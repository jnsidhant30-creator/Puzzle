import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode: number;
}

export const errorHandler = (
  err: AppError | Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  let message = 'Internal Server Error';

  if ('statusCode' in err) {
    statusCode = err.statusCode;
  }

  if (err.message) {
    message = err.message;
  }

  // Prevent raw stack traces in production
  const isDev = process.env.NODE_ENV !== 'production';

  res.status(statusCode).json({
    success: false,
    message,
    ...(isDev && { stack: err.stack }),
  });
};

export class ApiError extends Error {
  statusCode: number;
  
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}
