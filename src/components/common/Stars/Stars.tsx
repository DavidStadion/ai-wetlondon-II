import styles from './Stars.module.css';

interface StarsProps {
  rating: number;
  size?: 'sm' | 'lg';
}

export function Stars({ rating, size = 'sm' }: StarsProps) {
  const className = size === 'lg' ? styles.starsLg : styles.starsSm;
  return (
    <span className={className} aria-label={`${rating} out of 5 stars`}>
      {'★'.repeat(Math.round(rating))}{'☆'.repeat(5 - Math.round(rating))}
    </span>
  );
}
