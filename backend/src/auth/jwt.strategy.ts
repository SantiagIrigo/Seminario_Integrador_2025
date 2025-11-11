import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>('JWT_SECRET') || 'TU_SECRETO_SUPER_SEGURA',
      ignoreExpiration: false,
    });
  }

  async validate(payload: any) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.log('JWT validate payload:', payload);
    }
    return {
      userId: payload.sub,
      id: payload.sub,
      email: payload.email,
      rol: payload.rol,
    };
  }
}
