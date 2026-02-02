
/**
 * S.I.E PRO - AMBIENT TYPE DEFINITIONS (GLOBAL SRE SCRIPT)
 * Protocolo de Resiliência: Resolve ts(2665), ts(7016)
 * REMOVIDO: export {}, import (Para evitar conflitos de augmentation)
 */

declare module 'react-is';
declare module 'react-dom';
declare module 'react-dom/client';
declare module 'react/jsx-runtime';
declare module 'leaflet';
declare module 'recharts';

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}
