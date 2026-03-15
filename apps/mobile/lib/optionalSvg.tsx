import type { ComponentType, ReactNode } from 'react';

interface BaseSvgProps {
  children?: ReactNode;
  [key: string]: unknown;
}

interface SvgModule {
  default: ComponentType<BaseSvgProps>;
  Path: ComponentType<BaseSvgProps>;
  Circle: ComponentType<BaseSvgProps>;
  Polyline: ComponentType<BaseSvgProps>;
}

let cachedSvgModule: SvgModule | null | undefined;

export function getOptionalSvgModule(): SvgModule | null {
  if (cachedSvgModule !== undefined) {
    return cachedSvgModule;
  }

  try {
    cachedSvgModule = require('react-native-svg') as SvgModule;
  } catch (error) {
    console.warn('[mobile] react-native-svg native module is unavailable; falling back to non-SVG UI.', error);
    cachedSvgModule = null;
  }

  return cachedSvgModule;
}
