import nextVitals from 'eslint-config-next/core-web-vitals';

export default [
  ...nextVitals,
  {
    // A migração mantém visíveis os novos diagnósticos do compilador React.
    // Os fluxos assíncronos existentes serão revisados em uma mudança própria.
    rules: {
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/immutability': 'warn',
    },
  },
  { ignores: ['.next/**', '.next-zenith-test/**', 'next-env.d.ts', 'src-tauri/**'] },
];
