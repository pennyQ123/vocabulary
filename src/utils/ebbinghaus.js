// 艾宾浩斯遗忘曲线复习算法 (SM-2 based)

// 复习间隔表（天）Lv.1-6
export const INTERVALS = [1, 3, 7, 14, 30, 60];

// 优先级
export const PRIORITY = {
  CRITICAL: 0,   // 连续错误≥3
  HIGH: 1,       // 连续错误=2
  OVERDUE_7: 2,  // 逾期≥7天
  OVERDUE_1_6: 3, // 逾期1-6天
  NEW: 4,       // 新词
};

// 计算下一次复习时间
// quality: 1=模糊/不记得, 2=记得, 3=牢记
// record: { word, level, interval, easeFactor, nextReview, lastReview, errorCount }
export function calcNextReview(quality, record) {
  const current = record || {};
  const level = current.level || 0;
  const easeFactor = current.easeFactor || 2.5;
  const interval = current.interval || 1;
  const errorCount = current.errorCount || 0;

  if (quality === 1) {
    // 模糊 → 退一步，缩短间隔
    const newLevel = Math.max(0, level - 1);
    const newInterval = level === 0 ? 1 : Math.max(1, Math.round(interval * 0.5));
    return {
      level: newLevel,
      interval: newInterval,
      easeFactor,
      nextReview: Date.now() + newInterval * 86400000,
      lastReview: Date.now(),
    };
  }

  if (quality === 2) {
    // 记得 → 正常进度
    const newLevel = Math.min(level + 1, 6);
    const idx = Math.min(newLevel, INTERVALS.length - 1);
    const newInterval = INTERVALS[idx] || (interval < 7 ? 3 : interval * 2);
    return {
      level: newLevel,
      interval: newInterval,
      easeFactor,
      nextReview: Date.now() + newInterval * 86400000,
      lastReview: Date.now(),
    };
  }

  // quality === 3: 牢记 → 加速升级
  const newLevel = Math.min(level + 2, 6);
  const idx = Math.min(newLevel, INTERVALS.length - 1);
  const newInterval = INTERVALS[idx] || (interval < 7 ? 7 : interval * 2.5);
  return {
    level: newLevel,
    interval: newInterval,
    easeFactor,
    nextReview: Date.now() + newInterval * 86400000,
    lastReview: Date.now(),
  };
}

// 获取优先级
export function getPriority(record) {
  if (!record) return PRIORITY.NEW;

  if ((record.errorCount || 0) >= 3) return PRIORITY.CRITICAL;
  if ((record.errorCount || 0) === 2) return PRIORITY.HIGH;

  if (!record.lastReview) return PRIORITY.NEW;

  const overdueDays = (Date.now() - (record.nextReview || 0)) / 86400000;
  if (overdueDays >= 7) return PRIORITY.OVERDUE_7;
  if (overdueDays >= 1) return PRIORITY.OVERDUE_1_6;
  return PRIORITY.NEW;
}

// 排序复习队列
export function sortReviewQueue(records) {
  return records
    .map(r => ({ ...r, _priority: getPriority(r.mem || r) }))
    .sort((a, b) => a._priority - b._priority);
}

// 获取间隔描述
export function getIntervalLabel(level) {
  const idx = Math.min(level || 1, INTERVALS.length - 1);
  return INTERVALS[idx] + '天';
}

// 获取等级描述
export function getLevelLabel(level) {
  const labels = ['未学习', 'Lv.1', 'Lv.2', 'Lv.3', 'Lv.4', 'Lv.5', '永久记忆'];
  return labels[level] || labels[0];
}