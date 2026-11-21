const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { chromium } = require('playwright');

const web = 'http://localhost:3101';
const auth = 'http://localhost:3100';
const api = 'http://localhost:3102';

async function request(url, { body, token, expected = 200 } = {}) {
  const response = await fetch(url, {
    method: body ? 'POST' : 'GET',
    headers: {
      ...(body && { 'Content-Type': 'application/json' }),
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body && JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  });
  assert.equal(response.status, expected, `${new URL(url).pathname} retornou HTTP ${response.status}`);
  return response.json();
}

function fixtureCredentials() {
  const suffix = randomUUID();
  return {
    email: `zenith-${suffix}@example.com`,
    password: `Fixture!9A${suffix.replace(/abcd|1234|(.)\1{3,}/gi, '-q-')}`,
  };
}

async function mailLink(email, kind, previousMessageId) {
  const expectedPath = kind === 'reset' ? '/reset-password/' : '/verify-email/';
  const subject = kind === 'reset' ? 'Redefina sua senha no Zenith' : 'Confirme seu e-mail no Zenith';
  const mailbox = 'http://127.0.0.1:8025/api/v1';
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    const { messages } = await request(mailbox + '/messages');
    const match = messages.find(message => message.ID !== previousMessageId &&
      message.Subject === subject && message.To.some(to => to.Address === email));
    if (match) {
      const message = await request(mailbox + '/message/' + match.ID);
      const link = message.Text.match(/https?:\/\/[^\s]+/)?.[0];
      assert.ok(link, 'A mensagem deve conter um link');
      const url = new URL(link);
      assert.equal(url.origin, web);
      assert.equal(url.pathname, expectedPath);
      assert.match(url.hash, /^#[a-f0-9-]{36}$/i);
      return { url, id: match.ID };
    }
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  throw new Error(`O e-mail de ${kind} não chegou à caixa de teste`);
}

async function confirmedFixture(name) {
  const credentials = fixtureCredentials();
  await request(auth + '/auth/register', { body: { ...credentials, name }, expected: 201 });
  const verification = await mailLink(credentials.email, 'verification');
  const chosenPassword = credentials.password + '!Dono8';
  const mismatch = await request(auth + '/auth/verify-email', {
    body: { token: verification.url.hash.slice(1), password: chosenPassword },
    expected: 400,
  });
  assert.equal(mismatch.code, 'VERIFICATION_PASSWORD_MISMATCH');
  await request(auth + '/auth/forgot-password', { body: { email: credentials.email }, expected: 201 });
  const { url } = await mailLink(credentials.email, 'reset');
  await request(auth + '/auth/reset-password', {
    body: { token: url.hash.slice(1), newPassword: chosenPassword },
    expected: 201,
  });
  await request(auth + '/auth/verify-email', {
    body: { token: verification.url.hash.slice(1), password: credentials.password },
    expected: 400,
  });
  return { ...credentials, password: chosenPassword };
}

async function registerFromBrowser(page, credentials) {
  await page.route(url => url.origin === 'https://challenges.cloudflare.com' &&
    url.pathname === '/turnstile/v0/api.js', route => route.fulfill({
    contentType: 'application/javascript',
    body: `
      window.turnstile = {
        render(container, options) {
          if (options.action !== 'zenith_register') throw new Error('Ação inesperada');
          window.zenithTestChallenge = options;
          return 'fixture';
        },
        reset() { window.zenithTestChallenge.callback('zenith-ci-captcha-token'); },
        remove() {},
      };
    `,
  }));
  await page.goto(web + '/register/');
  await page.getByLabel('Nome', { exact: true }).fill('Zenith Fixture A');
  await page.getByLabel('E-mail', { exact: true }).fill(credentials.email);
  await page.getByLabel('Senha', { exact: true }).fill(credentials.password);
  await page.getByLabel('Confirmar senha', { exact: true }).fill(credentials.password);
  const create = page.getByRole('button', { name: 'Criar conta', exact: true });
  await page.waitForFunction(() => Boolean(window.zenithTestChallenge));
  assert.equal(await create.isEnabled(), false);
  await page.evaluate(() => window.zenithTestChallenge['expired-callback']());
  await page.getByText('A verificação expirou. Tente novamente.').waitFor();
  await page.getByRole('button', { name: 'Refazer verificação', exact: true }).click();
  const [registration] = await Promise.all([
    page.waitForResponse(response => response.url() === auth + '/auth/register' && response.request().method() === 'POST'),
    create.click(),
  ]);
  assert.equal(registration.status(), 201);
  assert.equal(registration.request().postDataJSON().captchaToken, 'zenith-ci-captcha-token');
  await page.getByRole('heading', { name: 'Confira seu e-mail' }).waitFor();

  const first = await mailLink(credentials.email, 'verification');
  await page.getByRole('link', { name: 'Reenviar confirmação', exact: true }).click();
  await page.getByLabel('E-mail', { exact: true }).fill(credentials.email);
  await page.getByRole('button', { name: 'Solicitar link', exact: true }).click();
  await page.getByText('Se o endereço estiver elegível', { exact: false }).waitFor();
  const resent = await mailLink(credentials.email, 'verification', first.id);
  assert.equal(first.url.hash === resent.url.hash, false);

  let clickedVerificationRequests = 0;
  page.on('request', request => {
    if (request.method() === 'POST' && request.url() === auth + '/auth/verify-email') clickedVerificationRequests++;
  });
  await page.goto(resent.url.href);
  const confirmation = page.getByRole('button', { name: 'Confirmar e-mail', exact: true });
  await confirmation.waitFor();
  assert.equal(new URL(page.url()).hash, '');
  assert.equal(clickedVerificationRequests, 0, 'Abrir o link não deve confirmar o e-mail');
  await page.getByLabel('Senha do cadastro').fill(credentials.password);
  await confirmation.click();
  await page.getByText('E-mail confirmado. Sua conta está pronta para entrar.').waitFor();
  assert.equal(clickedVerificationRequests, 1);
  await request(auth + '/auth/verify-email', { body: { token: first.url.hash.slice(1), password: credentials.password }, expected: 400 });
  const generic = await request(auth + '/auth/resend-verification', { body: { email: 'missing@example.com' }, expected: 202 });
  const verified = await request(auth + '/auth/resend-verification', { body: { email: credentials.email }, expected: 202 });
  assert.deepEqual(verified, generic);
}

async function verifyPasswordRecovery(page, owner, previousSession) {
  await page.goto(web + '/forgot-password/');
  await page.getByLabel('E-mail', { exact: true }).fill(owner.email);
  await page.getByRole('button', { name: 'Solicitar link', exact: true }).click();
  await page.getByText('Se o endereço estiver elegível', { exact: false }).waitFor();
  const { url } = await mailLink(owner.email, 'reset');
  await page.goto(url.href);
  const password = page.getByLabel('Nova senha', { exact: true });
  const confirmation = page.getByLabel('Confirmar nova senha', { exact: true });
  const save = page.getByRole('button', { name: 'Salvar nova senha', exact: true });
  await password.fill(owner.password);
  await confirmation.fill(owner.password);
  await save.click();
  await page.getByText('Escolha uma senha diferente das últimas que você usou.').waitFor();
  const newPassword = owner.password + '!Nova8';
  await password.fill(newPassword);
  await confirmation.fill(newPassword);
  await save.click();
  await page.getByText('Senha alterada. Entre com sua nova senha.').waitFor();
  await request(auth + '/auth/refresh', { body: { refreshToken: previousSession.refreshToken }, expected: 401 });
  await request(api + '/auth/me', { token: previousSession.accessToken, expected: 401 });
  await request(auth + '/auth/reset-password', { body: { token: url.hash.slice(1), newPassword }, expected: 400 });
  await request(auth + '/auth/login', { body: owner, expected: 401 });
  await page.getByRole('link', { name: 'Entrar no Zenith', exact: true }).click();
  await signIn(page, { ...owner, password: newPassword });
  await page.waitForURL(url => url.pathname === '/dashboard/');
}

async function signIn(page, credentials) {
  const email = page.locator('#login-email');
  const password = page.locator('#login-password');
  await email.waitFor();
  await email.fill(credentials.email);
  await password.fill(credentials.password);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
}

async function verify() {
  const owner = fixtureCredentials();
  const visitor = await confirmedFixture('Zenith Fixture B');
  const { accessToken: visitorToken } = await request(auth + '/auth/login', { body: visitor });
  assert.ok(visitorToken, 'A segunda conta deve receber um access token');

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      locale: 'pt-BR',
      timezoneId: 'America/Sao_Paulo',
    });
    page.setDefaultTimeout(15_000);

    await registerFromBrowser(page, owner);
    const today = '/hoje/?new=true';
    await page.goto(web + today);
    await page.waitForURL(url => url.pathname === '/login/');
    assert.equal(new URL(page.url()).searchParams.get('next'), today);
    await signIn(page, owner);
    await page.waitForURL(url => url.pathname === '/hoje/' && url.searchParams.get('new') === 'true');

    const captureUrl = api + '/tasks/capture';
    const title = 'Revisar a rotina de teste';
    let firstAttempt;
    await page.route(captureUrl, async route => {
      if (route.request().method() !== 'POST' || firstAttempt) return route.continue();
      // A API recebe e grava. Somente a resposta é perdida pelo navegador.
      const response = await route.fetch();
      firstAttempt = {
        status: response.status(),
        task: await response.json(),
        requestId: route.request().postDataJSON().requestId,
      };
      await route.abort();
    });

    const capture = page.getByLabel('Captura rápida', { exact: true });
    await capture.fill(title);
    await capture.press('Enter');
    await page.getByText('Não foi possível confirmar a captura. Seu texto foi mantido. Tente novamente.').waitFor();
    assert.equal(await capture.inputValue(), title);
    assert.equal(firstAttempt?.status, 201);
    assert.ok(firstAttempt?.requestId);

    const [retry] = await Promise.all([
      page.waitForResponse(response => response.url() === captureUrl && response.request().method() === 'POST'),
      capture.press('Enter'),
    ]);
    assert.equal(retry.status(), 201);
    assert.equal(retry.request().postDataJSON().requestId, firstAttempt.requestId);
    const task = await retry.json();
    assert.equal(task.id, firstAttempt.task.id);

    const taskButton = name => page.getByRole('button', { name: `${name}: ${title}`, exact: true });
    await taskButton('Planejar para hoje').click();
    await taskButton('Concluir').click();
    await taskButton('Desfazer').waitFor();

    const navigation = page.getByRole('navigation', { name: 'Navegação móvel' });
    await navigation.getByText('Mais', { exact: true }).click();
    await navigation.getByRole('link', { name: 'Relatório', exact: true }).click();
    await page.getByRole('heading', { name: 'Revisão semanal' }).waitFor();
    await page.getByText(title, { exact: true }).waitFor();
    assert.equal(await page.getByText(title, { exact: true }).count(), 1);

    await page.reload();
    await page.getByText(title, { exact: true }).waitFor();
    const context = page.context();
    const refresh = (await context.cookies()).find(cookie => cookie.name === 'zenith_refresh');
    assert.equal(refresh?.httpOnly, true);
    const rejected = await context.request.post(web + '/api/session/', {
      headers: { Origin: 'http://example.invalid' },
      data: { action: 'logout' },
    });
    assert.equal(rejected.status(), 403);

    await context.clearCookies({ name: 'zenith_access' });
    await page.reload();
    await page.getByText(title, { exact: true }).waitFor();
    const rotated = (await context.cookies()).find(cookie => cookie.name === 'zenith_refresh');
    assert.ok(rotated?.value && rotated.value !== refresh.value, 'O NexusAuth deve rotacionar o refresh');

    await request(`${api}/tasks/${task.id}`, { token: visitorToken, expected: 404 });
    const ownerToken = (await context.cookies()).find(cookie => cookie.name === 'zenith_access')?.value;
    assert.ok(ownerToken, 'A conta proprietária deve receber um access token');
    const savedTask = await request(`${api}/tasks/${task.id}`, { token: ownerToken });
    assert.equal(savedTask.completed, true);

    await navigation.getByRole('link', { name: 'Calendário', exact: true }).click();
    await page.getByRole('heading', { name: 'Calendário', exact: true }).waitFor();
    await page.getByRole('region', { name: 'Agenda do dia' }).getByText(title, { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Grade', exact: true }).click();
    await page.getByText('✓ ' + title, { exact: true }).waitFor();

    await navigation.getByText('Mais', { exact: true }).click();
    await navigation.getByRole('link', { name: 'Páginas', exact: true }).click();
    const newPage = api + '/pages';
    const [created] = await Promise.all([
      page.waitForResponse(response => response.url() === newPage && response.request().method() === 'POST'),
      page.getByRole('button', { name: 'Nova Página', exact: true }).click(),
    ]);
    assert.equal(created.status(), 201);
    const { id: pageId } = await created.json();
    await page.waitForURL(url => url.pathname === `/paginas/${pageId}/`);
    const pageTitle = page.getByPlaceholder('Sem título', { exact: true });
    await pageTitle.waitFor();
    assert.equal(await pageTitle.inputValue(), 'Nova Página');
    const savedPage = await request(`${api}/pages/${pageId}`, { token: ownerToken });
    assert.equal(savedPage.title, 'Nova Página');
    await request(`${api}/pages/${pageId}`, { token: visitorToken, expected: 404 });
    await request(api + '/pages', {
      token: visitorToken,
      body: { title: 'Página fictícia em outra conta', parentId: pageId },
      expected: 404,
    });
    const child = await request(api + '/pages', {
      token: ownerToken,
      body: { title: 'Página filha fictícia', parentId: pageId },
      expected: 201,
    });
    const hierarchy = await request(`${api}/pages/${pageId}`, { token: ownerToken });
    assert.deepEqual(hierarchy.children, [child.id]);

    await page.getByRole('button', { name: /adicionar bloco/i }).click();
    await page.getByRole('button', { name: 'Texto', exact: true }).click();
    const editor = page.getByRole('textbox', { name: 'Texto do bloco' });
    const draft = 'Resumo fictício\nSegunda linha';
    await editor.fill(draft);
    let dropNextSave = true;
    await page.route('**/pages/blocks/*', async route => {
      if (dropNextSave && route.request().method() === 'PATCH') {
        dropNextSave = false;
        await route.abort();
      } else {
        await route.continue();
      }
    });
    await page.getByRole('button', { name: 'Salvar bloco' }).click();
    await page.getByText('Falha ao salvar. Seu texto foi mantido nesta página.').waitFor();
    assert.equal(await editor.inputValue(), draft);
    await page.getByRole('button', { name: 'Tentar salvar novamente' }).click();
    await page.getByText('Bloco salvo.').waitFor();
    await page.reload();
    await editor.waitFor();
    assert.equal(await editor.inputValue(), draft);

    const signedOutToken = (await context.cookies()).find(cookie => cookie.name === 'zenith_access')?.value;
    assert.ok(signedOutToken, 'O logout deve ser verificado com a sessão que estava ativa');
    await page.getByRole('button', { name: 'Menu da conta' }).click();
    await page.getByRole('button', { name: 'Sair', exact: true }).click();
    await page.waitForURL(url => url.pathname === '/login/');
    assert.equal((await context.cookies()).some(cookie => cookie.name === 'zenith_refresh'), false);
    await request(api + '/auth/me', { token: signedOutToken, expected: 401 });
    await page.goto(web + '/hoje/');
    await page.waitForURL(url => url.pathname === '/login/');
    const ownerSession = await request(auth + '/auth/login', { body: owner });
    await request(api + '/auth/me', { token: ownerSession.accessToken });
    await verifyPasswordRecovery(page, owner, ownerSession);
    console.log('Cadastro com confirmação, reenvio e recuperação de senha validados pelo SMTP de teste.');
    console.log('Jornada móvel validada: recarga com sessão, rotação, logout e rotina com isolamento.');
  } finally {
    await browser.close();
  }
}

verify().catch(error => {
  console.error(String(error.stack || error).replace(/#[a-f0-9-]{36}/gi, '#[token omitido]'));
  process.exitCode = 1;
});
