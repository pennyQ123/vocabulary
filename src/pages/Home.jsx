import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllVocab, db } from '../utils/storage';
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

      // 统计已学习的
      const mem = await db.memory.toArray();
      const learnedCount = mem.filter(m => m.level > 0).length;
      setLearned(learnedCount);

      // 待复习数
      const now = Date.now();
      setDueCount(mem.filter(m => m.nextReview && m.nextReview <= now).length);

      // 新词数 = 总词数 - 已学习词数
      setNewCount(vocab.length - learnedCount);

      // 最近学习的词（取最新10条记忆记录）
      const recent = mem
        .filter(m => m.lastReview)
        .sort((a, b) => b.lastReview - a.lastReview)
        .slice(0, 10);

      // 匹配词汇详情
      const wordMap = {};
      vocab.forEach(v => wordMap[v.word] = v);
      setRecentWords(recent.map(r => wordMap[r.word]).filter(Boolean).slice(0, 8));

      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink-tertiary)' }}>加载中...</div>;
  }

  return (
    <div style={{ padding: '16px', maxWidth: 600, margin: '0 auto' }}>
      {/* Logo区 */}
      <div style={{ textAlign: 'center', padding: '24px 0 16px' }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>📖</div>
        <h1 style={{
          fontFamily: 'var(--font-title)',
          fontSize: 'var(--text-2xl)',
          color: 'var(--ink-primary)',
          fontWeight: 600,
          letterSpacing: '0.05em',
        }}>
          词汇故纸屋
        </h1>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-tertiary)', marginTop: 4 }}>
          IELTS 易混淆词辨析记忆系统
        </p>
      </div>

      {/* 今日任务 */}
      <div className="card" style={{
        background: 'var(--paper-mid)', borderRadius: 'var(--radius-lg)',
        padding: 20, marginBottom: 16, boxShadow: 'var(--shadow-card)',
      }}>
        <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, marginBottom: 16 }}>
          今日任务
        </h2>

        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{
            flex: 1, background: 'var(--paper-base)', borderRadius: 'var(--radius-md)',
            padding: 16, textAlign: 'center', border: '1px solid var(--paper-shadow)',
          }}>
            <div style={{ fontSize: 28, marginBottom: 4 }}>📚</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--wine-red)' }}>{dueCount}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-tertiary)' }}>待复习</div>
            {dueCount > 0 && (
              <Link to="/review">
                <button style={{
                  marginTop: 8, padding: '6px 16px',
                  background: 'var(--wine-red)', color: 'white',
                  borderRadius: 'var(--radius-sm)', fontSize: 12,
                  border: 'none', cursor: 'pointer',
                }}>
                  开始复习
                </button>
              </Link>
            )}
          </div>

          <div style={{
            flex: 1, background: 'var(--paper-base)', borderRadius: 'var(--radius-md)',
            padding: 16, textAlign: 'center', border: '1px solid var(--paper-shadow)',
          }}>
            <div style={{ fontSize: 28, marginBottom: 4 }}>📝</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--ink-green)' }}>{newCount}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-tertiary)' }}>新词</div>
            <Link to="/library">
              <button style={{
                marginTop: 8, padding: '6px 16px',
                background: 'var(--ink-green)', color: 'white',
                borderRadius: 'var(--radius-sm)', fontSize: 12,
                border: 'none', cursor: 'pointer',
              }}>
                学习新词
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* 学习入口 */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <Link to="/library" style={{ flex: 1 }}>
          <div style={{
            background: 'var(--paper-mid)', borderRadius: 'var(--radius-lg)',
            padding: 20, textAlign: 'center', boxShadow: 'var(--shadow-card)',
            cursor: 'pointer', transition: 'transform var(--transition-fast)',
          }}>
            <div style={{ fontSize: 24, marginBottom: 4 }}>📚</div>
            <div style={{ fontWeight: 600, marginBottom: 2 }}>词库浏览</div>
            <div style={{ fontSize: 12, color: 'var(--ink-tertiary)' }}>{total}词汇</div>
          </div>
        </Link>

        <Link to="/quiz" style={{ flex: 1 }}>
          <div style={{
            background: 'var(--paper-mid)', borderRadius: 'var(--radius-lg)',
            padding: 20, textAlign: 'center', boxShadow: 'var(--shadow-card)',
            cursor: 'pointer',
          }}>
            <div style={{ fontSize: 24, marginBottom: 4 }}>📋</div>
            <div style={{ fontWeight: 600, marginBottom: 2 }}>测验中心</div>
            <div style={{ fontSize: 12, color: 'var(--ink-tertiary)' }}>多种题型</div>
          </div>
        </Link>
      </div>

      {/* 学习数据 */}
      <div style={{
        background: 'var(--paper-mid)', borderRadius: 'var(--radius-lg)',
        padding: 20, boxShadow: 'var(--shadow-card)', marginBottom: 16,
      }}>
        <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, marginBottom: 16 }}>
          学习数据
        </h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink-primary)' }}>{total}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-tertiary)' }}>总词数</div>
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink-green)' }}>{learned}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-tertiary)' }}>已学习</div>
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--amber)' }}>{dueCount}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-tertiary)' }}>待复习</div>
          </div>
        </div>
      </div>

      {/* 最近学习 */}
      {recentWords.length > 0 && (
        <div style={{
          background: 'var(--paper-mid)', borderRadius: 'var(--radius-lg)',
          padding: 20, boxShadow: 'var(--shadow-card)',
        }}>
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, marginBottom: 12 }}>
            最近学习
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {recentWords.map(w => (
              <Link key={w.word} to={`/word/${w.word}`}>
                <span style={{
                  padding: '4px 12px',
                  background: 'var(--paper-base)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--text-sm)',
                  fontFamily: 'var(--font-word)',
                  border: '1px solid var(--paper-shadow)',
                  cursor: 'pointer',
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