import type { WetnessLevel } from '@/types/venue';
import styles from './WetnessIndicator.module.css';

export interface WetnessIndicatorProps {
  score: number;
  level: WetnessLevel;
  size?: 'sm' | 'md';
}

const levelDescriptions: Record<WetnessLevel, string> = {
  dry: 'Stay Dry',
  slightly: 'Slightly Wet',
  wet: 'Get Wet',
};

export function WetnessIndicator({ score, level, size = 'md' }: WetnessIndicatorProps) {
  const barClass = [styles.bar, size === 'sm' && styles['bar--sm']].filter(Boolean).join(' ');
  const fillClass = styles.fill;
  const labelClass = [styles.label, size === 'sm' && styles['label--sm']].filter(Boolean).join(' ');

  return (
    <div
      className={styles.indicator}
      role="img"
      aria-label={`Wetness score: ${score}%, ${levelDescriptions[level]}`}
    >
      <div className={barClass}>
        <div className={fillClass} style={{ width: `${score}%` }} />
      </div>
      <span className={labelClass}>{Math.round(score)}% wet</span>
    </div>
  );
}
