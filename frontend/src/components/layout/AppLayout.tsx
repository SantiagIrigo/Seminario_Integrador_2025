import { ReactNode } from 'react';
import styles from './AppLayout.module.css';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useAuth } from 'contexts/AuthContext';

interface AppLayoutProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function AppLayout({ title, subtitle, actions, children }: AppLayoutProps) {
  const { user, logout } = useAuth();

  return (
    <div className={styles.container}>
      <Sidebar />
      <div className={styles.main}>
        <TopBar title={title} subtitle={subtitle} actions={actions} />
        <main className={styles.content}>
          <div className={styles.contentInner}>{children}</div>
        </main>
      </div>
    </div>
  );
}
