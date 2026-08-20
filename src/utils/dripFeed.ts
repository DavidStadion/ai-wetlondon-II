/**
 * The swipe feed's name and copy, in one place.
 *
 * It is promoted from the homepage, from the foot of All Activities and from a
 * site-wide prompt, so the name lives here rather than being typed out three
 * times and drifting. Renaming it is this file and nothing else.
 *
 * "Drip Feed" because it is literally a feed and the site is about rain. The
 * runners-up were "The Downpour", which oversells a list of ten, and "Puddle
 * Hop", which ties to the mascot but reads younger than the rest of the voice.
 */
export const DRIP_FEED = {
  name: 'Drip Feed',
  path: '/swipe',
  /** Homepage band. */
  bandTitle: "Can't decide? Let it",
  bandAccent: 'rain.',
  bandBody:
    'One place at a time, full screen, in a downpour. Keep going until one of them sticks.',
  cta: 'Open the Drip Feed',
  /** The site-wide prompt, which has room for far less. */
  promptTitle: 'Still scrolling?',
  promptBody: 'Swipe through them one at a time instead.',
  promptCta: 'Try it',
  promptDismiss: 'Not now',
} as const;
