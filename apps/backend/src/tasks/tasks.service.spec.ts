import assert from 'node:assert/strict';
import { test } from 'node:test';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { TasksService } from './tasks.service';

const firstUserId = 'test-account-a';
const secondUserId = 'test-account-b';
const requestId = '584e9c1a-7838-4a45-8490-f39deab493dd';
const day = '2028-02-29';
const personal = { goalId: null, milestoneId: null, routineId: null };

function knownError(code: string) {
  return new Prisma.PrismaClientKnownRequestError(code, { code, clientVersion: Prisma.prismaVersion.client });
}

test('capture retries use the same ID and keep the original task, independently per account', async () => {
  type Fixture = { id: string; userId: string; title: string };
  const records = new Map<string, Fixture>();
  const service = new TasksService(null, {
    task: {
      async create({ data }: { data: Fixture }) {
        if (records.has(data.id)) throw knownError('P2002');
        const record = { ...data, createdAt: new Date(), date: null, status: 'ACTIVE', completed: false };
        records.set(record.id, record);
        return record;
      },
      async findFirst({ where }: { where: { id: string; userId: string } }) {
        const record = records.get(where.id);
        return record?.userId === where.userId ? record : null;
      },
    },
  } as any);

  const [original, duplicate] = await Promise.all([
    service.capture(firstUserId, { title: '  Revisar slides  ', requestId }),
    service.capture(firstUserId, { title: 'Título alterado', requestId: requestId.toUpperCase() }),
  ]);
  const otherAccount = await service.capture(secondUserId, { title: 'Atividade em outra conta', requestId });
  assert.deepEqual(duplicate, original);
  assert.equal(original.title, 'Revisar slides');
  assert.equal(original.date, undefined);
  assert.notEqual(otherAccount.id, original.id);
  assert.equal(records.size, 2);

  await assert.rejects(service.capture(firstUserId, { title: ' ', requestId }), BadRequestException);
  await assert.rejects(service.capture(firstUserId, { title: 'x'.repeat(201), requestId }), BadRequestException);
  await assert.rejects(service.capture(firstUserId, { title: 'Revisar slides', requestId: 'invalid' }), BadRequestException);
  assert.equal(records.size, 2);
});

test('personal lists isolate the account, exclude related tasks, and split the date and inbox filters', async () => {
  const service = new TasksService(null, {
    task: {
      async findMany({ where }: { where: unknown }) {
        assert.deepEqual(where, {
          userId: firstUserId,
          ...personal,
          OR: [{ date: null, status: 'ACTIVE', completed: false }, { date: { gte: day } }],
        });
        return [
          { id: 'inbox', date: null, completed: false, createdAt: new Date() },
          { id: 'today', date: day, completed: true, createdAt: new Date() },
        ];
      },
    },
  } as any);

  const result = await service.findPersonal(firstUserId, day);
  assert.deepEqual(result.inbox.map(item => item.id), ['inbox']);
  assert.deepEqual(result.upcoming.map(item => item.id), ['today']);
  assert.equal(result.upcoming[0].completed, true);
  await assert.rejects(service.findPersonal(firstUserId, '2027-02-29'), BadRequestException);
});

test('triage and completion use absolute states with a scoped write', async () => {
  type TaskMutation = { date?: string | null; completed?: boolean; status?: string };
  let task = { id: 'task-a', date: null, completed: false, status: 'ACTIVE', createdAt: new Date() };
  const service = new TasksService(null, {
    task: {
      async update({ where, data }: { where: object; data: TaskMutation }) {
        assert.deepEqual(where, { id: ('id' in where ? where.id : undefined), userId: firstUserId, ...personal });
        if (!('id' in where) || where.id !== task.id) throw knownError('P2025');
        task = { ...task, ...data };
        return task;
      },
    },
  } as any);

  assert.equal((await service.updatePersonal(firstUserId, task.id, { date: day })).date, day);
  for (const completed of [true, true, false, false]) {
    const result = await service.updatePersonal(firstUserId, task.id, { completed });
    assert.equal(result.completed, completed);
    assert.equal(result.status, completed ? 'COMPLETED' : 'ACTIVE');
  }
  assert.equal((await service.updatePersonal(firstUserId, task.id, { date: null })).date, undefined);
  await assert.rejects(service.updatePersonal(firstUserId, 'task-b', { completed: true }), NotFoundException);
  await assert.rejects(service.updatePersonal(firstUserId, task.id, { date: '2028-02-30' }), BadRequestException);
  await assert.rejects(service.updatePersonal(firstUserId, task.id, { date: day, completed: true }), BadRequestException);
  assert.equal(task.completed, false);
  assert.equal(task.date, null);
});

test('weekly review uses validated inclusive date bounds while unfiltered reads keep their original shape', async () => {
  const queries: unknown[] = [];
  const service = new TasksService(null, {
    task: {
      async findMany({ where }: { where: unknown }) {
        queries.push(where);
        return [];
      },
    },
  } as any);

  await service.findAll(firstUserId);
  await service.findAll(firstUserId, { from: day, to: '2028-03-06', status: 'COMPLETED' });
  await service.findAll(firstUserId, { from: day });
  await assert.rejects(service.findAll(firstUserId, { from: day, to: '2028-02-28' }), BadRequestException);
  await assert.rejects(service.findAll(firstUserId, { to: '2028-04-31' }), BadRequestException);
  assert.deepEqual(queries, [
    { userId: firstUserId },
    { userId: firstUserId, status: 'COMPLETED', date: { gte: day, lte: '2028-03-06' } },
    { userId: firstUserId, date: { gte: day, lte: undefined } },
  ]);
});
