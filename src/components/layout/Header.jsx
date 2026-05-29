import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'var(--paper-surface)',
      borderBottom: '1px solid var(--border-medium)',
      padding: '14px 18px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0 2px 12px rgba(30, 44, 35, 0.08)',
    }}>
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          fontSize: 22,
          color: 'var(--lotus)',
          filter: 'drop-shadow(0 1px 2px rgba(184, 138, 58, 0.4))',
        }}>✦</span>
        <span style={{
          fontFamily: 'var(--font-title)',
          fontSize: 'var(--text-lg)',
          fontWeight: 600,
          color: 'var(--ink-faded)',
          letterSpacing: '-0.01em',
        }}>
          背单词
        </span>
      </Link>

      <Link to="/library">
        <button
          style={{
            background: 'var(--paper-bg)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            fontSize: 16,
            padding: 7,
            color: 'var(--ink-secondary)',
            boxShadow: 'var(--shadow-button)',
            transition: 'all var(--transition-fast)',
          }}
          aria-label="搜索"
        >⌕</button>
      </Link>
    </header>
  );
}
