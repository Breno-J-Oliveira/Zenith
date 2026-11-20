// Server Component — exporta generateStaticParams para output: 'export'
// A lógica client está em VerifyEmailClient.tsx
import VerifyEmailClient from './VerifyEmailClient';

export function generateStaticParams() {
  return [];
}

export default function VerifyEmailPage({ params }: { params: { token: string } }) {
  return <VerifyEmailClient token={params.token} />;
}