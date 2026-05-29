import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../store/drillStore';
import './Leaderboard.css';

const paperCard = {
  background: 'var(--paper-surface)',
  border: '1px solid var(--border-light)',
  borderRadius: 16,
  boxShadow: 'var(--shadow-paper)',
};

export default function Leaderboard() {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const allProgress = await db.drillProgress.toArray();
      const sorted = allProgress.filter(p => (p.unknownCount || 0) > 0)
        .sort((a, b) => (b.unknownCount || 0) - (a.unknownCount || 0)).slice(0, 20);
      const vocab = await db.vocab.toArray();
      const wordMap = {};
      vocab.forEach(v => { wordMap[v.word] = v; });
      setRankings(sorted.map(p => ({ ...p, vocab: wordMap[p.word] || null })));
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return (
    <div style={{ padding: 60, textAlign: 'center' }}>
      <div style={{ width: 32, height: 32, border: '2px solid rgba(184, 138, 58, 0.25)', borderTopColor: 'var(--lotus)', borderRadius: '50%', animation: 'lb-spin 0.7s linear infinite', margin: '0 auto' }} />
    </div>
  );

  if (rankings.length === 0) return (
    <div style={{ padding: 80, textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.5 }}>◇</div>
      <p style={{ color: 'var(--ink-faded)', fontSize: 15, marginBottom: 6 }}>暂无记录</p>
      <p style={{ color: 'var(--ink-faded)', fontSize: 13 }}>开始刷词后自动生成排行榜</p>
    </div>
  );

  return (
    <div style={{ padding: '0 0 84px' }}>
      <div style={{ ...paperCard, margin: 16, padding: 22 }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink-primary)', marginBottom: 4 }}>背错排行榜</h2>
          <p style={{ fontSize: 12, color: 'var(--ink-faded)' }}>错得越多，排名越高</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rankings.map((item, i) => {
            const pos = item.vocab?.pos ? item.vocab.pos : [];
            const medals = ['🥇', '🥈', '🥉'];
            return (
              <div key={item.word} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '12px 16px',
                background: i < 3 ? 'rgba(184, 138, 58, 0.05)' : 'var(--paper-bg)',
                border: i < 3 ? '1px solid rgba(184, 138, 58, 0.18)' : '1px solid var(--border-light)',
                borderRadius: 10,
                transition: 'all 150ms ease',
              }}>
                <div style={{ width: 28, textAlign: 'center', fontSize: i < 3 ? 18 : 14, fontWeight: i < 3 ? 600 : 400, color: i < 3 ? 'var(--lotus)' : 'var(--ink-faded)' }}>
                  {i < 3 ? medals[i] : i + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: 'var(--font-title)', fontSize: 16, fontWeight: i < 3 ? 650 : 400, color: i < 3 ? 'var(--ink-primary)' : 'var(--ink-faded)' }}>{item.word}</span>
                    {pos.length > 0 && (
                      <span style={{ padding: '1px 6px', borderRadius: 4, fontSize: 10, background: i < 3 ? 'rgba(139, 69, 69, 0.08)' : 'rgba(184, 138, 58, 0.06)', color: i < 3 ? 'var(--lotus-dark)' : 'var(--ink-faded)' }}>{pos[0]}</span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: i < 3 ? 'var(--ink-secondary)' : 'var(--ink-faded)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', opacity: i < 3 ? 1 : 0.7 }}>
                    {item.vocab?.definitions?.[0] ? (typeof item.vocab.definitions[0] === 'string' ? item.vocab.definitions[0] : item.vocab.definitions[0].meaning) : ''}
                  </div>
                </div>
                <div style={{ textAlign: 'center', flexShrink: 0 }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: i < 3 ? 'var(--lotus-dark)' : 'var(--ink-faded)', lineHeight: 1 }}>{item.unknownCount}</div>
                  <div style={{ fontSize: 10, color: 'var(--ink-faded)', opacity: i < 3 ? 1 : 0.6 }}>次</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
