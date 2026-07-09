import { ShellLayout } from '../../components/layout/ShellLayout';

export default function RelatorioPage() {
  return (
    <ShellLayout>
      <div className="p-8 max-w-3xl">
        <h1 className="font-orbitron text-2xl font-bold mb-4">Relatório</h1>
        <div className="bg-[var(--color-surface-1)] border border-[var(--color-surface-2)] rounded-lg p-12 text-center">
          <p className="font-orbitron text-xl text-dim mb-2">Em breve</p>
          <p className="text-dim text-sm">
            Esta funcionalidade será implementada em uma fase futura.
          </p>
        </div>
      </div>
    </ShellLayout>
  );
}
