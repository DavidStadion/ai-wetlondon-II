import styles from './GalleryTab.module.css';

interface GalleryTabProps {
  venueName: string;
  imageUrl?: string;
}

export function GalleryTab({ venueName, imageUrl }: GalleryTabProps) {
  return (
    <div className={styles.container}>
      {imageUrl ? (
        <div className={styles.gallery}>
          <div
            className={styles.image}
            style={{ backgroundImage: `url(${imageUrl})` }}
            role="img"
            aria-label={venueName}
          />
        </div>
      ) : (
        <div className={styles.placeholder}>
          <p className={styles.placeholderText}>Gallery images coming soon</p>
        </div>
      )}
    </div>
  );
}
