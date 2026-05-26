import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(245, 237, 224, 0.95)',
      backdropFilter: 'blur(8px)',
      borderBottom: '1px solid var(--paper-shadow)',
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 20 }}>📖</span>
        <span style={{
          fontFamily: 'var(--font-title)',
          fontSize: 'var(--text-xl)',
          fontWeight: 600,
          color: 'var(--ink-primary)',
          letterSpacing: '0.02em',
        }}>
          词汇故纸屋
        </span>
      </Link>

      <Link to="/library">
        <button style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 18, padding: 4,
        }} aria-label="搜索">🔍</button>
      </Link>
    </header>
  );
}