import type { ComponentChildren } from 'preact';
import styles from './Button.module.css';

interface ButtonBaseProps {
  children: ComponentChildren;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent' | 'action';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

interface ButtonAsButtonProps extends ButtonBaseProps {
  as?: 'button';
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
  href?: never;
}

interface ButtonAsAnchorProps extends ButtonBaseProps {
  as: 'a';
  href: string;
  onClick?: never;
  disabled?: never;
  type?: never;
}

export type ButtonProps = ButtonAsButtonProps | ButtonAsAnchorProps;

export function Button(props: ButtonProps) {
  const {
    children,
    variant = 'primary',
    size = 'md',
    className,
  } = props;

  const classNames = [
    styles.button,
    styles[`button--${variant}`],
    styles[`button--${size}`],
    className,
  ].filter(Boolean).join(' ');

  if (props.as === 'a') {
    return (
      <a
        href={props.href}
        className={classNames}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      type={props.type || 'button'}
      className={classNames}
      onClick={props.onClick}
      disabled={props.disabled}
    >
      {children}
    </button>
  );
}
