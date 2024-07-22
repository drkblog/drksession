import { describe, it, expect } from "vitest";
import { createTemporaryRedirect, getCookies, createRedirectWithCookie, createRedirectWithClearCookie } from "../src/utility";

const HTTP_FOUND = 302;

describe('createTemporaryRedirect', () => {
  it('createTemporaryRedirect must return location to the input URL with HTTP status 302', () => {
    const response = createTemporaryRedirect('https://example.com');
    expect(response.status).toEqual(HTTP_FOUND);
    expect(response.headers.get('Location')).toEqual('https://example.com');
  });

  it('createTemporaryRedirect must return max-age zero in cache control', () => {
    const response = createTemporaryRedirect('https://example.com');
    expect(response.status).toEqual(HTTP_FOUND);
    expect(response.headers.get('Cache-Control')).toEqual('max-age=0');
  });
});

describe('getCookies', () => {
  it('getCookies must return an empty object when no cookies are present', () => {
    const headers = new Headers();
    const request = new Request('https://example.com', { headers: headers });
    expect(getCookies(request)).toEqual({});
  });

  it('getCookies must return an object with the cookies', () => {
    const headers = new Headers({
      "Cookie": "name1=value1; name2=value2"
    });
    const request = new Request('https://example.com', { headers: headers });
    expect(getCookies(request)).toEqual({
      "name1": "value1",
      "name2": "value2",
    });
  });

  it('getCookies doesn\'t support multiple cookies with the same name, last one wins', () => {
    const headers = new Headers({
      "Cookie": "name1=value1; name2=value2; name1=value3"
    });
    const request = new Request('https://example.com', { headers: headers });
    expect(getCookies(request)).toEqual({
      "name1": "value3",
      "name2": "value2",
    });
  });
});

describe('createRedirectWithCookie', () => {
  it('createRedirectWithCookie must return a redirect to the input URL with HTTP status 302', () => {
    const response = createRedirectWithCookie('https://example.com', 'cookieName', 'cookieValue');
    expect(response.status).toEqual(HTTP_FOUND);
    expect(response.headers.get('Location')).toEqual('https://example.com');
  });

  it('createRedirectWithCookie must set the cookie in the response', () => {
    const response = createRedirectWithCookie('https://example.com', 'cookieName', 'cookieValue');
    expect(response.headers.get('Set-Cookie')).toEqual('cookieName=cookieValue; Path=/; SameSite=None; Secure; HttpOnly');
  });

  it('createRedirectWithCookie must allow to set the path', () => {
    const response = createRedirectWithCookie('https://example.com', 'cookieName', 'cookieValue', '/other-path');
    expect(response.headers.get('Set-Cookie')).toEqual('cookieName=cookieValue; Path=/other-path; SameSite=None; Secure; HttpOnly');
  });

  it('createRedirectWithCookie must allow to set sameSite to Lax', () => {
    const response = createRedirectWithCookie('https://example.com', 'cookieName', 'cookieValue', '/', 'Lax');
    expect(response.headers.get('Set-Cookie')).toEqual('cookieName=cookieValue; Path=/; SameSite=Lax; Secure; HttpOnly');
  });

  it('createRedirectWithCookie must allow to set sameSite to Strict', () => {
    const response = createRedirectWithCookie('https://example.com', 'cookieName', 'cookieValue', '/', 'Strict');
    expect(response.headers.get('Set-Cookie')).toEqual('cookieName=cookieValue; Path=/; SameSite=Strict; Secure; HttpOnly');
  });

  it('createRedirectWithCookie must allow to set sameSite to None', () => {
    const response = createRedirectWithCookie('https://example.com', 'cookieName', 'cookieValue', '/', 'None');
    expect(response.headers.get('Set-Cookie')).toEqual('cookieName=cookieValue; Path=/; SameSite=None; Secure; HttpOnly');
  });

  it('createRedirectWithCookie must allow to set non secure', () => {
    const response = createRedirectWithCookie('https://example.com', 'cookieName', 'cookieValue', '/', 'None', false);
    expect(response.headers.get('Set-Cookie')).toEqual('cookieName=cookieValue; Path=/; SameSite=None; HttpOnly');
  });

  it('createRedirectWithCookie must allow to set non http-only', () => {
    const response = createRedirectWithCookie('https://example.com', 'cookieName', 'cookieValue', '/', 'None', false, false);
    expect(response.headers.get('Set-Cookie')).toEqual('cookieName=cookieValue; Path=/; SameSite=None');
  });
});


describe('createRedirectWithClearCookie', () => {
  it('createRedirectWithClearCookie must return a redirect to the input URL with HTTP status 302', () => {
    const response = createRedirectWithClearCookie('https://example.com', 'cookieName');
    expect(response.status).toEqual(HTTP_FOUND);
    expect(response.headers.get('Location')).toEqual('https://example.com');
  });

  it('createRedirectWithClearCookie must set the cookie in the response', () => {
    const response = createRedirectWithClearCookie('https://example.com', 'cookieName');
    expect(response.headers.get('Set-Cookie')).toEqual(`cookieName=DELETED; Path=/; Expires=${new Date().toUTCString()}; SameSite=None; Secure; HttpOnly`);
  });

  it('createRedirectWithClearCookie must allow to set the path', () => {
    const response = createRedirectWithClearCookie('https://example.com', 'cookieName', '/other-path');
    expect(response.headers.get('Set-Cookie')).toEqual(`cookieName=DELETED; Path=/other-path; Expires=${new Date().toUTCString()}; SameSite=None; Secure; HttpOnly`);
  });

  it('createRedirectWithClearCookie must allow to set sameSite to Lax', () => {
    const response = createRedirectWithClearCookie('https://example.com', 'cookieName', '/', 'Lax');
    expect(response.headers.get('Set-Cookie')).toEqual(`cookieName=DELETED; Path=/; Expires=${new Date().toUTCString()}; SameSite=Lax; Secure; HttpOnly`);
  });

  it('createRedirectWithClearCookie must allow to set sameSite to Strict', () => {
    const response = createRedirectWithClearCookie('https://example.com', 'cookieName', '/', 'Strict');
    expect(response.headers.get('Set-Cookie')).toEqual(`cookieName=DELETED; Path=/; Expires=${new Date().toUTCString()}; SameSite=Strict; Secure; HttpOnly`);
  });

  it('createRedirectWithClearCookie must allow to set sameSite to None', () => {
    const response = createRedirectWithClearCookie('https://example.com', 'cookieName', '/', 'None');
    expect(response.headers.get('Set-Cookie')).toEqual(`cookieName=DELETED; Path=/; Expires=${new Date().toUTCString()}; SameSite=None; Secure; HttpOnly`);
  });

  it('createRedirectWithClearCookie must allow to set non secure', () => {
    const response = createRedirectWithClearCookie('https://example.com', 'cookieName', '/', 'None', false);
    expect(response.headers.get('Set-Cookie')).toEqual(`cookieName=DELETED; Path=/; Expires=${new Date().toUTCString()}; SameSite=None; HttpOnly`);
  });

  it('createRedirectWithClearCookie must allow to set non http-only', () => {
    const response = createRedirectWithClearCookie('https://example.com', 'cookieName', '/', 'None', false, false);
    expect(response.headers.get('Set-Cookie')).toEqual(`cookieName=DELETED; Path=/; Expires=${new Date().toUTCString()}; SameSite=None`);
  });
});
