// Tests for the config schema and the loaded config singleton.
const { test } = require('node:test');
const assert = require('node:assert');

const schema = require('../src/common/config/schema.js').default;
const { waitForConfig } = require('./helpers.cjs');

test('schema fills in defaults for an empty config', function () {
  const validated = schema.validate({});
  assert.ifError(validated.error);
  assert.strictEqual(validated.value.es_host, 'elastalert');
  assert.strictEqual(validated.value.es_port, 9200);
  assert.strictEqual(validated.value.es_ssl, false);
  assert.strictEqual(validated.value.port, 3030);
});

test('schema keeps values that are provided', function () {
  const validated = schema.validate({
    es_host: 'es.example.com',
    es_port: 9243,
    es_ssl: true
  });
  assert.ifError(validated.error);
  assert.strictEqual(validated.value.es_host, 'es.example.com');
  assert.strictEqual(validated.value.es_port, 9243);
  assert.strictEqual(validated.value.es_ssl, true);
});

test('the config file is loaded and validated on startup', async function () {
  const loaded = await waitForConfig();
  assert.strictEqual(typeof loaded.es_host, 'string');
  assert.strictEqual(typeof loaded.es_port, 'number');
  assert.strictEqual(typeof loaded.es_ssl, 'boolean');
  assert.strictEqual(typeof loaded.rulesPath.path, 'string');
});
