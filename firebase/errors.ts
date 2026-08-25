export enum ErrorCode {
  AUTH_REQUIRED = 'AUTH_REQUIRED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  ROOM_UNAVAILABLE = 'ROOM_UNAVAILABLE',
  BOOKING_FAILED = 'BOOKING_FAILED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  PAYMENT_VERIFICATION_FAILED = 'PAYMENT_VERIFICATION_FAILED',
  REFUND_FAILED = 'REFUND_FAILED',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR'
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: Record<string, any>;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number = 400,
    details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class AuthRequiredError extends AppError {
  constructor(message: string = 'Authentication is required to perform this action.') {
    super(ErrorCode.AUTH_REQUIRED, message, 401);
  }
}

export class PermissionDeniedError extends AppError {
  constructor(message: string = 'You do not have permission to perform this action.') {
    super(ErrorCode.PERMISSION_DENIED, message, 403);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(ErrorCode.VALIDATION_ERROR, message, 400, details);
  }
}

export class NotFoundError extends AppError {
  constructor(entity: string = 'Resource') {
    super(ErrorCode.NOT_FOUND, `${entity} was not found.`, 404);
  }
}

export class RoomUnavailableError extends AppError {
  constructor(message: string = 'Selected room is not available for the requested dates.') {
    super(ErrorCode.ROOM_UNAVAILABLE, message, 409);
  }
}

export class BookingFailedError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(ErrorCode.BOOKING_FAILED, message, 400, details);
  }
}

export class PaymentFailedError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(ErrorCode.PAYMENT_FAILED, message, 400, details);
  }
}

export class PaymentVerificationFailedError extends AppError {
  constructor(message: string = 'Payment signature verification failed.') {
    super(ErrorCode.PAYMENT_VERIFICATION_FAILED, message, 400);
  }
}

export class RefundFailedError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(ErrorCode.REFUND_FAILED, message, 400, details);
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'An unexpected internal server error occurred.') {
    super(ErrorCode.INTERNAL_SERVER_ERROR, message, 500);
  }
}

/**
 * Format error safely for client response (stripping sensitive internal details)
 */
export function formatErrorForClient(error: unknown): { code: string; message: string; details?: any } {
  if (error instanceof AppError) {
    return {
      code: error.code,
      message: error.message,
      ...(error.details ? { details: error.details } : {})
    };
  }

  // Handle generic error
  return {
    code: ErrorCode.INTERNAL_SERVER_ERROR,
    message: 'An unexpected backend error occurred.'
  };
}
