let audioCtx = null;
let masterGain = null;
let currentType = null;
let playing = false;
let activeNodes = [];
let rainAudios = [];

function getContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.25;
    masterGain.connect(audioCtx.destination);
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function stopAll() {
  activeNodes.forEach(n => {
    try { n.stop(); } catch (_) {}
    try { n.disconnect(); } catch (_) {}
    try { n.pause(); n.currentTime = 0; } catch (_) {}
  });
  activeNodes = [];
  rainAudios = [];
}

function createNoiseBuffer(ctx, duration) {
  const size = duration * ctx.sampleRate;
  const buffer = ctx.createBuffer(1, size, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < size; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

function noiseSource(ctx) {
  const src = ctx.createBufferSource();
  src.buffer = createNoiseBuffer(ctx, 2);
  src.loop = true;
  return src;
}

const BASE = import.meta.env.BASE_URL;

// ---- Rain 1 (森林雨滴) ----
function startRain1() {
  const a = new Audio(BASE + 'audio/rain-forest.mp3');
  a.loop = true;
  a.volume = 0.5;
  a.play().catch(() => {});
  rainAudios.push(a);
  activeNodes.push(a);
}

// ---- Rain 2 (门廊雨声) ----
function startRain2() {
  const a = new Audio(BASE + 'audio/rain-porch.mp3');
  a.loop = true;
  a.volume = 0.5;
  a.play().catch(() => {});
  rainAudios.push(a);
  activeNodes.push(a);
}

// ---- Fire 1 (森林篝火) ----
function startFire1() {
  const a = new Audio(BASE + 'audio/forest-fire.mp3');
  a.loop = true;
  a.volume = 0.5;
  a.play().catch(() => {});
  rainAudios.push(a);
  activeNodes.push(a);
}

// ---- Fire 2 (篝火堆) ----
function startFire2() {
  const a = new Audio(BASE + 'audio/bonfire.mp3');
  a.loop = true;
  a.volume = 0.5;
  a.play().catch(() => {});
  rainAudios.push(a);
  activeNodes.push(a);
}

// ---- Stream (森林溪流) ----
function startStream() {
  const a = new Audio(BASE + 'audio/forest-stream.mp3');
  a.loop = true;
  a.volume = 0.5;
  a.play().catch(() => {});
  rainAudios.push(a);
  activeNodes.push(a);
}

// ---- Sea (海浪) ----
function startSea() {
  const a = new Audio(BASE + 'audio/sea-surf.mp3');
  a.loop = true;
  a.volume = 0.5;
  a.play().catch(() => {});
  rainAudios.push(a);
  activeNodes.push(a);
}

// ---- Campfire (gentle crackle) ----
function startCampfire() {
  const ctx = getContext();

  // Deep warm rumble
  const deepSrc = noiseSource(ctx);
  const deepLP = ctx.createBiquadFilter();
  deepLP.type = 'lowpass';
  deepLP.frequency.value = 180;
  const deepGain = ctx.createGain();
  deepGain.gain.value = 0.3;
  deepSrc.connect(deepLP);
  deepLP.connect(deepGain);
  deepGain.connect(masterGain);
  deepSrc.start();
  activeNodes.push(deepSrc, deepLP, deepGain);

  // Mid crackle layer
  const crackSrc = noiseSource(ctx);
  const crackBP = ctx.createBiquadFilter();
  crackBP.type = 'bandpass';
  crackBP.frequency.value = 600;
  crackBP.Q.value = 1.5;
  const crackGain = ctx.createGain();
  crackGain.gain.value = 0.25;
  // Gentle irregular crackle via slow LFO
  const cLfo = ctx.createOscillator();
  cLfo.frequency.value = 1.2;
  const cLfoGain = ctx.createGain();
  cLfoGain.gain.value = 0.4;
  cLfo.connect(cLfoGain);
  cLfoGain.connect(crackGain.gain);
  cLfo.start();
  crackSrc.connect(crackBP);
  crackBP.connect(crackGain);
  crackGain.connect(masterGain);
  crackSrc.start();
  activeNodes.push(crackSrc, crackBP, crackGain, cLfo, cLfoGain);

  // Light pop layer
  const popSrc = noiseSource(ctx);
  const popBP = ctx.createBiquadFilter();
  popBP.type = 'highpass';
  popBP.frequency.value = 2000;
  const popGain = ctx.createGain();
  popGain.gain.value = 0.08;
  popSrc.connect(popBP);
  popBP.connect(popGain);
  popGain.connect(masterGain);
  popSrc.start();
  activeNodes.push(popSrc, popBP, popGain);
}

// ---- public API ----
export function playSound(type) {
  if (currentType === type && playing) return;
  stopAll();
  currentType = type;
  playing = true;

  switch (type) {
    case 'white': startWhiteNoise(); break;
    case 'rain1': startRain1(); break;
    case 'rain2': startRain2(); break;
    case 'fire1': startFire1(); break;
    case 'fire2': startFire2(); break;
    case 'stream': startStream(); break;
    case 'sea': startSea(); break;
    default: playing = false; return;
  }
}

export function stopSound() {
  stopAll();
  playing = false;
  currentType = null;
}

export function isPlaying() {
  return playing;
}

export function setVolume(v) {
  if (masterGain) {
    masterGain.gain.value = Math.max(0, Math.min(1, v));
  }
}
