import Dexie from 'dexie';

export const db = new Dexie('VocabAntiqueHouse_v2');

db.version(1).stores({
  vocab: 'word',
  drillProgress: 'word',
});

// Load vocab data
export async function initVocab() {
  const count = await db.vocab.count();
  if (count === 0) {
    const vocabData = await import('../data/vocab.json');
    const wordsObj = vocabData.words || {};
    const entries = Object.entries(wordsObj).map(([word, data]) => {
      const rawDefs = data.definitions || [];
      const definitions = rawDefs.map(d => {
        if (typeof d === 'string') return { meaning: d };
        if (d && typeof d === 'object') return d;
        return { meaning: String(d) };
      });
      const rawMem = data.memory;
      let memory = [];
      if (typeof rawMem === 'string' && rawMem.trim()) {
        memory = [{ type: '词根词缀', content: rawMem }];
      } else if (Array.isArray(rawMem)) {
        memory = rawMem;
      }
      return { word, ...data, definitions, memory };
    });
    await db.vocab.bulkPut(entries);
    console.log('[DB] Vocab imported:', entries.length, 'words');
  }
}

export async function getAllVocab() {
  return db.vocab.toArray();
}

export async function getDrillProgress(word) {
  return db.drillProgress.get(word);
}

export async function setDrillResult(word, known) {
  const existing = await db.drillProgress.get(word);
  const now = Date.now();
  if (existing) {
    existing.total = (existing.total || 0) + 1;
    existing.correct = (existing.correct || 0) + (known ? 1 : 0);
    existing.lastDrill = now;
    existing.unknownCount = known ? 0 : Math.min((existing.unknownCount || 0) + 1, 9);
    await db.drillProgress.put(existing);
  } else {
    await db.drillProgress.put({
      word,
      total: 1,
      correct: known ? 1 : 0,
      lastDrill: now,
      unknownCount: known ? 0 : 1,
    });
  }
}

export async function getDrillQueue() {
  const allVocab = await db.vocab.toArray();
  const allProgress = await db.drillProgress.toArray();
  const progressMap = {};
  allProgress.forEach(p => { progressMap[p.word] = p; });

  const POS_PRIORITY = { n: 0, v: 1, adj: 2, adv: 3 };

  return allVocab
    .map(v => ({
      ...v,
      progress: progressMap[v.word] || { unknownCount: 0, total: 0 },
    }))
    .sort((a, b) => {
      // 1. unknownCount desc (错得多优先)
      const ua = a.progress.unknownCount || 0;
      const ub = b.progress.unknownCount || 0;
      if (ua !== ub) return ub - ua;
      // 2. 词性优先级 n>v>adj>adv
      const posA = POS_PRIORITY[a.pos?.[0]] ?? 9;
      const posB = POS_PRIORITY[b.pos?.[0]] ?? 9;
      if (posA !== posB) return posA - posB;
      // 3. 随机
      return Math.random() - 0.5;
    });
}