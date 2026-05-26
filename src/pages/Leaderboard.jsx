import { useState, useEffect } from 'react';
import { db } from '../store/drillStore';
import './Leaderboard.css';
import './Drill.css';

export default function Leaderboard() {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const allProgress = await db.drillProgress.toArray();
      const sorted = allProgress
        .filter(p => (p.unknownCount || 0) > 0)
        .sort((a, b) => (b.unknownCount || 0) - (a.unknownCount || 0))
        .slice(0, 20);

      const vocab = await db.vocab.toArray();
      const wordMap = {};
      vocab.forEach(v => { wordMap[v.word] = v; });

      setRankings(sorted.map(p => ({
        ...p,
        vocab: wordMap[p.word] || null,
      })));
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="lb-loading">
        <div className="lb-spinner" />
      </div>
    );
  }

  if (rankings.length === 0) {
    return (
      <div className="lb-empty">
        <div className="lb-empty__icon">📋</div>
        <p className="lb-empty__text">暂无记录</p>
        <p className="lb-empty__sub">开始刷词后自动生成排行榜</p>
      </div>
    );
  }

  return (
    <div className="lb">
      <div className="lb-header">
        <div className="lb-header__title">背错排行榜</div>
        <div className="lb-header__sub">错得越多，排名越高</div>
      </div>

      <div className="lb-list">
        {rankings.map((item, i) => {
          const pos = item.vocab?.pos ? item.vocab.pos : [];
          return (
            <div key={item.word} className="lb-item">
              <div className="lb-item__rank">
                {i < 3
                  ? <span className={`lb-rank-medal lb-rank-medal--${i}`}>{['🥇','🥈','🥉'][i]}</span>
                  : <span className="lb-rank-num">{i + 1}</span>
                }
              </div>
              <div className="lb-item__info">
                <div className="lb-item__word-row">
                  <span className="lb-item__word">{item.word}</span>
                  {pos.length > 0 && (
                    <span className="lb-item__pos">{pos[0]}</span>
                  )}
                </div>
                <div className="lb-item__def">
                  {item.vocab?.definitions?.[0]
                    ? (typeof item.vocab.definitions[0] === 'string'
                        ? item.vocab.definitions[0]
                        : item.vocab.definitions[0].meaning)
                    : ''}
                </div>
              </div>
              <div className="lb-item__count">
                <div className="lb-item__count-num">{item.unknownCount}</div>
                <div className="lb-item__count-label">次</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}