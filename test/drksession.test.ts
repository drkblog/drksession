import { SessionManager, SessionManagerConfiguration } from '../src/drksession';
import { MockKvAdapter } from '../src/kvadapter';

const VALID_DOMAINS = [
  'drk.com.ar',
  'www.drk.com.ar',
  'drkbugs.com',
  'www.drkbugs.com',
  'drk.ar',
  'www.drk.ar'
];

describe('Domain tests', () => {
  const configuration: SessionManagerConfiguration = {
    sessionKv: new MockKvAdapter(),
    cookieName: 'cookieName',
    validOrigins: VALID_DOMAINS,
    sessionTtl: 2*3600
  };
  const sessionManager: SessionManager = new SessionManager(configuration);
    
  test('Valid origins', () => {

    VALID_DOMAINS.forEach((domain) => {
      const url = `https://${domain}`;
      expect(sessionManager.isValidOrigin(url)).toBe(true);
    });
  });

  test('Valid referers from drk.com.ar', () => {
    const SUFFIXES = [
      '',
      '/',
      '/example',
      '/?a=1',
      '/dir/file.ext'
    ];
    VALID_DOMAINS.forEach((domain) => {
      SUFFIXES.forEach((suffix) => {
        const url = `https://${domain}${suffix}`;
        expect(sessionManager.isValidReferer(url)).toBe(true);
      });
    });
  });

  test('Invalid referers from valid domains', () => {
    const PREFIXES = [
      'http://www.',
      'http://',
      'www.',
      ''
    ];
    VALID_DOMAINS.forEach((domain) => {
      PREFIXES.forEach((prefix) => {
        const url = `${prefix}${domain}`;
        expect(sessionManager.isValidReferer(url)).toBe(false);
      });
    });
  });

  test('Invalid referers', () => {
    expect(sessionManager.isValidReferer('https://127.0.0.1')).toBe(false);
    expect(sessionManager.isValidReferer('https://localhost')).toBe(false);
    expect(sessionManager.isValidReferer('https://www.google.com')).toBe(false);
    expect(sessionManager.isValidReferer('https://www.google.com/')).toBe(false);
    expect(sessionManager.isValidReferer('https://www.google.com/example')).toBe(false);
    expect(sessionManager.isValidReferer('https://www.google.com/?a=1')).toBe(false);
    expect(sessionManager.isValidReferer('https://www.google.com/dir/file.ext')).toBe(false);
    expect(sessionManager.isValidReferer('https://cloudflare.com')).toBe(false);
    expect(sessionManager.isValidReferer('https://cloudflare.com/')).toBe(false);
    expect(sessionManager.isValidReferer('https://cloudflare.com/example')).toBe(false);
    expect(sessionManager.isValidReferer('https://cloudflare.com/?a=1')).toBe(false);
    expect(sessionManager.isValidReferer('https://cloudflare.com/dir/file.ext')).toBe(false);
  });

  test('Tricky referers', () => {
    expect(sessionManager.isValidReferer('https://cloudflare.com/drk.com.ar')).toBe(false);
    expect(sessionManager.isValidReferer('https://cloudflare.com/www.drk.com.ar/')).toBe(false);
    expect(sessionManager.isValidReferer('https://cloudflare.com/https://drk.com.ar')).toBe(false);
    expect(sessionManager.isValidReferer('https://cloudflare.com/https://drk.com.ar/')).toBe(false);
  });
});