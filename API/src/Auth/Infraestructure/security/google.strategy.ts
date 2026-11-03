import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, type Profile, type VerifyCallback } from 'passport-google-oauth20';

export interface OAuthUser {
  provider: 'google' | 'github';
  providerId: string;
  email: string;
  name?: string;
  picture?: string;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID || 'dummy-google-client-id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy-google-client-secret',
      callbackURL:
        process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<OAuthUser> {
    const email = profile.emails?.[0]?.value ?? '';
    const name =
      profile.displayName ||
      `${profile.name?.givenName ?? ''} ${profile.name?.familyName ?? ''}`.trim() ||
      undefined;
    const picture = profile.photos?.[0]?.value;

    const user: OAuthUser = {
      provider: 'google',
      providerId: profile.id,
      email,
      name,
      picture,
    };

    done(null, user);
    return user;
  }
}
