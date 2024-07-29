import { HTTP_CODE } from "./http";

const COOCKIE_HEADER = "Cookie";

export function getCookies(request: Request): Record<string, string> {
  const cookiesString = request.headers.get(COOCKIE_HEADER) || "";
  const cookies = cookiesString
    .split("; ")
    .reduce((acc: Record<string, string>, curr) => {
      const [name, value] = curr.split("=");
      acc[name] = value;
      return acc;
    }, {});
  return cookies;
}

export function createTemporaryRedirect(url: string): Response {
  return new Response("", {
    status: HTTP_CODE.HTTP_FOUND,
    headers: {
      "Location": url,
      "Cache-Control": "max-age=0",
    },
  });
}

export function createCookie(
  cookieName: string,
  cookieValue: string,
  path: string = "/",
  sameSite: string = "Strict",
  secure: boolean = true,
  httpOnly: boolean= true,
  expires: Date | undefined = undefined,
): string {
  const cookieItems = [
    `${cookieName}=${cookieValue}`,
    `Path=${path}`,
    `SameSite=${sameSite}`,
  ];
  if (secure) cookieItems.push("Secure");
  if (httpOnly) cookieItems.push("HttpOnly");
  if (expires !== undefined) cookieItems.push(`Expires=${expires.toUTCString()}`);
  const setCookieString = cookieItems.join("; ");
  return setCookieString;
}

export function createRedirectWithCookie(
  url: string,
  cookieName: string,
  cookieValue: string,
  path = "/",
  sameSite = "None",
  secure = true,
  httpOnly = true,
): Response {
  const setCookieString = createCookie(cookieName, cookieValue, path, sameSite, secure, httpOnly);
  return new Response("", {
    status: HTTP_CODE.HTTP_FOUND,
    headers: {
      "Location": url,
      "Set-Cookie": setCookieString,
      "Cache-Control": "max-age=0",
    },
  });
}

export function createRedirectWithClearCookie(
  url: string,
  cookieName: string,
  path = "/",
  sameSite = "None",
  secure = true,
  httpOnly = true,
): Response {
  const setCookieString = createCookie(cookieName, "DELETED", path, sameSite, secure, httpOnly, new Date());
  return new Response("", {
    status: HTTP_CODE.HTTP_FOUND,
    headers: {
      "Location": url,
      "Set-Cookie": setCookieString,
      "Cache-Control": "max-age=0",
    },
  });
}
