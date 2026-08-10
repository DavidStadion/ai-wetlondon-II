import { useState } from 'preact/hooks';
import styles from './JoinClub.module.css';

type State = 'idle' | 'sending' | 'check-email' | 'stored' | 'already' | 'error';

interface JoinClubProps {
  /** Recorded against the signup so we learn which placement converts. */
  source?: string;
}

export function JoinClub({ source = 'footer' }: JoinClubProps) {
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');   // honeypot
  const [state, setState] = useState<State>('idle');
  const [message, setMessage] = useState('');

  const submit = async (e: Event) => {
    e.preventDefault();
    if (state === 'sending') return;

    setState('sending');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, company, source }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) {
        setState('error');
        setMessage(data.error || 'That did not work. Try again in a moment.');
        return;
      }
      setState(data.status === 'already' ? 'already' : data.status === 'stored' ? 'stored' : 'check-email');
      setEmail('');
    } catch {
      setState('error');
      setMessage('That did not work. Try again in a moment.');
    }
  };

  if (state === 'check-email') {
    return (
      <p className={styles.done}>
        Check your inbox and tap the confirm link. That is the last we ask of you.
      </p>
    );
  }

  // No mailer configured yet, so promising an email would be a lie.
  if (state === 'stored') {
    return (
      <p className={styles.done}>
        You are on the list. We will confirm by email as soon as alerts go live.
      </p>
    );
  }

  if (state === 'already') {
    return <p className={styles.done}>You are already on the list. Nothing to do.</p>;
  }

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <label className={styles.label} htmlFor="clubEmail">
        Rainy day alerts
      </label>
      <p className={styles.blurb}>
        We email on the mornings rain is coming, with somewhere indoors to go.
      </p>

      <div className={styles.row}>
        <input
          id="clubEmail"
          className={styles.input}
          type="email"
          name="email"
          inputMode="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          value={email}
          onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
        />
        <button className={styles.button} type="submit" disabled={state === 'sending'}>
          {state === 'sending' ? 'One sec' : 'Join'}
        </button>
      </div>

      {/* Bots fill this; people never see it. */}
      <input
        className={styles.honeypot}
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={company}
        onInput={(e) => setCompany((e.target as HTMLInputElement).value)}
      />

      {state === 'error' && <p className={styles.error} role="alert">{message}</p>}

      <p className={styles.smallprint}>
        One email on wet mornings, nothing else. Unsubscribe in one tap.{' '}
        <a href="/privacy">How we handle your data</a>.
      </p>
    </form>
  );
}
