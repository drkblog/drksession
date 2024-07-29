import { HTTP_CODE } from "./http";

// Constants
const HTTPS_SCHEMA_LENGTH = 8;
const CONTENT_TYPE_JSON = "application/json; charset=utf-8";
const VALID_DOMAIN_NAME_REGEX = new RegExp(
  "^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$",
);
const DEFAULT_ALLOWED_HEADERS = "*";
const DEFAULT_ALLOWED_METHODS = "*";

/**
 * CORS Helper configuration
 *
 * @param validOrigins an array of valid origin domain names. The first one will be used as default redirect domain.
 */
export type CorsHelperInitialization = {
  validOrigins: string[];
  allowedHeaders?: string;
  allowedMethods?: string;
};

type CorsHelperConfiguration = {
  validOrigins: string[];
  allowedHeaders: string;
  allowedMethods: string;
};

export class CorsHelper {
  private configuration: CorsHelperConfiguration;

  /**
   * Creates a SessionManager
   *
   * @param initialization settings for this session manager
   */
  constructor(initialization: CorsHelperInitialization) {
    if (initialization.validOrigins.length === 0) {
      throw new Error("At least one valid origin is required");
    }
    initialization.validOrigins.forEach((origin) => {
      if (!VALID_DOMAIN_NAME_REGEX.test(origin)) {
        throw new Error(`Invalid origin: ${origin}`);
      }
    });
    if (!initialization.allowedHeaders) {
      initialization.allowedHeaders = DEFAULT_ALLOWED_HEADERS;
    }
    if (!initialization.allowedMethods) {
      initialization.allowedMethods = DEFAULT_ALLOWED_METHODS;
    }
    this.configuration = { 
      validOrigins: initialization.validOrigins,
      allowedHeaders: initialization.allowedHeaders,
      allowedMethods: initialization.allowedMethods
     };
  }

  public isValidOrigin(origin: string): boolean {
    const domain = origin.substring(HTTPS_SCHEMA_LENGTH);
    return (
      origin.startsWith("https://") &&
      this.configuration.validOrigins.includes(domain)
    );
  }

  public isValidReferer(referer: string): boolean {
    if (!referer.startsWith("https://")) {
      return false;
    }
    // Start at lease one character after https://
    const start = HTTPS_SCHEMA_LENGTH;
    const cut = referer.includes("/", start)
      ? referer.indexOf("/", start)
      : undefined;
    const origin = referer.substring(0, cut);
    return this.isValidOrigin(origin);
  }

  public bakeOriginHeader(request: Request): { [key: string]: string } {
    const origin: string = request.headers.get("Origin") || "";
    if (this.isValidOrigin(origin)) {
      return { "Access-Control-Allow-Origin": origin };
    }
    return {
      "Access-Control-Allow-Origin": `https://${this.configuration.validOrigins[0]}`,
    };
  }

  public createCorsAwareResponse(
    request: Request,
    body: string,
    status: number = HTTP_CODE.HTTP_OK,
    contentType: string = CONTENT_TYPE_JSON,
  ): Response {
    return new Response(body, {
      status: status,
      headers: {
        ...this.bakeOriginHeader(request),
        "Access-Control-Allow-Methods": this.configuration.allowedMethods!,
        "Access-Control-Allow-Headers": this.configuration.allowedHeaders!,
        "Access-Control-Allow-Credentials": "true",
        "Content-Type": contentType,
        Vary: "Origin",
        "Cache-Control": "max-age=0",
      },
    });
  }
}
