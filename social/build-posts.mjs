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
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), 'instagram');
mkdirSync(OUT, { recursive: true });

const INK = '#0C0C0D';
const PAPER = '#FFFFFF';
const WET = '#1F43FF';

/* Three grounds, rotated, so a row of nine on the profile grid reads as a set
   rather than as twelve of the same card. */
const THEMES = [
  { name: 'ink',   bg: INK,   fg: PAPER, eye: INK },
  { name: 'paper', bg: PAPER, fg: INK,   eye: PAPER },
  { name: 'wet',   bg: WET,   fg: PAPER, eye: WET },
];

const POSTS = [
  { slug: 'light-showers', size: 104, lines: ['“Light showers.”', 'The two most', 'optimistic words', 'in the English', 'language.'] },
  { slug: 'too-far-to-go-back', size: 96, lines: ['The rain doesn’t', 'start when you', 'leave. It waits', 'until you’re too', 'far to go back.'] },
  { slug: 'umbrella-negotiation', size: 88, lines: ['An umbrella keeps', 'the top of your', 'head dry while the', 'rest of you is', 'negotiated with.'] },
  { slug: 'rainy-disposition', size: 100, lines: ['London doesn’t', 'have a rainy', 'season. It has a', 'rainy disposition.'] },
  { slug: 'easing-off', size: 116, lines: ['“I think it’s', 'easing off.”', '', 'It is not', 'easing off.'] },
  { slug: 'one-day-in-three', size: 96, lines: ['It rains here one', 'day in three.', 'The other two,', 'it’s thinking', 'about it.'] },
  { slug: 'four-working-umbrellas', size: 92, lines: ['There are nine', 'million people in', 'London and four', 'working umbrellas.'] },
  { slug: 'bus-shelter', size: 98, lines: ['The bus shelter', 'is not a shelter.', 'It’s a suggestion.'] },
  { slug: 'you-can-smell-it', size: 96, lines: ['It’s coming. You', 'can smell it on', 'the pavement.', 'You will do', 'nothing about it.'] },
  { slug: 'nobody-asked', size: 88, lines: ['We rate everywhere', 'by how wet you’ll', 'get on the way.', 'Nobody asked.', 'Somebody had to.'] },
  { slug: 'highest-compliment', size: 128, lines: ['0% wet.', '', 'The highest', 'compliment', 'we give.'] },
  { slug: 'forty-minutes', size: 96, lines: ['Rain in forty', 'minutes. You have', 'forty minutes to', 'make better', 'choices.'] },
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

/* Diagonal rain, only on the two dark grounds: on white it reads as scratches. */
const rain = (fg) => Array.from({ length: 26 }, (_, i) => {
  const x = i * 52 - 120;
  return `<line x1="${x}" y1="-40" x2="${x - 150}" y2="1400"/>`;
}).join('');

let made = 0;
POSTS.forEach((post, i) => {
  const t = THEMES[i % THEMES.length];
  const { size } = post;
  const leading = Math.round(size * 1.06);
  // Bottom-anchored block: the last line always sits the same distance above
  // the footer, so the set holds a rhythm whatever the line count.
  const baseline = 1350 - 190 - (post.lines.length - 1) * leading;

  const text = post.lines
    .map((l, n) => l === ''
      ? ''
      : `<text x="96" y="${baseline + n * leading}" font-family="Newsreader, Georgia, serif" font-size="${size}" font-weight="400" fill="${t.fg}" letter-spacing="-0.02em">${l.replace(/&/g, '&amp;')}</text>`)
    .join('\n    ');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
  <rect width="1080" height="1350" fill="${t.bg}"/>
  ${t.name === 'paper' ? '' : `<g stroke="${t.fg}" stroke-opacity="0.10" stroke-width="3">${rain(t.fg)}</g>`}
  ${drop(t.fg, t.eye)}
    ${text}
  <text x="96" y="1268" font-family="Archivo, Helvetica, Arial, sans-serif" font-size="26" font-weight="700" letter-spacing="0.16em" fill="${t.fg}" fill-opacity="0.55">WETLONDON.CO.UK</text>
</svg>
`;
  writeFileSync(join(OUT, `${String(i + 1).padStart(2, '0')}-${post.slug}.svg`), svg);
  made += 1;
  console.log(`  ${String(i + 1).padStart(2, '0')}  ${t.name.padEnd(5)}  ${post.lines.filter(Boolean).join(' ')}`);
});
console.log(`\n  ${made} posts written to social/instagram/`);
