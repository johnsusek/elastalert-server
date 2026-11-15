import { describe, test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm, access } from 'node:fs/promises';
import { once } from 'node:events';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import express from 'express';
import config from '../src/common/config';
import setupRouter from '../src/routes/route_setup';
import RulesController from '../src/controllers/rules';
import TemplatesController from '../src/controllers/templates';
import FoldersController from '../src/controllers/folders';
import SilenceController from '../src/controllers/silence';
import { request } from './request';

let scratch;
let base;
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
  base = join(scratch, 'base');

  await mkdir(base);

  for (let folder of [
    'rules',
    'rules-evil',
    'rule_templates',
    'rule_templates-evil',
  ]) {
    await mkdir(join(base, folder));
  }

  await writeFile(join(base, 'config.yaml'), 'es_password: hunter2\n');
  await writeFile(join(base, 'rules', 'good.yaml'), 'name: good\n');
  await writeFile(
    join(base, 'rules-evil', 'secret.yaml'),
    'name: sibling-content\n',
  );
  await writeFile(join(base, 'rule_templates', 'good.yaml'), 'name: good\n');
  await writeFile(
    join(base, 'rule_templates-evil', 'secret.yaml'),
    'name: sibling-content\n',
  );

  let rulesController = new RulesController();
  let templatesController = new TemplatesController();
  let foldersController = new FoldersController();
  rulesController.rulesFolder = join(base, 'rules');
  templatesController.templatesFolder = join(base, 'rule_templates');
  foldersController.rulesFolder = join(base, 'rules');
  foldersController.templatesFolder = join(base, 'rule_templates');

  let app = express();
  app.use(express.json());
  setupRouter(app);
  app.set('server', {
    rulesController,
    templatesController,
    foldersController,
  });

  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  port = server.address().port;
});

after(async () => {
  server.close();
  await rm(scratch, { recursive: true, force: true });
});

for (let [route, root, sibling] of [
  ['rules', 'rules', 'rules-evil'],
  ['templates', 'rule_templates', 'rule_templates-evil'],
]) {
  describe(`/${route}`, () => {
    let escapes = [
      '..%2Fconfig',
      `..%2F${sibling}%2Fsecret`,
      '%2E%2E%2Fconfig',
      `good%2F..%2F..%2F${sibling}%2Fsecret`,
      'config%00',
    ];

    for (let id of escapes) {
      test(`GET ${id} is 404`, async () => {
        let response = await request(port, 'GET', `/${route}/${id}`);
        assert.equal(response.status, 404);
        assert.doesNotMatch(response.text, /hunter2|sibling-content/);
      });

      test(`DELETE ${id} is 404 and deletes nothing`, async () => {
        let response = await request(port, 'DELETE', `/${route}/${id}`);
        assert.equal(response.status, 404);
        assert.ok(await exists(join(base, 'config.yaml')));
        assert.ok(await exists(join(base, sibling, 'secret.yaml')));
      });
    }

    for (let id of ['..%2Fpwned', `..%2F${sibling}%2Fpwned`, 'pwned%00']) {
      test(`POST ${id} is 404 and writes nothing`, async () => {
        let response = await request(port, 'POST', `/${route}/${id}`, {
          body: JSON.stringify({ yaml: 'name: pwned\n' }),
          headers: { 'content-type': 'application/json' },
        });
        assert.equal(response.status, 404);
        assert.equal(await exists(join(base, 'pwned.yaml')), false);
        assert.equal(await exists(join(base, sibling, 'pwned.yaml')), false);
      });
    }

    test('absolute id stays inside the root', async () => {
      let absolute = encodeURIComponent(join(base, 'config'));
      let response = await request(port, 'GET', `/${route}/${absolute}`);
      assert.equal(response.status, 404);
      assert.doesNotMatch(response.text, /hunter2/);
    });

    for (let path of ['..', `..%2F${sibling}`, '%2F..%2F..', 'x%00']) {
      test(`list ?path=${path} is 404`, async () => {
        let response = await request(port, 'GET', `/${route}?path=${path}`);
        assert.equal(response.status, 404);
        assert.doesNotMatch(
          response.text,
          /hunter2|sibling-content|config.yaml/,
        );
      });
    }

    test('normal ids still work', async () => {
      assert.equal((await request(port, 'GET', `/${route}/good`)).status, 200);
      assert.equal((await request(port, 'GET', `/${route}`)).status, 200);

      let created = await request(port, 'POST', `/${route}/fresh`, {
        body: JSON.stringify({ yaml: 'name: fresh\n' }),
        headers: { 'content-type': 'application/json' },
      });
      assert.equal(created.status, 200);
      assert.ok(await exists(join(base, root, 'fresh.yaml')));
      assert.equal(
        (await request(port, 'DELETE', `/${route}/fresh`)).status,
        200,
      );
    });
  });
}

describe('/folders', () => {
  for (let [type, sibling] of [
    ['rules', 'rules-evil'],
    ['templates', 'rule_templates-evil'],
  ]) {
    test(`PUT ${type} outside the root is 404 and creates nothing`, async () => {
      for (let path of ['..%2Fmade', `..%2F${sibling}%2Fmade`, 'made%00']) {
        let response = await request(port, 'PUT', `/folders/${type}/${path}`);
        assert.equal(response.status, 404);
      }

      assert.equal(await exists(join(base, 'made')), false);
      assert.equal(await exists(join(base, sibling, 'made')), false);
    });

    test(`DELETE ${type} outside the root is 404 and deletes nothing`, async () => {
      for (let path of ['..', `..%2F${sibling}`]) {
        let response = await request(
          port,
          'DELETE',
          `/folders/${type}/${path}`,
        );
        assert.equal(response.status, 404);
      }

      assert.ok(await exists(join(base, sibling, 'secret.yaml')));
    });
  }

  test('folders inside the root still work', async () => {
    assert.equal(
      (await request(port, 'PUT', '/folders/rules/inner')).status,
      200,
    );
    assert.ok(await exists(join(base, 'rules', 'inner')));
    assert.equal(
      (await request(port, 'DELETE', '/folders/rules/inner')).status,
      200,
    );
    assert.equal(await exists(join(base, 'rules', 'inner')), false);
  });
});

test('silence rejects a rule outside the root before spawning', async () => {
  let controller = new SilenceController();
  controller.rulesFolder = join(base, 'rules');

  for (let path of ['../config', '../rules-evil/secret', 'good\0']) {
    await assert.rejects(controller.silenceRule(path, 'minutes', 1), {
      statusCode: 404,
    });
  }
});
