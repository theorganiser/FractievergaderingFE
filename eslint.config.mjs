import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

const config = [
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Nieuwe React 19-regels: bestaande code laadt data in effects en navigeert na inloggen
      // bewust met een volledige page load. Als waarschuwing laten staan, niet blokkerend.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/immutability': 'warn',
      'react/no-unescaped-entities': 'off',
      '@next/next/no-location-assign-relative-destination': 'off',
    },
  },
  { ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts'] },
]

export default config
