'use client';

import { useState, useRef } from 'react';

interface FileUploadProps {
  onUpload: (file: File) => void;
  accept?: string;
  maxSize?: number; // em MB
  label?: string;
  multiple?: boolean;
  preview?: boolean;
}

export function FileUpload({ 
  onUpload, 
  accept = 'image/*', 
  maxSize = 5, 
  label = 'Enviar arquivo',
  multiple = false,
  preview = true
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [previews, setPreviews] = useState<{ file: File; url: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateFile = (file: File): boolean => {
    setError(null);

    // Validar tamanho
    if (file.size > maxSize * 1024 * 1024) {
      setError(`Arquivo muito grande. Máximo: ${maxSize}MB`);
      return false;
    }

    // Validar tipo
    if (accept && !file.type.match(accept.replace('*', '.*'))) {
      setError('Tipo de arquivo não suportado');
      return false;
    }

    return true;
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    await processFiles(files);
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    await processFiles(files);
  };

  const processFiles = async (files: File[]) => {
    const validFiles = files.filter(validateFile);
    
    if (validFiles.length === 0) return;

    setUploading(true);

    const newPreviews: { file: File; url: string }[] = [];
    
    for (const file of validFiles) {
      // Gerar preview para imagens
      if (preview && file.type.startsWith('image/')) {
        const url = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        });
        newPreviews.push({ file, url });
      } else {
        newPreviews.push({ file, url: '' });
      }

      // Chamar callback de upload
      onUpload(file);
    }

    if (multiple) {
      setPreviews(prev => [...prev, ...newPreviews]);
    } else {
      setPreviews(newPreviews.slice(0, 1));
    }

    setUploading(false);
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const removePreview = (index: number) => {
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    setPreviews([]);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (type: string): string => {
    if (type.startsWith('image/')) return '🖼️';
    if (type.startsWith('video/')) return '🎥';
    if (type.startsWith('audio/')) return '🎵';
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('sheet') || type.includes('excel')) return '📊';
    return '📎';
  };

  return (
    <div className="w-full space-y-3">
      {/* Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
          ${dragActive
            ? 'border-[var(--color-primary)] bg-[var(--color-primary-subtle)] scale-[1.02]'
            : 'border-[var(--border-default)] hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-surface-2)]/30'
          }
          ${uploading ? 'pointer-events-none opacity-60' : ''}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          multiple={multiple}
          className="hidden"
        />

        {uploading ? (
          <div className="space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full border-2 border-[var(--color-surface-2)] border-t-[var(--color-primary)] animate-spin" />
            <p className="text-sm text-[var(--color-text-dim)]">Enviando arquivo...</p>
          </div>
        ) : previews.length > 0 && !multiple ? (
          // Single preview
          <div className="relative inline-block">
            {previews[0].url ? (
              <img
                src={previews[0].url}
                alt="Preview"
                className="max-w-full max-h-48 rounded-lg shadow-md"
              />
            ) : (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-[var(--color-surface-2)]/50">
                <span className="text-3xl">{getFileIcon(previews[0].file.type)}</span>
                <div className="text-left">
                  <p className="text-sm font-medium text-[var(--color-text)] truncate max-w-[200px]">
                    {previews[0].file.name}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {formatFileSize(previews[0].file.size)}
                  </p>
                </div>
              </div>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                removePreview(0);
              }}
              className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-[var(--color-danger)] text-white flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        ) : (
          // Empty state
          <div className="space-y-3">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[var(--color-surface-2)] to-[var(--color-surface-3)] flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-dim)" strokeWidth="1.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--color-text)]">{label}</p>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                Arraste e solte ou clique para selecionar
              </p>
              <div className="flex items-center justify-center gap-3 mt-3 text-[10px] text-[var(--color-text-muted)]">
                <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[var(--color-surface-2)]/50">
                  📏 Máx: {maxSize}MB
                </span>
                {accept && (
                  <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[var(--color-surface-2)]/50">
                    📁 {accept.replace('/*', '').replace('image', 'Imagens')}
                  </span>
                )}
                {multiple && (
                  <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[var(--color-surface-2)]/50">
                    📚 Múltiplos
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Multiple previews */}
      {multiple && previews.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-mono text-[var(--color-text-muted)] uppercase tracking-wider">
              Arquivos selecionados ({previews.length})
            </p>
            <button
              onClick={clearAll}
              className="text-xs text-[var(--color-text-dim)] hover:text-[var(--color-danger)] transition-colors"
            >
              Limpar todos
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {previews.map((item, index) => (
              <div
                key={index}
                className="relative group rounded-lg overflow-hidden bg-[var(--color-surface-2)]/30 border border-[var(--border-subtle)]"
              >
                {item.url ? (
                  <img
                    src={item.url}
                    alt={item.file.name}
                    className="w-full h-24 object-cover"
                  />
                ) : (
                  <div className="w-full h-24 flex items-center justify-center">
                    <span className="text-3xl">{getFileIcon(item.file.type)}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    onClick={() => removePreview(index)}
                    className="w-8 h-8 rounded-full bg-[var(--color-danger)] text-white flex items-center justify-center hover:scale-110 transition-transform"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
                <div className="p-2">
                  <p className="text-xs text-[var(--color-text)] truncate">{item.file.name}</p>
                  <p className="text-[10px] text-[var(--color-text-muted)]">{formatFileSize(item.file.size)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--color-danger-glow)] border border-[var(--color-danger)]/30">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <p className="text-xs text-[var(--color-danger)]">{error}</p>
        </div>
      )}
    </div>
  );
}