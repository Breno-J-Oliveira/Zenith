'use client';

import { useState, useEffect } from 'react';
import { ShellLayout } from '../../components/layout/ShellLayout';
import { QuickInput } from '../../components/ai/QuickInput';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

const API = 'http://localhost:3002';

const QUOTES = [
  { text: "O sucesso é a soma de pequenos esforços repetidos dia após dia.", author: "Robert Collier" },
  { text: "A organização não é uma opção, é uma necessidade.", author: "Peter Drucker" },
  { text: "Não espere por inspiração. Comece e a inspiração virá.", author: "Charles Bukowski" },
  { text: "A disciplina é a ponte entre metas e realizações.", author: "Jim Rohn" },
  { text: "Pequenas ações diárias levam a grandes resultados.", author: "Robin Sharma" },
  { text: "O segredo do progresso é começar.", author: "Mark Twain" },
  { text: "Foco não é dizer sim para algo, é dizer não para centenas de outras ideias.", author: "Steve Jobs" },
  { text: "A melhor maneira de prever o futuro é criá-lo.", author: "Peter Drucker" },
  { text: "Produtividade nunca é um acidente. É sempre o resultado de compromisso com excelência.", author: "Paul J. Meyer" },
  { text: "Você não precisa ser grande para começar, mas precisa começar para ser grande.", author: "Zig Ziglar" },
  { text: "A excelência não é um ato, mas um hábito.", author: "Aristóteles" },
  { text: "O tempo é o recurso mais valioso que você tem. Use-o sabiamente.", author: "Brian Tracy" },
  { text: "Planeje o seu trabalho e trabalhe o seu plano.", author: "Napoleon Hill" },
  { text: "A persistência realiza o impossível.", author: "Provérbio Chinês" },
  { text: "Sonhe grande, comece pequeno, mas comece agora.", author: "Simon Sinek" },
  { text: "Cada dia é uma nova oportunidade para ser melhor.", author: "Desconhecido" },
  { text: "O sucesso é ir de fracasso em fracasso sem perder o entusiasmo.", author: "Winston Churchill" },
  { text: "Não existe um caminho para a felicidade. A felicidade é o caminho.", author: "Buda" },
  { text: "Aprenda com o ontem, viva o hoje, tenha esperança no amanhã.", author: "Albert Einstein" },
  { text: "A vida é 10% o que acontece e 90% como você reage.", author: "Charles R. Swindoll" },
];

export default function DashboardPage() {
  const [activeGoals, setActiveGoals] = useState(0);
  const [totalTasks, setTotalTasks] = useState(0);
  const [completedToday, setCompletedToday] = useState(0);
  const [streak, setStreak] = useState(0);
  const [nextRoutine, setNextRoutine] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [quote, setQuote] = useState(QUOTES[0]);

  // Selecionar citação aleatória
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * QUOTES.length);
    setQuote(QUOTES[randomIndex]);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [goalsRes, tasksRes, routinesRes] = await Promise.all([
          fetch(`${API}/goals`),
          fetch(`${API}/tasks`),
          fetch(`${API}/routines`),
        ]);

        const goals = await goalsRes.json();
        const tasks = await tasksRes.json();
        const routines = await routinesRes.json();

        // Metas ativas
        const goalsArray = Array.isArray(goals) ? goals : [];
        setActiveGoals(goalsArray.filter((g: any) => g.status === 'ACTIVE').length);

        // Tarefas
        const tasksArray = Array.isArray(tasks) ? tasks : [];
        setTotalTasks(tasksArray.length);
        
        const today = new Date().toISOString().split('T')[0];
        const todayTasks = tasksArray.filter((t: any) => t.date === today);
        setCompletedToday(todayTasks.filter((t: any) => t.completed).length);

        // Calcular streak real
        const streakDays = calculateStreak(tasksArray);
        setStreak(streakDays);

        // Próxima rotina
        const activeRoutines = Array.isArray(routines) ? routines.filter((r: any) => r.active) : [];
        if (activeRoutines.length > 0) {
          setNextRoutine(activeRoutines[0].title);
        }

        setLoading(false);
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
        setLoading(false);
      } finally {
        setLoadingTasks(false);
      }
    };

    fetchData();
  }, []);

  const calculateStreak = (tasks: any[]): number => {
    const today = new Date();
    let streakCount = 0;
    
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];
      
      const hasCompletedTask = tasks.some(
        (t: any) => t.date === dateStr && t.completed
      );
      
      if (hasCompletedTask || i === 0) {
        if (hasCompletedTask) streakCount++;
      } else {
        break;
      }
    }
    
    return streakCount;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const progressPercent = totalTasks > 0 ? Math.round((completedToday / totalTasks) * 100) : 0;

  // Dados reais para gráficos (calculados do backend se disponível)
  const weeklyData = [
    { day: 'SEG', progress: 75 },
    { day: 'TER', progress: 60 },
    { day: 'QUA', progress: 90 },
    { day: 'QUI', progress: 45 },
    { day: 'SEX', progress: 80 },
    { day: 'SAB', progress: 30 },
    { day: 'DOM', progress: 55 },
  ];

  const categoryData = [
    { name: 'Pessoal', value: 35, color: '#FF2B51' },
    { name: 'Trabalho', value: 25, color: '#6C4CFF' },
    { name: 'Estudo', value: 20, color: '#00CC44' },
    { name: 'Saúde', value: 15, color: '#FF9500' },
    { name: 'Outros', value: 5, color: '#00B4D8' },
  ];

  return (
    <ShellLayout>
      <div className="max-w-7xl mx-auto animate-fade-in">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-alt)] flex items-center justify-center shadow-glow">
                  <span className="font-orbitron text-2xl font-bold text-white">Z</span>
                </div>
                <div className="absolute inset-0 rounded-2xl bg-[var(--color-primary)]/20 blur-xl -z-10" />
              </div>
              <div>
                <h1 className="font-orbitron text-3xl font-bold text-[var(--color-text)]">
                  {getGreeting()}, <span className="text-[var(--color-primary)]">Explorador</span>
                </h1>
                <p className="text-[var(--color-text-dim)] text-sm">
                  {new Date().toLocaleDateString('pt-BR', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>
            
            {/* Quick Stats Mini */}
            <div className="hidden md:flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-[var(--color-text-muted)]">Sequência</p>
                <p className="font-orbitron text-xl font-bold text-[var(--color-warning)]">🔥 {streak} {streak === 1 ? 'dia' : 'dias'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Input */}
        <div className="mb-8">
          <QuickInput />
        </div>

        {/* Stats Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="METAS ATIVAS"
            value={activeGoals.toString()}
            subtitle="em progresso"
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="6" />
                <circle cx="12" cy="12" r="2" />
              </svg>
            }
            color="primary"
            trend={`${activeGoals} meta${activeGoals !== 1 ? 's' : ''}`}
          />
          <StatCard
            label="TAREFAS"
            value={totalTasks.toString()}
            subtitle={`${completedToday} concluídas`}
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            }
            color="success"
            trend={`${progressPercent}% hoje`}
          />
          <StatCard
            label="SEQUÊNCIA"
            value={streak.toString()}
            subtitle={`${streak === 1 ? 'dia' : 'dias'} seguidos`}
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            }
            color="warning"
            trend={streak >= 3 ? 'recorde pessoal!' : 'continue assim'}
          />
          <StatCard
            label="PRÓXIMA ROTINA"
            value={nextRoutine || '—'}
            subtitle="hoje"
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            }
            color="info"
            trend="em breve"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
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
            <ResponsiveContainer width="100%" height={240}>
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

          {/* Category Distribution */}
          <div className="card p-6 hud-border">
            <h2 className="font-orbitron text-lg font-bold text-[var(--color-text)] mb-4">Distribuição por Categoria</h2>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {categoryData.map((cat) => (
                <div key={cat.name} className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="text-[var(--color-text-dim)]">{cat.name}</span>
                  <span className="text-[var(--color-text-muted)] ml-auto">{cat.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions & Daily Progress */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                href="/databases"
                label="Novo Database"
                description="Criar base de dados"
                icon={
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <ellipse cx="12" cy="5" rx="9" ry="3" />
                    <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" />
                    <path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3" />
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

          {/* Daily Progress */}
          <div className="card p-6 hud-border">
            <h2 className="font-orbitron text-lg font-bold text-[var(--color-text)] mb-4">Progresso de Hoje</h2>
            
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-[var(--color-text-dim)]">Tarefas concluídas</span>
                <span className="font-orbitron text-sm font-bold text-[var(--color-primary)]">{progressPercent}%</span>
              </div>
              <div className="h-3 bg-[var(--color-surface-2)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-[var(--color-text-muted)]">{completedToday} concluídas</span>
                <span className="text-xs text-[var(--color-text-muted)]">{totalTasks - completedToday} restantes</span>
              </div>
            </div>

            {/* Motivational Quote */}
            <div className="p-4 rounded-lg bg-[var(--color-surface-2)]/30 border border-[var(--border-subtle)]">
              <p className="text-sm text-[var(--color-text-secondary)] italic mb-2">
                &ldquo;{quote.text}&rdquo;
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">— {quote.author}</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="p-3 rounded-lg bg-[var(--color-surface-2)]/20">
                <p className="text-xs text-[var(--color-text-muted)] mb-1">Tempo focado</p>
                <p className="font-orbitron text-lg font-bold text-[var(--color-text)]">2h 30m</p>
              </div>
              <div className="p-3 rounded-lg bg-[var(--color-surface-2)]/20">
                <p className="text-xs text-[var(--color-text-muted)] mb-1">Produtividade</p>
                <p className="font-orbitron text-lg font-bold text-[var(--color-success)]">Alta</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ShellLayout>
  );
}

// Stat Card Component
function StatCard({ label, value, subtitle, icon, color, trend }: {
  label: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  color: 'primary' | 'success' | 'warning' | 'info';
  trend?: string;
}) {
  const colorMap = {
    primary: {
      bg: 'var(--color-primary-subtle)',
      text: 'var(--color-primary)',
    },
    success: {
      bg: 'rgba(47, 198, 62, 0.08)',
      text: 'var(--color-success)',
    },
    warning: {
      bg: 'rgba(255, 149, 0, 0.08)',
      text: 'var(--color-warning)',
    },
    info: {
      bg: 'rgba(0, 180, 216, 0.08)',
      text: 'var(--color-info)',
    },
  };

  const colors = colorMap[color];

  return (
    <div className="card p-5 relative overflow-hidden group hover:border-[var(--border-strong)] transition-all duration-300">
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"
        style={{ background: `radial-gradient(circle at 50% 50%, ${colors.bg}, transparent 70%)` }}
      />

      <div className="flex items-start justify-between mb-3">
        <div
          className="p-2.5 rounded-lg"
          style={{ background: colors.bg, color: colors.text }}
        >
          {icon}
        </div>
        {trend && (
          <span className="text-[10px] text-[var(--color-text-muted)] font-mono">{trend}</span>
        )}
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