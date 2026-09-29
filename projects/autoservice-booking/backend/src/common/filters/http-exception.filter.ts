import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();
    const isHttp = exception instanceof HttpException;
    const status = isHttp ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const payload = isHttp ? exception.getResponse() : null;
    const details = typeof payload === 'string' ? { message: payload } : payload;
    if (!isHttp) console.error(exception);
    response.status(status).json({
      statusCode: status,
      error: HttpStatus[status],
      ...(typeof details === 'object' && details ? details : {}),
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
