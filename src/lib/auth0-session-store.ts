import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from 'node:crypto';
import { createClient } from 'redis';
import type { SessionData, SessionDataStore } from '@auth0/nextjs-auth0/types';

const SESSION_TTL_SECONDS = 60 * 60 * 24;
const SESSION_ABSOLUTE_SECONDS = 60 * 60 * 24 * 3;
const SESSION_PREFIX = 'shopademia:auth0:session:';
const SESSION_SID_BY_ID_PREFIX = 'shopademia:auth0:session-sid:';
const SESSION_ID_BY_SID_PREFIX = 'shopademia:auth0:sid-session:';
const ACTIVE_SESSION_PREFIX = 'shopademia:auth0:active:';
const USER_SESSIONS_PREFIX = 'shopademia:auth0:user-sessions:';

type RedisClient = ReturnType<typeof createClient>;

let clientPromise: Promise<RedisClient> | undefined;

function getEncryptionKey(): Buffer {
  const encoded = process.env.AUTH0_SESSION_ENCRYPTION_KEY;
  if (!encoded) {
    throw new Error('AUTH0_SESSION_ENCRYPTION_KEY is required for Auth0 sessions.');
  }

  const key = Buffer.from(encoded, 'base64');
  if (
    key.length !== 32 ||
    key.toString('base64').replace(/=+$/, '') !== encoded.replace(/=+$/, '')
  ) {
    throw new Error('AUTH0_SESSION_ENCRYPTION_KEY must be a base64-encoded 32-byte key.');
  }
  return key;
}

function getRedisClient(): Promise<RedisClient> {
  if (clientPromise) {
    return clientPromise;
  }

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    throw new Error('REDIS_URL is required for Auth0 sessions.');
  }

  const client = createClient({ url: redisUrl });
  client.on('error', () => {
    console.error('Auth0 session storage is unavailable.');
  });
  clientPromise = client.connect()
    .then(() => client)
    .catch((error: unknown) => {
      clientPromise = undefined;
      throw error;
    });
  return clientPromise;
}

function encryptSession(session: SessionData, key: Buffer): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(session), 'utf8'),
    cipher.final(),
  ]);
  return [
    'v1',
    iv.toString('base64url'),
    cipher.getAuthTag().toString('base64url'),
    encrypted.toString('base64url'),
  ].join('.');
}

function decryptSession(encrypted: string, key: Buffer): SessionData {
  const [version, ivPart, tagPart, dataPart, ...rest] = encrypted.split('.');
  if (version !== 'v1' || !ivPart || !tagPart || !dataPart || rest.length > 0) {
    throw new Error('Stored Auth0 session has an invalid format.');
  }

  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(ivPart, 'base64url'));
  decipher.setAuthTag(Buffer.from(tagPart, 'base64url'));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(dataPart, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
  return JSON.parse(plaintext) as SessionData;
}

function toText(value: string | Buffer | null): string | null {
  if (value === null) {
    return null;
  }
  return typeof value === 'string' ? value : value.toString('utf8');
}

function ttlFor(session: SessionData): number {
  const absoluteExpiry = session.internal.createdAt + SESSION_ABSOLUTE_SECONDS;
  return Math.max(
    1,
    Math.min(SESSION_TTL_SECONDS, absoluteExpiry - Math.floor(Date.now() / 1000)),
  );
}

async function removeSession(client: RedisClient, id: string): Promise<void> {
  const sid = toText(await client.get(`${SESSION_SID_BY_ID_PREFIX}${id}`));
  if (!sid) {
    await client.del([`${SESSION_PREFIX}${id}`, `${SESSION_SID_BY_ID_PREFIX}${id}`]);
    return;
  }

  const activeKey = `${ACTIVE_SESSION_PREFIX}${sid}`;
  const sub = toText(await client.get(activeKey));
  const transaction = client.multi()
    .del(`${SESSION_PREFIX}${id}`)
    .del(`${SESSION_SID_BY_ID_PREFIX}${id}`)
    .del(`${SESSION_ID_BY_SID_PREFIX}${sid}`)
    .del(activeKey);
  if (sub) {
    transaction.sRem(`${USER_SESSIONS_PREFIX}${sub}`, sid);
    if ((await client.sCard(`${USER_SESSIONS_PREFIX}${sub}`)) <= 1) {
      transaction.del(`${USER_SESSIONS_PREFIX}${sub}`);
    }
  }
  await transaction.exec();
}

export function createAuth0SessionDataStore(
  client: RedisClient,
  encryptionKey: Buffer = getEncryptionKey(),
): SessionDataStore {
  return {
    async get(id) {
      const value = toText(await client.get(`${SESSION_PREFIX}${id}`));
      return value ? decryptSession(value, encryptionKey) : null;
    },

    async set(id, session) {
      const sid = session.internal.sid;
      const ttl = ttlFor(session);
      const previousSid = toText(await client.get(`${SESSION_SID_BY_ID_PREFIX}${id}`));
      if (previousSid && previousSid !== sid) {
        await removeSession(client, id);
      }
      const transaction = client.multi()
        .set(`${SESSION_PREFIX}${id}`, encryptSession(session, encryptionKey), { EX: ttl })
        .set(`${SESSION_SID_BY_ID_PREFIX}${id}`, sid, { EX: ttl })
        .set(`${SESSION_ID_BY_SID_PREFIX}${sid}`, id, { EX: ttl })
        .set(`${ACTIVE_SESSION_PREFIX}${sid}`, session.user.sub, { EX: ttl })
        .sAdd(`${USER_SESSIONS_PREFIX}${session.user.sub}`, sid)
        .expire(`${USER_SESSIONS_PREFIX}${session.user.sub}`, ttl);
      await transaction.exec();
    },

    async delete(id) {
      await removeSession(client, id);
    },

    async deleteByLogoutToken(logoutToken) {
      if (logoutToken.sid) {
        const id = toText(await client.get(`${SESSION_ID_BY_SID_PREFIX}${logoutToken.sid}`));
        const sub = toText(await client.get(`${ACTIVE_SESSION_PREFIX}${logoutToken.sid}`));
        if (id && (!logoutToken.sub || logoutToken.sub === sub)) {
          await removeSession(client, id);
        }
        return;
      }

      if (logoutToken.sub) {
        const sessions = await client.sMembers(`${USER_SESSIONS_PREFIX}${logoutToken.sub}`);
        for (const sid of sessions) {
          const id = toText(await client.get(`${SESSION_ID_BY_SID_PREFIX}${sid}`));
          if (id) {
            await removeSession(client, id);
          }
        }
      }
    },
  };
}

export async function getAuth0RedisClient(): Promise<RedisClient> {
  return getRedisClient();
}
