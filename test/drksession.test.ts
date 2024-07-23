import { describe, it, expect, beforeEach } from "vitest";
import { env } from "cloudflare:test";
import { SessionManager, SessionManagerConfiguration, PublicSessionData } from "../src/drksession";
import { SessionNotFoundError } from "../src/errors";
import { DefaultKvAdapter, KvAdapter } from "../src/kvadapter";
import { kvContainsKey, kvKeyCount, kvClear } from "./test-utility";

const DRK_SESSION: KVNamespace = env.DRK_SESSION;
const DRK_SESSION_ADAPTER: KvAdapter = new DefaultKvAdapter(DRK_SESSION);

describe("Session tests", () => {
  const configuration: SessionManagerConfiguration = {
    sessionKv: DRK_SESSION_ADAPTER,
    sessionTtl: 2 * 3600,
  };
  const sessionManager: SessionManager = new SessionManager(configuration);

  beforeEach(async () => {
    kvClear(DRK_SESSION);
  });

  it("Session hash is at least 60 digits long", async () => {
    const sessionData: PublicSessionData = {
      authority: "AUTH",
      username: "user",
      displayName: "display name",
      avatarUrl: "https://www.dummy.com/image.jpg",
    };

    const hash = await sessionManager.createAndStoreSession(
      sessionData,
      null,
    );

    expect(hash).not.toBeNull();
    expect(hash.length).toBeGreaterThanOrEqual(60);
  });

  it("Session is restored properly", async () => {
    const sessionData: PublicSessionData = {
      authority: "AUTH",
      username: "user",
      displayName: "display name",
      avatarUrl: "https://www.dummy.com/image.jpg",
    };
    const hash = await sessionManager.createAndStoreSession(
      sessionData,
      null,
    );

    const session = await sessionManager.getSession(hash);

    expect(await kvKeyCount(DRK_SESSION)).toEqual(1);
    expect(await kvContainsKey(DRK_SESSION, hash)).toBeTruthy();
    expect(session.authority).toEqual(sessionData.authority);
    expect(session.username).toEqual(sessionData.username);
    expect(session.displayName).toEqual(sessionData.displayName);
    expect(session.avatarUrl).toEqual(sessionData.avatarUrl);
  });

  it.each([
    (hash: string) => hash + "x",
    (hash: string) => hash.substring(0, hash.length - 1),
    (hash: string) => hash.replace(hash[0], String.fromCharCode(hash.charCodeAt(0) + 1))
  ])("Session is not restored if wrong key", async (transform) => {
    const sessionData: PublicSessionData = {
      authority: "AUTH",
      username: "user",
      displayName: "display name",
      avatarUrl: "https://www.dummy.com/image.jpg",
    };
    const hash = await sessionManager.createAndStoreSession(
      sessionData,
      null,
    );

    await expect(async () => await sessionManager.getSession(transform(hash))).rejects.toThrow(
      SessionNotFoundError,
    );

    expect(await kvKeyCount(DRK_SESSION)).toEqual(1);
    expect(await kvContainsKey(DRK_SESSION, hash)).toBeTruthy();
  });

  it("Public session doesn't contain private data", async () => {
    const privateData = { data: "private data" };
    const sessionData: PublicSessionData = {
      authority: "AUTH",
      username: "user",
      displayName: "display name",
      avatarUrl: "https://www.dummy.com/image.jpg",
    };
    const hash = await sessionManager.createAndStoreSession(
      sessionData,
      privateData,
    );

    const publicSessionData = await sessionManager.getPublicSessionData(hash);

    // PublicSessionData type doesn't contain private data but if the attribute
    // is added by mistake, this will help us to catch it.
    const publicSessionDataJson = JSON.stringify(publicSessionData);

    expect(publicSessionDataJson).not.toContain(privateData.data);
    expect(await kvKeyCount(DRK_SESSION)).toEqual(1);
    expect(await kvContainsKey(DRK_SESSION, hash)).toBeTruthy();
    expect(publicSessionData.authority).toEqual(sessionData.authority);
    expect(publicSessionData.username).toEqual(sessionData.username);
    expect(publicSessionData.displayName).toEqual(sessionData.displayName);
    expect(publicSessionData.avatarUrl).toEqual(sessionData.avatarUrl);
  });
  
  it("Session is deleted properly", async () => {
    const sessionData: PublicSessionData = {
      authority: "AUTH",
      username: "user",
      displayName: "display name",
      avatarUrl: "https://www.dummy.com/image.jpg",
    };
    const hash = await sessionManager.createAndStoreSession(
      sessionData,
      null,
    );

    await sessionManager.deleteSession(hash);

    await expect(async () => sessionManager.getSession(hash)).rejects.toThrow(
      SessionNotFoundError,
    );
    expect(await kvKeyCount(DRK_SESSION)).toEqual(0);
    expect(await kvContainsKey(DRK_SESSION, hash)).toBeFalsy();
  });

  it.each([
    (hash: string) => hash + "x",
    (hash: string) => hash.substring(0, hash.length - 1),
    (hash: string) => hash.replace(hash[0], String.fromCharCode(hash.charCodeAt(0) + 1))
  ])("Delete session fails if invalid key", async (transform) => {
    const sessionData: PublicSessionData = {
      authority: "AUTH",
      username: "user",
      displayName: "display name",
      avatarUrl: "https://www.dummy.com/image.jpg",
    };
    const hash = await sessionManager.createAndStoreSession(
      sessionData,
      null,
    );

    await expect(async () => await sessionManager.deleteSession(transform(hash))).rejects.toThrow(
      SessionNotFoundError,
    );

    expect(await kvKeyCount(DRK_SESSION)).toEqual(1);
    expect(await kvContainsKey(DRK_SESSION, hash)).toBeTruthy();
  });

});
