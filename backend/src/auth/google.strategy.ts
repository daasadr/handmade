import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';
import { AuthService } from './auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private authService: AuthService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID ?? 'MISSING',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? 'MISSING',
      callbackURL:
        process.env.GOOGLE_CALLBACK_URL ||
        'http://localhost:3001/api/auth/google/callback',
      scope: ['email', 'profile'],
      // JWT app has no server-side sessions — state CSRF check would
      // always fail on the first attempt because Passport can't store
      // the generated state anywhere between the two redirects.
      state: false,
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: any,
    done: any,
  ) {
    const email: string = profile.emails?.[0]?.value ?? '';
    const result = await this.authService.loginOrRegisterWithGoogle(
      profile.id as string,
      email,
    );
    done(null, result);
  }
}
