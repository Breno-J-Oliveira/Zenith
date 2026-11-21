import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rmdir, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, test } from 'node:test';
import { addCivilDays, getCivilDate } from '../../../../packages/shared/src/civil-date';
import { PrismaService } from '../prisma.service';
import { RoutinesService } from './routines.service';

const userId = 'routine-test-user';
let directory: string;
let prisma: PrismaService;
let otherPrisma: PrismaService;
let service: RoutinesService;

before(async () => {
  directory = await mkdtemp(join(tmpdir(), 'zenith-routines-'));
  const databaseUrl = `file:${join(directory, 'routine.db').replace(/\\/g, '/')}`;
  prisma = new PrismaService({ datasourceUrl: databaseUrl });
  otherPrisma = new PrismaService({ datasourceUrl: databaseUrl });
  service = new RoutinesService(prisma);
  const migration = await readFile(join(process.cwd(), 'prisma/migrations/20260709181125_init/migration.sql'), 'utf8');
  for (const statement of migration.split(';').map(sql => sql.trim()).filter(Boolean)) {
    await prisma.$executeRawUnsafe(statement);
  }
  await prisma.user.create({ data: { id: userId, name: 'Routine test', email: 'routine-test@example.test' } });
});

after(async () => {
  await Promise.all([prisma?.$disconnect(), otherPrisma?.$disconnect()]);
  if (directory) {
    for (const file of await readdir(directory)) await unlink(join(directory, file));
    await rmdir(directory);
  }
});

async function createDailyRoutine(title: string) {
  return service.create(userId, { title, frequency: 'daily', time: '09:00', duration: 30 });
}

test('concurrent generators on separate Prisma clients save each occurrence once', async () => {
  const routine = await createDailyRoutine('Estudo');
  const today = getCivilDate();
  const otherService = new RoutinesService(otherPrisma);

  const results = await Promise.all(Array.from({ length: 6 }, (_, attempt) =>
    (attempt % 2 ? service : otherService).generateTasks(userId, routine.id, 3),
  ));
  const stored = await prisma.task.findMany({
    where: { userId, routineId: routine.id },
    orderBy: { date: 'asc' },
  });

  assert.deepEqual(stored.map(task => task.date), [today, addCivilDays(today, 1), addCivilDays(today, 2)]);
  assert.deepEqual(results.flat().map(task => task.id).sort(), stored.map(task => task.id).sort());
  assert.deepEqual(await service.generateTasks(userId, routine.id, 3), []);
});

test('rescheduling a new occurrence keeps its identity and leaves the next occurrence available', async () => {
  const routine = await createDailyRoutine('Caminhada');
  const today = getCivilDate();
  const tomorrow = addCivilDays(today, 1);

  const [first] = await service.generateTasks(userId, routine.id, 1);
  await service.updateGeneratedTask(userId, first.id, { date: tomorrow, time: '12:00' });
  const [next] = await service.generateTasks(userId, routine.id, 2);
  const stored = await prisma.task.findMany({ where: { userId, routineId: routine.id } });

  assert.notEqual(next.id, first.id);
  assert.equal(next.date, tomorrow);
  assert.equal(stored.length, 2);
  assert.ok(stored.some(task => task.id === first.id && task.date === tomorrow && task.time === '12:00'));
  assert.ok(stored.some(task => task.id === next.id && task.date === tomorrow && task.time === '09:00'));
  assert.deepEqual(await service.generateTasks(userId, routine.id, 2), []);
});

test('generation preserves a legacy occurrence and its completion on the stored date', async () => {
  const routine = await createDailyRoutine('Revisão');
  const today = getCivilDate();
  const existing = await prisma.task.create({
    data: {
      userId, routineId: routine.id, title: 'Revisão antiga', date: today,
      time: '08:30', duration: 45, completed: true, status: 'COMPLETED',
    },
  });

  const generated = await service.generateTasks(userId, routine.id, 2);
  const storedToday = await prisma.task.findMany({ where: { userId, routineId: routine.id, date: today } });

  assert.deepEqual(generated.map(task => task.date), [addCivilDays(today, 1)]);
  assert.deepEqual(storedToday, [existing]);
});
