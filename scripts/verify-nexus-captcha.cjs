const assert = require('node:assert/strict');
const { verifyCaptcha } = require('/app/dist/common/utils/captcha.util.js');

const token = 'zenith-ci-captcha-token';

async function verify() {
  process.env.NODE_ENV = 'production';
  delete process.env.TURNSTILE_SECRET_KEY;
  await assert.rejects(verifyCaptcha(token), error => error.getResponse().code === 'CAPTCHA_NOT_CONFIGURED');

  process.env.TURNSTILE_SECRET_KEY = 'fixture-captcha-secret';
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
