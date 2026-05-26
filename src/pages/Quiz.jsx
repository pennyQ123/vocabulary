import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db, getAllVocab } from '../utils/storage';

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
      vocab
        .filter(x => x.word !== v.word)
        .map(x => x.definitions[0]?.meaning || '')
        .filter(d => d && d !== correctDef)
    ).slice(0, 3);
    const options = shuffle([correctDef, ...others.slice(0, 3)]);
    const correctIdx = options.indexOf(correctDef);
    return {
      word: v.word,
      phonetic: v.phonetic,
      pos: v.pos,
      options,
      correctIdx,
      answered: null,
      correct: null,
    };
  });
}

export default function Quiz() {
  const [quizList, setQuizList] = useState([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('definition');

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
    if (current + 1 >= quizList.length) {
      setDone(true);
      saveRecord();
    } else {
      setCurrent(prev => prev + 1);
      setSelected(null);
    }
  }

  async function saveRecord() {
    const correct = quizList.filter(q => q.correct).length;
    const total = quizList.length;
    const records = await db.quizRecords.toArray();
    const last10 = records.slice(-9);
    const improvement = last10.length > 0
      ? (correct / total) - (last10.reduce((s, r) => s + r.correct / r.total, 0) / last10.length)
      : 0;
    await db.quizRecords.add({
      date: Date.now(),
      total,
      correct,
      score: Math.round((correct / total) * 100),
      mode,
      improvement: Math.round(improvement * 100),
    });
  }

  function restart() {
    setCurrent(0);
    setSelected(null);
    setDone(false);
    setLoading(true);
    async function init() {
      const vocab = await getAllVocab();
      const filtered = vocab.filter(v => v.definitions && v.definitions.length > 0);
      setQuizList(generateQuiz(filtered, 10));
      setLoading(false);
    }
    init();
  }

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink-tertiary)' }}>
        生成测验中...
      </div>
    );
  }

  if (done) {
    const correct = quizList.filter(q => q.correct).length;
    const total = quizList.length;
    const score = Math.round((correct / total) * 100);
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 12 }}>🎉</div>
        <h2 style={{
          fontSize: 'var(--text-2xl)',
          fontFamily: 'var(--font-title)',
          color: 'var(--ink-primary)',
          marginBottom: 8,
        }}>
          测验完成
        </h2>
        <div style={{
          display: 'inline-block',
          padding: '24px 40px',
          background: 'var(--paper-mid)',
          borderRadius: 'var(--radius-lg)',
          marginTop: 12,
          boxShadow: 'var(--shadow-card)',
        }}>
          <div style={{ fontSize: 48, fontWeight: 700, color: 'var(--wine-red)' }}>
            {score}
          </div>
          <div style={{ fontSize: 14, color: 'var(--ink-tertiary)' }}>正确率</div>
          <div style={{
            marginTop: 16, display: 'flex', gap: 20,
            fontSize: 14, color: 'var(--ink-secondary)',
          }}>
            <span>✓ {correct}</span>
            <span style={{ color: 'var(--wine-red)' }}>✗ {total - correct}</span>
          </div>
        </div>
        <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button onClick={restart} style={{
            padding: '10px 24px',
            background: 'var(--wine-red)', color: 'white',
            border: 'none', borderRadius: 'var(--radius-md)',
            cursor: 'pointer', fontSize: 14,
          }}>
            再来一轮
          </button>
          <Link to="/">
            <button style={{
              padding: '10px 24px',
              background: 'var(--paper-base)',
              border: '1px solid var(--paper-shadow)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer', fontSize: 14,
              color: 'var(--ink-primary)',
            }}>
              返回首页
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const q = quizList[current];

  return (
    <div style={{ padding: '0 0 120px' }}>
      {/* 顶部进度 */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(245, 237, 224, 0.98)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid var(--paper-shadow)',
        padding: '12px 16px',
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 8,
        }}>
          <span style={{ fontSize: 13, color: 'var(--ink-tertiary)' }}>单选题</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-primary)' }}>
            {current + 1} / {quizList.length}
          </span>
        </div>
        <div style={{
          height: 4,
          background: 'var(--paper-shadow)',
          borderRadius: 2,
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${((current + 1) / quizList.length) * 100}%`,
            background: 'var(--wine-red)',
            transition: 'width 0.3s ease',
          }} />
        </div>
      </div>

      {/* 题目 */}
      <div style={{ padding: 16 }}>
        <div style={{
          padding: '24px 16px',
          background: 'var(--paper-mid)',
          borderRadius: 'var(--radius-lg)',
          textAlign: 'center',
          border: '1px solid var(--paper-shadow)',
          marginBottom: 20,
        }}>
          <h2 style={{
            fontFamily: 'var(--font-word)',
            fontSize: '1.75rem',
            fontWeight: 700,
            color: 'var(--ink-primary)',
            marginBottom: 6,
          }}>
            {q.word}
          </h2>
          {q.phonetic && (
            <p style={{
              fontFamily: 'var(--font-phonetic)',
              fontSize: 'var(--text-base)',
              color: 'var(--ink-tertiary)',
            }}>
              {q.phonetic}
            </p>
          )}
          {q.pos && q.pos.length > 0 && (
            <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 8 }}>
              {q.pos.map(p => (
                <span key={p} style={{
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 10,
                  background: 'var(--paper-base)',
                  color: 'var(--ink-secondary)',
                }}>
                  {p}
                </span>
              ))}
            </div>
          )}
          <p style={{
            marginTop: 12,
            fontSize: 13,
            color: 'var(--ink-tertiary)',
          }}>
            请选择正确释义
          </p>
        </div>

        {/* 选项 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {q.options.map((opt, idx) => {
            const isSelected = selected === idx;
            const isCorrect = idx === q.correctIdx;
            const showResult = selected !== null;
            let bg = 'var(--paper-base)';
            let border = '1px solid var(--paper-shadow)';
            let color = 'var(--ink-primary)';

            if (showResult) {
              if (isCorrect) {
                bg = 'rgba(45, 90, 74, 0.15)';
                border = '2px solid var(--ink-green)';
                color = 'var(--ink-green)';
              } else if (isSelected && !isCorrect) {
                bg = 'rgba(139, 58, 58, 0.15)';
                border = '2px solid var(--wine-red)';
                color = 'var(--wine-red)';
              }
            } else if (isSelected) {
              bg = 'var(--paper-mid)';
              border = '2px solid var(--wine-red)';
            }

            return (
              <button
                key={idx}
                onClick={() => selectOption(idx)}
                disabled={selected !== null}
                style={{
                  padding: '14px 16px',
                  background: bg,
                  border: border,
                  borderRadius: 'var(--radius-md)',
                  cursor: selected !== null ? 'default' : 'pointer',
                  fontSize: 14,
                  color,
                  textAlign: 'left',
                  fontFamily: 'var(--font-body)',
                  lineHeight: 1.5,
                  transition: 'all 0.2s ease',
                  animation: showResult && isCorrect ? 'correct-pulse 0.3s ease' :
                             showResult && isSelected && !isCorrect ? 'wrong-shake 0.3s ease' : 'none',
                }}
              >
                <span style={{
                  display: 'inline-block',
                  width: 24, height: 24,
                  borderRadius: '50%',
                  border: `2px solid ${isCorrect ? 'var(--ink-green)' : isSelected ? 'var(--wine-red)' : 'var(--paper-shadow)'}`,
                  background: isCorrect ? 'var(--ink-green)' : isSelected ? 'var(--wine-red)' : 'transparent',
                  color: isCorrect || isSelected ? 'white' : 'var(--ink-tertiary)',
                  textAlign: 'center', lineHeight: '22px',
                  marginRight: 10, fontSize: 12,
                  fontWeight: 700,
                }}>
                  {isCorrect ? '✓' : isSelected ? '✗' : String.fromCharCode(65 + idx)}
                </span>
                {opt}
              </button>
            );
          })}
        </div>
      </div>

      {/* 底部按钮 */}
      {selected !== null && (
        <div style={{
          position: 'fixed', bottom: 72, left: 0, right: 0,
          background: 'rgba(245, 237, 224, 0.98)',
          backdropFilter: 'blur(8px)',
          borderTop: '1px solid var(--paper-shadow)',
          padding: '12px 16px',
          zIndex: 90,
        }}>
          <button
            onClick={nextQuestion}
            style={{
              width: '100%', padding: '14px',
              background: 'var(--wine-red)', color: 'white',
              border: 'none', borderRadius: 'var(--radius-md)',
              cursor: 'pointer', fontSize: 15, fontWeight: 600,
            }}
          >
            {current + 1 >= quizList.length ? '查看结果' : '下一题'}
          </button>
        </div>
      )}
    </div>
  );
}