import { describe, it, expect, beforeEach } from "vitest";
import { CorsHelper, CorsHelperInitialization } from "../src/cors";
import { HTTP_CODE } from "../src/http";

const VALID_DOMAINS = [
  "drk.com.ar",
  "www.drk.com.ar",
  "drkbugs.com",
  "www.drkbugs.com",
  "drk.ar",
  "www.drk.ar",
];

describe("Domain tests", () => {
  const initialization: CorsHelperInitialization = {
    validOrigins: VALID_DOMAINS,
  };
  const corsHelper: CorsHelper = new CorsHelper(initialization);

  it("Empty domain list throws error", () => {
    expect(() => {
      const configuration: CorsHelperInitialization = {
        validOrigins: [],
      };
      new CorsHelper(configuration);
    }).toThrow("At least one valid origin is required");
  });

  it.each(["#$%", "...", "*"])("Invalid domain %s throws error", (domain) => {
    expect(() => {
      const configuration: CorsHelperInitialization = {
        validOrigins: [domain],
      };
      new CorsHelper(configuration);
    }).toThrow(`Invalid origin: ${domain}`);
  });

  it("Valid origins", () => {
    VALID_DOMAINS.forEach((domain) => {
      const url = `https://${domain}`;
      expect(corsHelper.isValidOrigin(url)).toBe(true);
    });
  });

  it("Valid referrers from drk.com.ar", () => {
    const SUFFIXES = ["", "/", "/example", "/?a=1", "/dir/file.ext"];
    VALID_DOMAINS.forEach((domain) => {
      SUFFIXES.forEach((suffix) => {
        const url = `https://${domain}${suffix}`;
        expect(corsHelper.isValidReferer(url)).toBe(true);
      });
    });
  });

  it("Invalid referrers from valid domains", () => {
    const PREFIXES = ["http://www.", "http://", "www.", ""];
    VALID_DOMAINS.forEach((domain) => {
      PREFIXES.forEach((prefix) => {
        const url = `${prefix}${domain}`;
        expect(corsHelper.isValidReferer(url)).toBe(false);
      });
    });
  });

  it("Invalid referrers", () => {
    expect(corsHelper.isValidReferer("https://127.0.0.1")).toBe(false);
    expect(corsHelper.isValidReferer("https://localhost")).toBe(false);
    expect(corsHelper.isValidReferer("https://www.google.com")).toBe(false);
    expect(corsHelper.isValidReferer("https://www.google.com/")).toBe(
      false,
    );
    expect(
      corsHelper.isValidReferer("https://www.google.com/example"),
    ).toBe(false);
    expect(corsHelper.isValidReferer("https://www.google.com/?a=1")).toBe(
      false,
    );
    expect(
      corsHelper.isValidReferer("https://www.google.com/dir/file.ext"),
    ).toBe(false);
    expect(corsHelper.isValidReferer("https://cloudflare.com")).toBe(false);
    expect(corsHelper.isValidReferer("https://cloudflare.com/")).toBe(
      false,
    );
    expect(
      corsHelper.isValidReferer("https://cloudflare.com/example"),
    ).toBe(false);
    expect(corsHelper.isValidReferer("https://cloudflare.com/?a=1")).toBe(
      false,
    );
    expect(
      corsHelper.isValidReferer("https://cloudflare.com/dir/file.ext"),
    ).toBe(false);
  });

  it("Tricky referrers", () => {
    expect(
      corsHelper.isValidReferer("https://cloudflare.com/drk.com.ar"),
    ).toBe(false);
    expect(
      corsHelper.isValidReferer("https://cloudflare.com/www.drk.com.ar/"),
    ).toBe(false);
    expect(
      corsHelper.isValidReferer(
        "https://cloudflare.com/https://drk.com.ar",
      ),
    ).toBe(false);
    expect(
      corsHelper.isValidReferer(
        "https://cloudflare.com/https://drk.com.ar/",
      ),
    ).toBe(false);
  });
});


describe("CORS aware response", () => {
  let corsHelper: CorsHelper;

  beforeEach(() => {
    corsHelper = new CorsHelper({ 
      validOrigins: VALID_DOMAINS
    });
  });

  it("createCorsAwareResponse should return a Response with the correct headers", async () => {
    const request = new Request("https://drk.com.ar/");
    const body = "Hello";
    const response = corsHelper.createCorsAwareResponse(request, body);

    expect(response.headers.get("Access-Control-Allow-Origin")).toEqual("https://drk.com.ar");
    expect(response.headers.get("Access-Control-Allow-Headers")).toEqual("*");
    expect(response.headers.get("Access-Control-Allow-Methods")).toEqual("*");
    expect(response.headers.get("Access-Control-Allow-Credentials")).toEqual("true");
    expect(response.headers.get("Vary")).toEqual("Origin");
    expect(response.headers.get("Cache-Control")).toEqual("max-age=0");
    expect(response.headers.get("Content-Type")).toEqual("application/json");
    expect(response.status).toEqual(HTTP_CODE.HTTP_OK);
    expect(await response.text()).toEqual(body);
  });

  it("createCorsAwareResponse should allow to change the status and content type", () => {
    const request = new Request("https://drk.com.ar/");
    const body = "Hello";
    const response = corsHelper.createCorsAwareResponse(request, body, HTTP_CODE.HTTP_BAD_REQUEST, "text/plain");

    expect(response.headers.get("Content-Type")).toEqual("text/plain");
    expect(response.status).toEqual(HTTP_CODE.HTTP_BAD_REQUEST);
  });

  it("createCorsAwareResponse does't support http", async () => {
    const request = new Request("http://drk.com.ar/");
    const body = "Hello";
    const response = corsHelper.createCorsAwareResponse(request, body);

    expect(response.headers.get("Access-Control-Allow-Origin")).toEqual("https://drk.com.ar");
  });
});

describe("CORS aware response initialization", () => {

  it("createCorsAwareResponse should return a Response with the correct headers", async () => {
    const corsHelper = new CorsHelper({ 
      validOrigins: VALID_DOMAINS,
      allowedHeaders: "Content-Type",
      allowedMethods: "GET,POST"
    });

    const request = new Request("https://drk.com.ar/");
    const body = "Hello";
    const response = corsHelper.createCorsAwareResponse(request, body);

    expect(response.headers.get("Access-Control-Allow-Origin")).toEqual("https://drk.com.ar");
    expect(response.headers.get("Access-Control-Allow-Headers")).toEqual("Content-Type");
    expect(response.headers.get("Access-Control-Allow-Methods")).toEqual("GET,POST");
    expect(response.headers.get("Access-Control-Allow-Credentials")).toEqual("true");
    expect(response.headers.get("Vary")).toEqual("Origin");
    expect(response.headers.get("Cache-Control")).toEqual("max-age=0");
    expect(response.headers.get("Content-Type")).toEqual("application/json");
    expect(response.status).toEqual(HTTP_CODE.HTTP_OK);
    expect(await response.text()).toEqual(body);
  });
});

