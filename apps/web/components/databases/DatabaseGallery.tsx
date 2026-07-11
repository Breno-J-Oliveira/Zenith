'use client';

import { useState } from 'react';

const API = 'http://localhost:3002';

interface Property {
  id: string;
  name: string;
  type: string;
  options: string | null;
  order: number;
}

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
  properties: Property[];
  rows: Row[];
}

interface DatabaseGalleryProps {
  database: Database;
  onUpdate: () => void;
}

export function DatabaseGallery({ database, onUpdate }: DatabaseGalleryProps) {
  const [selectedRow, setSelectedRow] = useState<Row | null>(null);

  const sortedProperties = [...database.properties].sort((a, b) => a.order - b.order);
  const sortedRows = [...(database.rows || [])].sort((a, b) => a.order - b.order);

  const getCellValue = (row: Row, propId: string): string => {
    try {
      const values = JSON.parse(row.values);
      return values[propId] || '';
    } catch {
      return '';
    }
  };

  const handleAddRow = async () => {
    try {
      const initialValues: Record<string, string> = {};
      sortedProperties.forEach(prop => {
        initialValues[prop.id] = '';
      });

      await fetch(`${API}/databases/${database.id}/rows`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: JSON.stringify(initialValues) }),
      });

      onUpdate();
    } catch (err) {
      console.error('Erro ao adicionar item:', err);
    }
  };

  const handleDeleteRow = async (rowId: string) => {
    if (!confirm('Excluir este item?')) return;
    try {
      await fetch(`${API}/databases/rows/${rowId}`, { method: 'DELETE' });
      setSelectedRow(null);
      onUpdate();
    } catch (err) {
      console.error('Erro ao excluir item:', err);
    }
  };

  // Pega a primeira propriedade de texto para usar como título do card
  const titleProp = sortedProperties.find(p => p.type === 'text') || sortedProperties[0];
  // Pega propriedades para mostrar no card (excluindo a de título)
  const displayProps = sortedProperties.filter(p => p.id !== titleProp?.id).slice(0, 3);

  return (
    <div>
      {/* Gallery Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {sortedRows.map(row => {
          const title = titleProp ? getCellValue(row, titleProp.id) : 'Sem título';
          const coverImage = row.coverImage;

          return (
            <div
              key={row.id}
              onClick={() => setSelectedRow(row)}
              className="card overflow-hidden cursor-pointer hover:border-[var(--color-primary)]/50 transition-all duration-200 group"
            >
              {/* Cover Image */}
              <div className="aspect-video bg-[var(--color-surface-2)] relative overflow-hidden">
                {coverImage ? (
                  <img
                    src={coverImage}
                    alt={title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">
                    {database.icon || '📄'}
                  </div>
                )}
              </div>

              {/* Card Content */}
              <div className="p-4">
                <h3 className="font-medium text-sm text-[var(--color-text)] mb-2 truncate">
                  {title || 'Sem título'}
                </h3>
                <div className="space-y-1">
                  {displayProps.map(prop => {
                    const value = getCellValue(row, prop.id);
                    if (!value) return null;

                    return (
                      <div key={prop.id} className="flex items-center justify-between text-xs">
                        <span className="text-[var(--color-text-muted)]">{prop.name}</span>
                        <span className="text-[var(--color-text-dim)] truncate ml-2 max-w-[60%]">
                          {prop.type === 'currency' ? `R$ ${parseFloat(value).toFixed(2)}` : value}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}

        {/* Add Card */}
        <div
          onClick={handleAddRow}
          className="card border-dashed border-2 border-[var(--border-default)] hover:border-[var(--color-primary)]/50 transition-all duration-200 cursor-pointer flex items-center justify-center min-h-[200px] group"
        >
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center mx-auto mb-2 group-hover:bg-[var(--color-primary-subtle)] transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--color-text-dim)] group-hover:text-[var(--color-primary)]">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
            <p className="text-sm text-[var(--color-text-dim)] group-hover:text-[var(--color-primary)] transition-colors">
              Adicionar item
            </p>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedRow && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedRow(null)}
        >
          <div
            className="card max-w-lg w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cover */}
            {selectedRow.coverImage && (
              <div className="aspect-video bg-[var(--color-surface-2)]">
                <img
                  src={selectedRow.coverImage}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Content */}
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h2 className="font-orbitron text-lg font-bold text-[var(--color-text)]">
                  {titleProp ? getCellValue(selectedRow, titleProp.id) : 'Sem título'}
                </h2>
                <button
                  onClick={() => setSelectedRow(null)}
                  className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <div className="space-y-3">
                {sortedProperties.map(prop => {
                  const value = getCellValue(selectedRow, prop.id);

                  return (
                    <div key={prop.id} className="flex items-start gap-3 py-2 border-b border-[var(--border-subtle)]">
                      <span className="text-xs font-mono text-[var(--color-text-dim)] w-24 shrink-0 pt-0.5">
                        {prop.name}
                      </span>
                      <span className="text-sm text-[var(--color-text)] flex-1">
                        {prop.type === 'checkbox' ? (
                          <input type="checkbox" checked={value === 'true'} disabled className="w-4 h-4" />
                        ) : prop.type === 'currency' && value ? (
                          <span className="text-[var(--color-success)]">R$ {parseFloat(value).toFixed(2)}</span>
                        ) : value || <span className="text-[var(--color-text-muted)]">—</span>}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => handleDeleteRow(selectedRow.id)}
                  className="btn btn-ghost text-[var(--color-text-muted)] hover:text-[var(--color-danger)]"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  Excluir item
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}