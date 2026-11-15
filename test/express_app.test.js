import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createApp } from '../src/elastalert_server';
import { request } from './request';

let server;
let port;

before(async () => {
  let app = createApp();
  app.post('/echo', (incoming, response) =>
    response.send({ body: incoming.body ?? null }),
  );
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  port = server.address().port;
});

after(() => {
  server.close();
});

test('no CORS headers on a cross-origin request', async () => {
  let response = await request(port, 'POST', '/echo', {
    body: '{}',
    headers: {
      origin: 'http://evil.example',
      'content-type': 'application/json',
    },
  });
  assert.equal(response.status, 200);
  assert.equal(response.headers['access-control-allow-origin'], undefined);
});

test('no CORS headers on a preflight', async () => {
  let response = await request(port, 'OPTIONS', '/echo', {
    headers: {
      origin: 'http://evil.example',
      'access-control-request-method': 'POST',
      'access-control-request-headers': 'content-type',
    },
  });
  assert.equal(response.headers['access-control-allow-origin'], undefined);
  assert.equal(response.headers['access-control-allow-methods'], undefined);
});

test('form-encoded body is rejected', async () => {
  let response = await request(port, 'POST', '/echo', {
    body: 'yaml=name%3A+pwned',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
  });
  assert.equal(response.status, 415);
});

test('JSON body is parsed', async () => {
  let response = await request(port, 'POST', '/echo', {
    body: '{"yaml":"name: ok"}',
    headers: { 'content-type': 'application/json' },
  });
  assert.deepEqual(JSON.parse(response.text), { body: { yaml: 'name: ok' } });
});
