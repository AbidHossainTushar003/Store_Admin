import { Auth0Client } from '@auth0/nextjs-auth0/server';
import { createAuth0SessionDataStore, getAuth0RedisClient } from './auth0-session-store';

const requiredAuth0Environment = [
  'AUTH0_DOMAIN',
  'AUTH0_CLIENT_ID',
  'AUTH0_CLIENT_SECRET',
  'AUTH0_SECRET',
  'AUTH0_AUDIENCE',
  'APP_BASE_URL',
  'API_BASE_URL',
  'REDIS_URL',
  'AUTH0_SESSION_ENCRYPTION_KEY',
] as const;

let client: Auth0Client | undefined;

function hasSecureProductionAppBaseUrl(): boolean {
  if (process.env.NODE_ENV !== 'production') {
    return true;
  }

  try {
    const appBaseUrl = process.env.APP_BASE_URL ?? '';
    const parsedAppBaseUrl = new URL(appBaseUrl);
    return parsedAppBaseUrl.protocol === 'https:' &&
      parsedAppBaseUrl.origin === appBaseUrl;
  } catch {
    return false;
  }
}

function hasSecureProductionRedisUrl(): boolean {
  if (process.env.NODE_ENV !== 'production') {
    return true;
  }
  try {
    return new URL(process.env.REDIS_URL ?? '').protocol === 'rediss:';
  } catch {
    return false;
  }
}

export function hasAuth0Configuration(): boolean {
  return hasSecureProductionAppBaseUrl() &&
    hasSecureProductionRedisUrl() &&
    requiredAuth0Environment.every((name) => Boolean(process.env[name]));
}

export function getAuth0Client(): Auth0Client {
  const missing = requiredAuth0Environment.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(`Admin Auth0 access is not configured. Missing: ${missing.join(', ')}.`);
  }
  if (!hasSecureProductionRedisUrl()) {
    throw new Error('REDIS_URL must use TLS (rediss) in production.');
  }
  if (client) {
    return client;
  }

  const requiredValue = (name: typeof requiredAuth0Environment[number]) => {
    const value = process.env[name];
    if (!value) {
      throw new Error(`Admin Auth0 access is not configured. Missing: ${name}.`);
    }
    return value;
  };

  const appBaseUrl = requiredValue('APP_BASE_URL');
  client = new Auth0Client({
    domain: requiredValue('AUTH0_DOMAIN'),
    clientId: requiredValue('AUTH0_CLIENT_ID'),
    clientSecret: requiredValue('AUTH0_CLIENT_SECRET'),
    secret: requiredValue('AUTH0_SECRET'),
    appBaseUrl,
    authorizationParameters: {
      audience: requiredValue('AUTH0_AUDIENCE'),
      scope: 'openid profile email',
    },
    sessionStore: {
      get: async (id) => (
        await createAuth0SessionDataStore(await getAuth0RedisClient())
      ).get(id),
      set: async (id, session) => (
        await createAuth0SessionDataStore(await getAuth0RedisClient())
      ).set(id, session),
      delete: async (id) => (
        await createAuth0SessionDataStore(await getAuth0RedisClient())
      ).delete(id),
      deleteByLogoutToken: async (logoutToken) => {
        const store = createAuth0SessionDataStore(await getAuth0RedisClient());
        await store.deleteByLogoutToken?.(logoutToken);
      },
    },
    session: {
      absoluteDuration: 60 * 60 * 24 * 3,
      inactivityDuration: 60 * 60 * 24,
      cookie: {
        sameSite: 'lax',
        secure: appBaseUrl.startsWith('https://'),
      },
    },
  });
  return client;
}
