'use client';

import { useState } from 'react';

interface CreateDatabaseModalProps {
  onClose: () => void;
  onCreate: (data: {
    title: string;
    icon?: string;
    presetType?: string;
    properties?: { name: string; type: string; options?: string }[];
  }) => void;
}

const PRESETS = [
  {
    type: 'finance',
    title: 'Finanças',
    icon: '💰',
    description: 'Controle de receitas e despesas',
  },
  {
    type: 'shopping',
    title: 'Lista de Compras',
    icon: '🛒',
    description: 'Itens para comprar no mercado',
  },
  {
    type: 'study',
    title: 'Estudos',
    icon: '📚',
    description: 'Organize suas matérias e tópicos',
  },
  {
    type: 'habits',
    title: 'Hábitos',
    icon: '✅',
    description: 'Acompanhe seus hábitos diários',
  },
];

const PROPERTY_TYPES = [
  { value: 'text', label: 'Texto' },
  { value: 'number', label: 'Número' },
  { value: 'currency', label: 'Moeda' },
  { value: 'date', label: 'Data' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'select', label: 'Seleção' },
];

export function CreateDatabaseModal({ onClose, onCreate }: CreateDatabaseModalProps) {
  const [mode, setMode] = useState<'preset' | 'custom'>('preset');
  const [title, setTitle] = useState('');
  const [icon, setIcon] = useState('📊');
  const [properties, setProperties] = useState<{ name: string; type: string }[]>([
    { name: 'Nome', type: 'text' },
  ]);

  const handleAddProperty = () => {
    setProperties([...properties, { name: '', type: 'text' }]);
  };

  const handleRemoveProperty = (index: number) => {
    setProperties(properties.filter((_, i) => i !== index));
  };

  const handleUpdateProperty = (index: number, field: 'name' | 'type', value: string) => {
    const updated = [...properties];
    updated[index][field] = value as any;
    setProperties(updated);
  };

  const handleCreate = () => {
    if (mode === 'preset') {
      // Será definido ao clicar em um preset
      return;
    }

    if (!title.trim()) {
      alert('Por favor, insira um título para o database.');
      return;
    }

    const validProperties = properties.filter(p => p.name.trim());
    if (validProperties.length === 0) {
      alert('Adicione pelo menos uma propriedade.');
      return;
    }

    onCreate({
      title,
      icon,
      properties: validProperties,
    });
  };

  const handlePresetSelect = (presetType: string) => {
    onCreate({
      title: '',
      presetType,
    });
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="card max-w-2xl w-full max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-default)]">
          <h2 className="font-orbitron text-xl font-bold text-[var(--color-text)]">
            Criar Database
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Mode Toggle */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setMode('preset')}
              className={`flex-1 py-3 px-4 rounded-lg border transition-all ${
                mode === 'preset'
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary-subtle)] text-[var(--color-primary)]'
                  : 'border-[var(--border-default)] text-[var(--color-text-dim)] hover:border-[var(--border-strong)]'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
                Usar Preset
              </div>
            </button>
            <button
              onClick={() => setMode('custom')}
              className={`flex-1 py-3 px-4 rounded-lg border transition-all ${
                mode === 'custom'
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary-subtle)] text-[var(--color-primary)]'
                  : 'border-[var(--border-default)] text-[var(--color-text-dim)] hover:border-[var(--border-strong)]'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Criar do Zero
              </div>
            </button>
          </div>

          {mode === 'preset' ? (
            /* Preset Selection */
            <div className="grid grid-cols-2 gap-4">
              {PRESETS.map((preset) => (
                <button
                  key={preset.type}
                  onClick={() => handlePresetSelect(preset.type)}
                  className="card p-5 text-left hover:border-[var(--color-primary)]/50 transition-all group"
                >
                  <div className="text-3xl mb-3">{preset.icon}</div>
                  <h3 className="font-orbitron text-sm font-bold text-[var(--color-text)] mb-1 group-hover:text-[var(--color-primary)] transition-colors">
                    {preset.title}
                  </h3>
                  <p className="text-xs text-[var(--color-text-dim)]">
                    {preset.description}
                  </p>
                </button>
              ))}
            </div>
          ) : (
            /* Custom Creation */
            <div className="space-y-6">
              {/* Title and Icon */}
              <div className="flex gap-4">
                <div className="w-20">
                  <label className="block text-xs font-mono text-[var(--color-text-dim)] mb-2">
                    ÍCONE
                  </label>
                  <input
                    type="text"
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    className="input w-full text-center text-2xl"
                    maxLength={2}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-mono text-[var(--color-text-dim)] mb-2">
                    TÍTULO
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Minhas Finanças"
                    className="input w-full"
                    autoFocus
                  />
                </div>
              </div>

              {/* Properties */}
              <div>
                <label className="block text-xs font-mono text-[var(--color-text-dim)] mb-3">
                  PROPRIEDADES
                </label>
                <div className="space-y-2">
                  {properties.map((prop, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={prop.name}
                        onChange={(e) => handleUpdateProperty(index, 'name', e.target.value)}
                        placeholder="Nome da propriedade"
                        className="input flex-1"
                      />
                      <select
                        value={prop.type}
                        onChange={(e) => handleUpdateProperty(index, 'type', e.target.value)}
                        className="input w-32"
                      >
                        {PROPERTY_TYPES.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                      {properties.length > 1 && (
                        <button
                          onClick={() => handleRemoveProperty(index)}
                          className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-colors"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleAddProperty}
                  className="mt-3 flex items-center gap-2 text-sm text-[var(--color-text-dim)] hover:text-[var(--color-primary)] transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Adicionar propriedade
                </button>
              </div>

              {/* Create Button */}
              <button
                onClick={handleCreate}
                className="btn btn-primary w-full"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Criar Database
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}