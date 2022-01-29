import * as session from '../src/drksession';

const VALID_DOMAINS = [
  'drk.com.ar',
  'drkbugs.com',
  'drk.ar'
];

test('Valid referers from drk.com.ar', () => {
  const PREFIXES = [
    '',
    'www.'
  ];
  const SUFFIXES = [
    '',
    '/',
    '/example',
    '/?a=1',
    '/dir/file.ext'
  ];
  VALID_DOMAINS.forEach((domain) => {
    PREFIXES.forEach((prefix) => {
      SUFFIXES.forEach((suffix) => {
        const url = `https://${prefix}${domain}${suffix}`;
        expect(session.isValidReferer(url)).toBe(true);
      });
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
      expect(session.isValidReferer(url)).toBe(false);
    });
  });
});

test('Invalid referers', () => {
  expect(session.isValidReferer('https://127.0.0.1')).toBe(false);
  expect(session.isValidReferer('https://localhost')).toBe(false);
  expect(session.isValidReferer('https://www.google.com')).toBe(false);
  expect(session.isValidReferer('https://www.google.com/')).toBe(false);
  expect(session.isValidReferer('https://www.google.com/example')).toBe(false);
  expect(session.isValidReferer('https://www.google.com/?a=1')).toBe(false);
  expect(session.isValidReferer('https://www.google.com/dir/file.ext')).toBe(false);
  expect(session.isValidReferer('https://cloudflare.com')).toBe(false);
  expect(session.isValidReferer('https://cloudflare.com/')).toBe(false);
  expect(session.isValidReferer('https://cloudflare.com/example')).toBe(false);
  expect(session.isValidReferer('https://cloudflare.com/?a=1')).toBe(false);
  expect(session.isValidReferer('https://cloudflare.com/dir/file.ext')).toBe(false);
});

test('Tricky referers', () => {
  expect(session.isValidReferer('https://cloudflare.com/drk.com.ar')).toBe(false);
  expect(session.isValidReferer('https://cloudflare.com/www.drk.com.ar/')).toBe(false);
  expect(session.isValidReferer('https://cloudflare.com/https://drk.com.ar')).toBe(false);
  expect(session.isValidReferer('https://cloudflare.com/https://drk.com.ar/')).toBe(false);
});
