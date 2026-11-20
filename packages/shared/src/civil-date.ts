// O Zenith usa este fuso para a agenda enquanto não houver preferência por conta.
export const ZENITH_TIME_ZONE = 'America/Sao_Paulo';

const dateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: ZENITH_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});
const timeFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: ZENITH_TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

export function getCivilDate(instant = new Date()): string {
  const parts = dateFormatter.formatToParts(instant);
  const year = parts.find(part => part.type === 'year')!.value.padStart(4, '0');
  const month = parts.find(part => part.type === 'month')!.value;
  const day = parts.find(part => part.type === 'day')!.value;
  return `${year}-${month}-${day}`;
}

export function getCivilTime(instant = new Date()): string {
  return timeFormatter.format(instant);
}

// Âncora para fazer aritmética de calendário com métodos UTC sem depender do host.
// Não representa o instante em que começou o dia no fuso do Zenith.
export function civilDateAnchor(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

export function addCivilDays(date: string, days: number): string {
  const anchor = civilDateAnchor(date);
  anchor.setUTCDate(anchor.getUTCDate() + days);
  return anchor.toISOString().slice(0, 10);
}

function startOfCivilDay(date: string): Date {
  const anchor = civilDateAnchor(date).getTime();
  const dayInMs = 86_400_000;
  let before = anchor - dayInMs;
  let after = anchor + dayInMs;

  // Busca o primeiro instante do dia, inclusive quando a hora civil 00:00
  // foi pulada por uma transição histórica de horário de verão.
  while (after - before > 1) {
    const middle = Math.floor((before + after) / 2);
    if (getCivilDate(new Date(middle)) < date) before = middle;
    else after = middle;
  }
  return new Date(after);
}

export function getCivilDayBounds(instant = new Date()): { start: Date; end: Date } {
  const today = getCivilDate(instant);
  return { start: startOfCivilDay(today), end: startOfCivilDay(addCivilDays(today, 1)) };
}
