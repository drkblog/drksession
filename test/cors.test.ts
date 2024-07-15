import { CorsHelper, CorsHelperConfiguration } from "../src/cors";

const VALID_DOMAINS = [
  "drk.com.ar",
  "www.drk.com.ar",
  "drkbugs.com",
  "www.drkbugs.com",
  "drk.ar",
  "www.drk.ar",
];

describe("Domain tests", () => {
  const configuration: CorsHelperConfiguration = {
    validOrigins: VALID_DOMAINS,
  };
  const sessionManager: CorsHelper = new CorsHelper(configuration);

  test("Empty domain list throws error", () => {
    expect(() => {
      const configuration: CorsHelperConfiguration = {
        validOrigins: [],
      };
      new CorsHelper(configuration);
    }).toThrow('At least one valid origin is required');
  });

  test.each(['#$%', '...', '*'])('Invalid domain %s throws error', (domain) => {
    expect(() => {
      const configuration: CorsHelperConfiguration = {
        validOrigins: [domain],
      };
      new CorsHelper(configuration);
    }).toThrow(`Invalid origin: ${domain}`);
  });

  test("Valid origins", () => {
    VALID_DOMAINS.forEach((domain) => {
      const url = `https://${domain}`;
      expect(sessionManager.isValidOrigin(url)).toBe(true);
    });
  });

  test("Valid referrers from drk.com.ar", () => {
    const SUFFIXES = ["", "/", "/example", "/?a=1", "/dir/file.ext"];
    VALID_DOMAINS.forEach((domain) => {
      SUFFIXES.forEach((suffix) => {
        const url = `https://${domain}${suffix}`;
        expect(sessionManager.isValidReferer(url)).toBe(true);
      });
    });
  });

  test("Invalid referrers from valid domains", () => {
    const PREFIXES = ["http://www.", "http://", "www.", ""];
    VALID_DOMAINS.forEach((domain) => {
      PREFIXES.forEach((prefix) => {
        const url = `${prefix}${domain}`;
        expect(sessionManager.isValidReferer(url)).toBe(false);
      });
    });
  });

  test("Invalid referrers", () => {
    expect(sessionManager.isValidReferer("https://127.0.0.1")).toBe(false);
    expect(sessionManager.isValidReferer("https://localhost")).toBe(false);
    expect(sessionManager.isValidReferer("https://www.google.com")).toBe(false);
    expect(sessionManager.isValidReferer("https://www.google.com/")).toBe(
      false
    );
    expect(
      sessionManager.isValidReferer("https://www.google.com/example")
    ).toBe(false);
    expect(sessionManager.isValidReferer("https://www.google.com/?a=1")).toBe(
      false
    );
    expect(
      sessionManager.isValidReferer("https://www.google.com/dir/file.ext")
    ).toBe(false);
    expect(sessionManager.isValidReferer("https://cloudflare.com")).toBe(false);
    expect(sessionManager.isValidReferer("https://cloudflare.com/")).toBe(
      false
    );
    expect(
      sessionManager.isValidReferer("https://cloudflare.com/example")
    ).toBe(false);
    expect(sessionManager.isValidReferer("https://cloudflare.com/?a=1")).toBe(
      false
    );
    expect(
      sessionManager.isValidReferer("https://cloudflare.com/dir/file.ext")
    ).toBe(false);
  });

  test("Tricky referrers", () => {
    expect(
      sessionManager.isValidReferer("https://cloudflare.com/drk.com.ar")
    ).toBe(false);
    expect(
      sessionManager.isValidReferer("https://cloudflare.com/www.drk.com.ar/")
    ).toBe(false);
    expect(
      sessionManager.isValidReferer("https://cloudflare.com/https://drk.com.ar")
    ).toBe(false);
    expect(
      sessionManager.isValidReferer(
        "https://cloudflare.com/https://drk.com.ar/"
      )
    ).toBe(false);
  });
});
