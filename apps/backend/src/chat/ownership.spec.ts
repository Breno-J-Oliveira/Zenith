import assert from 'node:assert/strict';
import { test } from 'node:test';
import { NotFoundException } from '@nestjs/common';
import { AIService } from '../ai/ai.service';
import { CalendarService } from '../calendar/calendar.service';
import { ConflictResolver } from '../shared/conflict-resolver.service';
import { AgentService } from './agent.service';
import { ChatService } from './chat.service';

const date = '2026-11-20';
const firstUser = 'account-a';
const secondUser = 'account-b';

test('calendar scopes reads and rescheduling to the authenticated account', async () => {
  const goalTasks = {
    getTasks: async (userId: string) => [{ id: userId, date, title: `Goal task ${userId}` }],
  };
  const routineTasks = {
    getGeneratedTasks: async (userId: string) => [{ id: userId, date, title: 'Routine task' }],
    getTasksForDate: async (userId: string) => {
      assert.equal(userId, firstUser);
      return [];
    },
    updateGeneratedTask: async (userId: string, id: string) => {
      if (id !== userId) throw new NotFoundException('Task not found');
      return { title: 'Routine task' };
    },
  };
  const scheduler = {
    findAll: async (userId: string) => [{
      id: userId,
      date,
      title: `Appointment ${userId}`,
      startTime: '12:00',
      endTime: '13:00',
    }],
  };
  const calendar = new CalendarService(
    goalTasks as any,
    routineTasks as any,
    scheduler as any,
    new ConflictResolver(),
  );

  const firstEvents = await calendar.getEvents(firstUser, date, date);
  const secondEvents = await calendar.getEvents(secondUser, date, date);
  assert.deepEqual(firstEvents.map(event => event.sourceId), [firstUser, firstUser, firstUser]);
  assert.deepEqual(secondEvents.map(event => event.sourceId), [secondUser, secondUser, secondUser]);

  const drop = { type: 'task' as const, newStart: `${date}T10:00:00` };
  const result = await calendar.reschedule(firstUser, { ...drop, eventId: `cal-rtask-${firstUser}` });
  assert.equal(result.event.sourceId, firstUser);
  await assert.rejects(
    calendar.reschedule(firstUser, { ...drop, eventId: `cal-rtask-${secondUser}` }),
    NotFoundException,
  );
  await assert.rejects(
    calendar.reschedule(firstUser, { ...drop, type: 'appointment', eventId: `cal-appt-${secondUser}` }),
    NotFoundException,
  );
});

test('parser, log and briefing use the supplied authenticated account', async () => {
  const goals = {
    findAll: async (userId: string) => [{ id: userId, title: `Goal ${userId}` }],
    getTasks: async () => [],
    getProgress: async (userId: string, goalId: string) => {
      assert.equal(userId, goalId);
      return 50;
    },
  };
  const routineOwners: string[] = [];
  const routines = {
    create: async (userId: string) => { routineOwners.push(userId); return { id: userId }; },
    getTasksForDate: async () => [],
    findAll: async () => [],
  };
  const logs: Array<{ userId: string; input: string; result: string }> = [];
  const prisma = {
    aILog: {
      create: async ({ data }: { data: (typeof logs)[number] }) => { logs.push(data); },
      findMany: async ({ where }: { where: { userId: string } }) =>
        logs.filter(log => log.userId === where.userId).map(log => ({ ...log, id: log.userId, timestamp: new Date(date) })),
    },
  };
  const ai = new AIService(goals as any, routines as any, { findAll: async () => [] } as any, prisma as any);
  Object.assign(ai, { geminiProvider: {
    parse: async () => ({ intent: 'CREATE_ROUTINE', payload: { title: 'Study', frequency: 'daily', time: '08:00' } }),
  } });

  await ai.parse(firstUser, 'First input');
  await ai.parse(secondUser, 'Second input');
  assert.deepEqual(routineOwners, [firstUser, secondUser]);
  assert.deepEqual((await ai.getLog(firstUser)).map(log => log.input), ['First input']);

  Object.assign(ai, { geminiProvider: null });
  assert.match((await ai.getBriefing(firstUser)).text, /Goal account-a/);
  assert.doesNotMatch((await ai.getBriefing(firstUser)).text, /Goal account-b/);
});

test('chat agent uses the conversation owner for tool writes and audit records', async () => {
  const writes: string[] = [];
  const logOwners: string[] = [];
  const prisma = {
    chatThread: {
      findFirst: async ({ where }: { where: { id: string; userId: string } }) =>
        where.userId === firstUser ? { id: where.id, messages: [] } : null,
      update: async () => undefined,
    },
    chatMessage: { create: async ({ data }: { data: unknown }) => data },
    aILog: { create: async ({ data }: { data: { userId: string } }) => { logOwners.push(data.userId); } },
  };
  const tasks = { create: async (userId: string, dto: { title: string }) => {
    writes.push(userId);
    return { id: 'created', title: dto.title };
  } };
  const agent = new AgentService(prisma as any, null, tasks as any, null, null, null);
  Object.assign(agent, { genAI: { getGenerativeModel: () => ({ startChat: () => ({
    sendMessage: async (message: string | unknown[]) => ({
      response: {
        functionCalls: () => typeof message === 'string'
          ? [{ name: 'create_task', args: { title: 'Study', userId: secondUser } }]
          : [],
        text: () => 'Created',
      },
    }),
  }) }) } });
  const chat = new ChatService(prisma as any, agent);

  await assert.rejects(chat.sendMessage(secondUser, 'thread-a', 'Study'), NotFoundException);
  await chat.sendMessage(firstUser, 'thread-a', 'Study');
  assert.deepEqual(writes, [firstUser]);
  assert.deepEqual(logOwners, [firstUser]);
});
