import { BookOpen, Database, ListChecks, ShoppingCart, Wallet, type LucideIcon } from 'lucide-react';

const PRESET_ICONS = new Map<string, { legacy: string; icon: LucideIcon }>([
  ['finance', { legacy: '💰', icon: Wallet }],
  ['shopping', { legacy: '🛒', icon: ShoppingCart }],
  ['study', { legacy: '📚', icon: BookOpen }],
  ['habits', { legacy: '✅', icon: ListChecks }],
]);

export function DatabaseIcon({ icon, presetType, className }: {
  icon?: string | null;
  presetType?: string | null;
  className: string;
}) {
  const preset = presetType ? PRESET_ICONS.get(presetType) : undefined;
  if (icon && icon !== preset?.legacy) {
    return <span aria-hidden="true" className={`inline-flex items-center justify-center ${className}`}>{icon}</span>;
  }

  const Icon = preset?.icon ?? Database;
  return <Icon aria-hidden="true" className={className} />;
}
