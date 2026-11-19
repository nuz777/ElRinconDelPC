export const PROFILE_AVATARS = [
  { id: 'perfil1', src: '/profiles/perfil1.png', label: 'Perfil 1' },
  { id: 'perfil2', src: '/profiles/perfil2.png', label: 'Perfil 2' },
  { id: 'perfil3', src: '/profiles/perfil3.jpg', label: 'Perfil 3' },
  { id: 'perfil4', src: '/profiles/perfil4.png', label: 'Perfil 4' },
  { id: 'perfil5', src: '/profiles/perfil5.png', label: 'Perfil 5' },
  { id: 'perfil6', src: '/profiles/perfil6.png', label: 'Perfil 6' },
] as const;

export type ProfileAvatarId = (typeof PROFILE_AVATARS)[number]['id'];

export const DEFAULT_PROFILE_AVATAR = PROFILE_AVATARS[0].src;

export function isProfileAvatar(src: string | undefined | null): src is string {
  if (!src) return false;
  return PROFILE_AVATARS.some((a) => a.src === src);
}
