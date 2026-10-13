// Tests for the ApiKey, Bearer and Cloud ID connection options.
const { test } = require('node:test');
const assert = require('node:assert');

const axios = require('axios');

const esClient = require('../src/common/elasticsearch_client.js');
const { waitForConfig, startEsStub, withConfig } = require('./helpers.cjs');

function cloudIdFor(host) {
  const encoded = Buffer.from(`${host}$es-uuid$kibana-uuid`).toString('base64');
  return `test-deployment:${encoded}`;
}

const base = {
  es_host: '127.0.0.1',
  es_username: '',
  es_password: '',
  es_ssl: false,
  opensearch_flg: false,
  opensearch2_flg: false,
  es_api_key: '',
  es_bearer: '',
  es_cloud_id: ''
};

function overrides(port, extra) {
  return Object.assign({}, base, { es_port: port }, extra);
}

test('getCloudHost decodes the host out of a cloud id', function () {
  assert.strictEqual(
    esClient.getCloudHost(cloudIdFor('abc123.example.es.io')),
    'es-uuid.abc123.example.es.io'
  );
  assert.throws(function () {
    esClient.getCloudHost('missing-the-base64-part');
  }, /Invalid es_cloud_id/);
});

test('getAuthHeaders builds the ApiKey and Bearer headers', async function () {
  await withConfig({ es_api_key: 'key-1', es_bearer: '' }, function () {
    assert.deepStrictEqual(esClient.getAuthHeaders(), { Authorization: 'ApiKey key-1' });
  });
  await withConfig({ es_api_key: '', es_bearer: 'tok-2' }, function () {
    assert.deepStrictEqual(esClient.getAuthHeaders(), { Authorization: 'Bearer tok-2' });
  });
  await withConfig({ es_api_key: '', es_bearer: '' }, function () {
    assert.deepStrictEqual(esClient.getAuthHeaders(), {});
  });
});

test('getEsAuth prefers ApiKey over Bearer', async function () {
  await withConfig({ es_api_key: 'key-1', es_bearer: 'tok-2' }, function () {
    assert.deepStrictEqual(esClient.getEsAuth(), { apiKey: 'key-1' });
  });
  await withConfig({ es_api_key: '', es_bearer: 'tok-2' }, function () {
    assert.deepStrictEqual(esClient.getEsAuth(), { bearer: 'tok-2' });
  });
  await withConfig({ es_api_key: '', es_bearer: '' }, function () {
    assert.strictEqual(esClient.getEsAuth(), null);
  });
});

test('getClientVersion sends the ApiKey header', async function () {
  await waitForConfig();
  const stub = await startEsStub('7.17.14');
  try {
    const version = await withConfig(
      overrides(stub.port, { es_api_key: 'key-1' }),
      async function () {
        return await esClient.getClientVersion();
      }
    );
    assert.strictEqual(version, 7);
    assert.strictEqual(stub.requests[0].auth, 'ApiKey key-1');
  } finally {
    stub.server.close();
  }
});

test('getClientVersion sends the Bearer header', async function () {
  await waitForConfig();
  const stub = await startEsStub('7.17.14');
  try {
    const version = await withConfig(
      overrides(stub.port, { es_bearer: 'tok-2' }),
      async function () {
        return await esClient.getClientVersion();
      }
    );
    assert.strictEqual(version, 7);
    assert.strictEqual(stub.requests[0].auth, 'Bearer tok-2');
  } finally {
    stub.server.close();
  }
});

test('the client sends the ApiKey header when pinging', async function () {
  await waitForConfig();
  const stub = await startEsStub('7.17.14');
  try {
    const pinged = await withConfig(
      overrides(stub.port, { es_api_key: 'key-1' }),
      async function () {
        const client = await esClient.getClient();
        return await client.ping();
      }
    );
    assert.ok(pinged);
    const seen = stub.requests.map(function (request) {
      return request.auth;
    });
    assert.ok(seen.indexOf('ApiKey key-1') !== -1);
  } finally {
    stub.server.close();
  }
});

test('getClient builds a client from a cloud id', async function () {
  await waitForConfig();
  const stub = await startEsStub('7.17.14');
  const realGet = axios.get;
  const probes = [];
  // Probing a cloud id would go to https on port 443, answer the version
  // probe directly and only exercise the client construction.
  axios.get = async function (url, options) {
    probes.push({ url: url, headers: options.headers });
    return { data: { version: { number: '7.17.14' } } };
  };
  try {
    const client = await withConfig(
      overrides(stub.port, { es_cloud_id: cloudIdFor('example.elastic.cloud'), es_api_key: 'key-1' }),
      async function () {
        return await esClient.getClient();
      }
    );
    assert.ok(client);
    assert.strictEqual(probes[0].url, 'https://es-uuid.example.elastic.cloud');
    assert.strictEqual(probes[0].headers.Authorization, 'ApiKey key-1');
  } finally {
    axios.get = realGet;
    stub.server.close();
  }
});
