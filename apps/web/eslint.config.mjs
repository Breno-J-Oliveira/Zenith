import nextVitals from 'eslint-config-next/core-web-vitals';

export default [
  ...nextVitals,
  { ignores: ['.next/**', '.next-zenith-test/**', 'next-env.d.ts', 'src-tauri/**'] },
];
