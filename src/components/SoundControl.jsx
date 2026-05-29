import { useState } from 'react';
import { playSound, stopSound } from '../utils/soundEngine';

const sounds = [
  { type: 'rain1', label: '雨声1', icon: '🌧' },
  { type: 'rain2', label: '雨声2', icon: '🌦' },
  { type: 'fire1', label: '篝火1', icon: '🔥' },
  { type: 'fire2', label: '篝火2', icon: '🪵' },
  { type: 'stream', label: '溪流', icon: '💧' },
  { type: 'sea', label: '海浪', icon: '🌊' },
];

export default function SoundControl() {
  const [on, setOn] = useState(false);
  const [active, setActive] = useState(null);

  function toggle() {
    if (on) {
      stopSound();
      setOn(false);
      setActive(null);
    } else {
      setOn(true);
    }
  }

  function select(type) {
    if (!on) return;
    if (active === type) {
      stopSound();
      setActive(null);
    } else {
      playSound(type);
      setActive(type);
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 8,
      right: 8,
      zIndex: 300,
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        alignItems: 'flex-end',
      }}>
        {/* Toggle */}
        <button
          onClick={toggle}
          title={on ? '关闭音效' : '开启音效'}
          style={{
            width: 36, height: 36,
            borderRadius: '50%',
            border: `2px solid ${on ? 'var(--lotus)' : 'var(--border-medium)'}`,
            background: on ? 'rgba(184, 138, 58, 0.15)' : 'var(--paper-surface)',
            cursor: 'pointer',
            fontSize: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-button)',
            transition: 'all var(--transition-fast)',
            opacity: 0.85,
          }}
        >
          {on ? '🔊' : '🔇'}
        </button>

        {/* Sound type buttons */}
        {on && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            animation: 'fade-in-up 0.25s ease',
          }}>
            {sounds.map(s => (
              <button
                key={s.type}
                onClick={() => select(s.type)}
                title={s.label}
                style={{
                  padding: '5px 12px',
                  borderRadius: 16,
                  border: active === s.type
                    ? '1px solid var(--lotus)'
                    : '1px solid var(--border-medium)',
                  background: active === s.type
                    ? 'rgba(184, 138, 58, 0.15)'
                    : 'var(--paper-surface)',
                  cursor: 'pointer',
                  fontSize: 12,
                  color: active === s.type ? 'var(--lotus)' : 'var(--ink-secondary)',
                  fontFamily: 'var(--font-body)',
                  whiteSpace: 'nowrap',
                  boxShadow: 'var(--shadow-button)',
                  transition: 'all var(--transition-fast)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  opacity: 0.85,
                }}
              >
                <span style={{ fontSize: 14 }}>{s.icon}</span>
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
