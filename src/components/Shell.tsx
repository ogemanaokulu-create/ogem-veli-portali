import { ReactNode, useEffect, useState } from 'react';
import {
  Baby, Bell, ChevronRight, LogOut, Menu, Search, X,
  type LucideIcon,
} from 'lucide-react';
import { useAuth, roleLabel } from '@/lib/auth';
import { getInitials, avatarColor, fetchNotifications, markNotificationRead } from '@/lib/api';

export type NavItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
};

export function Shell({
  navItems,
  activePage,
  onPageChange,
  children,
  bottomNav,
}: {
  navItems: NavItem[];
  activePage: string;
  onPageChange: (page: string) => void;
  children: ReactNode;
  bottomNav?: NavItem[];
}) {
  const { session, signOut } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [notifOpen, setNotOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const profile = session?.profile;

  useEffect(() => {
    fetchNotifications().then(setNotifications);
  }, [activePage]);

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  function handleNotifClick(id: string) {
    markNotificationRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read_at: 'read' } : n)));
  }

  const activeLabel = navItems.find((n) => n.id === activePage)?.label ?? '';

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNavOpen ? 'sidebar-open' : ''}`}>
        <div className="brand-lockup">
          <div className="brand-mark"><img src="/Yeni_Proje.png" alt="OGEM" className="brand-logo" /></div>
          <div><strong>OGEM</strong><span>Anaokulu</span></div>
          <button className="icon-button mobile-close" onClick={() => setMobileNavOpen(false)} aria-label="Menüyü kapat"><X size={20} /></button>
        </div>
        <div className="school-switcher">
          <div className="school-emblem">O</div>
          <div><b>OGEM Anaokulu</b><span>Diyarbakır</span></div>
          <ChevronRight size={16} />
        </div>
        <nav className="main-nav">
          <p className="nav-caption">MENÜ</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={`nav-item ${activePage === item.id ? 'active' : ''}`}
                onClick={() => { onPageChange(item.id); setMobileNavOpen(false); }}
              >
                <span className={`nav-icon nav-icon-${item.id}`}><Icon size={17} /></span>
                <span>{item.label}</span>
                {item.badge ? <em>{item.badge}</em> : null}
              </button>
            );
          })}
          <button className="nav-item nav-item-logout" onClick={signOut}>
            <span className="nav-icon nav-icon-logout"><LogOut size={17} /></span>
            <span>Çıkış Yap</span>
          </button>
        </nav>
        <div className="sidebar-bottom">
          <button className="user-card" onClick={signOut}>
            <div className={`avatar avatar-small avatar-${avatarColor(profile?.full_name ?? '')}`}>
              {getInitials(profile?.full_name ?? '')}
            </div>
            <div>
              <b>{profile?.full_name}</b>
              <span>{roleLabel(profile?.role ?? 'parent')}</span>
            </div>
            <LogOut size={17} />
          </button>
        </div>
      </aside>

      {mobileNavOpen && <button className="sidebar-overlay" onClick={() => setMobileNavOpen(false)} aria-label="Menüyü kapat" />}

      <main className="main-content">
        <header className="topbar">
          <button className="icon-button menu-trigger" onClick={() => setMobileNavOpen(true)} aria-label="Menüyü aç"><Menu size={22} /></button>
          <div className="breadcrumb">
            <span>OGEM Anaokulu</span>
            <ChevronRight size={14} />
            <b>{activeLabel}</b>
          </div>
          <div className="top-actions">
            <button className="icon-button"><Search size={19} /></button>
            <div className="notif-wrapper">
              <button className="notification-button" onClick={() => setNotOpen(!notifOpen)}>
                <Bell size={19} />
                {unreadCount > 0 && <i />}
              </button>
              {notifOpen && (
                <div className="notif-dropdown">
                  <div className="notif-header">
                    <b>Bildirimler</b>
                    <button onClick={() => setNotOpen(false)}><X size={16} /></button>
                  </div>
                  <div className="notif-list">
                    {notifications.length === 0 && <p className="notif-empty">Henüz bildirim yok</p>}
                    {notifications.map((n) => (
                      <button
                        key={n.id}
                        className={`notif-item ${n.read_at ? 'read' : ''}`}
                        onClick={() => handleNotifClick(n.id)}
                      >
                        <div className="notif-dot" />
                        <div>
                          <b>{n.title}</b>
                          <span>{n.body}</span>
                          <small>{new Date(n.created_at).toLocaleDateString('tr-TR')}</small>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="top-profile">
              <div className={`avatar avatar-small avatar-${avatarColor(profile?.full_name ?? '')}`}>
                {getInitials(profile?.full_name ?? '')}
              </div>
              <span>{profile?.full_name}</span>
              <button className="icon-button topbar-logout" onClick={signOut} aria-label="Çıkış Yap" title="Çıkış Yap"><LogOut size={17} /></button>
            </div>
          </div>
        </header>
        <div className="content-wrap">{children}</div>
      </main>

      {bottomNav && (
        <nav className="bottom-nav">
          {bottomNav.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={`bottom-nav-item ${activePage === item.id ? 'active' : ''}`}
                onClick={() => onPageChange(item.id)}
              >
                <span className={`bottom-nav-icon bottom-nav-icon-${item.id}`}><Icon size={19} /></span>
                <span>{item.label}</span>
                {item.badge ? <em>{item.badge}</em> : null}
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}
