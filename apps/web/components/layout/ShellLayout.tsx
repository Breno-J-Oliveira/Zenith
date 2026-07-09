import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';

export function ShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <Sidebar />
      <Footer />
      <main className="pt-16 pb-12 pr-16 min-h-screen">
        {children}
      </main>
    </>
  );
}
