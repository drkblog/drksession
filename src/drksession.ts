import { parse, Attributes } from 'worktop/cookie';
import { KvAdapter } from './kvadapter';

// Fine tunning
const HASH_SIZE = 30;

// Constants
const HTTPS_SCHEMA_LENGTH = 8;
const CONTENT_TYPE_JSON = 'application/json';

export enum HTTP_CODE {
  HTTP_OK = 200,
  HTTP_MOVED_PERMANENTLY = 301,
  HTTP_SEE_OTHER = 303,
  HTTP_BAD_REQUEST = 400,
  HTTP_FORBIDDEN = 403,
  HTTP_NOT_FOUND = 404,
  HTTP_CONFLICT = 409,
  HTTP_TOO_MANY_REQUESTS = 429,
  HTTP_INTERNAL_SERVER_ERROR = 500
}

type SessionData = {
  authority: string,
  username: string;
  displayName: string;
  created: Date;
  expires: Date;
  avatarUrl: string;
  data: unknown;
}

type PublicSessionData = {
  authority: string;
  username: string;
  displayName: string;
  avatarUrl: string;
}

/**
 * Session manager configuration
 * 
 * @param sessionKv a KvAdapter (encapsulation Cloudflare KV namespace) to store session data
 * @param cookieName the name to use for the session cookie
 * @param validOrigins an array of valid origin domain names. The first one will be used as default redirect domain.
 * @param sessionTtl session TTL in seconds
 */
export type SessionManagerConfiguration = {
  sessionKv: KvAdapter;
  cookieName: string;
  validOrigins: string[];
  sessionTtl: number;
}

export class SessionManager {
  private cfg: SessionManagerConfiguration;

  /**
   * Creates a SessionManager
   * 
   * @param configuration settings for this session manager
   */
  constructor(configuration: SessionManagerConfiguration) {
    this.cfg = configuration;
  }

  /**
   * Create and store a session in the KV
   * 
   * @param authority string representing the identity provider which authorizing this session
   * @param username string with the username (it may or may not match the one provided by the authority)
   * @param displayName string with the human readable name of this user
   * @param avatarUrl string with the user's avatar URL 
   * @param data opaque object containing what the consume code needs to store (it might be the data returned by the authority)
   * @returns the hash used as a key for storing the session in the KV
   */
  public async createAndStoreSession(authority: string, username: string, displayName: string, avatarUrl: string, data: unknown): Promise<string> {
    const now = new Date();
    const expires = new Date(this.computeExpirationFromNow())
    const session: SessionData = { 
      authority: authority,
      username: username, 
      created: now,
      expires: expires,
      displayName: displayName,
      avatarUrl: avatarUrl,
      data: data
    };
    const sessionString = toJson(session);
    const hash = generateRandomHash(HASH_SIZE);
    await this.cfg.sessionKv.put(hash, sessionString, { expirationTtl: this.cfg.sessionTtl });
    return hash;
  }

  /**
   * Computes expiration based on session manager configuration.
   * 
   * @returns expiration in number of milliseconds elapsed since January 1, 1970 00:00:00 UTC. 
   */
  private computeExpirationFromNow(): number {
    return Date.now() + this.cfg.sessionTtl * 1000;
  }

  /**
   * Retrieves the public session data form the KV, if the request contains a valid cookie and the session exists.
   * 
   * @param sessionKey the sessionKey string (a hash)
   * @returns partial session data to be sent over the internet
   */
  public async getPublicSessionData(sessionKey: string): Promise<PublicSessionData> {
    const sessionData = await this.getSession(sessionKey);
    const publicSessionData: PublicSessionData = { 
      authority: sessionData.authority,
      username: sessionData.username, 
      displayName: sessionData.displayName,
      avatarUrl: sessionData.avatarUrl
    };
    return publicSessionData;
  }

   /**
   * Retrieves the session data form the KV, if the request contains a valid cookie and the session exists.
   * 
   * @param sessionKey the sessionKey string (a hash)
   * @returns complete session data (not to be exposed over the internet)
   * @throws 'No cookie' or 'No session' accordingly
   */
  public async getSession(sessionKey: string): Promise<SessionData> {
    if (sessionKey == null) {
      throw new Error('No cookie');
    }
    const sessionData = await this.retrieveSessionDataFromKv(sessionKey);
    if (sessionData == null) {
      throw new Error('No session');
    }
    return sessionData;
  }

  /**
   * Deletes the session identified by the cookie (if present and valid), if it exists in the KV.
   * 
   * @param sessionKey the sessionKey string (a hash)
   * @throws nothing, even if the cookie or the session are missing.
   */
  public async deleteSession(sessionKey: string): Promise<void> {
    if (sessionKey == null) {
      return;
    }
    const sessionData = await this.retrieveSessionDataFromKv(sessionKey);
    if (sessionData != null) {
      await this.cfg.sessionKv.delete(sessionKey);
    }
  }

  private async retrieveSessionDataFromKv(sessionKey: string): Promise<SessionData | null> {
    return this.cfg.sessionKv.get(sessionKey, { type: "json" });
  }

  public isValidOrigin(origin: string): boolean {
    const domain = origin.substring(HTTPS_SCHEMA_LENGTH)
    return origin.startsWith('https://') && this.cfg.validOrigins.includes(domain);
  }

  public isValidReferer(referer: string): boolean {
    if (!referer.startsWith('https://')) {
      return false;
    }
    // Start at lease one character after https://
    const start = HTTPS_SCHEMA_LENGTH;
    const cut = (referer.includes('/', start)) ? referer.indexOf('/', start) : undefined;
    const origin = referer.substring(0, cut);
    return this.isValidOrigin(origin);
  }

  public bakeOriginHeader(request: Request) : {[key: string]: string} {
    const origin: string = request.headers.get('Origin') || '';
    if (this.isValidOrigin(origin)) {
      return {"Access-Control-Allow-Origin": origin};
    }
    return {"Access-Control-Allow-Origin": `https://${this.cfg.validOrigins[0]}`};
  }

  public createCorsAwareResponse(request: Request, body: string, status: number = HTTP_CODE.HTTP_OK, contentType: string = CONTENT_TYPE_JSON) : Response {
    return new Response(body, {
      status: status,
      headers: {
        ...this.bakeOriginHeader(request),
        'Access-Control-Allow-Credentials': 'true',
        'Content-Type': contentType,
        'Vary': 'Origin',
        'Cache-Control': 'max-age=0'
      }
    });
  }
}

// Utility public functions
export function getCookies(request: Request): Attributes & Record<string, string> {
  return parse(request.headers.get("Cookie") || "");
}

export function createRedirect(url: string): Response {
  return new Response('', {
    status: HTTP_CODE.HTTP_MOVED_PERMANENTLY, 
    headers: {
      'Location': url,
      'Cache-Control': 'max-age=0'
    }
  });
}

export function createRedirectWithCookies(url: string, cookieName: string, cookieValue: string): Response {
  return new Response('', {
    status: HTTP_CODE.HTTP_MOVED_PERMANENTLY, 
    headers: {
      'Location': url, 
      'Set-Cookie': `${cookieName}=${cookieValue}; SameSite=None; Secure; HttpOnly`,
      'Cache-Control': 'max-age=0'
    }
  });
}

// Private
function generateRandomHash(size: number) : string {
  const randomBytes = new Uint8Array(size);
  crypto.getRandomValues(randomBytes);
  return [...randomBytes].map(x => x.toString(16).padStart(2, '0')).join('');
}

function toJson(data: unknown): string {
  return JSON.stringify(data, null, 2);
}