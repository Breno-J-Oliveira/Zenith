// Server Component — exporta generateStaticParams para output: 'export'
// A lógica client está em ResetPasswordClient.tsx
import ResetPasswordClient from './ResetPasswordClient';

export function generateStaticParams() {
  return [];
}

export default function ResetPasswordPage({ params }: { params: { token: string } }) {
  return <ResetPasswordClient token={params.token} />;
}