import { getCookies } from './utility';

export class CookieManager {
  public cookieName: string;

  constructor(cookieName: string) {
    this.cookieName = cookieName;
  }

  public getValueFromRequest(request: Request): string {
    const cookies = getCookies(request);
    return cookies[this.cookieName];
  }
}