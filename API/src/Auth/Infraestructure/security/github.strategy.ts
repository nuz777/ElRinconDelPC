import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, type Profile } from 'passport-github2';
import type { OAuthUser } from './google.strategy.js';

@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor() {
    super({
      clientID: process.env.GITHUB_CLIENT_ID || 'dummy-github-client-id',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || 'dummy-github-client-secret',
      callbackURL:
        process.env.GITHUB_CALLBACK_URL || 'http://localhost:3000/auth/github/callback',
      scope: ['user:email'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: (err: Error | null, user?: OAuthUser) => void,
  ): Promise<OAuthUser> {
    const email =
      profile.emails?.[0]?.value ||
      (profile.username
        ? `${profile.username}@users.noreply.github.com`
        : `${profile.id}@users.noreply.github.com`);

    const name = profile.displayName || profile.username || undefined;
    const picture = profile.photos?.[0]?.value;

    const user: OAuthUser = {
      provider: 'github',
      providerId: profile.id,
      email,
      name,
      picture,
    };

    done(null, user);
    return user;
  }
}
