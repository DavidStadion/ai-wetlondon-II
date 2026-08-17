/**
 * The raindrop mascot.
 *
 * Lived inline in Layout.tsx until he was wanted in four places. Copying an SVG
 * around is exactly how the two Places APIs and the three collection lists
 * happened, so he is one component now.
 *
 * His classes are global (`wl-drop-*` in global.css) rather than CSS-module
 * scoped, matching `wl-prerender` and `wl-skip-link`. That is deliberate: the
 * header speeds his animations up on hover, and a hashed module class cannot be
 * targeted from a different stylesheet.
 */
export type DropMood = 'default' | 'lost';

export interface DropMarkProps {
  /** Rendered size in px. He is drawn on a 64 unit grid and scales cleanly. */
  size?: number;
  /**
   * `lost` looks down and away and stops glancing about, for the 404 and the
   * empty states. He is not searching for anything, he has given up.
   */
  mood?: DropMood;
  /** Off for decorative placements, so the page is not full of moving parts. */
  animated?: boolean;
  className?: string;
}

export function DropMark({
  size = 50,
  mood = 'default',
  animated = true,
  className,
}: DropMarkProps) {
  const lost = mood === 'lost';

  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      className={['wl-drop', className].filter(Boolean).join(' ')}
    >
      <g className={animated && !lost ? 'wl-drop-hop' : undefined}>
        <path
          d="M32 4c0 0 18 22.5 18 34.5a18 18 0 0 1-36 0C14 26.5 32 4 32 4Z"
          fill="currentColor"
        />
        {/*
          * Whites knocked out of the body, so they read as eyes on any ground.
          * Pupils in currentColor for the same reason: holes within holes, right
          * whatever the drop is set in.
          *
          * The whites default to the page background but can be overridden with
          * --wl-drop-eye. The footer needs that: he is set in translucent white
          * there, so page-white eyes disappear into him completely.
          *
          * Only the pupils move. Sliding the whites would look like the holes
          * were wandering around his head rather than like him looking.
          */}
        <g
          className={animated ? 'wl-drop-eyes' : undefined}
          fill="var(--wl-drop-eye, var(--color-bg))"
        >
          <ellipse cx="25.4" cy="39" rx="4.3" ry="5.2" />
          <ellipse cx="38.6" cy="39" rx="4.3" ry="5.2" />
          <g
            className={animated && !lost ? 'wl-drop-pupils' : undefined}
            fill="currentColor"
          >
            {/* Lost: down and to one side. Both eyes together, because eyes that
                disagree read as a bug rather than an expression. */}
            <circle cx={lost ? 24.2 : 25.4} cy={lost ? 41 : 39.6} r="2.4" />
            <circle cx={lost ? 37.4 : 38.6} cy={lost ? 41 : 39.6} r="2.4" />
          </g>
        </g>
      </g>
    </svg>
  );
}
