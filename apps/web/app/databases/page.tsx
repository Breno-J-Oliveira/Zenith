'use client';

import { useState, useEffect } from 'react';
import { ShellLayout } from '../../components/layout/ShellLayout';
import { DatabaseTable } from '../../components/databases/DatabaseTable';
import { DatabaseGallery } from '../../components/databases/DatabaseGallery';
import { CreateDatabaseModal } from '../../components/databases/CreateDatabaseModal';

const API = 'http://localhost:3002';

interface Row {
  id: string;
  values: string;
  coverImage: string | null;
  order: number;
}

interface Database {
  id: string;
  title: string;
  icon: string | null;
  isPreset: boolean;
  presetType: string | null;
  properties: Property[];
  views: View[];
  rows?: Row[];
  _count: { rows: number };
}

interface Property {
  id: string;
  name: string;
  type: string;
  options: string | null;
  order: number;
}

interface View {
  id: string;
  name: string;
  type: 'table' | 'gallery' | 'list' | 'board';
  config: string;
}

export default function DatabasesPage() {
  const [databases, setDatabases] = useState<Database[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDb, setSelectedDb] = useState<Database | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'gallery'>('table');

  const fetchDatabases = async () => {
    try {
      const res = await fetch(`${API}/databases`);
      const data = await res.json();
      setDatabases(Array.isArray(data) ? data : []);
    } catch {
      setDatabases([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatabases();
  }, []);

  const handleSelectDatabase = async (db: Database) => {
    // Busca detalhes completos com rows
    const res = await fetch(`${API}/databases/${db.id}`);
    const data = await res.json();
    setSelectedDb(data);
  };

  const handleCreateDatabase = async (data: {
    title: string;
    icon?: string;
    presetType?: string;
    properties?: { name: string; type: string; options?: string }[];
  }) => {
    try {
      if (data.presetType) {
        // Criar a partir de preset
        const res = await fetch(`${API}/databases/presets/${data.presetType}`, {
          method: 'POST',
        });
        const db = await res.json();
        await handleSelectDatabase(db);
      } else {
        // Criar do zero
        const res = await fetch(`${API}/databases`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: data.title, icon: data.icon }),
        });
        const db = await res.json();

        // Adicionar propriedades
        if (data.properties) {
          for (const prop of data.properties) {
            await fetch(`${API}/databases/${db.id}/properties`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(prop),
            });
          }
        }

        await handleSelectDatabase(db);
      }

      setShowCreateModal(false);
      fetchDatabases();
    } catch (err) {
      console.error('Erro ao criar database:', err);
    }
  };

  const handleDeleteDatabase = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este database?')) return;
    try {
      await fetch(`${API}/databases/${id}`, { method: 'DELETE' });
      setSelectedDb(null);
      fetchDatabases();
    } catch (err) {
      console.error('Erro ao excluir database:', err);
    }
  };

  return (
    <ShellLayout>
      <div className="max-w-7xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[var(--color-primary-subtle)] text-[var(--color-primary)]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <ellipse cx="12" cy="5" rx="9" ry="3" />
                <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" />
                <path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3" />
              </svg>
            </div>
            <div>
              <h1 className="font-orbitron text-2xl font-bold text-[var(--color-text)]">Databases</h1>
              <p className="text-[var(--color-text-dim)] text-sm">{databases.length} databases criados</p>
            </div>
          </div>
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Novo Database
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-12 h-12 rounded-full border-2 border-[var(--color-surface-2)] border-t-[var(--color-primary)] animate-spin mb-4" />
            <p className="text-[var(--color-text-dim)] text-sm">Carregando databases...</p>
          </div>
        ) : !selectedDb ? (
          /* Lista de databases */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {databases.length === 0 ? (
              <div className="col-span-full card p-12 text-center hud-border">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5">
                    <ellipse cx="12" cy="5" rx="9" ry="3" />
                    <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" />
                    <path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3" />
                  </svg>
                </div>
                <p className="font-orbitron text-lg text-[var(--color-text)] mb-2">Nenhum database</p>
                <p className="text-[var(--color-text-dim)] text-sm mb-4">
                  Crie um database do zero ou escolha um preset para começar.
                </p>
                <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
                  Criar Database
                </button>
              </div>
            ) : (
              databases.map((db) => (
                <div
                  key={db.id}
                  onClick={() => handleSelectDatabase(db)}
                  className="card p-5 cursor-pointer hover:border-[var(--color-primary)]/50 transition-all duration-200 group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-2xl">{db.icon || '📊'}</span>
                    <span className="badge badge-primary text-[9px]">
                      {db._count.rows} {db._count.rows === 1 ? 'item' : 'itens'}
                    </span>
                  </div>
                  <h3 className="font-orbitron text-sm font-bold text-[var(--color-text)] mb-1 group-hover:text-[var(--color-primary)] transition-colors">
                    {db.title}
                  </h3>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {db.properties.length} propriedades · {db.views.length} {db.views.length === 1 ? 'view' : 'views'}
                  </p>
                  {db.isPreset && (
                    <span className="inline-block mt-2 text-[9px] font-mono text-[var(--color-primary)] bg-[var(--color-primary-subtle)] px-2 py-0.5 rounded">
                      PRESET
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        ) : (
          /* Database selecionado - mostrar dados */
          <div>
            {/* Header do database */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedDb(null)}
                  className="p-2 rounded-lg text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)] transition-all"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <span className="text-2xl">{selectedDb.icon || '📊'}</span>
                <div>
                  <h2 className="font-orbitron text-xl font-bold text-[var(--color-text)]">{selectedDb.title}</h2>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {selectedDb.properties.length} propriedades · {selectedDb.rows?.length || 0} itens
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Toggle view */}
                <div className="flex rounded-lg border border-[var(--border-default)] overflow-hidden">
                  <button
                    onClick={() => setViewMode('table')}
                    className={`p-2 transition-colors ${viewMode === 'table' ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-dim)] hover:text-[var(--color-text)]'}`}
                    title="Visualização em Tabela"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <line x1="3" y1="9" x2="21" y2="9" />
                      <line x1="3" y1="15" x2="21" y2="15" />
                      <line x1="9" y1="3" x2="9" y2="21" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode('gallery')}
                    className={`p-2 transition-colors ${viewMode === 'gallery' ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-dim)] hover:text-[var(--color-text)]'}`}
                    title="Visualização em Galeria"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="7" height="7" />
                      <rect x="14" y="3" width="7" height="7" />
                      <rect x="14" y="14" width="7" height="7" />
                      <rect x="3" y="14" width="7" height="7" />
                    </svg>
                  </button>
                </div>

                <button
                  onClick={() => handleDeleteDatabase(selectedDb.id)}
                  className="btn btn-ghost text-[var(--color-text-muted)] hover:text-[var(--color-danger)]"
                  title="Excluir database"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            </div>

            {/* View */}
            {viewMode === 'table' ? (
              <DatabaseTable database={selectedDb} onUpdate={fetchDatabases} />
            ) : (
              <DatabaseGallery database={selectedDb} onUpdate={fetchDatabases} />
            )}
          </div>
        )}

        {/* Modal de criação */}
        {showCreateModal && (
          <CreateDatabaseModal
            onClose={() => setShowCreateModal(false)}
            onCreate={handleCreateDatabase}
          />
        )}
      </div>
    </ShellLayout>
  );
}