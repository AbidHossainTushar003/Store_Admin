const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

class MemoryRedis {
  values = new Map();
  sets = new Map();

  async get(key) {
    return this.values.get(key) ?? null;
  }

  async set(key, value) {
    this.values.set(key, value);
    return 'OK';
  }

  async del(keys) {
    const values = Array.isArray(keys) ? keys : [keys];
    for (const key of values) {
      this.values.delete(key);
      this.sets.delete(key);
    }
    return values.length;
  }

  async sAdd(key, member) {
    const members = this.sets.get(key) ?? new Set();
    members.add(member);
    this.sets.set(key, members);
    return 1;
  }

  async sRem(key, member) {
    return this.sets.get(key)?.delete(member) ? 1 : 0;
  }

  async sCard(key) {
    return this.sets.get(key)?.size ?? 0;
  }

  async sMembers(key) {
    return [...(this.sets.get(key) ?? [])];
  }

  async expire() {
    return 1;
  }

  multi() {
    const commands = [];
    const queue = (method) => (...args) => {
      commands.push(() => this[method](...args));
      return transaction;
    };
    const transaction = {
      set: queue('set'),
      del: queue('del'),
      sAdd: queue('sAdd'),
      sRem: queue('sRem'),
      expire: queue('expire'),
      exec: async () => {
        for (const command of commands) {
          await command();
        }
        return [];
      },
    };
    return transaction;
  }
}

function loadSessionStore() {
  const filename = path.join(__dirname, '..', 'src', 'lib', 'auth0-session-store.ts');
  const source = fs.readFileSync(filename, 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const loadedModule = new Module(filename, module);
  loadedModule.filename = filename;
  loadedModule.paths = Module._nodeModulePaths(path.dirname(filename));
  loadedModule._compile(compiled, filename);
  return loadedModule.exports;
}

function loadAdminApiBase() {
  const filename = path.join(__dirname, '..', 'src', 'lib', 'api-base.ts');
  const source = fs.readFileSync(filename, 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const loadedModule = new Module(filename, module);
  loadedModule.filename = filename;
  loadedModule.paths = Module._nodeModulePaths(path.dirname(filename));
  loadedModule._compile(compiled, filename);
  return loadedModule.exports;
}

function loadAuth0Module() {
  const previousTypeScriptLoader = Module._extensions['.ts'];
  Module._extensions['.ts'] = (loadedModule, filename) => {
    const source = fs.readFileSync(filename, 'utf8');
    const compiled = ts.transpileModule(source, {
      compilerOptions: {
        esModuleInterop: true,
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText;
    loadedModule._compile(compiled, filename);
  };

  try {
    return require('../src/lib/auth0.ts');
  } finally {
    if (previousTypeScriptLoader) {
      Module._extensions['.ts'] = previousTypeScriptLoader;
    } else {
      delete Module._extensions['.ts'];
    }
  }
}

const { createAuth0SessionDataStore } = loadSessionStore();
const { hasAuth0Configuration } = loadAuth0Module();
const key = Buffer.alloc(32, 17);
const session = {
  user: { sub: 'auth0|admin' },
  tokenSet: { accessToken: 'private-admin-token', expiresAt: 1_900_000_000 },
  internal: { sid: 'admin-session-1', createdAt: Math.floor(Date.now() / 1000) },
};

test('stores encrypted session data and publishes the API active-session index', async () => {
  const redis = new MemoryRedis();
  const store = createAuth0SessionDataStore(redis, key);

  await store.set('admin-session-id', session);

  const ciphertext = await redis.get('shopademia:auth0:session:admin-session-id');
  assert.ok(ciphertext);
  assert.equal(ciphertext.includes('private-admin-token'), false);
  assert.deepEqual(await store.get('admin-session-id'), session);
  assert.equal(
    await redis.get('shopademia:auth0:active:admin-session-1'),
    'auth0|admin',
  );
});

test('rejects a tampered session ciphertext', async () => {
  const redis = new MemoryRedis();
  const store = createAuth0SessionDataStore(redis, key);
  await store.set('admin-session-id', session);
  const keyName = 'shopademia:auth0:session:admin-session-id';
  const ciphertext = await redis.get(keyName);
  await redis.set(keyName, `${ciphertext}tampered`);

  await assert.rejects(store.get('admin-session-id'));
});

test('revokes the active-session index only for a matching Auth0 logout identity', async () => {
  const redis = new MemoryRedis();
  const store = createAuth0SessionDataStore(redis, key);
  await store.set('admin-session-id', session);

  await store.deleteByLogoutToken({ sid: 'admin-session-1', sub: 'auth0|other' });
  assert.equal(await redis.get('shopademia:auth0:active:admin-session-1'), 'auth0|admin');

  await store.deleteByLogoutToken({ sid: 'admin-session-1', sub: 'auth0|admin' });
  assert.equal(await redis.get('admin-session-id'), null);
  assert.equal(await redis.get('shopademia:auth0:active:admin-session-1'), null);
});

test('requires an HTTPS Auth0 application origin in production', () => {
  const names = [
    'AUTH0_DOMAIN',
    'AUTH0_CLIENT_ID',
    'AUTH0_CLIENT_SECRET',
    'AUTH0_SECRET',
    'AUTH0_AUDIENCE',
    'APP_BASE_URL',
    'API_BASE_URL',
    'REDIS_URL',
    'AUTH0_SESSION_ENCRYPTION_KEY',
  ];
  const previousValues = new Map(names.map((name) => [name, process.env[name]]));
  const previousNodeEnv = process.env.NODE_ENV;

  try {
    for (const name of names) {
      process.env[name] = name === 'APP_BASE_URL'
        ? 'http://admin.example.test'
        : name === 'REDIS_URL'
          ? 'rediss://cache.example.test:6380'
        : 'test-configuration-value';
    }
    process.env.NODE_ENV = 'production';
    assert.equal(hasAuth0Configuration(), false);

    process.env.APP_BASE_URL = 'https://admin.example.test';
    process.env.REDIS_URL = 'redis://cache.example.test:6379';
    assert.equal(hasAuth0Configuration(), false);

    process.env.REDIS_URL = 'rediss://cache.example.test:6380';
    assert.equal(hasAuth0Configuration(), true);
  } finally {
    for (const [name, value] of previousValues) {
      if (value === undefined) {
        delete process.env[name];
      } else {
        process.env[name] = value;
      }
    }
    if (previousNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = previousNodeEnv;
    }
  }
});

test('requires the Auth0 Admin BFF mode in production', () => {
  const names = ['NODE_ENV', 'NEXT_PUBLIC_ADMIN_AUTH_MODE'];
  const previousValues = new Map(names.map((name) => [name, process.env[name]]));

  try {
    process.env.NODE_ENV = 'production';
    delete process.env.NEXT_PUBLIC_ADMIN_AUTH_MODE;
    assert.throws(loadAdminApiBase, /Production Admin Portal requires/);

    process.env.NEXT_PUBLIC_ADMIN_AUTH_MODE = 'auth0';
    assert.equal(loadAdminApiBase().apiBaseUrl, '/api/admin-proxy');
  } finally {
    for (const [name, value] of previousValues) {
      if (value === undefined) {
        delete process.env[name];
      } else {
        process.env[name] = value;
      }
    }
  }
});
