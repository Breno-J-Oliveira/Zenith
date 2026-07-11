import { Header } from './Header';
import { Sidebar } from './Sidebar';

export function ShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Header />
      <Sidebar />
      <main className="pt-16 pl-[72px] min-h-screen">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}