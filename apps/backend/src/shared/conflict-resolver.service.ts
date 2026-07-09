import { Injectable } from '@nestjs/common';

export interface BusySlot {
  start: number;
  end: number;
}

export interface ConflictResolverInput {
  conflictStart: number;
  conflictEnd: number;
  duration: number;
  busy: BusySlot[];
}

/**
 * ConflictResolver — Heurística única de realocação de conflitos.
 *
 * Usada por SchedulerService (criação de appointments) e
 * CalendarService (reschedule via drag-and-drop).
 *
 * Regra (mesma da Fase 4):
 * 1. Tenta DEPOIS do conflito (candidateStart = conflictEnd)
 * 2. Se não couber (passa das 23:59), tenta ANTES (candidateEnd = conflictStart)
 * 3. Se não couber em nenhum caso, retorna null (não move)
 */
@Injectable()
export class ConflictResolver {
  findFreeSlot(input: ConflictResolverInput): { time: string } | null {
    const { conflictStart, conflictEnd, duration, busy } = input;

    // Tentativa 1: depois do conflito
    let candidateStart = conflictEnd;
    let candidateEnd = candidateStart + duration;
    if (candidateEnd <= this.toMinutes('23:59')) {
      if (!this.overlapsAny(candidateStart, candidateEnd, busy)) {
        return { time: this.fromMinutes(candidateStart) };
      }
    }

    // Tentativa 2: antes do conflito
    candidateEnd = conflictStart;
    candidateStart = candidateEnd - duration;
    if (candidateStart >= this.toMinutes('00:00')) {
      if (!this.overlapsAny(candidateStart, candidateEnd, busy)) {
        return { time: this.fromMinutes(candidateStart) };
      }
    }

    return null;
  }

  hasConflict(start1: number, end1: number, start2: number, end2: number): boolean {
    return start1 < end2 && end1 > start2;
  }

  private overlapsAny(start: number, end: number, busy: BusySlot[]): boolean {
    return busy.some(b => start < b.end && end > b.start);
  }

  toMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + (m || 0);
  }

  fromMinutes(mins: number): string {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
}
