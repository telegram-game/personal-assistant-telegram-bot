import {
  Injectable,
  CanActivate,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { NOT_REQUIRE_AUTHENTICATION } from './metadata.constant';
import { AUTHORIZATION } from 'src/constants';
import { JwtService } from '@nestjs/jwt';
import { BusinessException } from 'src/exceptions';
import { HttpStatusCode } from 'axios';
import { ERROR_CODES, getErorrMessage } from 'src/constants/errors';
import { Logger } from 'src/modules/loggers';
import { ConfigService } from '@nestjs/config';

export const NotRequireAuthentication = () =>
  SetMetadata(NOT_REQUIRE_AUTHENTICATION, true);

interface AuthPayload {
  uniqueDeviceId: string;
  iat: number;
  exp: number;
  iss: number;
  sub: string;
}

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger: Logger = new Logger(AuthGuard.name);
  private readonly ignoreAuthGuard: boolean;
  private readonly jwtAccesstokenPublicKey: string;
  constructor(
    private reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.ignoreAuthGuard = this.configService.get<boolean>('ignoreAuthGuard');
    this.jwtAccesstokenPublicKey = this.configService.get<string>(
      'jwtAccesstokenPublicKey',
    );
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (this.ignoreAuthGuard) {
      return true;
    }

    const handler = context.getHandler();
    const isNotRequireAuth = this.reflector.getAllAndOverride<boolean>(
      NOT_REQUIRE_AUTHENTICATION,
      [handler, context.getClass()],
    );

    if (isNotRequireAuth) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const accessToken =
      request.header(AUTHORIZATION) ||
      request.header(AUTHORIZATION.toUpperCase());
    if (accessToken) {
      try {
        const token = accessToken.split(' ')[1];

        await this.jwtService.verifyAsync<AuthPayload>(token, {
          publicKey: this.jwtAccesstokenPublicKey,
        });
        return true;
      } catch (error) {
        this.logger.warn('Error verifying token', error);
      }
    }

    throw new BusinessException({
      status: HttpStatusCode.Unauthorized as number,
      errorCode: ERROR_CODES.INVALID_TOKEN,
      errorMessage: getErorrMessage(ERROR_CODES.INVALID_TOKEN),
    });
  }
}
