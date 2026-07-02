declare const process: {
  env: Record<string, string | undefined>;
  cwd(): string;
  version: string;
  [key: string]: unknown;
};
