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
  const [completedToday, setCompletedToday] = useState(0);

  useEffect(() => {
    fetch('http://localhost:3002/goals?status=ACTIVE')
      .then(r => r.json())
      .then(data => setActiveGoals(Array.isArray(data) ? data.length : 0))
      .catch(() => setActiveGoals(0));
    fetch('http://localhost:3002/tasks')
      .then(r => r.json())
      .then(data => {
        const tasks = Array.isArray(data) ? data : [];
        setTotalTasks(tasks.length);
        setCompletedToday(tasks.filter((t: any) => t.completed).length);
      })
      .catch(() => { setTotalTasks(0); setCompletedToday(0); });
  }, []);

  return (
    <ShellLayout>
      <div className="max-w-6xl mx-auto animate-fade-in">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="relative">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-alt)] flex items-center justify-center shadow-glow">
                <span className="font-orbitron text-2xl font-bold text-white">Z</span>
              </div>
              {/* Glow ring */}
              <div className="absolute inset-0 rounded-xl bg-[var(--color-primary)]/20 blur-xl -z-10" />
            </div>
            <div>
              <h1 className="font-orbitron text-2xl font-bold text-[var(--color-text)]">
                Bom dia, <span className="text-[var(--color-primary)]">Explorador</span>
              </h1>
              <p className="text-[var(--color-text-dim)] text-sm">
                {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Input */}
        <div className="mb-8">
          <QuickInput />
        </div>

        {/* Stats Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="METAS ATIVAS"
            value={activeGoals.toString()}
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="6" />
                <circle cx="12" cy="12" r="2" />
              </svg>
            }
            color="primary"
          />
          <StatCard
            label="TAREFAS"
            value={totalTasks.toString()}
            subtitle={`${completedToday} concluídas`}
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            }
            color="success"
          />
          <StatCard
            label="SEQUÊNCIA"
            value="5"
            subtitle="dias seguidos"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            }
            color="warning"
          />
          <StatCard
            label="PROGRESSO"
            value="62%"
            subtitle="esta semana"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            }
            color="info"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Weekly Progress Chart */}
          <div className="lg:col-span-2 card p-6 hud-border">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-orbitron text-lg font-bold text-[var(--color-text)]">Progresso Semanal</h2>
                <p className="text-[var(--color-text-dim)] text-sm">Últimos 7 dias</p>
              </div>
              <div className="badge badge-primary">
                <span className="w-2 h-2 rounded-full bg-[var(--color-primary)] animate-pulse-glow" />
                Ativo
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={weeklyData} barCategoryGap="20%">
                <XAxis
                  dataKey="day"
                  stroke="var(--color-text-muted)"
                  tick={{ fontSize: 11, fontFamily: 'var(--font-space-mono)', fill: 'var(--color-text-dim)' }}
                  axisLine={{ stroke: 'var(--border-default)' }}
                  tickLine={false}
                />
                <YAxis
                  stroke="var(--color-text-muted)"
                  tick={{ fontSize: 11, fontFamily: 'var(--font-space-mono)', fill: 'var(--color-text-dim)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Bar dataKey="progress" radius={[6, 6, 0, 0]}>
                  {weeklyData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.progress >= 70 ? 'var(--color-success)' : entry.progress >= 40 ? 'var(--color-primary)' : 'var(--color-text-muted)'}
                      fillOpacity={0.8}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Quick Actions */}
          <div className="card p-6 hud-border">
            <h2 className="font-orbitron text-lg font-bold text-[var(--color-text)] mb-4">Ações Rápidas</h2>
            <div className="space-y-3">
              <QuickAction
                href="/metas"
                label="Nova Meta"
                description="Definir objetivo"
                icon={
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                }
              />
              <QuickAction
                href="/rotinas"
                label="Nova Rotina"
                description="Criar hábito"
                icon={
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                }
              />
              <QuickAction
                href="/paginas"
                label="Nova Página"
                description="Organizar ideias"
                icon={
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                }
              />
              <QuickAction
                href="/calendario"
                label="Agendar"
                description="Marcar compromisso"
                icon={
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                }
              />
            </div>
          </div>
        </div>
      </div>
    </ShellLayout>
  );
}

// Stat Card Component
function StatCard({ label, value, subtitle, icon, color }: {
  label: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  color: 'primary' | 'success' | 'warning' | 'info';
}) {
  const colorMap = {
    primary: {
      bg: 'var(--color-primary-subtle)',
      border: 'var(--color-primary)',
      text: 'var(--color-primary)',
      glow: 'var(--color-primary-glow)',
    },
    success: {
      bg: 'rgba(47, 198, 62, 0.08)',
      border: 'var(--color-success)',
      text: 'var(--color-success)',
      glow: 'var(--color-success-glow)',
    },
    warning: {
      bg: 'rgba(255, 149, 0, 0.08)',
      border: 'var(--color-warning)',
      text: 'var(--color-warning)',
      glow: 'var(--color-warning-glow)',
    },
    info: {
      bg: 'rgba(0, 180, 216, 0.08)',
      border: 'var(--color-info)',
      text: 'var(--color-info)',
      glow: 'var(--color-info-glow)',
    },
  };

  const colors = colorMap[color];

  return (
    <div className="card p-4 relative overflow-hidden group hover:border-[var(--border-strong)] transition-all duration-300">
      {/* Background glow on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"
        style={{ background: `radial-gradient(circle at 50% 50%, ${colors.bg}, transparent 70%)` }}
      />

      <div className="flex items-start justify-between mb-3">
        <div
          className="p-2 rounded-lg"
          style={{ background: colors.bg, color: colors.text }}
        >
          {icon}
        </div>
      </div>
      <p className="font-mono text-[10px] text-[var(--color-text-dim)] tracking-wider mb-1">{label}</p>
      <p className="font-orbitron text-2xl font-bold" style={{ color: colors.text }}>{value}</p>
      {subtitle && <p className="text-[var(--color-text-muted)] text-xs mt-1">{subtitle}</p>}
    </div>
  );
}

// Quick Action Component
function QuickAction({ href, label, description, icon }: {
  href: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-surface-2)]/30 border border-[var(--border-subtle)] hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-primary-subtle)] transition-all duration-200 group"
    >
      <div className="p-2 rounded-lg bg-[var(--color-surface-2)] group-hover:bg-[var(--color-primary)]/20 group-hover:text-[var(--color-primary)] text-[var(--color-text-dim)] transition-all duration-200">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">{label}</p>
        <p className="text-xs text-[var(--color-text-muted)]">{description}</p>
      </div>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)] group-hover:translate-x-1 transition-all">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </a>
  );
}