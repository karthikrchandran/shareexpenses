export function createJoinToken(randomUUID?: () => string): string;
export function validateJoinToken(token: unknown): string;
export function buildJoinUrl(options: { appUrl?: string; token: string }): string;
