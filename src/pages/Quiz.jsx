import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db, getAllVocab } from '../store/drillStore';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateQuiz(vocab, count = 10) {
  const quizVocab = shuffle(vocab).slice(0, count);
  return quizVocab.map(v => {
    const correctDef = v.definitions[0]?.meaning || '';
    const others = shuffle(
      vocab.filter(x => x.word !== v.word)
        .map(x => x.definitions[0]?.meaning || '')
        .filter(d => d && d !== correctDef)
    ).slice(0, 3);
    const options = shuffle([correctDef, ...others.slice(0, 3)]);
    const correctIdx = options.indexOf(correctDef);
    return { word: v.word, phonetic: v.phonetic, pos: v.pos, options, correctIdx, answered: null, correct: null };
  });
}

const paperCard = {
  background: 'var(--paper-surface)',
  border: '1px solid var(--border-light)',
  borderRadius: 16,
  boxShadow: 'var(--shadow-paper)',
};

export default function Quiz() {
  const [quizList, setQuizList] = useState([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mode] = useState('definition');

  useEffect(() => {
    async function init() {
      const vocab = await getAllVocab();
      const filtered = vocab.filter(v => v.definitions && v.definitions.length > 0);
      setQuizList(generateQuiz(filtered, 10));
      setLoading(false);
    }
    init();
  }, []);

  function selectOption(idx) {
    if (selected !== null) return;
    setSelected(idx);
    setQuizList(prev => prev.map((q, i) =>
      i === current ? { ...q, answered: idx, correct: idx === q.correctIdx } : q
    ));
  }

  function nextQuestion() {
    if (current + 1 >= quizList.length) { setDone(true); saveRecord(); }
    else { setCurrent(prev => prev + 1); setSelected(null); }
  }

  async function saveRecord() {
    const correct = quizList.filter(q => q.correct).length;
    const total = quizList.length;
    const records = await db.quizRecords.toArray();
    const last10 = records.slice(-9);
    const improvement = last10.length > 0
      ? (correct / total) - (last10.reduce((s, r) => s + r.correct / r.total, 0) / last10.length) : 0;
    await db.quizRecords.add({ date: Date.now(), total, correct, score: Math.round((correct / total) * 100), mode, improvement: Math.round(improvement * 100) });
  }

  function restart() {
    setCurrent(0); setSelected(null); setDone(false); setLoading(true);
    async function init() {
      const vocab = await getAllVocab();
      const filtered = vocab.filter(v => v.definitions && v.definitions.length > 0);
      setQuizList(generateQuiz(filtered, 10));
      setLoading(false);
    }
    init();
  }

  if (loading) return (
    <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-faded)' }}>生成测验中...</div>
  );

  if (done) {
    const correct = quizList.filter(q => q.correct).length;
    const total = quizList.length;
    const score = Math.round((correct / total) * 100);
    const scoreColor = score >= 80 ? 'var(--night-sea)' : score >= 60 ? 'var(--lotus)' : 'var(--lotus-dark)';
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 60, marginBottom: 14, color: 'var(--lotus)', filter: 'drop-shadow(0 4px 12px rgba(184, 138, 58, 0.30))' }}>✦</div>
        <h2 style={{ fontSize: 24, fontFamily: 'var(--font-title)', fontWeight: 700, color: 'var(--ink-primary)', marginBottom: 8 }}>测验完成</h2>
        <div style={{ ...paperCard, display: 'inline-block', padding: '24px 44px', marginTop: 14 }}>
          <div style={{ fontSize: 52, fontWeight: 800, color: scoreColor }}>{score}</div>
          <div style={{ fontSize: 13, color: 'var(--ink-faded)', marginTop: 4 }}>正确率</div>
          <div style={{ marginTop: 16, display: 'flex', gap: 22, fontSize: 14, color: 'var(--ink-secondary)' }}>
            <span style={{ color: 'var(--night-sea)' }}>✓ {correct}</span>
            <span style={{ color: 'var(--lotus-dark)' }}>✗ {total - correct}</span>
          </div>
        </div>
        <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button onClick={restart} style={{ padding: '10px 24px', background: 'var(--lotus-dark)', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600, boxShadow: 'var(--shadow-button)' }}>
            再来一轮
          </button>
          <Link to="/">
            <button style={{ padding: '10px 24px', background: 'var(--paper-surface)', border: '1px solid var(--border-medium)', borderRadius: 8, cursor: 'pointer', fontSize: 14, color: 'var(--ink-primary)', boxShadow: 'var(--shadow-button)' }}>
              返回首页
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const q = quizList[current];

  function undoLast() {
    setQuizList(prev => prev.map((quiz, i) =>
      i === current ? { ...quiz, answered: null, correct: null } : quiz
    ));
    setSelected(null);
  }

  return (
    <div style={{ padding: '0 0 120px' }}>
      {/* Sticky header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'var(--paper-surface)',
        borderBottom: '1px solid var(--border-medium)',
        padding: '12px 16px',
        boxShadow: '0 2px 12px rgba(30, 44, 35, 0.06)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--ink-faded)' }}>单选题</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-primary)' }}>{current + 1} / {quizList.length}</span>
        </div>
        <div style={{ height: 4, background: 'rgba(184, 138, 58, 0.12)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${((current + 1) / quizList.length) * 100}%`, background: 'var(--lotus-dark)', transition: 'width 0.3s ease' }} />
        </div>
        {selected !== null && (
          <button onClick={undoLast} style={{
            marginTop: 8, padding: '6px 12px',
            background: 'var(--paper-bg)',
            border: '1px solid var(--border-medium)',
            borderRadius: 8,
            cursor: 'pointer', fontSize: 12, color: 'var(--ink-secondary)',
            display: 'flex', alignItems: 'center', gap: 4,
            transition: 'all 150ms ease',
          }}>
            ↩ 撤销选择
          </button>
        )}
      </div>

      {/* Question card */}
      <div style={{ padding: 16 }}>
        <div style={{ ...paperCard, padding: '26px 18px', textAlign: 'center', marginBottom: 18 }}>
          <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '2rem', fontWeight: 700, color: 'var(--ink-primary)', marginBottom: 6 }}>
            {q.word}
          </h2>
          {q.phonetic && <p style={{ fontFamily: 'var(--font-phonetic)', fontSize: 14, color: 'var(--ink-faded)', marginBottom: 6 }}>{q.phonetic}</p>}
          {q.pos && q.pos.length > 0 && (
            <div style={{ display: 'flex', gap: 5, justifyContent: 'center', marginTop: 8 }}>
              {q.pos.map(p => (
                <span key={p} style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: 'rgba(184, 138, 58, 0.10)', color: 'var(--lotus-dark)', border: '1px solid rgba(184, 138, 58, 0.20)' }}>{p}</span>
              ))}
            </div>
          )}
          <p style={{ marginTop: 14, fontSize: 12, color: 'var(--ink-faded)' }}>请选择正确释义</p>
        </div>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {q.options.map((opt, idx) => {
            const isSelected = selected === idx;
            const isCorrect = idx === q.correctIdx;
            const showResult = selected !== null;
            let bg = 'var(--paper-surface)';
            let border = '1px solid var(--border-light)';
            let color = 'var(--ink-primary)';

            if (showResult) {
              if (isCorrect) { bg = 'rgba(61, 90, 74, 0.10)'; border = '2px solid var(--night-sea)'; color = 'var(--night-sea)'; }
              else if (isSelected && !isCorrect) { bg = 'rgba(139, 69, 69, 0.08)'; border = '2px solid var(--lotus-dark)'; color = 'var(--lotus-dark)'; }
            } else if (isSelected) { bg = 'rgba(184, 138, 58, 0.08)'; border = '2px solid var(--lotus)'; }

            return (
              <button key={idx} onClick={() => selectOption(idx)} disabled={selected !== null}
                style={{ padding: '14px 16px', background: bg, border, borderRadius: 10, cursor: selected !== null ? 'default' : 'pointer', fontSize: 14, color, textAlign: 'left', fontFamily: 'var(--font-body)', lineHeight: 1.5, transition: 'all 0.2s ease' }}>
                <span style={{ display: 'inline-block', width: 24, height: 24, borderRadius: '50%', border: `2px solid ${isCorrect ? 'var(--night-sea)' : isSelected ? 'var(--lotus-dark)' : 'var(--border-medium)'}`, background: isCorrect ? 'var(--night-sea)' : isSelected ? 'var(--lotus-dark)' : 'transparent', color: isCorrect || isSelected ? 'white' : 'var(--ink-faded)', textAlign: 'center', lineHeight: '22px', marginRight: 10, fontSize: 12, fontWeight: 700 }}>
                  {isCorrect ? '✓' : isSelected ? '✗' : String.fromCharCode(65 + idx)}
                </span>
                {opt}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom button */}
      {selected !== null && (
        <div style={{
          position: 'fixed', bottom: 72, left: 0, right: 0,
          background: 'var(--paper-surface)',
          borderTop: '1px solid var(--border-medium)',
          padding: '12px 16px', zIndex: 90,
          boxShadow: '0 -4px 16px rgba(30, 44, 35, 0.08)',
        }}>
          <button onClick={nextQuestion} style={{
            width: '100%', padding: '14px',
            background: 'var(--lotus-dark)',
            color: 'white', border: 'none', borderRadius: 8,
            cursor: 'pointer', fontSize: 15, fontWeight: 650,
            boxShadow: 'var(--shadow-button)',
          }}>
            {current + 1 >= quizList.length ? '查看结果' : '下一题 →'}
          </button>
        </div>
      )}
    </div>
  );
}
