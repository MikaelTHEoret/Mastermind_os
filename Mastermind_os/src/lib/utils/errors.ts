export class AppError extends Error {
  constructor(
    message: string,
    public source: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }

  static fromUnknown(error: unknown, source: string): AppError {
    if (error instanceof AppError) {
      return error;
    }
    
    const message = error instanceof Error ? error.message : String(error);
    return new AppError(message, source, error);
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
