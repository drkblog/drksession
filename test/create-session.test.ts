import { SessionManager, SessionManagerConfiguration } from '../src/drksession';
import { DefaultKvAdapter, KvAdapter } from '../src/kvadapter';
import { clearKv } from './test-utility';

declare var global: any;
declare const DRK_SESSION: KVNamespace;
const DRK_SESSION_ADAPTER: KvAdapter = new DefaultKvAdapter(DRK_SESSION);

const VALID_DOMAINS = [
  'drk.com.ar',
  'www.drk.com.ar',
  'drkbugs.com',
  'www.drkbugs.com',
  'drk.ar',
  'www.drk.ar'
];

describe('Create session tests', () => {
  const configuration: SessionManagerConfiguration = {
    sessionKv: DRK_SESSION_ADAPTER,
    cookieName: 'cookieName',
    validOrigins: VALID_DOMAINS,
    sessionTtl: 2 * 3600
  };
  const sessionManager: SessionManager = new SessionManager(configuration);

  describe('Tests cases', () => {
    beforeEach(async () => {
      clearKv(DRK_SESSION);
    });

    test('Session hash is at least 60 digits long', async () => {
      const authority = 'AUTH';
      const username = 'user';
      const displayName = 'display name';
      const avatarUrl = 'https://www.dummy.com/image.jpg';
      const hash = await sessionManager.createAndStoreSession(authority, username, displayName, avatarUrl, null);
      expect(hash.length).toBeGreaterThanOrEqual(60);
    });
  });
});