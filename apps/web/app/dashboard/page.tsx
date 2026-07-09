'use client';

import { useState, useEffect } from 'react';
import { ShellLayout } from '../../components/layout/ShellLayout';
import { QuickInput } from '../../components/ai/QuickInput';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';

const weeklyData = [
  { day: 'SEG', progress: 75 },
  { day: 'TER', progress: 60 },
  { day: 'QUA', progress: 90 },
  { day: 'QUI', progress: 45 },
  { day: 'SEX', progress: 80 },
  { day: 'SAB', progress: 30 },
  { day: 'DOM', progress: 55 },
];

export default function DashboardPage() {
  const [activeGoals, setActiveGoals] = useState(0);
  const [totalTasks, setTotalTasks] = useState(0);

  useEffect(() => {
    fetch('http://localhost:3002/goals?status=ACTIVE')
      .then(r => r.json())
      .then(data => setActiveGoals(Array.isArray(data) ? data.length : 0))
      .catch(() => setActiveGoals(0));
    fetch('http://localhost:3002/tasks')
      .then(r => r.json())
      .then(data => setTotalTasks(Array.isArray(data) ? data.length : 0))
      .catch(() => setTotalTasks(0));
  }, []);
  return (
    <ShellLayout>
      <div className="p-8 max-w-5xl">
        <QuickInput />

        {/* Avatar + greeting */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-full bg-[var(--color-surface-2)] border-2 border-[var(--color-primary)] flex items-center justify-center">
            <span className="font-orbitron text-xl font-bold text-primary">Z</span>
          </div>
          <div>
            <h1 className="font-orbitron text-2xl font-bold">Bem-vindo</h1>
            <p className="text-dim text-sm">mock-user</p>
          </div>
        </div>

        {/* Specifications card */}
        <div className="bg-[var(--color-surface-1)] border border-[var(--color-surface-2)] rounded-lg p-6 mb-6">
          <h2 className="font-orbitron text-lg font-bold mb-6">Your specifications</h2>
          <div className="grid grid-cols-3 gap-6 mb-6">
            <div>
              <p className="font-mono text-xs text-dim mb-1">NÍVEL</p>
              <p className="font-orbitron text-3xl font-bold text-primary">12</p>
            </div>
            <div>
              <p className="font-mono text-xs text-dim mb-1">METAS ATIVAS</p>
              <p className="font-orbitron text-3xl font-bold text-primary">{activeGoals}</p>
            </div>
            <div>
              <p className="font-mono text-xs text-dim mb-1">PROGRESSO SEMANAL</p>
              <p className="font-orbitron text-3xl font-bold text-primary">62%</p>
            </div>
          </div>

          {/* Bar chart */}
          <div className="mt-8">
            <p className="font-mono text-xs text-dim mb-4">PROGRESSO DA SEMANA</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeklyData}>
                <XAxis
                  dataKey="day"
                  stroke="var(--color-text-dim)"
                  tick={{ fontSize: 11, fontFamily: 'var(--font-space-mono)' }}
                  axisLine={{ stroke: 'var(--color-surface-2)' }}
                  tickLine={false}
                />
                <YAxis
                  stroke="var(--color-text-dim)"
                  tick={{ fontSize: 11, fontFamily: 'var(--font-space-mono)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Bar dataKey="progress" radius={[4, 4, 0, 0]}>
                  {weeklyData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill="var(--color-primary)" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick stats cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[var(--color-surface-1)] border border-[var(--color-surface-2)] rounded-lg p-6">
            <p className="font-mono text-xs text-dim mb-2">SEQUÊNCIA</p>
            <p className="font-orbitron text-2xl font-bold">5 dias</p>
          </div>
          <div className="bg-[var(--color-surface-1)] border border-[var(--color-surface-2)] rounded-lg p-6">
            <p className="font-mono text-xs text-dim mb-2">TAREFAS</p>
            <p className="font-orbitron text-2xl font-bold">{totalTasks}</p>
          </div>
        </div>
      </div>
    </ShellLayout>
  );
}
