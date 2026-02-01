import styles from './Tag.module.css';

interface InteractiveTagProps {
  label: string;
  selected: boolean;
  onClick: () => void;
  variant?: 'default' | 'category';
}

interface DisplayTagProps {
  label: string;
  variant: 'display';
}

export type TagProps = InteractiveTagProps | DisplayTagProps;

function isDisplayTag(props: TagProps): props is DisplayTagProps {
  return props.variant === 'display';
}

export function Tag(props: TagProps) {
  if (isDisplayTag(props)) {
    return (
      <span className={`${styles.tag} ${styles['tag--display']}`}>
        {props.label}
      </span>
    );
  }

  const { label, selected, onClick, variant = 'default' } = props;
  const classNames = [
    styles.tag,
    selected && styles['tag--selected'],
    variant === 'category' && styles['tag--category'],
  ].filter(Boolean).join(' ');

  return (
    <button type="button" className={classNames} onClick={onClick} aria-pressed={selected}>
      {label}
    </button>
  );
}
