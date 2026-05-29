import { NavLink } from 'react-router-dom';

const tabs = [
  { to: '/', icon: '◎', label: '首页' },
  { to: '/library', icon: '▦', label: '词库' },
  { to: '/review', icon: '◈', label: '复习' },
  { to: '/quiz', icon: '◇', label: '测验' },
  { to: '/profile', icon: '◉', label: '我的' },
];

export default function TabBar() {
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: 'var(--paper-surface)',
      borderTop: '1px solid var(--border-medium)',
      borderRadius: '0',
      display: 'flex',
      justifyContent: 'space-around',
      padding: '10px 0 max(10px, env(safe-area-inset-bottom))',
      zIndex: 200,
      boxShadow: '0 -3px 16px rgba(30, 44, 35, 0.08)',
    }}>
      {tabs.map(tab => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.to === '/'}
          style={({ isActive }) => ({
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
            padding: '6px 14px',
            color: isActive ? 'var(--lotus)' : 'var(--ink-faded)',
            fontSize: 10,
            fontWeight: isActive ? 600 : 400,
            transition: 'all var(--transition-fast)',
            textDecoration: 'none',
          })}
        >
          <span style={{
            fontSize: 22,
            transition: 'transform var(--transition-spring)',
            display: 'block',
          }}>{tab.icon}</span>
          <span style={{ letterSpacing: '0.02em' }}>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
