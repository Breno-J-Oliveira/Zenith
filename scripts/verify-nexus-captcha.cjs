const assert = require('node:assert/strict');
const { validateEnv } = require('/app/dist/config/env.js');
const { verifyCaptcha } = require('/app/dist/common/utils/captcha.util.js');

const token = 'zenith-ci-captcha-token';

async function verify() {
  const production = {
    NODE_ENV: 'production',
    DATABASE_URL: 'postgresql://db.example/auth',
    REDIS_URL: 'redis://redis.example',
    ENCRYPTION_KEY: 'a'.repeat(64),
    CORS_ORIGINS: 'https://beta.zenith.example',
  };
  assert.throws(() => validateEnv(production), /SMTP_HOST/);
  const mail = {
    SMTP_HOST: 'smtp.example',
    SMTP_PORT: '587',
    SMTP_FROM: 'zenith@example.com',
    ACCOUNT_LINK_ORIGIN: 'https://beta.zenith.example',
  };
  assert.throws(() => validateEnv({ ...production, ...mail, ACCOUNT_LINK_ORIGIN: 'http://localhost:3101' }), /HTTPS/);
  assert.throws(() => validateEnv({ ...production, ...mail, TURNSTILE_SECRET_KEY: 'fixture-secret' }), /TURNSTILE_EXPECTED_HOSTNAME/);
  assert.equal(validateEnv({ ...production, ...mail }).REQUIRE_EMAIL_VERIFIED, 'true');
  assert.equal(validateEnv({ ...production, REQUIRE_EMAIL_VERIFIED: 'false' }).REQUIRE_EMAIL_VERIFIED, 'false');
  process.env.NODE_ENV = 'production';
  delete process.env.TURNSTILE_SECRET_KEY;
  await assert.rejects(verifyCaptcha(token), error => error.getResponse().code === 'CAPTCHA_NOT_CONFIGURED');

  process.env.TURNSTILE_SECRET_KEY = 'fixture-captcha-secret';
  delete process.env.TURNSTILE_EXPECTED_HOSTNAME;
  await assert.rejects(verifyCaptcha(token), error => error.getResponse().code === 'CAPTCHA_NOT_CONFIGURED');
  process.env.TURNSTILE_EXPECTED_HOSTNAME = 'beta.zenith.example';

  const accepted = { success: true, hostname: 'beta.zenith.example', action: 'zenith_register' };
  global.fetch = async () => Response.json(accepted);
  await verifyCaptcha(token);
  for (const invalid of [
    { ...accepted, success: false },
    { ...accepted, hostname: 'other.example' },
    { ...accepted, action: 'other_action' },
  ]) {
    global.fetch = async () => Response.json(invalid);
    await assert.rejects(verifyCaptcha(token), error => error.getResponse().code === 'CAPTCHA_FAILED');
  }
  console.log('CAPTCHA: a verificação exige configuração, resposta válida, origem e ação esperadas.');
}

verify().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
