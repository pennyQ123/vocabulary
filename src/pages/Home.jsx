import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllVocab, db } from '../store/drillStore';
import { getLevelLabel } from '../utils/ebbinghaus';

export default function Home() {
  const [total, setTotal] = useState(0);
  const [dueCount, setDueCount] = useState(0);
  const [learned, setLearned] = useState(0);
  const [newCount, setNewCount] = useState(0);
  const [recentWords, setRecentWords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const vocab = await getAllVocab();
      setTotal(vocab.length);
      const mem = await db.memory.toArray();
      const learnedCount = mem.filter(m => m.level > 0).length;
      setLearned(learnedCount);
      const now = Date.now();
      setDueCount(mem.filter(m => m.nextReview && m.nextReview <= now).length);
      setNewCount(vocab.length - learnedCount);
      const recent = mem.filter(m => m.lastReview).sort((a, b) => b.lastReview - a.lastReview).slice(0, 10);
      const wordMap = {};
      vocab.forEach(v => wordMap[v.word] = v);
      setRecentWords(recent.map(r => wordMap[r.word]).filter(Boolean).slice(0, 8));
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-faded)' }}>
        加载中...
      </div>
    );
  }

  const paperCard = {
    background: 'var(--paper-surface)',
    border: '1px solid var(--border-light)',
    borderRadius: 16,
    boxShadow: 'var(--shadow-paper)',
  };

  const paperBtn = (accent = false) => ({
    padding: '7px 18px',
    background: accent
      ? 'var(--lotus-dark)'
      : 'var(--paper-surface)',
    border: '1px solid var(--border-medium)',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    color: accent ? 'white' : 'var(--ink-primary)',
    boxShadow: 'var(--shadow-button)',
    transition: 'all 150ms ease',
  });

  return (
    <div style={{ padding: '20px 16px 24px', maxWidth: 430, margin: '0 auto' }}>
      {/* Logo */}
      <div style={{ textAlign: 'center', padding: '20px 0 18px' }}>
        <div style={{
          fontSize: 52,
          color: 'var(--lotus)',
          filter: 'drop-shadow(0 4px 12px rgba(184, 138, 58, 0.30))',
          marginBottom: 8,
          lineHeight: 1,
        }}>✦</div>
        <h1 style={{
          fontFamily: 'var(--font-title)',
          fontSize: 26,
          fontWeight: 700,
          color: 'var(--ink-primary)',
          letterSpacing: '-0.02em',
        }}>
          词汇流动屋
        </h1>
        <p style={{ fontSize: 13, color: 'var(--ink-faded)', marginTop: 5 }}>
          IELTS 易混淆词辨析记忆系统
        </p>
      </div>

      {/* Today Stats */}
      <div style={{ ...paperCard, padding: 22, marginBottom: 14 }}>
        <h2 style={{ fontSize: 14, fontWeight: 650, color: 'var(--ink-secondary)', marginBottom: 16, letterSpacing: '0.02em' }}>
          今日任务
        </h2>
        <div style={{ display: 'flex', gap: 12 }}>
          {/* Due */}
          <div style={{
            flex: 1,
            background: 'rgba(139, 69, 69, 0.06)',
            border: '1px solid rgba(139, 69, 69, 0.18)',
            borderRadius: 12,
            padding: 18,
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: -20, right: -20,
              width: 70, height: 70,
              background: 'radial-gradient(circle, rgba(139, 69, 69, 0.10), transparent)',
              borderRadius: '50%',
            }} />
            <div style={{ fontSize: 32, marginBottom: 4 }}>◈</div>
            <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--lotus-dark)', lineHeight: 1 }}>{dueCount}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-faded)', marginTop: 4 }}>待复习</div>
            {dueCount > 0 && (
              <Link to="/review">
                <button style={{ ...paperBtn(true), marginTop: 10, fontSize: 12 }}>
                  开始复习
                </button>
              </Link>
            )}
          </div>

          {/* New */}
          <div style={{
            flex: 1,
            background: 'rgba(184, 138, 58, 0.06)',
            border: '1px solid rgba(184, 138, 58, 0.18)',
            borderRadius: 12,
            padding: 18,
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: -20, left: -20,
              width: 70, height: 70,
              background: 'radial-gradient(circle, rgba(184, 138, 58, 0.10), transparent)',
              borderRadius: '50%',
            }} />
            <div style={{ fontSize: 32, marginBottom: 4 }}>◎</div>
            <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--lotus)', lineHeight: 1 }}>{newCount}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-faded)', marginTop: 4 }}>新词</div>
            <Link to="/library">
              <button style={{ ...paperBtn(true), marginTop: 10, fontSize: 12 }}>
                学习新词
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Access */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
        <Link to="/library" style={{ flex: 1 }}>
          <div style={{
            ...paperCard,
            padding: 20,
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 150ms ease',
          }}>
            <div style={{ fontSize: 24, marginBottom: 6, color: 'var(--lotus)' }}>▦</div>
            <div style={{ fontWeight: 650, marginBottom: 3, color: 'var(--ink-primary)', fontSize: 15 }}>词库浏览</div>
            <div style={{ fontSize: 12, color: 'var(--ink-faded)' }}>{total} 词汇</div>
          </div>
        </Link>
        <Link to="/quiz" style={{ flex: 1 }}>
          <div style={{
            ...paperCard,
            padding: 20,
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 150ms ease',
          }}>
            <div style={{ fontSize: 24, marginBottom: 6, color: 'var(--night-sea)' }}>◇</div>
            <div style={{ fontWeight: 650, marginBottom: 3, color: 'var(--ink-primary)', fontSize: 15 }}>测验中心</div>
            <div style={{ fontSize: 12, color: 'var(--ink-faded)' }}>多种题型</div>
          </div>
        </Link>
      </div>

      {/* Learning Stats */}
      <div style={{ ...paperCard, padding: 22, marginBottom: 14 }}>
        <h2 style={{ fontSize: 14, fontWeight: 650, color: 'var(--ink-secondary)', marginBottom: 16 }}>学习数据</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { label: '总词数', value: total, color: 'var(--ink-primary)' },
            { label: '已学习', value: learned, color: 'var(--night-sea)' },
            { label: '待复习', value: dueCount, color: 'var(--lotus-dark)' },
          ].map(item => (
            <div key={item.label} style={{ flex: 1, textAlign: 'center', padding: '12px 8px', background: 'var(--paper-bg)', borderRadius: 8, border: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: item.color, lineHeight: 1 }}>{item.value}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-faded)', marginTop: 5 }}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Words */}
      {recentWords.length > 0 && (
        <div style={{ ...paperCard, padding: 22 }}>
          <h2 style={{ fontSize: 14, fontWeight: 650, color: 'var(--ink-secondary)', marginBottom: 14 }}>最近学习</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {recentWords.map(w => (
              <Link key={w.word} to={`/word/${w.word}`}>
                <span style={{
                  padding: '5px 13px',
                  background: 'rgba(184, 138, 58, 0.08)',
                  border: '1px solid rgba(184, 138, 58, 0.20)',
                  borderRadius: 6,
                  fontSize: 13,
                  fontFamily: 'var(--font-title)',
                  fontWeight: 500,
                  color: 'var(--lotus-dark)',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                }}>
                  {w.word}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
