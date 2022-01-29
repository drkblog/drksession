import { parse } from 'worktop/cookie';

const DRK_SESSION_TTL = 2 * 3600;
const HASH_SIZE = 30;

export const HTTP_OK = 200;
export const HTTP_SEE_OTHER = 303
export const HTTP_BAD_REQUEST = 400;
export const HTTP_FORBIDDEN = 403;
export const HTTP_NOT_FOUND = 404;
export const HTTP_CONFLICT = 409;
export const HTTP_TOO_MANY_REQUESTS = 429;
export const HTTP_INTERNAL_SERVER_ERROR = 500;

const CONTENT_TYPE_JSON = 'application/json';

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

//  Session public functions

export class Session {
  sessionKv: KVNamespace;
  cookieName: string;

  constructor(sessionKv: KVNamespace, cookieName: string) {
    this.sessionKv = sessionKv;
    this.cookieName = cookieName;
  }

  public async createSessionFromExternalAuthority(authority: string, username: string, displayName: string, avatarUrl: string, redirectUrl: string, data: any): Promise<Response> {
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
    return createRedirectWithCookies(redirectUrl, this.cookieName, hash);
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
}

// Utility public functions

function isValidOrigin(origin: string) {
  return origin.startsWith('https://') && (origin.endsWith('drk.com.ar') || origin.endsWith('drkbugs.com') || origin.endsWith('drk.ar'));
}

export function isValidReferer(referer: string) {
  if (!referer.startsWith('https://')) {
    return false;
  }
  // Start at lease one character after https://
  const start = 9;
  const cut = (referer.includes('/', start)) ? referer.indexOf('/', start) : undefined;
  const origin = referer.substring(0, cut);
  return isValidOrigin(origin);
}

function bakeOriginHeader(request: Request) : {[key: string]: string} {
  const origin: string = request.headers.get('Origin') || '';
  if (isValidOrigin(origin)) {
    return {"Access-Control-Allow-Origin": origin};
  }
  return {"Access-Control-Allow-Origin": "https://www.drk.com.ar"};
}

export function createCorsAwareResponse(request: Request, body: string, status: number = HTTP_OK, contentType: string = CONTENT_TYPE_JSON) : Response {
  return new Response(body, {
    status: status,
    headers: {
      ...bakeOriginHeader(request),
      'Access-Control-Allow-Credentials': 'true',
      'Content-Type': contentType,
      'Vary': 'Origin',
      'Cache-Control': 'max-age=0'
    }
  });
}

export function getCookies(request: Request) {
  return parse(request.headers.get("Cookie") || "");
}

export function createRedirect(url: string): Response {
  return new Response("drkbugs", {
    status: 301, 
    headers: {
      'Location': url,
      'Cache-Control': 'max-age=0'
    }
  });
}

export function createRedirectWithCookies(url: string, cookieName: string, cookieValue: string): Response {
  return new Response("drkbugs", {
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