// Server Component — exporta generateStaticParams para output: 'export'
// A lógica client está em PageEditorClient.tsx
import PageEditorClient from './PageEditorClient';

export function generateStaticParams() {
  return [];
}

export default async function PageEditor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PageEditorClient id={id} />;
}