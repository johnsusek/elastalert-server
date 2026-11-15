import { test } from 'node:test';
import assert from 'node:assert/strict';
import { containedPath } from '../src/common/contained_path';

test('paths inside the root resolve', () => {
  assert.equal(containedPath('/srv/rules', 'a/b.yaml'), '/srv/rules/a/b.yaml');
  assert.equal(containedPath('/srv/rules', ''), '/srv/rules');
  assert.equal(
    containedPath('/srv/rules/', 'a/../b.yaml'),
    '/srv/rules/b.yaml',
  );
  assert.equal(
    containedPath('/srv/rules', '/etc/passwd'),
    '/srv/rules/etc/passwd',
  );
  assert.equal(containedPath('/srv/rules', '../rules'), '/srv/rules');
});

test('paths outside the root are null', () => {
  for (let path of [
    '..',
    '../config.yaml',
    'a/../../config.yaml',
    '../rules-evil/x.yaml',
    '../rulesx',
  ]) {
    assert.equal(containedPath('/srv/rules', path), null, path);
  }
});

test('NUL bytes and non-strings are null', () => {
  assert.equal(containedPath('/srv/rules', 'a\0.yaml'), null);
  assert.equal(containedPath('/srv/rules', ['a', 'b']), null);
  assert.equal(containedPath('/srv/rules', undefined), null);
});
