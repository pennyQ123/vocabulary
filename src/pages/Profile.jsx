import { useState, useEffect } from 'react';
import { db } from '../store/drillStore';
import { getLevelLabel } from '../utils/ebbinghaus';

const paperCard = {
  background: 'var(--paper-surface)',
  border: '1px solid var(--border-light)',
  borderRadius: 16,
  boxShadow: 'var(--shadow-paper)',
};

export default function Profile() {
  const [stats, setStats] = useState({ total: 0, learned: 0, dueCount: 0, streak: 0, totalReviews: 0 });
  const [recentRecords, setRecentRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const mem = await db.memory.toArray();
      const records = await db.quizRecords.toArray();
      const now = Date.now();
      const learned = mem.filter(m => m.level > 0).length;
      const dueCount = mem.filter(m => m.nextReview && m.nextReview <= now).length;
      const totalReviews = mem.reduce((s, m) => s + (m.reviewCount || 0), 0);
      const sorted = [...records].sort((a, b) => b.date - a.date);
      let streak = 0;
      if (sorted.length > 0) {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        let checkDate = new Date(today);
        for (let i = 0; i < 365; i++) {
          const dayStr = checkDate.toDateString();
          const hasRecord = sorted.some(r => new Date(r.date).toDateString() === dayStr);
          if (hasRecord) { streak++; checkDate.setDate(checkDate.getDate() - 1); } else break;
        }
      }
      const vocab = await db.vocab.toArray();
      setStats({ total: vocab.length, learned, dueCount, streak, totalReviews });
      setRecentRecords(sorted.reverse().slice(-10));
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return (
    <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-faded)' }}>加载中...</div>
  );

  const statCards = [
    { label: '总词数', value: stats.total, icon: '▦', color: 'var(--night-sea)' },
    { label: '已学习', value: stats.learned, icon: '◎', color: 'var(--night-sea)' },
    { label: '待复习', value: stats.dueCount, icon: '◈', color: 'var(--lotus-dark)' },
    { label: '连续天数', value: stats.streak, icon: '✦', color: 'var(--lotus)' },
  ];

  return (
    <div style={{ padding: '0 0 100px' }}>
      {/* User info */}
      <div style={{
        padding: '26px 16px',
        background: 'rgba(184, 138, 58, 0.06)',
        borderBottom: '1px solid var(--border-medium)',
        textAlign: 'center',
      }}>
        <div style={{
          width: 74, height: 74, borderRadius: '50%',
          background: 'rgba(184, 138, 58, 0.12)',
          border: '2px solid var(--lotus)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 12px',
          fontSize: 34,
          color: 'var(--lotus)',
          boxShadow: '0 8px 24px rgba(184, 138, 58, 0.15)',
        }}>
          ◉
        </div>
        <h2 style={{ fontFamily: 'var(--font-title)', fontSize: 22, fontWeight: 700, color: 'var(--ink-primary)', marginBottom: 4 }}>
          词汇流动屋
        </h2>
        <p style={{ fontSize: 12, color: 'var(--ink-faded)' }}>坚持学习，持续进步</p>
      </div>

      {/* Stat cards */}
      <div style={{ padding: 16 }}>
        <h2 style={{ fontSize: 13, fontWeight: 650, color: 'var(--ink-faded)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          学习统计
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {statCards.map(item => (
            <div key={item.label} style={{ ...paperCard, padding: 18, textAlign: 'center' }}>
              <div style={{ fontSize: 24, marginBottom: 6, opacity: 0.7, color: item.color }}>{item.icon}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: item.color, lineHeight: 1 }}>{item.value}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-faded)', marginTop: 4 }}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent records */}
      {recentRecords.length > 0 && (
        <div style={{ padding: '0 16px 16px' }}>
          <h2 style={{ fontSize: 13, fontWeight: 650, color: 'var(--ink-faded)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            最近测验
          </h2>
          <div style={{ ...paperCard, padding: 8, overflow: 'hidden' }}>
            {recentRecords.map((r, idx) => (
              <div key={idx} style={{
                padding: '10px 14px',
                background: idx % 2 === 0 ? 'var(--paper-bg)' : 'var(--paper-surface)',
                borderBottom: idx < recentRecords.length - 1 ? '1px solid var(--border-light)' : 'none',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontSize: 12, color: 'var(--ink-faded)' }}>
                  {new Date(r.date).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}
                </span>
                <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: r.score >= 80 ? 'var(--night-sea)' : r.score >= 60 ? 'var(--lotus)' : 'var(--lotus-dark)' }}>
                    {r.score}分
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--ink-faded)' }}>{r.correct}/{r.total}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data management */}
      <div style={{ padding: '0 16px' }}>
        <h2 style={{ fontSize: 13, fontWeight: 650, color: 'var(--ink-faded)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          数据管理
        </h2>
        <div style={{ ...paperCard, overflow: 'hidden' }}>
          <button
            onClick={async () => {
              if (window.confirm('确定要清除所有学习记录吗？此操作不可恢复。')) {
                await db.memory.clear();
                await db.quizRecords.clear();
                await db.notes.clear();
                setStats(prev => ({ ...prev, learned: 0, dueCount: 0, streak: 0 }));
              }
            }}
            style={{
              width: '100%', padding: '15px 16px',
              background: 'none', border: 'none',
              borderBottom: '1px solid var(--border-light)',
              cursor: 'pointer', fontSize: 14, color: 'var(--lotus-dark)',
              textAlign: 'left', fontFamily: 'var(--font-body)',
              transition: 'background 150ms ease',
            }}
          >
            清除学习记录
          </button>
          <button
            onClick={async () => {
              const mem = await db.memory.toArray();
              const data = JSON.stringify(mem, null, 2);
              const blob = new Blob([data], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url; a.download = `vocab-backup-${Date.now()}.json`; a.click();
              URL.revokeObjectURL(url);
            }}
            style={{
              width: '100%', padding: '15px 16px',
              background: 'none', border: 'none',
              cursor: 'pointer', fontSize: 14,
              color: 'var(--ink-primary)',
              textAlign: 'left', fontFamily: 'var(--font-body)',
              transition: 'background 150ms ease',
            }}
          >
            导出学习记录
          </button>
        </div>
      </div>
    </div>
  );
}
