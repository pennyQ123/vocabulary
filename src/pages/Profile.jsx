import { useState, useEffect } from 'react';
import { db } from '../utils/storage';
import { getLevelLabel } from '../utils/ebbinghaus';

export default function Profile() {
  const [stats, setStats] = useState({
    total: 0,
    learned: 0,
    dueCount: 0,
    streak: 0,
    totalReviews: 0,
  });
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

      // 计算连续学习天数
      const sorted = [...records].sort((a, b) => b.date - a.date);
      let streak = 0;
      if (sorted.length > 0) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let checkDate = new Date(today);
        for (let i = 0; i < 365; i++) {
          const dayStr = checkDate.toDateString();
          const hasRecord = sorted.some(r => new Date(r.date).toDateString() === dayStr);
          if (hasRecord) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break;
          }
        }
      }

      const vocab = await db.vocab.toArray();
      setStats({
        total: vocab.length,
        learned,
        dueCount,
        streak,
        totalReviews,
      });
      setRecentRecords(sorted.reverse().slice(-10));
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink-tertiary)' }}>
        加载中...
      </div>
    );
  }

  return (
    <div style={{ padding: '0 0 100px' }}>
      {/* 用户信息 */}
      <div style={{
        padding: '24px 16px',
        background: 'var(--paper-mid)',
        borderBottom: '1px solid var(--paper-shadow)',
        textAlign: 'center',
      }}>
        <div style={{
          width: 72, height: 72,
          borderRadius: '50%',
          background: 'var(--paper-base)',
          border: '3px solid var(--wine-red)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 12px',
          fontSize: 32,
        }}>
          📖
        </div>
        <h2 style={{
          fontFamily: 'var(--font-title)',
          fontSize: 'var(--text-xl)',
          fontWeight: 600,
          color: 'var(--ink-primary)',
          marginBottom: 4,
        }}>
          词汇故纸屋
        </h2>
        <p style={{ fontSize: 12, color: 'var(--ink-tertiary)' }}>
          坚持学习，持续进步
        </p>
      </div>

      {/* 统计卡片 */}
      <div style={{ padding: 16 }}>
        <h2 style={{
          fontSize: 'var(--text-base)', fontWeight: 600,
          color: 'var(--ink-tertiary)', marginBottom: 12,
          textTransform: 'uppercase', letterSpacing: '0.08em',
        }}>
          学习统计
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { label: '总词数', value: stats.total, icon: '📚', color: 'var(--ink-primary)' },
            { label: '已学习', value: stats.learned, icon: '✅', color: 'var(--ink-green)' },
            { label: '待复习', value: stats.dueCount, icon: '📝', color: 'var(--wine-red)' },
            { label: '连续天数', value: stats.streak, icon: '🔥', color: 'var(--amber)' },
          ].map(item => (
            <div key={item.label} style={{
              padding: 16,
              background: 'var(--paper-mid)',
              borderRadius: 'var(--radius-lg)',
              textAlign: 'center',
              border: '1px solid var(--paper-shadow)',
            }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>{item.icon}</div>
              <div style={{
                fontSize: '1.5rem', fontWeight: 700,
                color: item.color,
              }}>
                {item.value}
              </div>
              <div style={{ fontSize: 11, color: 'var(--ink-tertiary)', marginTop: 2 }}>
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 复习记录 */}
      {recentRecords.length > 0 && (
        <div style={{ padding: '0 16px 16px' }}>
          <h2 style={{
            fontSize: 'var(--text-base)', fontWeight: 600,
            color: 'var(--ink-tertiary)', marginBottom: 12,
            textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>
            最近测验
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recentRecords.map((r, idx) => (
              <div key={idx} style={{
                padding: '10px 14px',
                background: 'var(--paper-base)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--paper-shadow)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <span style={{ fontSize: 12, color: 'var(--ink-tertiary)' }}>
                  {new Date(r.date).toLocaleDateString('zh-CN', {
                    month: 'numeric', day: 'numeric',
                  })}
                </span>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span style={{
                    fontSize: 13, fontWeight: 600,
                    color: r.score >= 80 ? 'var(--ink-green)' : r.score >= 60 ? 'var(--amber)' : 'var(--wine-red)',
                  }}>
                    {r.score}分
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--ink-tertiary)' }}>
                    {r.correct}/{r.total}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 操作入口 */}
      <div style={{ padding: '0 16px' }}>
        <h2 style={{
          fontSize: 'var(--text-base)', fontWeight: 600,
          color: 'var(--ink-tertiary)', marginBottom: 12,
          textTransform: 'uppercase', letterSpacing: '0.08em',
        }}>
          数据管理
        </h2>
        <div style={{
          background: 'var(--paper-mid)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--paper-shadow)',
          overflow: 'hidden',
        }}>
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
              width: '100%', padding: '14px 16px',
              background: 'none', border: 'none',
              borderBottom: '1px solid var(--paper-shadow)',
              cursor: 'pointer', fontSize: 14,
              color: 'var(--wine-red)',
              textAlign: 'left',
              fontFamily: 'var(--font-body)',
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
              a.href = url;
              a.download = `vocab-backup-${Date.now()}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            style={{
              width: '100%', padding: '14px 16px',
              background: 'none', border: 'none',
              cursor: 'pointer', fontSize: 14,
              color: 'var(--ink-primary)',
              textAlign: 'left',
              fontFamily: 'var(--font-body)',
            }}
          >
            导出学习记录
          </button>
        </div>
      </div>
    </div>
  );
}