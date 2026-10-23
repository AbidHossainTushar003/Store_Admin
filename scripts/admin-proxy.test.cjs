const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

function loadProxyRoute() {
  const filename = path.join(
    __dirname,
    '..',
    'src',
    'lib',
    'admin-proxy-policy.ts',
  );
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

const { isAllowedAdminProxyPath } = loadProxyRoute();

test('allows only intended read-only Admin data and identity paths', () => {
  for (const path of [
    ['admin', 'summary'],
    ['admin', 'orders'],
    ['admin', 'products'],
    ['super-admin', 'me'],
  ]) {
    assert.equal(isAllowedAdminProxyPath('GET', path), true);
  }
  assert.equal(isAllowedAdminProxyPath('GET', ['admin', 'unknown']), false);
});

test('allows only the bootstrap write and explicitly scoped Admin mutations', () => {
  assert.equal(isAllowedAdminProxyPath('POST', ['super-admin', 'bootstrap']), true);
  assert.equal(isAllowedAdminProxyPath('POST', ['admin', 'users']), false);
  assert.equal(isAllowedAdminProxyPath('PATCH', ['admin', 'products', 'listing-1', 'status']), true);
  assert.equal(isAllowedAdminProxyPath('PATCH', ['admin', 'products', 'listing-1', 'publication']), true);
  assert.equal(isAllowedAdminProxyPath('PATCH', ['admin', 'orders', 'order-1', 'confirm']), true);
  assert.equal(isAllowedAdminProxyPath('DELETE', ['admin', 'products', 'listing-1']), false);
});

test('rejects path traversal, slashes, and unexpected methods', () => {
  assert.equal(isAllowedAdminProxyPath('GET', ['admin', '..', 'summary']), false);
  assert.equal(isAllowedAdminProxyPath('GET', ['admin', 'orders/order-1']), false);
  assert.equal(isAllowedAdminProxyPath('POST', ['super-admin', 'me']), false);
  assert.equal(isAllowedAdminProxyPath('PATCH', ['super-admin', 'bootstrap']), false);
});
