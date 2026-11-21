// Server Component — exporta generateStaticParams para output: 'export'
// A lógica client está em ResetPasswordClient.tsx
import ResetPasswordClient from './ResetPasswordClient';

export function generateStaticParams() {
  return [];
}

export default async function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <ResetPasswordClient token={token} />;
}