// Server Component — exporta generateStaticParams para output: 'export'
// A lógica client está em PageEditorClient.tsx
import PageEditorClient from './PageEditorClient';

export function generateStaticParams() {
  return [];
}

export default function PageEditor({ params }: { params: { id: string } }) {
  return <PageEditorClient id={params.id} />;
}