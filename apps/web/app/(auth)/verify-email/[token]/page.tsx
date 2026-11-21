// Server Component — exporta generateStaticParams para output: 'export'
// A lógica client está em VerifyEmailClient.tsx
import VerifyEmailClient from './VerifyEmailClient';

export function generateStaticParams() {
  return [];
}

export default async function VerifyEmailPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <VerifyEmailClient token={token} />;
}