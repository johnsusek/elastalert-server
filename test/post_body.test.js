import { describe, test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdtemp,
  mkdir,
  writeFile,
  readFile,
  rm,
  access,
} from 'node:fs/promises';
import { once } from 'node:events';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import config from '../src/common/config';
import { createApp } from '../src/elastalert_server';
import RulesController from '../src/controllers/rules';
import TemplatesController from '../src/controllers/templates';
import { request } from './request';

let original = 'name: existing\ntype: any\n';
let scratch;
let server;
let port;

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

before(async () => {
  if (!config.get('rulesPath')) {
    await new Promise((resolve) => config.ready(resolve));
  }

  scratch = await mkdtemp(join(tmpdir(), 'elastalert-server-'));

  for (let folder of ['rules', 'rule_templates']) {
    await mkdir(join(scratch, folder));
  }

  let rulesController = new RulesController();
  let templatesController = new TemplatesController();
  rulesController.rulesFolder = join(scratch, 'rules');
  templatesController.templatesFolder = join(scratch, 'rule_templates');

  let app = createApp();
  app.set('server', { rulesController, templatesController });

  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  port = server.address().port;
});

after(async () => {
  server.close();
  await rm(scratch, { recursive: true, force: true });
});

for (let [route, folder] of [
  ['rules', 'rules'],
  ['templates', 'rule_templates'],
]) {
  describe(`POST /${route}`, () => {
    let unsupported = [
      [
        'form-encoded',
        {
          body: 'yaml=name%3A+pwned',
          headers: { 'content-type': 'application/x-www-form-urlencoded' },
        },
      ],
      [
        'text/plain',
        {
          body: '{"yaml":"name: pwned"}',
          headers: { 'content-type': 'text/plain' },
        },
      ],
      [
        'multipart',
        {
          body: '--x\r\nContent-Disposition: form-data; name="yaml"\r\n\r\nname: pwned\r\n--x--\r\n',
          headers: { 'content-type': 'multipart/form-data; boundary=x' },
        },
      ],
      ['no Content-Type', {}],
    ];

    for (let [label, options] of unsupported) {
      test(`${label} is 415 and leaves the file unchanged`, async () => {
        let existing = join(scratch, folder, 'existing.yaml');
        await writeFile(existing, original);
        let response = await request(
          port,
          'POST',
          `/${route}/existing`,
          options,
        );
        assert.equal(response.status, 415);
        assert.equal(await readFile(existing, 'utf8'), original);
      });
    }

    for (let [label, body] of [
      ['no yaml', '{}'],
      ['numeric yaml', '{"yaml":1}'],
      ['array body', '[]'],
    ]) {
      test(`JSON with ${label} is 400 and leaves the file unchanged`, async () => {
        let existing = join(scratch, folder, 'existing.yaml');
        await writeFile(existing, original);
        let response = await request(port, 'POST', `/${route}/existing`, {
          body,
          headers: { 'content-type': 'application/json' },
        });
        assert.equal(response.status, 400);
        assert.equal(await readFile(existing, 'utf8'), original);
      });

      test(`JSON with ${label} is 400 and creates nothing for a new id`, async () => {
        let response = await request(port, 'POST', `/${route}/fresh`, {
          body,
          headers: { 'content-type': 'application/json' },
        });
        assert.equal(response.status, 400);
        assert.equal(await exists(join(scratch, folder, 'fresh.yaml')), false);
      });
    }

    test('JSON with a string yaml writes the file', async () => {
      let existing = join(scratch, folder, 'existing.yaml');
      await writeFile(existing, original);
      let response = await request(port, 'POST', `/${route}/existing`, {
        body: JSON.stringify({ yaml: 'name: updated\n' }),
        headers: { 'content-type': 'application/json; charset=utf-8' },
      });
      assert.equal(response.status, 200);
      assert.equal(await readFile(existing, 'utf8'), 'name: updated\n');
    });
  });
}
