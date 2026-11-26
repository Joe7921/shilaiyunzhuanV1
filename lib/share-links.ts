// Outbound invitations must work even when the sender opened a private preview.
export const publicSiteOrigin = 'https://shilai-yunzhuan.joe7921.chatgpt.site';

export function shareUrl(kind?: 'recipe' | 'poll', id?: string): string {
  const url = new URL('/', publicSiteOrigin);
  if (kind && id) url.searchParams.set(kind, id);
  return url.href;
}
