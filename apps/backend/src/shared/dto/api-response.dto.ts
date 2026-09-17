/** Standard success envelope. Errors use the shape from AllExceptionsFilter. */
export class ApiResponse<T> {
  success = true;
  constructor(
    public data: T,
    public meta?: Record<string, unknown>,
  ) {}
  static ok<T>(data: T, meta?: Record<string, unknown>): ApiResponse<T> {
    return new ApiResponse(data, meta);
  }
}
