export const ALLOWED_PROFILE_AVATARS = [
  '/profiles/perfil1.png',
  '/profiles/perfil2.png',
  '/profiles/perfil3.jpg',
  '/profiles/perfil4.png',
  '/profiles/perfil5.png',
  '/profiles/perfil6.png',
] as const;

export type AllowedProfileAvatar = (typeof ALLOWED_PROFILE_AVATARS)[number];
