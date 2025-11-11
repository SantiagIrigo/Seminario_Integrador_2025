import styles from './AppLayout.module.css';

interface TopBarProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function TopBar({ title, subtitle, actions }: TopBarProps) {
  return (
    <header className={styles.topbar}>
      <div className={styles.topbarHeading}>
        <span className={styles.topbarTitle}>{title}</span>
        {subtitle ? <span className={styles.topbarSubtitle}>{subtitle}</span> : null}
      </div>
      {actions}
    </header>
  );
}
