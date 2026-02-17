import styles from './SkeletonLoader.module.css';

export interface SkeletonLoaderProps {
  variant: 'card' | 'text' | 'circle' | 'button';
  width?: string;
  height?: string;
  count?: number;
}

export function SkeletonLoader({
  variant,
  width,
  height,
  count = 1,
}: SkeletonLoaderProps) {
  const baseClass = [styles.skeleton, styles[`skeleton--${variant}`]].join(' ');

  const style: Record<string, string> = {};
  if (width) style.width = width;
  if (height) style.height = height;

  if (variant === 'text' && count > 1) {
    return (
      <div className={styles.textGroup} role="status" aria-label="Loading">
        {Array.from({ length: count }, (_, i) => (
          <div
            key={i}
            className={baseClass}
            style={{
              ...style,
              width: i === count - 1 ? '60%' : style.width,
            }}
          />
        ))}
        <span className={styles.srOnly}>Loading...</span>
      </div>
    );
  }

  return (
    <div
      className={baseClass}
      style={style}
      role="status"
      aria-label="Loading"
    >
      <span className={styles.srOnly}>Loading...</span>
    </div>
  );
}
