export class BasisTheoryApiError extends Error {
  public readonly status: number;
  public readonly data?: unknown;

  public constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'BasisTheoryApiError';
    this.status = status;
    this.data = data;
  }
}

export class BasisTheoryValidationError extends Error {
  public readonly errors: unknown;
  public readonly validation: unknown[];

  public constructor(message: string, errors: unknown, validation: unknown[]) {
    super(message);
    this.name = 'BasisTheoryValidationError';
    this.errors = errors;
    this.validation = validation;
  }
}
