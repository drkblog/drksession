import { HTTP_CODE } from "./http";
import { InvalidKeyError, SessionNotFoundError } from "./errors";
// Fine tunning
const HASH_SIZE = 30;
export class SessionManager {
    /**
     * Creates a SessionManager
     *
     * @param configuration settings for this session manager
     */
    constructor(configuration) {
        this.cfg = configuration;
    }
    /**
     * Create and store a session in the KV
     *
     * @param authority string representing the identity provider which authorizing this session
     * @param username string with the username (it may or may not match the one provided by the authority)
     * @param displayName string with the human readable name of this user
     * @param avatarUrl string with the user's avatar URL
     * @param data opaque object containing what the consume code needs to store (it might be the data returned by the authority)
     * @returns the hash used as a key for storing the session in the KV
     */
    async createAndStoreSession(authority, username, displayName, avatarUrl, data) {
        const now = new Date();
        const expires = new Date(this.computeExpirationFromNow());
        const session = {
            authority: authority,
            username: username,
            created: now,
            expires: expires,
            displayName: displayName,
            avatarUrl: avatarUrl,
            data: data,
        };
        const sessionString = toJson(session);
        const hash = generateRandomHash(HASH_SIZE);
        await this.cfg.sessionKv.put(hash, sessionString, {
            expirationTtl: this.cfg.sessionTtl,
        });
        return hash;
    }
    /**
     * Computes expiration based on session manager configuration.
     *
     * @returns expiration in number of milliseconds elapsed since January 1, 1970 00:00:00 UTC.
     */
    computeExpirationFromNow() {
        return Date.now() + this.cfg.sessionTtl * 1000;
    }
    /**
     * Retrieves the public session data form the KV, if the request contains a valid cookie and the session exists.
     *
     * @param sessionKey the sessionKey string (a hash)
     * @returns partial session data to be sent over the internet
     */
    async getPublicSessionData(sessionKey) {
        const sessionData = await this.getSession(sessionKey);
        const publicSessionData = {
            authority: sessionData.authority,
            username: sessionData.username,
            displayName: sessionData.displayName,
            avatarUrl: sessionData.avatarUrl,
        };
        return publicSessionData;
    }
    /**
     * Retrieves the session data form the KV, if the request contains a valid cookie and the session exists.
     *
     * @param sessionKey the sessionKey string (a hash)
     * @returns complete session data (not to be exposed over the internet)
     * @throws InvalidKeyError or SessionNotFoundError accordingly
     */
    async getSession(sessionKey) {
        if (sessionKey == null) {
            throw new InvalidKeyError();
        }
        const sessionData = await this.retrieveSessionDataFromKv(sessionKey);
        if (sessionData == null) {
            throw new SessionNotFoundError();
        }
        return sessionData;
    }
    /**
     * Deletes the session identified by the cookie (if present and valid), if it exists in the KV.
     *
     * @param sessionKey the sessionKey string (a hash)
     * @throws InvalidKeyError or SessionNotFoundError accordingly
     */
    async deleteSession(sessionKey) {
        if (sessionKey == null) {
            throw new InvalidKeyError();
        }
        const sessionData = await this.retrieveSessionDataFromKv(sessionKey);
        if (sessionData == null) {
            throw new SessionNotFoundError();
        }
        await this.cfg.sessionKv.delete(sessionKey);
    }
    async retrieveSessionDataFromKv(sessionKey) {
        return this.cfg.sessionKv.get(sessionKey, { type: "json" });
    }
}
// Utility public functions
export function getCookies(request) {
    const cookiesString = request.headers.get("Cookie") || "";
    const cookies = cookiesString
        .split("; ")
        .reduce((acc, curr) => {
        const [name, value] = curr.split("=");
        acc[name] = value;
        return acc;
    }, {});
    return cookies;
}
export function createRedirect(url) {
    return new Response("", {
        status: HTTP_CODE.HTTP_FOUND,
        headers: {
            Location: url,
            "Cache-Control": "max-age=0",
        },
    });
}
export function createRedirectWithCookie(url, cookieName, cookieValue, path = "/", sameSite = "None", secure = true, httpOnly = true) {
    const securityFlags = `${secure ? "Secure;" : ""} ${httpOnly ? "HttpOnly;" : ""}`;
    const setCookieString = `${cookieName}=${cookieValue}; SameSite=${sameSite}; Path=${path}; ${securityFlags}`;
    return new Response("", {
        status: HTTP_CODE.HTTP_FOUND,
        headers: {
            Location: url,
            "Set-Cookie": setCookieString,
            "Cache-Control": "max-age=0",
        },
    });
}
export function createRedirectWithClearCookie(url, cookieName, path = "/", sameSite = "None", secure = true, httpOnly = true) {
    const now = new Date().toUTCString();
    const securityFlags = `${secure ? "Secure;" : ""} ${httpOnly ? "HttpOnly;" : ""}`;
    const setCookieString = `${cookieName}=DELETED; Expires=${now} SameSite=${sameSite}; Path=${path}; ${securityFlags}`;
    return new Response("", {
        status: HTTP_CODE.HTTP_FOUND,
        headers: {
            Location: url,
            "Set-Cookie": setCookieString,
            "Cache-Control": "max-age=0",
        },
    });
}
// Private
function generateRandomHash(size) {
    const randomBytes = new Uint8Array(size);
    crypto.getRandomValues(randomBytes);
    return [...randomBytes].map((x) => x.toString(16).padStart(2, "0")).join("");
}
function toJson(data) {
    return JSON.stringify(data, null, 2);
}
