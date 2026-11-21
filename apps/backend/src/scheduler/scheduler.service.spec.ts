import assert from 'node:assert/strict';
import { test } from 'node:test';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { SchedulerService } from './scheduler.service';
import { ConflictResolver } from '../shared/conflict-resolver.service';
import type { PrismaService } from '../prisma.service';
import type { RoutinesService } from '../routines/routines.service';

const draft = {
  title: 'Reunião', date: '2026-11-21', startTime: '09:00', endTime: '10:00',
  requestId: '66f2bd1e-9c94-4157-9bcd-9d8be55fbab8',
};

function fixture() {
  type Row = typeof draft & { id: string; userId: string; createdAt: Date };
  const rows = new Map<string, Row>();
  const errorFor = (code: string) => new Prisma.PrismaClientKnownRequestError('fixture', { code, clientVersion: 'test' });
  const prisma = {
    appointment: {
      create: async ({ data }: { data: Row }) => {
        if (rows.has(data.id)) throw errorFor('P2002');
        const row = { ...data, createdAt: new Date(0) };
        rows.set(row.id, row);
        return row;
      },
      findFirst: async ({ where }: { where: { id: string; userId: string } }) => {
        const row = rows.get(where.id);
        return row?.userId === where.userId ? row : null;
      },
      update: async ({ where, data }: { where: { id: string; userId: string }; data: Partial<Row> }) => {
        const row = rows.get(where.id);
        if (row?.userId !== where.userId) throw errorFor('P2025');
        const updated = { ...row, ...data };
        rows.set(row.id, updated);
        return updated;
      },
    },
  } as unknown as PrismaService;
  const routines = {
    getTasksForDate: () => assert.fail('Manual operations must never move routines.'),
  } as unknown as RoutinesService;
  return { service: new SchedulerService(routines, new ConflictResolver(), prisma), rows };
}

test('manual creation returns the same appointment after retry and scopes request IDs per account', async () => {
  const { service, rows } = fixture();
  const [first, retry] = await Promise.all([
    service.createManualAppointment('account-a', draft),
    service.createManualAppointment('account-a', draft),
  ]);
  assert.deepEqual(first, retry);
  const other = await service.createManualAppointment('account-b', draft);
  assert.notEqual(first.id, other.id);
  assert.equal(rows.size, 2);
});

test('editing requires ownership and preserves the appointment on rejected input', async () => {
  const { service, rows } = fixture();
  const first = await service.createManualAppointment('account-a', draft);
  await assert.rejects(service.updateAppointment('account-b', first.id, draft), NotFoundException);
  await assert.rejects(service.updateAppointment('account-a', first.id, { ...draft, endTime: '08:00' }), BadRequestException);
  assert.equal(rows.get(first.id)?.startTime, draft.startTime);
  const edited = await service.updateAppointment('account-a', first.id, { ...draft, date: '2026-11-22' });
  assert.equal(edited.date, '2026-11-22');
});

test('appointments reject impossible civil dates and malformed request IDs', async () => {
  const { service, rows } = fixture();
  await assert.rejects(service.createManualAppointment('account-a', { ...draft, date: '2026-02-30' }), BadRequestException);
  await assert.rejects(service.createManualAppointment('account-a', { ...draft, requestId: 'invalid' }), BadRequestException);
  assert.equal(rows.size, 0);
});
