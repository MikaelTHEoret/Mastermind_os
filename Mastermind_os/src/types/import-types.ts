export type ImportGlobFunction = (pattern: string | string[]) => Promise<Record<string, () => Promise<any>>>;
