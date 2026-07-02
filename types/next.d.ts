declare module 'next' {
  export type NextConfig = Record<string, any>;
}

declare module 'next/config' {
  export function defineConfig(config: any): any;
}
