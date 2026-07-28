import { Injectable, Logger } from '@nestjs/common';
import { PrismaService, MOCK_USER_ID } from '../prisma.service';
// TODO: migrar para user.id do JWT quando auth real cobrir todos os endpoints
import { GoalsService } from '../goals/goals.service';
import { TasksService } from '../tasks/tasks.service';
import { RoutinesService } from '../routines/routines.service';
import { PagesService } from '../pages/pages.service';
import { DatabasesService } from '../databases/databases.service';
import { SchedulerService } from '../scheduler/scheduler.service';

/**
 * Tipo de resultado de busca unificado.
 * Cada hit carrega o tipo, identificador, título, subtítulo (preview)
 * e href para navegação no frontend.
 */
export type SearchHitType = 'goal' | 'task' | 'routine' | 'page' | 'database' | 'appointment' | 'row';

export interface SearchHit {
  type: SearchHitType;
  id: string;
  title: string;
  subtitle?: string;
  preview?: string;     // trecho de texto com o termo destacado (quando aplicável)
  href: string;          // rota no frontend
  icon: string;          // emoji
  meta?: Record<string, any>;
}

export interface SearchResponse {
  query: string;
  total: number;
  byType: Record<SearchHitType, number>;
  results: SearchHit[];
}

/**
 * Normaliza string para busca: minúsculas + sem acentos.
 * "Finanças" e "Financas" passam a ser equivalentes.
 */
function norm(s: string | null | undefined): string {
  if (!s) return '';
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Verifica se o termo de busca casa com o texto (busca substring normalizada).
 */
function matches(text: string | null | undefined, q: string): boolean {
  return norm(text).includes(q);
}

/**
 * SearchService — busca global unificada.
 *
 * Agrega resultados de múltiplas entidades (goals, tasks, routines, pages,
 * databases, appointments, rows) em uma única chamada. Usado pela Fase 11
 * (Busca Global) do roadmap e pela tool `search` do AgentService.
 *
 * Vantagens sobre múltiplas chamadas paralelas no frontend:
 *  - 1 request HTTP em vez de 5
 *  - Ordenação e paginação centralizadas
 *  - Suporte a "deep search" (linhas de database com filtro)
 *  - Cacheable server-side
 */
@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly goalsService: GoalsService,
    private readonly tasksService: TasksService,
    private readonly routinesService: RoutinesService,
    private readonly pagesService: PagesService,
    private readonly databasesService: DatabasesService,
    private readonly schedulerService: SchedulerService,
  ) {}

  /**
   * Busca global. Retorna resultados agrupados por tipo, com limit por tipo.
   *
   * @param userId  usuário (vem do JWT)
   * @param query    termo de busca (mínimo 2 caracteres)
   * @param types    filtro opcional de tipos (ex: ['goal','task'])
   * @param limit    limite por tipo (default 10)
   */
  async search(
    userId: string,
    query: string,
    types?: SearchHitType[],
    limit = 10,
  ): Promise<SearchResponse> {
    // Por enquanto, todos os services (goals, tasks, etc) usam MOCK_USER_ID.
    // Quando o auth real cobrir todos os endpoints, trocar para userId do JWT.
    const effectiveUserId = MOCK_USER_ID;
    const q = norm(query);
    if (q.length < 2) {
      return { query, total: 0, byType: {} as any, results: [] };
    }

    const includeAll = !types || types.length === 0;
    const want = (t: SearchHitType) => includeAll || types!.includes(t);

    // Lança todas as buscas em paralelo
    const tasks: Promise<SearchHit[]>[] = [];
    if (want('goal')) tasks.push(this.searchGoals(userId, q, limit));
    if (want('task')) tasks.push(this.searchTasks(userId, q, limit));
    if (want('routine')) tasks.push(this.searchRoutines(userId, q, limit));
    if (want('page')) tasks.push(this.searchPages(userId, q, limit));
    if (want('database')) tasks.push(this.searchDatabases(userId, q, limit));
    if (want('appointment')) tasks.push(this.searchAppointments(userId, q, limit));
    if (want('row')) tasks.push(this.searchRows(userId, q, limit));

    const grouped = await Promise.all(tasks);
    const results = grouped.flat();

    // Ordena por relevância (match exato > prefixo > substring)
    results.sort((a, b) => {
      const aExact = norm(a.title) === q ? 0 : 1;
      const bExact = norm(b.title) === q ? 0 : 1;
      if (aExact !== bExact) return aExact - bExact;
      const aPrefix = norm(a.title).startsWith(q) ? 0 : 1;
      const bPrefix = norm(b.title).startsWith(q) ? 0 : 1;
      if (aPrefix !== bPrefix) return aPrefix - bPrefix;
      return a.title.localeCompare(b.title);
    });

    // Conta por tipo
    const byType: Record<string, number> = {};
    for (const r of results) {
      byType[r.type] = (byType[r.type] || 0) + 1;
    }

    return { query, total: results.length, byType: byType as any, results };
  }

  // ─── BUSCAS POR TIPO ──────────────────────────────────────

  private async searchGoals(userId: string, q: string, limit: number): Promise<SearchHit[]> {
    const goals = await this.goalsService.findAll(userId);
    return goals
      .filter((g) => matches(g.title, q) || matches(g.description, q))
      .slice(0, limit)
      .map((g) => ({
        type: 'goal' as const,
        id: g.id,
        title: g.title,
        subtitle: `${g.category} · ${g.status}${g.deadline ? ` · prazo ${g.deadline}` : ''}`,
        href: '/metas',
        icon: '🎯',
        meta: { category: g.category, status: g.status, deadline: g.deadline },
      }));
  }

  private async searchTasks(userId: string, q: string, limit: number): Promise<SearchHit[]> {
    const tasks = await this.tasksService.findAll(userId);
    return tasks
      .filter((t) => matches(t.title, q) || matches(t.description, q))
      .slice(0, limit)
      .map((t) => ({
        type: 'task' as const,
        id: t.id,
        title: t.title,
        subtitle: `${t.completed ? '✅ Concluída' : '⏳ Pendente'}${t.date ? ` · ${t.date}` : ''}`,
        href: '/hoje',
        icon: '✅',
        meta: { completed: t.completed, date: t.date, goalId: t.goalId },
      }));
  }

  private async searchRoutines(userId: string, q: string, limit: number): Promise<SearchHit[]> {
    const routines = await this.routinesService.findAll(userId);
    return routines
      .filter((r) => matches(r.title, q))
      .slice(0, limit)
      .map((r) => ({
        type: 'routine' as const,
        id: r.id,
        title: r.title,
        subtitle: `${r.frequency} às ${r.time}${r.active ? '' : ' (pausada)'}`,
        href: '/rotinas',
        icon: '🔄',
        meta: { frequency: r.frequency, time: r.time, active: r.active },
      }));
  }

  private async searchPages(userId: string, q: string, limit: number): Promise<SearchHit[]> {
    const pages = await this.pagesService.getPages(userId);
    return pages
      .filter((p) => matches(p.title, q))
      .slice(0, limit)
      .map((p) => ({
        type: 'page' as const,
        id: p.id,
        title: p.title,
        subtitle: `${(p as any).blocks?.length || 0} blocos`,
        href: `/paginas/${p.id}`,
        icon: '📄',
      }));
  }

  private async searchDatabases(userId: string, q: string, limit: number): Promise<SearchHit[]> {
    const databases = await this.databasesService.findAll(userId);
    return databases
      .filter((d) => matches(d.title, q))
      .slice(0, limit)
      .map((d) => ({
        type: 'database' as const,
        id: d.id,
        title: d.title,
        subtitle: `${d.properties?.length || 0} colunas${d.isPreset ? ' · preset' : ''}`,
        href: '/databases',
        icon: '🗄️',
        meta: { isPreset: d.isPreset, presetType: d.presetType },
      }));
  }

  private async searchAppointments(userId: string, q: string, limit: number): Promise<SearchHit[]> {
    const appointments = await this.schedulerService.findAll(userId);
    return appointments
      .filter((a) => matches(a.title, q))
      .slice(0, limit)
      .map((a) => ({
        type: 'appointment' as const,
        id: a.id,
        title: a.title,
        subtitle: `${a.date} das ${a.startTime} às ${a.endTime}`,
        href: '/calendario',
        icon: '📅',
        meta: { date: a.date, startTime: a.startTime, endTime: a.endTime },
      }));
  }

  /**
   * Busca nas LINHAS dos databases (não nos databases em si).
   * Para cada database do user, varre as rows e procura nos values.
   */
  private async searchRows(userId: string, q: string, limit: number): Promise<SearchHit[]> {
    const databases = await this.databasesService.findAll(userId);
    const results: SearchHit[] = [];
    for (const db of databases) {
      if (results.length >= limit) break;
      const fullDb = await this.databasesService.findOne(userId, db.id);
      // constrói índice propertyId -> propertyName
      const propName: Record<string, string> = {};
      for (const p of fullDb.properties) propName[p.id] = p.name;
      for (const row of fullDb.rows) {
        if (results.length >= limit) break;
        let values: any = {};
        try { values = JSON.parse(row.values); } catch { continue; }
        // Decodifica os values para nomes de coluna
        const named: Record<string, any> = {};
        for (const [k, v] of Object.entries(values)) {
          const colName = propName[k] || k;
          named[colName] = v;
        }
        // Verifica se algum valor casa
        const matchingCol = Object.entries(named).find(([_, v]) => matches(String(v ?? ''), q));
        if (matchingCol) {
          const [col, val] = matchingCol;
          results.push({
            type: 'row' as const,
            id: `${db.id}-${row.id}`,
            title: `${db.title}: ${val}`,
            subtitle: `Coluna "${col}" do database ${db.title}`,
            preview: `...${col}: ${val}...`,
            href: '/databases',
            icon: '📊',
            meta: { databaseId: db.id, databaseTitle: db.title, rowId: row.id, column: col },
          });
        }
      }
    }
    return results;
  }
}


