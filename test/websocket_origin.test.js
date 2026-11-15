import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import WebSocket from 'ws';
import { listen } from '../src/common/websocket';

let wss;
let server;
let port;

before(async () => {
  ({ wss, server } = listen(0));
  await once(server, 'listening');
  port = server.address().port;
});

after(() => {
  wss.close();
});

async function handshake(headers, path = '/test') {
  let client = new WebSocket(`ws://127.0.0.1:${port}${path}`, { headers });

  let result = await new Promise((resolve) => {
    client.on('open', () => resolve('open'));
    client.on('unexpected-response', (request, response) =>
      resolve(response.statusCode),
    );
    client.on('error', (error) => resolve(error.message));
  });

  client.terminate();
  return result;
}

let cases = [
  ['no Origin', {}, 'open'],
  ['Origin equal to Host', { origin: 'http://127.0.0.1:PORT' }, 'open'],
  [
    'Origin equal to Host, different case',
    { host: 'Praeco.Internal:8080', origin: 'http://praeco.INTERNAL:8080' },
    'open',
  ],
  [
    'https Origin equal to Host',
    { host: 'praeco.internal', origin: 'https://praeco.internal' },
    'open',
  ],
  [
    'Origin equal to X-Forwarded-Host',
    {
      host: '127.0.0.1:PORT',
      'x-forwarded-host': 'praeco.internal:8080',
      origin: 'http://praeco.internal:8080',
    },
    'open',
  ],
  ['foreign Origin', { origin: 'http://evil.example' }, 403],
  ['Origin null', { origin: 'null' }, 403],
  ['unparseable Origin', { origin: 'not a url' }, 403],
  [
    'Origin port differs from Host',
    { host: 'praeco.internal:8080', origin: 'http://praeco.internal:9090' },
    403,
  ],
  [
    'Host is a prefix of Origin',
    { host: 'praeco.internal', origin: 'http://praeco.internal.evil.example' },
    403,
  ],
  [
    'Host is a suffix of Origin',
    { host: 'praeco.internal', origin: 'http://evilpraeco.internal' },
    403,
  ],
  [
    'X-Forwarded-Host is a prefix of Origin',
    {
      'x-forwarded-host': 'praeco.internal',
      origin: 'http://praeco.internal.evil.example',
    },
    403,
  ],
  [
    'X-Forwarded-Host is a suffix of Origin',
    {
      'x-forwarded-host': 'praeco.internal',
      origin: 'http://evilpraeco.internal',
    },
    403,
  ],
];

for (let [name, headers, expected] of cases) {
  test(name, async () => {
    let resolved = Object.fromEntries(
      Object.entries(headers).map(([key, value]) => [
        key,
        value.replace('PORT', port),
      ]),
    );
    assert.equal(await handshake(resolved), expected);
  });
}

test('wrong path is rejected', async () => {
  assert.equal(await handshake({}, '/other'), 400);
});

test('accepted socket reaches connection listeners', async () => {
  let connected = once(wss, 'connection');
  assert.equal(await handshake({ origin: `http://127.0.0.1:${port}` }), 'open');
  await connected;
});
