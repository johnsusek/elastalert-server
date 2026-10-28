// Tests for src/common/elasticsearch_client.ts.
const { test } = require('node:test');
const assert = require('node:assert');

const esClient = require('../src/common/elasticsearch_client.ts');
const { waitForConfig, startEsStub, withConfig } = require('./helpers.cjs');

test('escapeLuceneSyntax escapes reserved characters', function () {
  assert.strictEqual(esClient.escapeLuceneSyntax('logs-*'), 'logs\\-\\*');
  assert.strictEqual(esClient.escapeLuceneSyntax('a+b:c'), 'a\\+b\\:c');
  assert.strictEqual(esClient.escapeLuceneSyntax('plain'), 'plain');
});

test('getClientVersion reads the major version off the ES endpoint', async function () {
  const loaded = await waitForConfig();
  const stub = await startEsStub('7.17.14');

  try {
    const version = await withConfig(
      {
        es_host: '127.0.0.1',
        es_port: stub.port,
        es_username: '',
        es_password: '',
        es_ssl: false,
        opensearch_flg: loaded.opensearch_flg,
        opensearch2_flg: loaded.opensearch2_flg
      },
      async function () {
        return await esClient.getClientVersion();
      }
    );

    assert.strictEqual(version, 7);
    assert.strictEqual(stub.requests.length, 1);
    assert.strictEqual(stub.requests[0].url, '/');
  } finally {
    stub.server.close();
  }
});

test('getClientVersion returns the OpenSearch major version without a request', async function () {
  const loaded = await waitForConfig();

  const version = await withConfig(
    { opensearch_flg: true, opensearch2_flg: false },
    async function () {
      return await esClient.getClientVersion();
    }
  );

  assert.strictEqual(version, 7);

  const version2 = await withConfig(
    { opensearch_flg: false, opensearch2_flg: true },
    async function () {
      return await esClient.getClientVersion();
    }
  );

  assert.strictEqual(version2, 8);

  // Restore the flag values from the config file for later tests.
  await withConfig(
    {
      opensearch_flg: loaded.opensearch_flg,
      opensearch2_flg: loaded.opensearch2_flg
    },
    async function () {}
  );
});

test('getClient builds a client for the reported ES version', async function () {
  const loaded = await waitForConfig();
  const stub = await startEsStub('7.17.14');

  try {
    const client = await withConfig(
      {
        es_host: '127.0.0.1',
        es_port: stub.port,
        es_username: '',
        es_password: '',
        es_ssl: false,
        opensearch_flg: loaded.opensearch_flg,
        opensearch2_flg: loaded.opensearch2_flg
      },
      async function () {
        return await esClient.getClient();
      }
    );

    assert.ok(client);
    assert.strictEqual(typeof client.search, 'function');
  } finally {
    stub.server.close();
  }
});
