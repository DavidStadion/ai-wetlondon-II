import styles from './LoadingSpinner.module.css';

interface LoadingSpinnerProps {
  text?: string;
}

export function LoadingSpinner({ text = 'Loading...' }: LoadingSpinnerProps) {
  return (
    <div className={styles.loading}>
      <div className={styles.spinner} />
      <p>{text}</p>
    </div>
  );
}
