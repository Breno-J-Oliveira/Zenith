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

interface DatabaseTableProps {
  database: Database;
  onUpdate: () => void;
}

export function DatabaseTable({ database, onUpdate }: DatabaseTableProps) {
  const [editingCell, setEditingCell] = useState<{ rowId: string; propId: string } | null>(null);
  const [editValue, setEditValue] = useState('');

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

  const handleCellClick = (rowId: string, propId: string, currentValue: string) => {
    setEditingCell({ rowId, propId });
    setEditValue(currentValue);
  };

  const handleCellBlur = async () => {
    if (!editingCell) return;

    const row = sortedRows.find(r => r.id === editingCell.rowId);
    if (!row) return;

    try {
      const values = JSON.parse(row.values);
      values[editingCell.propId] = editValue;

      await fetch(`${API}/databases/rows/${editingCell.rowId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: JSON.stringify(values) }),
      });

      onUpdate();
    } catch (err) {
      console.error('Erro ao atualizar célula:', err);
    }

    setEditingCell(null);
    setEditValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCellBlur();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
      setEditValue('');
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
      console.error('Erro ao adicionar linha:', err);
    }
  };

  const handleDeleteRow = async (rowId: string) => {
    if (!confirm('Excluir este item?')) return;
    try {
      await fetch(`${API}/databases/rows/${rowId}`, { method: 'DELETE' });
      onUpdate();
    } catch (err) {
      console.error('Erro ao excluir linha:', err);
    }
  };

  const renderCellInput = (prop: Property, value: string) => {
    switch (prop.type) {
      case 'checkbox':
        return (
          <input
            type="checkbox"
            checked={value === 'true'}
            onChange={(e) => setEditValue(e.target.checked ? 'true' : 'false')}
            className="w-4 h-4"
          />
        );
      case 'select':
        const options = prop.options ? JSON.parse(prop.options).options || [] : [];
        return (
          <select
            value={value}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleCellBlur}
            className="input w-full text-sm py-1"
            autoFocus
          >
            <option value="">Selecione...</option>
            {options.map((opt: string) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        );
      case 'number':
      case 'currency':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleCellBlur}
            onKeyDown={handleKeyDown}
            className="input w-full text-sm py-1"
            autoFocus
          />
        );
      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleCellBlur}
            onKeyDown={handleKeyDown}
            className="input w-full text-sm py-1"
            autoFocus
          />
        );
      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleCellBlur}
            onKeyDown={handleKeyDown}
            className="input w-full text-sm py-1"
            autoFocus
          />
        );
    }
  };

  return (
    <div className="card hud-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--border-default)] bg-[var(--color-surface-2)]/30">
              {sortedProperties.map(prop => (
                <th
                  key={prop.id}
                  className="text-left px-4 py-3 text-xs font-mono text-[var(--color-text-dim)] tracking-wider"
                >
                  {prop.name}
                  <span className="ml-2 text-[9px] text-[var(--color-text-muted)]">
                    {prop.type}
                  </span>
                </th>
              ))}
              <th className="w-12"></th>
            </tr>
          </thead>
          <tbody>
            {sortedRows.map(row => (
              <tr
                key={row.id}
                className="border-b border-[var(--border-subtle)] hover:bg-[var(--color-surface-2)]/20 transition-colors"
              >
                {sortedProperties.map(prop => {
                  const value = getCellValue(row, prop.id);
                  const isEditing = editingCell?.rowId === row.id && editingCell?.propId === prop.id;

                  return (
                    <td
                      key={prop.id}
                      className="px-4 py-2 text-sm"
                      onClick={() => !isEditing && handleCellClick(row.id, prop.id, value)}
                    >
                      {isEditing ? (
                        renderCellInput(prop, value)
                      ) : (
                        <div className="min-h-[24px] cursor-text hover:bg-[var(--color-surface-2)]/30 rounded px-2 py-1">
                          {prop.type === 'checkbox' ? (
                            <input type="checkbox" checked={value === 'true'} disabled className="w-4 h-4" />
                          ) : prop.type === 'currency' && value ? (
                            <span className="text-[var(--color-success)]">
                              R$ {parseFloat(value).toFixed(2)}
                            </span>
                          ) : value ? (
                            <span className="text-[var(--color-text)]">{value}</span>
                          ) : (
                            <span className="text-[var(--color-text-muted)]">—</span>
                          )}
                        </div>
                      )}
                    </td>
                  );
                })}
                <td className="px-2">
                  <button
                    onClick={() => handleDeleteRow(row.id)}
                    className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add row button */}
      <div className="p-3 border-t border-[var(--border-subtle)]">
        <button
          onClick={handleAddRow}
          className="flex items-center gap-2 text-sm text-[var(--color-text-dim)] hover:text-[var(--color-primary)] transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Adicionar item
        </button>
      </div>
    </div>
  );
}