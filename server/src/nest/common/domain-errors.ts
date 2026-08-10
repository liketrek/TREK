/**
 * The two error kinds the trip-shaped domains raise and their controllers map to
 * HTTP. They live here rather than on one service so a second domain (calendar,
 * maps) can raise them without importing the first one just for its error types.
 */
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
