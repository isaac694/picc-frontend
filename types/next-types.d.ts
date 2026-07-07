declare module 'next' {
  export type Metadata = any;
  export type Viewport = any;
}

declare module 'next/headers' {
  // preserve any exports used by the app; fallback to `any` types
  export const cookies: any;
  export const headers: any;
}
