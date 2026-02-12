import { useState, useEffect } from 'preact/hooks';
import styles from './GalleryTab.module.css';

interface GalleryTabProps {
  venueName: string;
  imageUrl?: string;
}

const galleryCache = new Map<string, string[]>();

export function GalleryTab({ venueName, imageUrl }: GalleryTabProps) {
  const cached = galleryCache.get(venueName);
  const [images, setImages] = useState<string[]>(cached ?? []);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(!cached);

  useEffect(() => {
    if (!venueName) {
      setLoading(false);
      return;
    }

    const cached = galleryCache.get(venueName);
    if (cached) {
      setImages(cached);
      setSelectedIndex(0);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchGallery() {
      setLoading(true);
      try {
        const q = venueName.replace(/, London$/i, '').trim();
        const resp = await fetch(
          `/api/place-photo?q=${encodeURIComponent(q + ' London')}&gallery=true`
        );
        if (!resp.ok) throw new Error('fetch failed');

        const data = await resp.json();
        const urls: string[] = data.galleryUrls ?? (data.imageUrl ? [data.imageUrl] : []);

        if (!cancelled) {
          galleryCache.set(venueName, urls);
          setImages(urls);
          setSelectedIndex(0);
        }
      } catch {
        if (!cancelled) {
          // Fall back to the hero image if available
          const fallback = imageUrl ? [imageUrl] : [];
          setImages(fallback);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchGallery();
    return () => { cancelled = true; };
  }, [venueName]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.spinner} />
        <p className={styles.loadingText}>Loading gallery...</p>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.placeholder}>
          <p className={styles.placeholderText}>No gallery images available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div
        className={styles.mainImage}
        style={{ backgroundImage: `url(${images[selectedIndex]})` }}
        role="img"
        aria-label={`${venueName} photo ${selectedIndex + 1}`}
      />

      {images.length > 1 && (
        <div className={styles.thumbnails}>
          {images.slice(0, 6).map((url, i) => (
            <button
              key={i}
              type="button"
              className={`${styles.thumbnail} ${i === selectedIndex ? styles['thumbnail--active'] : ''}`}
              onClick={() => setSelectedIndex(i)}
              aria-label={`View photo ${i + 1}`}
            >
              <div
                className={styles.thumbnailImage}
                style={{ backgroundImage: `url(${url})` }}
              />
            </button>
          ))}
        </div>
      )}

      <p className={styles.photoCount}>
        {selectedIndex + 1} / {images.length} photo{images.length !== 1 ? 's' : ''}
      </p>
    </div>
  );
}
