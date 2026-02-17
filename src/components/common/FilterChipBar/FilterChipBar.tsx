import styles from './FilterChipBar.module.css';

interface FilterChipBarProps<T extends string> {
  options: Array<{ value: T; label: string }>;
  selected: T;
  onSelect: (value: T) => void;
}

export function FilterChipBar<T extends string>({ options, selected, onSelect }: FilterChipBarProps<T>) {
  return (
    <div className={styles.filterBar}>
      {options.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          className={`${styles.filterChip} ${selected === value ? styles.active : ''}`}
          onClick={() => onSelect(value)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
