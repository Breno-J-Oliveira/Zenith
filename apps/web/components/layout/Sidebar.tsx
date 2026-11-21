'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRef } from 'react';
import {
  CalendarCheck, CalendarDays, ChartNoAxesColumn, Database, Ellipsis,
  FileText, LayoutDashboard, Repeat, Target,
} from 'lucide-react';

const daily = [
  { label: 'Hoje', href: '/hoje', icon: CalendarCheck },
  { label: 'Calendário', href: '/calendario', icon: CalendarDays },
  { label: 'Metas', href: '/metas', icon: Target },
  { label: 'Rotinas', href: '/rotinas', icon: Repeat },
];

const workspace = [
  { label: 'Painel', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Relatório', href: '/relatorio', icon: ChartNoAxesColumn },
  { label: 'Páginas', href: '/paginas', icon: FileText },
  { label: 'Bases de dados', href: '/databases', icon: Database },
];

export function Sidebar() {
  const pathname = usePathname();
  const more = useRef<HTMLDetailsElement>(null);

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + '/');
  const navItem = ({ label, href, icon: Icon }: (typeof daily)[number], mobileBar = false) => (
    <Link key={href} href={href + '/'} aria-current={isActive(href) ? 'page' : undefined}
      onClick={() => { if (more.current) more.current.open = false; }}
      className={`${mobileBar
        ? 'flex min-w-0 flex-col items-center justify-center gap-1 px-0.5 py-1 text-[11px] leading-tight'
        : 'flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-sm'
      } ${isActive(href)
        ? 'bg-[var(--color-primary-subtle)] font-bold text-[var(--color-text)]'
        : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)]'}`}>
      <Icon aria-hidden="true" size={18} className={isActive(href) ? 'text-[var(--color-primary)]' : ''} />
      <span>{label}</span>
    </Link>
  );

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-52 overflow-y-auto border-r border-[var(--color-surface-2)] bg-[var(--color-surface-1)] pt-20 md:block">
        <nav aria-label="Navegação principal" className="space-y-3 px-3 pb-4">
          <div className="space-y-1">{daily.map(item => navItem(item))}</div>
          <div className="space-y-1 border-t border-[var(--color-surface-2)] pt-3">
            {workspace.map(item => navItem(item))}
          </div>
        </nav>
      </aside>
      <nav aria-label="Navegação móvel"
        className="fixed inset-x-0 bottom-0 z-40 grid h-[calc(3.75rem+env(safe-area-inset-bottom))] grid-cols-5 items-stretch border-t border-[var(--color-surface-2)] bg-[var(--color-surface-1)] pb-[env(safe-area-inset-bottom)] md:hidden">
        {daily.map(item => navItem(item, true))}
        <details ref={more} className="group" onKeyDown={event => {
          if (event.key !== 'Escape' || !more.current?.open) return;
          more.current.open = false;
          more.current.querySelector('summary')?.focus();
        }}>
          <summary className="flex h-full cursor-pointer list-none flex-col items-center justify-center gap-1 px-0.5 py-1 text-[11px] leading-tight text-[var(--color-text-secondary)] [&::-webkit-details-marker]:hidden group-open:bg-[var(--color-surface-2)]">
            <Ellipsis aria-hidden="true" size={18} /> Mais
          </summary>
          <div className="absolute inset-x-3 bottom-full mb-2 space-y-1 rounded-xl border border-[var(--color-surface-3)] bg-[var(--color-surface-1)] p-2 shadow-xl">
            {workspace.map(item => navItem(item))}
          </div>
        </details>
      </nav>
    </>
  );
}
