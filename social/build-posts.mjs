/*
 * Instagram posts, 1080 x 1350 (4:5, the tallest portrait the feed allows).
 *
 * SVG rather than PNG so David can open them in Figma, retype a line and export
 * at whatever each platform wants. Newsreader and Archivo are both free on
 * Google Fonts; without them installed these fall back to Georgia and Helvetica
 * and lose most of their character, so install them first.
 *
 * Line breaks are authored by hand rather than wrapped automatically. A joke
 * lands on the break, and no wrapping algorithm knows where the beat is.
 */
import { writeFileSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), 'instagram');
mkdirSync(OUT, { recursive: true });

/*
 * Cleared first. Renaming a post used to leave the old file sitting there, and a
 * stale card in the folder is one you might post by mistake.
 */
for (const f of readdirSync(OUT)) {
  if (f.endsWith('.svg')) rmSync(join(OUT, f));
}

const INK = '#0C0C0D';
const PAPER = '#FFFFFF';
const WET = '#1F43FF';

/* Three grounds, rotated, so a row of nine on the profile grid reads as a set
   rather than as twelve of the same card. */
const THEMES = [
  { name: 'ink',   bg: INK,   fg: PAPER, eye: INK,   rain: 0.16 },
  // Dialled right back on white. Ink-on-paper rain at the same strength as the
  // dark grounds reads as scratches on a scan rather than as weather.
  { name: 'paper', bg: PAPER, fg: INK,   eye: PAPER, rain: 0.09 },
  { name: 'wet',   bg: WET,   fg: PAPER, eye: WET,   rain: 0.20 },
];

/*
 * `cta` is the small line above the domain: what to do, in words that follow on
 * from the joke above it. One tailored line beats the same line twelve times,
 * and the whole point of a set like this is that somebody eventually types the
 * address in.
 */
const POSTS = [
  { slug: 'light-showers', size: 104, cta: '341 indoor places, rated by how wet you’ll get.', lines: ['“Light showers.”', 'The two most', 'optimistic words', 'in the English', 'language.'] },
  { slug: 'too-far-to-go-back', size: 96, cta: 'Know where you’re going before it starts.', lines: ['The rain doesn’t', 'start when you', 'leave. It waits', 'until you’re too', 'far to go back.'] },
  { slug: 'umbrella-negotiation', size: 88, cta: 'Find the places where it stays shut.', lines: ['An umbrella keeps', 'the top of your', 'head dry while the', 'rest of you is', 'negotiated with.'] },
  { slug: 'rainy-disposition', size: 100, cta: 'So there is a whole website about it.', lines: ['London doesn’t', 'have a rainy', 'season. It has a', 'rainy disposition.'] },
  { slug: 'easing-off', size: 116, cta: 'It is not. Find somewhere with a roof.', lines: ['“I think it’s', 'easing off.”', '', 'It is not', 'easing off.'] },
  { slug: 'one-day-in-three', size: 96, cta: '341 places for the one day in three.', lines: ['It rains here one', 'day in three.', 'The other two,', 'it’s thinking', 'about it.'] },
  { slug: 'four-working-umbrellas', size: 92, cta: 'Somewhere indoors, then. 341 of them.', lines: ['There are nine', 'million people in', 'London and four', 'working umbrellas.'] },
  { slug: 'bus-shelter', size: 98, cta: 'Search 341 places with an actual roof.', lines: ['The bus shelter', 'is not a shelter.', 'It’s a suggestion.'] },
  { slug: 'you-can-smell-it', size: 96, cta: 'Or you could do something about it.', lines: ['It’s coming. You', 'can smell it on', 'the pavement.', 'You will do', 'nothing about it.'] },
  { slug: 'nobody-asked', size: 88, cta: 'Every place scored 0% to 100% wet.', lines: ['We rate everywhere', 'by how wet you’ll', 'get on the way.', 'Nobody asked.', 'Somebody had to.'] },
  { slug: 'highest-compliment', size: 128, cta: 'See the other 88 that cost nothing too.', lines: ['0% wet.', '', 'The highest', 'compliment', 'we give.'] },
  { slug: 'nobody-changes-plans', size: 90, cta: 'Be the first. 341 indoor places, rated.', lines: ['Nobody has ever', 'checked the', 'forecast and then', 'changed their', 'plans.'] },
];

/* The mascot, at the scale he sits at here. Same geometry as the site. */
const drop = (fg, eye) => `
  <g transform="translate(96 132) scale(1.55)">
    <path d="M32 4c0 0 18 22.5 18 34.5a18 18 0 0 1-36 0C14 26.5 32 4 32 4Z" fill="${fg}"/>
    <ellipse cx="25.4" cy="39" rx="4.3" ry="5.2" fill="${eye}"/>
    <ellipse cx="38.6" cy="39" rx="4.3" ry="5.2" fill="${eye}"/>
    <circle cx="25.4" cy="39.6" r="2.4" fill="${fg}"/>
    <circle cx="38.6" cy="39.6" r="2.4" fill="${fg}"/>
  </g>`;

/*
 * Rain, different on every post.
 *
 * Seeded from the slug rather than Math.random, so each post has its own
 * pattern but rebuilding gives back the same one. Random art that changes every
 * time you regenerate is not art, it is a diff you cannot review.
 *
 * Angle is constant across the set at 0.11 off vertical, because rain in one
 * frame falls one way and varying it would read as snow. What varies is
 * position, length, weight and opacity: enough that no two posts twin, not
 * enough to look like a different brand.
 */
function seeded(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6D2B79F5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rain = (slug, maxOpacity) => {
  const rnd = seeded(slug);
  const count = 22 + Math.floor(rnd() * 18);
  return Array.from({ length: count }, () => {
    const x1 = Math.round(rnd() * 1400 - 220);
    const y1 = Math.round(rnd() * 1500 - 260);
    const len = 160 + Math.round(rnd() * 560);
    const op = (maxOpacity * (0.35 + rnd() * 0.65)).toFixed(3);
    const w = (1.8 + rnd() * 2.2).toFixed(1);
    return `<line x1="${x1}" y1="${y1}" x2="${Math.round(x1 - len * 0.11)}" y2="${y1 + len}"`
      + ` stroke-opacity="${op}" stroke-width="${w}"/>`;
  }).join('');
};

let made = 0;
POSTS.forEach((post, i) => {
  const t = THEMES[i % THEMES.length];
  const { size } = post;
  const leading = Math.round(size * 1.06);
  // Bottom-anchored block: the last line always sits the same distance above
  // the footer, so the set holds a rhythm whatever the line count.
  const baseline = 1350 - 250 - (post.lines.length - 1) * leading;

  const text = post.lines
    .map((l, n) => l === ''
      ? ''
      : `<text x="96" y="${baseline + n * leading}" font-family="Newsreader, Georgia, serif" font-size="${size}" font-weight="400" fill="${t.fg}" letter-spacing="-0.02em">${l.replace(/&/g, '&amp;')}</text>`)
    .join('\n    ');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
  <rect width="1080" height="1350" fill="${t.bg}"/>
  <g stroke="${t.fg}" stroke-linecap="round">${rain(post.slug, t.rain)}</g>
  ${drop(t.fg, t.eye)}
    ${text}
  <line x1="96" y1="1156" x2="984" y2="1156" stroke="${t.fg}" stroke-opacity="0.22" stroke-width="2"/>
  <text x="96" y="1216" font-family="Archivo, Helvetica, Arial, sans-serif" font-size="34" font-weight="500" fill="${t.fg}" fill-opacity="0.8">${post.cta.replace(/&/g, '&amp;')}</text>
  <text x="96" y="1272" font-family="Archivo, Helvetica, Arial, sans-serif" font-size="27" font-weight="700" letter-spacing="0.16em" fill="${t.fg}">WETLONDON.CO.UK</text>
</svg>
`;
  writeFileSync(join(OUT, `${String(i + 1).padStart(2, '0')}-${post.slug}.svg`), svg);
  made += 1;
  console.log(`  ${String(i + 1).padStart(2, '0')}  ${t.name.padEnd(5)}  ${post.lines.filter(Boolean).join(' ')}`);
});
console.log(`\n  ${made} posts written to social/instagram/`);
