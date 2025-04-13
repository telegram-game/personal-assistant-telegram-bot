import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  ForbiddenException,
  HttpException,
  Inject,
  UnauthorizedException,
} from '@nestjs/common';
import { Injectable } from '@nestjs/common/decorators/core';
import { Request, Response } from 'express';
import { first } from 'lodash';
import {
  CID_HEADER_KEY,
  CONTENT_TYPE_HEADER_KEY,
  MODULE_OPTIONS_TOKEN,
} from 'src/constants';
import { ERROR_CODES, ERROR_MESSAGES } from 'src/constants/errors';
import { BusinessException } from 'src/exceptions';
import { ConfigModuleOptions, InvalidParam } from 'src/interfaces';
import { ErrorResponse } from 'src/models';
import { formatMilliseconds } from 'src/utils';

type ExceptionResponse =
  | {
      data?: unknown;
      statusCode: number;
      message: string | string[];
      error: string;
    }
  | string;
@Catch()
@Injectable()
export class CoreExceptionFilter implements ExceptionFilter {
  constructor(
    @Inject(MODULE_OPTIONS_TOKEN)
    private readonly registerOption: ConfigModuleOptions,
  ) {}

  /**
   * Handles exceptions thrown in the NestJS application and returns an appropriate error response.
   * @param exception - The exception object that was thrown.
   * @param host - The host object that contains the request and response objects.
   */
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { errorMessage, errorCode, invalidParams } =
      this.getErrorDetails(exception);

    this.setResponseStatus(response, exception, errorCode);

    // const errorTitle = this.getErrorTitle(errorCode, request);
    // const errorDetail = this.getErrorDetail(errorCode, errorMessage, request);
    const errorTitle = errorCode;
    const errorDetail =
      errorCode === 'INTERNAL_SERVER_ERROR'
        ? 'Internal server error'
        : errorMessage;

    const errorResponse = new ErrorResponse({
      timestamp: request.context?.requestTimestamp,
      responseTime: this.calculateResponseTime(
        request.context?.requestTimestamp,
      ),
      detail: errorDetail ?? this.getErrorMessage(exception),
      title: errorTitle,
      errorCode,
      instance: request.url,
      status: response.statusCode,
      invalidParams,
    });

    this.setResponseHeaders(response, request);
    response.json(errorResponse);

    return errorResponse;
  }

  private getErrorDetails(exception: any) {
    let errorMessage: string;
    let errorCode: string;
    let invalidParams: InvalidParam[] | undefined;

    switch (true) {
      case exception instanceof BusinessException: {
        errorCode = exception.errorCode;
        errorMessage = exception.errorMessage;
        invalidParams = exception.invalidParams;
        break;
      }
      case exception instanceof BadRequestException: {
        const badRequestException = this.handleBadRequestException(exception);
        errorCode = badRequestException.errorCode;
        errorMessage = badRequestException.errorMessage;
        invalidParams = badRequestException.invalidParams;
        break;
      }
      case exception instanceof ForbiddenException: {
        const forbiddenException = this.handleForbiddenException();
        errorCode = forbiddenException.errorCode;
        errorMessage = forbiddenException.errorMessage;
        break;
      }
      case exception instanceof UnauthorizedException: {
        errorCode = ERROR_CODES.UNAUTHORIZED;
        errorMessage = ERROR_MESSAGES[ERROR_CODES.UNAUTHORIZED];
        break;
      }
      case exception instanceof HttpException: {
        const httpException = this.handleHttpException(exception);
        errorMessage = httpException.errorMessage;
        break;
      }
      default: {
        errorCode = this.handlePrismaOrUnknowException(exception);
        break;
      }
    }

    return { errorMessage, errorCode, invalidParams };
  }

  private handleBadRequestException(exception: BadRequestException) {
    const message = (exception.getResponse() as any).message;
    let invalidParams: InvalidParam[] | undefined;

    if (message && Array.isArray(message)) {
      invalidParams = message.map((msg) => ({
        name: first(msg.split(' ')),
        reason: msg,
      }));
    }

    return {
      errorCode: ERROR_CODES.INVALID_REQUEST,
      errorMessage: ERROR_MESSAGES[ERROR_CODES.INVALID_REQUEST],
      invalidParams,
    };
  }

  private handleForbiddenException() {
    return {
      errorCode: ERROR_CODES.FORBIDDEN,
      errorMessage: ERROR_MESSAGES[ERROR_CODES.FORBIDDEN],
    };
  }

  private handleHttpException(exception: HttpException) {
    const exceptionResponse = exception.getResponse() as ExceptionResponse;
    let errorMessage: string;

    if (typeof exceptionResponse === 'object') {
      errorMessage = Array.isArray(exceptionResponse.message)
        ? first(exceptionResponse.message)
        : exceptionResponse.message;
    } else {
      errorMessage = exceptionResponse;
    }

    return { errorMessage };
  }

  private handlePrismaOrUnknowException(exception: any) {
    return exception.code === 'P2025' ? 'NOT_FOUND' : 'INTERNAL_SERVER_ERROR';
  }

  private setResponseStatus(
    response: Response,
    exception: HttpException,
    errorCode: string,
  ) {
    if (errorCode === ERROR_CODES.INVALID_REQUEST) response.status(400);
    else if (exception instanceof BusinessException) {
      const businessException: BusinessException = exception;
      response.status(businessException.status);
    } else if (errorCode === ERROR_CODES.NOT_FOUND) response.status(404);
    else if (errorCode === ERROR_CODES.FORBIDDEN) response.status(403);
    else if (errorCode === ERROR_CODES.UNAUTHORIZED) response.status(401);
    else if (exception instanceof HttpException)
      response.status(exception.getStatus());
    else response.status(500);
  }

  private setResponseHeaders(response: Response, request: Request) {
    response.header(CID_HEADER_KEY, request.context?.cid || '');
    response.header(CONTENT_TYPE_HEADER_KEY, 'application/problem+json');
  }

  /**
   * Gets the error message based on the environment and the exception's stack or message.
   * @param exception - The exception object.
   * @returns The error message.
   */
  private getErrorMessage(exception: HttpException): string {
    if (this.registerOption.env === 'development') {
      return exception?.stack ?? exception?.message ?? 'Internal Server Error';
    } else {
      return exception?.message;
    }
  }

  /**
   * Calculates the response time based on the given timestamp.
   * @param timestamp - The timestamp of the request.
   * @returns The formatted response time.
   */
  private calculateResponseTime(timestamp: number): string {
    const responseTime = new Date().getTime() - timestamp;
    return formatMilliseconds(responseTime);
  }
}
