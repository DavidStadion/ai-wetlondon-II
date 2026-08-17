import { useEffect } from 'preact/hooks';
import { signal } from '@preact/signals';
import { route } from 'preact-router';
import { setPageMeta, resetPageMeta } from '@/utils/meta';
import { useImageLoader } from '@/hooks/useImageLoader';
import { ClubBand } from '@/components/ClubBand';
import { BackToTop } from '@/components/common/BackToTop';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Button } from '@/components/common/Button';
import type { Article, RouteProps } from '@/types';
import styles from './ArticlesPage.module.css';

/**
 * Articles come from public/data/articles.json, built from markdown at build
 * time. Loaded once and held here, so moving between the index and a piece does
 * not refetch. The prerendered HTML already carries the words for anything that
 * does not run JavaScript.
 */
const articles = signal<Article[]>([]);
const isLoading = signal(true);

async function loadArticles() {
  if (articles.value.length > 0) {
    isLoading.value = false;
    return;
  }
  isLoading.value = true;
  try {
    const res = await fetch('/data/articles.json');
    if (!res.ok) throw new Error(String(res.status));
    articles.value = await res.json();
  } catch {
    // the empty state covers it
  } finally {
    isLoading.value = false;
  }
}

function useArticles(dep: unknown) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    loadArticles();
  }, [dep]);
}

/** 2026-08-12 becomes 12 August 2026. */
function formatDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  });
}

/* ── Index ─────────────────────────────────────────────────────────── */

function ArticleCard({ article, feature }: { article: Article; feature?: boolean }) {
  const { src } = useImageLoader(article.lead ?? '', [], article.title);

  return (
    <a
      className={[styles.card, feature && styles.cardFeature].filter(Boolean).join(' ')}
      href={`/blog/${article.slug}`}
    >
      <span className={styles.cardImage} style={{ backgroundImage: `url(${src})` }} aria-hidden="true" />
      <span className={styles.cardBody}>
        <span className={styles.cardMeta}>
          {formatDate(article.date)} · {article.readingMinutes} min read
        </span>
        <span className={styles.cardTitle}>{article.title}</span>
        <span className={styles.cardDek}>{article.dek}</span>
      </span>
    </a>
  );
}

/**
 * The archive row.
 *
 * The index was one uniform grid of identical picture cards, which read as
 * repetitive by about the sixth piece and would only get worse as the blog
 * grows. Everything past the first three is a text row instead: no image, a
 * number, and the dek doing the selling. It gives the eye somewhere to rest
 * after two rows of photographs, and it scales to fifty articles without
 * turning the page into a mile of tiles.
 */
function ArticleRow({ article, n }: { article: Article; n: number }) {
  const { src } = useImageLoader(article.lead ?? '', [], article.title);

  return (
    <li>
      <a className={styles.row} href={`/blog/${article.slug}`}>
        <span className={styles.rowNum} aria-hidden="true">{String(n).padStart(2, '0')}</span>
        <span
          className={styles.rowThumb}
          style={{ backgroundImage: `url(${src})` }}
          aria-hidden="true"
        />
        <span className={styles.rowMain}>
          <span className={styles.rowTitle}>{article.title}</span>
          <span className={styles.rowDek}>{article.dek}</span>
        </span>
        <span className={styles.rowMeta}>
          <time dateTime={article.date}>{formatDate(article.date)}</time>
          <span className={styles.rowMins}>{article.readingMinutes} min</span>
        </span>
      </a>
    </li>
  );
}

export function ArticlesPage(_props: RouteProps) {
  useArticles('index');

  useEffect(() => {
    setPageMeta({
      title: 'Blog | Wet London',
      description:
        'Longer pieces about indoor London: where to go when it is pouring, what is worth the money, and the places most people walk straight past.',
      path: '/blog',
    });
    return resetPageMeta;
  }, []);

  const list = articles.value;

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <h1 className={styles.title}>Blog</h1>
        <p className={styles.tagline}>
          Longer pieces about indoor London. Where to go when it is pouring, what is
          worth the money, and the places most people walk straight past.
        </p>
      </header>

      <section className={styles.container}>
        {isLoading.value && <LoadingSpinner text="Loading..." />}

        {!isLoading.value && list.length > 0 && (
          <>
            <ArticleCard article={list[0]} feature />

            {list.length > 1 && (
              <div className={styles.pair}>
                {list.slice(1, 3).map((a) => <ArticleCard key={a.slug} article={a} />)}
              </div>
            )}

            {list.length > 3 && (
              <>
                <h2 className={styles.archiveTitle}>Everything else</h2>
                <ol className={styles.rows}>
                  {list.slice(3).map((a, i) => (
                    <ArticleRow key={a.slug} article={a} n={i + 4} />
                  ))}
                </ol>
              </>
            )}
          </>
        )}

        {!isLoading.value && list.length === 0 && (
          <p className={styles.empty}>Nothing published yet. Give it a week.</p>
        )}
      </section>

      <ClubBand source="blog" />

      <BackToTop />
    </div>
  );
}

/* ── Single article ────────────────────────────────────────────────── */

/**
 * Links inside the article are plain anchors written in markdown, so every one
 * of them would otherwise reload the whole page. Route them like any other
 * internal link, leaving new-tab clicks and external links alone.
 */
function handleBodyClick(e: MouseEvent) {
  if (e.defaultPrevented || e.button !== 0) return;
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

  const anchor = (e.target as HTMLElement | null)?.closest?.('a');
  if (!anchor) return;

  const href = anchor.getAttribute('href');
  if (!href || !href.startsWith('/') || anchor.target) return;

  e.preventDefault();
  route(href);
}

interface ArticleRouteProps extends RouteProps {
  slug?: string;
}

export function ArticlePage({ slug }: ArticleRouteProps) {
  useArticles(slug);

  const article = articles.value.find((a) => a.slug === slug);
  const { src: cover } = useImageLoader(article?.lead ?? '', [], article?.title);

  useEffect(() => {
    if (article) {
      setPageMeta({
        title: `${article.title} | Wet London`,
        description: article.dek,
        path: `/blog/${article.slug}`,
      });
    }
    return resetPageMeta;
  }, [article?.slug]);

  if (isLoading.value) {
    return (
      <div className={styles.page}>
        <div className={styles.container}><LoadingSpinner text="Loading..." /></div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className={styles.page}>
        <div className={styles.hero}>
          <h1 className={styles.title}>Not found</h1>
          <p className={styles.tagline}>We have not written that one.</p>
          <div className={styles.heroActions}>
            <Button as="a" href="/blog" variant="accent">See everything we have written</Button>
          </div>
        </div>
      </div>
    );
  }

  const others = articles.value.filter((a) => a.slug !== article.slug).slice(0, 3);

  return (
    <div className={styles.page}>
      <article>
        <header className={styles.articleHero}>
          <div className={styles.articleHeroInner}>
            <a className={styles.crumb} href="/blog">Blog</a>
            <h1 className={styles.articleTitle}>{article.title}</h1>
            <p className={styles.dek}>{article.dek}</p>
            <p className={styles.meta}>
              <time dateTime={article.date}>{formatDate(article.date)}</time>
              {' · '}{article.readingMinutes} min read
            </p>
          </div>
        </header>

        {article.lead && (
          <div className={styles.cover} style={{ backgroundImage: `url(${cover})` }} aria-hidden="true" />
        )}

        {/* Converted from markdown at build time, never from user input. */}
        <div
          className={styles.body}
          onClick={handleBodyClick}
          dangerouslySetInnerHTML={{ __html: article.html }}
        />
      </article>

      {others.length > 0 && (
        <section className={styles.container}>
          <h2 className={styles.moreTitle}>More from the blog</h2>
          <div className={styles.trio}>
            {others.map((a) => <ArticleCard key={a.slug} article={a} />)}
          </div>
        </section>
      )}

      <ClubBand source="article" />

      <BackToTop />
    </div>
  );
}
