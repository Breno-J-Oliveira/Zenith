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

async function register(name) {
  const suffix = randomUUID();
  const credentials = { email: `zenith-${suffix}@example.com`, password: `Fixture!9a${suffix}` };
  await request(auth + '/auth/register', { body: { ...credentials, name }, expected: 201 });
  return credentials;
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
  const owner = await register('Zenith Fixture A');
  const visitor = await register('Zenith Fixture B');
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
    const { accessToken: ownerToken } = await request(auth + '/auth/login', { body: owner });
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

    await page.getByRole('button', { name: 'Menu da conta' }).click();
    await page.getByRole('button', { name: 'Sair', exact: true }).click();
    await page.waitForURL(url => url.pathname === '/login/');
    assert.equal((await context.cookies()).some(cookie => cookie.name === 'zenith_refresh'), false);
    await page.goto(web + '/hoje/');
    await page.waitForURL(url => url.pathname === '/login/');
    console.log('Jornada móvel validada: recarga com sessão, rotação, logout e rotina com isolamento.');
  } finally {
    await browser.close();
  }
}

verify().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
