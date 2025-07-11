import { describe, it, expect, beforeEach } from 'vitest';
import { CookieManager } from '../src/cookie';


// Extract constant 'my-cookie'
const MY_COOKIE = 'my-cookie';

describe('CookieManager tests', () => {
  let cookieManager: CookieManager;

  beforeEach(() => {
    cookieManager = new CookieManager(MY_COOKIE);
  });

  it('getValueFromRequest should return the value of the cookie', () => {
    const request = new Request('https://example.com', {
      headers: {
        cookie: `${MY_COOKIE}=my-value`,
      },
    });
    expect(cookieManager.getValueFromRequest(request)).toEqual('my-value');
  });

  it('getValueFromRequest should return undefined if the cookie is not found', () => {
    const request = new Request('https://example.com', {
      headers: {
        cookie: "nother-cookie=my-value",
      },
    });
    expect(cookieManager.getValueFromRequest(request)).toBeUndefined();
  });

});

