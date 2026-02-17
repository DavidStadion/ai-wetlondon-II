import styles from './BookmarkIcon.module.css';

export interface BookmarkIconProps {
  isBookmarked: boolean;
  onToggle: () => void;
  size?: number;
  className?: string;
  label?: string;
}

export function BookmarkIcon({ isBookmarked, onToggle, size = 24, className, label }: BookmarkIconProps) {
  const iconClass = [
    styles.icon,
    isBookmarked ? styles['icon--filled'] : styles['icon--outline'],
  ].join(' ');

  const buttonClass = [
    styles.button,
    label && styles['button--withLabel'],
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      type="button"
      className={buttonClass}
      onClick={onToggle}
      aria-label={label ? undefined : (isBookmarked ? 'Remove bookmark' : 'Add bookmark')}
    >
      <svg
        className={iconClass}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden={label ? 'true' : undefined}
      >
        <path d="M5 5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16l-7-3.5L5 21V5z" />
      </svg>
      {label && <span>{label}</span>}
    </button>
  );
}
