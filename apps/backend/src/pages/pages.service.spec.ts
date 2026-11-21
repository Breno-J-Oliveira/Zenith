import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdtemp, readFile, rm, rmdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { after, before, test } from 'node:test';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PagesService } from './pages.service';

const owner = 'test-page-owner';
const visitor = 'test-page-visitor';
let fixture: string;
let prisma: PrismaService;
let pages: PagesService;

before(async () => {
  fixture = await mkdtemp(join(tmpdir(), 'zenith-page-tree-'));
  const database = join(fixture, 'pages.sqlite').replace(/\\/g, '/');
  const datasourceUrl = 'file:' + database;
  prisma = new PrismaService({ datasourceUrl });
  const schemaDir = existsSync('prisma/schema.prisma') ? 'prisma' : 'apps/backend/prisma';
  const migrations = ['20260709181125_init', '20260709182748_add_pages_blocks'];
  for (const name of migrations) {
    const sql = await readFile(resolve(schemaDir, 'migrations', name, 'migration.sql'), 'utf8');
    // Somente SQL estático das duas migrações de criação que compõem a base deste teste.
    for (const statement of sql.split(';').map(part => part.trim()).filter(Boolean)) {
      await prisma.$executeRawUnsafe(statement);
    }
  }
  pages = new PagesService(prisma);
  await prisma.user.createMany({
    data: [
      { id: owner, name: 'Owner', email: 'owner@example.test' },
      { id: visitor, name: 'Visitor', email: 'visitor@example.test' },
    ],
  });
});

after(async () => {
  await prisma?.$disconnect();
  if (!fixture) return;
  for (const file of ['pages.sqlite', 'pages.sqlite-journal', 'pages.sqlite-shm', 'pages.sqlite-wal']) {
    await rm(join(fixture, file), { force: true });
  }
  await rmdir(fixture);
});

test('creates only valid parent relationships and filters legacy cross-account references in both directions', async () => {
  const root = await pages.createPage(owner, { title: 'Root' });
  const foreign = await pages.createPage(visitor, { title: 'Foreign' });
  const child = await pages.createPage(owner, { title: 'Child', parentId: root.id });

  assert.equal(root.parentId, null);
  assert.equal(child.parentId, root.id);
  await assert.rejects(pages.createPage(owner, { parentId: foreign.id }), NotFoundException);
  await assert.rejects(pages.createPage(owner, { parentId: 'nonexistent' }), NotFoundException);
  await assert.rejects(pages.createPage(owner, { parentId: '  ' }), BadRequestException);
  await assert.rejects(pages.updatePage(visitor, child.id, { title: 'Foreign edit' }), NotFoundException);
  await assert.rejects(pages.updatePage(owner, child.id, { parentId: foreign.id }), NotFoundException);
  await assert.rejects(pages.updatePage(owner, child.id, { parentId: 'nonexistent' }), NotFoundException);

  const foreignChild = await prisma.page.create({ data: { userId: visitor, parentId: root.id } });
  assert.deepEqual((await pages.getPage(owner, root.id)).children, [child.id]);
  assert.deepEqual((await pages.getPages(owner)).find(page => page.id === root.id)?.children, [child.id]);
  assert.equal((await pages.getPage(visitor, foreignChild.id)).parentId, null);
  assert.equal((await pages.getPages(visitor)).find(page => page.id === foreignChild.id)?.parentId, null);
  assert.equal((await prisma.page.findUniqueOrThrow({ where: { id: foreignChild.id } })).parentId, root.id);
});

test('rejects circular moves, keeps title changes independent and refreshes the tree after moving to root', async () => {
  const root = await pages.createPage(owner, {});
  const child = await pages.createPage(owner, { parentId: root.id });
  const grandchild = await pages.createPage(owner, { parentId: child.id });
  await assert.rejects(pages.updatePage(owner, root.id, { parentId: root.id }), BadRequestException);
  await assert.rejects(pages.updatePage(owner, root.id, { parentId: grandchild.id }), BadRequestException);

  const renamed = await pages.updatePage(owner, grandchild.id, { title: 'Renamed' });
  assert.equal(renamed.title, 'Renamed');
  assert.equal(renamed.parentId, child.id);
  assert.equal((await pages.updatePage(owner, child.id, { parentId: null })).parentId, null);
  assert.deepEqual((await pages.getPage(owner, root.id)).children, []);
  assert.equal((await pages.getPage(owner, grandchild.id)).parentId, child.id);

  // A legacy cycle can be repaired by moving one page back to root.
  await prisma.page.update({ where: { id: child.id }, data: { parentId: grandchild.id } });
  await assert.rejects(pages.createPage(owner, { parentId: child.id }), BadRequestException);
  assert.equal((await pages.updatePage(owner, child.id, { parentId: null })).parentId, null);
});

test('concurrent opposite moves cannot commit a cycle', async () => {
  const first = await pages.createPage(owner, {});
  const second = await pages.createPage(owner, {});
  const results = await Promise.allSettled([
    pages.updatePage(owner, first.id, { parentId: second.id }),
    pages.updatePage(owner, second.id, { parentId: first.id }),
  ]);
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
  const refused = results.find(result => result.status === 'rejected');
  assert.ok(refused?.reason instanceof BadRequestException || refused?.reason instanceof ConflictException, refused?.reason);
  const [savedFirst, savedSecond] = await Promise.all([
    pages.getPage(owner, first.id),
    pages.getPage(owner, second.id),
  ]);
  assert.equal([savedFirst.parentId, savedSecond.parentId].filter(Boolean).length, 1);
});
