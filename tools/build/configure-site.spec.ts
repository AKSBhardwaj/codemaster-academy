import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { deploymentSettings } from './configure-site';
import {
  absoluteSiteUrl,
  publicPath,
  SITE_BASE_PATH,
  SITE_URL,
} from '../../src/content-schema/site-constants';

test('GitHub project Pages gets a repository prefix', () => {
  assert.deepEqual(deploymentSettings(undefined, 'Ada/code-school'), {
    siteUrl: 'https://ada.github.io/code-school',
    baseHref: '/code-school/',
  });
});

test('a user Pages repository is served at the domain root', () => {
  assert.deepEqual(deploymentSettings(undefined, 'Ada/Ada.github.io'), {
    siteUrl: 'https://ada.github.io',
    baseHref: '/',
  });
});

test('a confirmed custom domain overrides the repository address', () => {
  assert.deepEqual(deploymentSettings('https://learn.example.org/', 'Ada/code-school'), {
    siteUrl: 'https://learn.example.org',
    baseHref: '/',
  });
  assert.equal(deploymentSettings('https://learn.example.org/classes/').baseHref, '/classes/');
});

test('invalid public deployment addresses fail before building', () => {
  for (const url of [
    'http://learn.example.org',
    'https://user:password@learn.example.org',
    'https://learn.example.org/?draft=1',
    'https://learn.example.org/#learn',
    'file:///tmp/site',
  ]) {
    assert.throws(() => deploymentSettings(url));
  }
  assert.throws(() => deploymentSettings(undefined, 'missing-repository'));
});

test('assets and directory URLs share the configured deployment prefix exactly once', () => {
  const origin = new URL(SITE_URL).origin;
  assert.equal(publicPath('/brand/logo.svg'), SITE_BASE_PATH + 'brand/logo.svg');
  assert.equal(publicPath(SITE_BASE_PATH + 'brand/logo.svg'), SITE_BASE_PATH + 'brand/logo.svg');
  assert.equal(absoluteSiteUrl('/tutorials/html'), origin + SITE_BASE_PATH + 'tutorials/html/');
  assert.equal(absoluteSiteUrl('/sitemap.xml'), origin + SITE_BASE_PATH + 'sitemap.xml');
  assert.equal(absoluteSiteUrl('/'), origin + SITE_BASE_PATH);
  assert.equal(publicPath('https://example.org/image.png'), 'https://example.org/image.png');
});
