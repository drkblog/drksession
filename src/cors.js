import { HTTP_CODE } from "./http";
// Constants
const HTTPS_SCHEMA_LENGTH = 8;
const CONTENT_TYPE_JSON = "application/json";
const VALID_DOMAIN_NAME_REGEX = new RegExp("^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$");
export class CorsHelper {
    /**
     * Creates a SessionManager
     *
     * @param configuration settings for this session manager
     */
    constructor(configuration) {
        if (configuration.validOrigins.length === 0) {
            throw new Error("At least one valid origin is required");
        }
        configuration.validOrigins.forEach((origin) => {
            if (!VALID_DOMAIN_NAME_REGEX.test(origin)) {
                throw new Error(`Invalid origin: ${origin}`);
            }
        });
        this.configuration = configuration;
    }
    isValidOrigin(origin) {
        const domain = origin.substring(HTTPS_SCHEMA_LENGTH);
        return (origin.startsWith("https://") &&
            this.configuration.validOrigins.includes(domain));
    }
    isValidReferer(referer) {
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
    bakeOriginHeader(request) {
        const origin = request.headers.get("Origin") || "";
        if (this.isValidOrigin(origin)) {
            return { "Access-Control-Allow-Origin": origin };
        }
        return {
            "Access-Control-Allow-Origin": `https://${this.configuration.validOrigins[0]}`,
        };
    }
    createCorsAwareResponse(request, body, status = HTTP_CODE.HTTP_OK, contentType = CONTENT_TYPE_JSON) {
        return new Response(body, {
            status: status,
            headers: {
                ...this.bakeOriginHeader(request),
                "Access-Control-Allow-Credentials": "true",
                "Content-Type": contentType,
                Vary: "Origin",
                "Cache-Control": "max-age=0",
            },
        });
    }
}
