import assert from 'node:assert/strict';
import { test } from 'node:test';
import { webCorsOrigins } from './cors-origins';

test('keeps development CORS and disables cross-origin access by default in production', () => {
  assert.equal(webCorsOrigins(undefined, false), '*');
  assert.equal(webCorsOrigins(undefined, true), false);
  assert.equal(webCorsOrigins('  ', true), false);
});

test('normalizes exact web origins for the allowlist', () => {
  assert.deepEqual(webCorsOrigins('https://zenith.example/, http://localhost:3101, https://zenith.example', true), [
    'https://zenith.example',
    'http://localhost:3101',
  ]);
});

test('rejects wildcards and URLs with extra components', () => {
  for (const invalid of [
    '*', 'file:///index.html', 'https://example.org/app', 'https://example.org/?query=1',
    'https://example.org/#fragment', 'https://example.org@other.example',
  ]) {
    assert.throws(() => webCorsOrigins(invalid, true), /CORS_ORIGINS/);
  }
});
