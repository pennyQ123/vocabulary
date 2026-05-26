import { NavLink } from 'react-router-dom';

const tabs = [
  { to: '/', icon: '🏠', label: '首页' },
  { to: '/library', icon: '📚', label: '词库' },
  { to: '/review', icon: '📝', label: '复习' },
  { to: '/quiz', icon: '📋', label: '测验' },
  { to: '/profile', icon: '👤', label: '我的' },
];

export default function TabBar() {
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: 'rgba(245, 237, 224, 0.98)',
      borderTop: '1px solid var(--paper-shadow)',
      display: 'flex',
      justifyContent: 'space-around',
      padding: '8px 0 12px',
      zIndex: 200,
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
            gap: 2,
            padding: '4px 12px',
            color: isActive ? 'var(--wine-red)' : 'var(--ink-tertiary)',
            fontSize: 11,
            fontWeight: isActive ? 600 : 400,
            transition: 'color var(--transition-fast)',
            textDecoration: 'none',
          })}
        >
          <span style={{ fontSize: 20 }}>{tab.icon}</span>
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}