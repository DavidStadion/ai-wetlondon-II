import { showToast } from '@/signals/uiSignals';

/**
 * Share a link, or copy it where sharing is not on offer.
 *
 * navigator.share is the whole point on a phone: one tap into WhatsApp or
 * Messages, which is how anyone actually sends a friend a thing to do. Desktop
 * browsers largely do not have it, so those fall back to the clipboard.
 *
 * Note there are two other hand-rolled copies of this in the codebase, in
 * ShareModal and ActivityModal. Both work, so neither is touched here.
 */
export async function shareLink(opts: {
  title: string;
  text: string;
  /** Path or absolute URL. Paths are resolved against the current origin. */
  url: string;
}): Promise<void> {
  const url = opts.url.startsWith('http')
    ? opts.url
    : `${window.location.origin}${opts.url}`;

  if (navigator.share) {
    try {
      await navigator.share({ title: opts.title, text: opts.text, url });
      return;
    } catch {
      /*
       * Cancelling the share sheet rejects, and it is not an error: falling
       * through to the clipboard here would copy a link the person just decided
       * not to send. Nothing to report, so say nothing.
       */
      return;
    }
  }

  try {
    await navigator.clipboard.writeText(url);
    showToast('Link copied to clipboard', 'success');
  } catch {
    showToast('Could not copy that link', 'error');
  }
}
