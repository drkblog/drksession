import { parse } from 'worktop/cookie';
import { KvAdapter } from './kvadapter';

// Fine tunning
const DRK_SESSION_TTL = 2 * 3600;
const HASH_SIZE = 30;

// Constants
const HTTPS_SCHEMA_LENGTH = 8;
const CONTENT_TYPE_JSON = 'application/json';

export enum HTTP_CODE {
  HTTP_OK = 200,
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
  avatarUrl: string;
  data: any;
}

type PublicSessionData = {
  authority: string;
  username: string;
  displayName: string;
  avatarUrl: string;
}

export class SessionManager {
  sessionKv: KvAdapter;
  cookieName: string;
  validOrigins: string[];

  /**
   * Creates a SessionManager
   * @param sessionKv a KvAdapter (encapsulation Cloudflare KV namespace) to store session data
   * @param cookieName the name to use for the session cookie
   * @param validOrigins an array of valid origin domain names. The first one will be used as default redirect domain.
   */
  constructor(sessionKv: KvAdapter, cookieName: string, validOrigins: string[]) {
    this.sessionKv = sessionKv;
    this.cookieName = cookieName;
    this.validOrigins = validOrigins;
  }

  public async createAndStoreSession(authority: string, username: string, displayName: string, avatarUrl: string, data: any): Promise<string> {
    const session: SessionData = { 
      authority: authority,
      username: username, 
      displayName: displayName,
      avatarUrl: avatarUrl,
      data: data
    };
    const sessionString = JSON.stringify(session, null, 2);
    const hash = generateRandomHash(HASH_SIZE);
    await this.sessionKv.put(hash, sessionString, { expirationTtl: DRK_SESSION_TTL });
    return hash;
  }

  public async getPublicSessionData(request: Request): Promise<PublicSessionData> {
    const sessionData = await this.getSession(request);
    const publicSessionData: PublicSessionData = { 
      authority: sessionData.authority,
      username: sessionData.username, 
      displayName: sessionData.displayName,
      avatarUrl: sessionData.avatarUrl
    };
    return publicSessionData;
  }

  public async getSession(request: Request): Promise<SessionData> {
    const cookies = getCookies(request);
    const sessionData: SessionData | null = await this.sessionKv.get(cookies[this.cookieName], { type: "json" });
    if (sessionData == null) {
      throw new Error('No session');
    }
    return sessionData;
  }

  public async deleteSession(request: Request) {
    const cookies = getCookies(request);
    const sessionKey = cookies[this.cookieName];
    if (sessionKey == null) {
      return;
    }
    const sessionData: SessionData | null = await this.sessionKv.get(sessionKey, { type: "json" });
    if (sessionData != null) {
      await this.sessionKv.delete(cookies[this.cookieName]);
    }
  }
  
  public isValidOrigin(origin: string) {
    const domain = origin.substring(HTTPS_SCHEMA_LENGTH)
    return origin.startsWith('https://') && this.validOrigins.includes(domain);
  }

  public isValidReferer(referer: string) {
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
    return {"Access-Control-Allow-Origin": `https://${this.validOrigins[0]}`};
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
export function getCookies(request: Request) {
  return parse(request.headers.get("Cookie") || "");
}

export function createRedirect(url: string): Response {
  return new Response('', {
    status: 301, 
    headers: {
      'Location': url,
      'Cache-Control': 'max-age=0'
    }
  });
}

export function createRedirectWithCookies(url: string, cookieName: string, cookieValue: string): Response {
  return new Response('', {
    status: 301, 
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