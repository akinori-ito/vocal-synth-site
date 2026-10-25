const $ = (id) => document.getElementById(id);
const controls = { pitch: $('pitch'), source: $('source'), larynx: $('larynx'), rear: $('rear'), front: $('front'), opening: $('opening'), level: $('level') };
const presets = {
  a: { rear: 78, front: 22, opening: 76 },
  e: { rear: 46, front: 62, opening: 58 },
  i: { rear: 22, front: 90, opening: 38 },
  o: { rear: 66, front: 26, opening: 44 },
  u: { rear: 72, front: 10, opening: 24 }
};
let ctx, oscillator, sourceGain, personality, f1, f2, radiation, master, analyser, animation;

function valueToF1(rear, opening) { return Math.round(220 + rear * 7.2 + opening * 1.8); }
function valueToF2(front) { return Math.round(650 + front * 17.5); }
function setParam(param, value, t = .035) {
  if (!ctx || !param) return;
  param.cancelScheduledValues(ctx.currentTime);
  param.setTargetAtTime(value, ctx.currentTime, t);
}
function updateTrack(el) {
  el.style.setProperty('--pct', `${(el.value-el.min)/(el.max-el.min)*100}%`);
}
function renderTract() {
  const larynxControl = +controls.larynx.value / 100;
  const rearControl = +controls.rear.value / 100;
  const frontControl = +controls.front.value / 100;
  const opening = +controls.opening.value / 100;
  const larynxWidth = 150 + (1-larynxControl) * 130;
  const larynxHeight = 100 + (1-larynxControl) * 130;
  const lx = 400-larynxWidth, ly = 195-larynxHeight/2;
  const totalOralWidth = 325;
  const rearWidth = 105 + (1-rearControl) * 80;
  const frontWidth = totalOralWidth-rearWidth;
  const rearHeight = 100 + (1-rearControl) * 125;
  const frontHeight = 100 + (1-frontControl) * 125;
  const rx = 500, ry = 195-rearHeight/2, fx = rx+rearWidth, fy = 195-frontHeight/2, right = fx+frontWidth;
  const aperture = 12 + opening * (frontHeight-32);
  const gapTop = 195-aperture/2, gapBottom = 195+aperture/2;
  const larynxRect = $('larynxRect');
  larynxRect.setAttribute('x',lx); larynxRect.setAttribute('y',ly);
  larynxRect.setAttribute('width',larynxWidth); larynxRect.setAttribute('height',larynxHeight);
  $('larynxLabel').setAttribute('x',lx+larynxWidth/2); $('larynxLabel').setAttribute('y',Math.max(ly-18,22));
  const rearRect = $('rearRect');
  rearRect.setAttribute('x',rx); rearRect.setAttribute('y',ry); rearRect.setAttribute('width',rearWidth); rearRect.setAttribute('height',rearHeight);
  $('rearLabel').setAttribute('x',rx+rearWidth/2); $('rearLabel').setAttribute('y',Math.max(ry-18,22));
  const frontFill = $('frontFill');
  frontFill.setAttribute('x',fx); frontFill.setAttribute('y',fy); frontFill.setAttribute('width',frontWidth); frontFill.setAttribute('height',frontHeight);
  $('frontPath').setAttribute('d',`M${fx} ${fy}H${right}V${gapTop} M${right} ${gapBottom}V${fy+frontHeight}H${fx}Z`);
  $('frontLabel').setAttribute('x',fx+frontWidth/2); $('frontLabel').setAttribute('y',Math.max(fy-18,22));
  $('openingLine').setAttribute('x1',right+18); $('openingLine').setAttribute('x2',right+18);
  $('openingLine').setAttribute('y1',gapTop); $('openingLine').setAttribute('y2',gapBottom);
  $('openingLabel').setAttribute('x',right+18); $('openingLabel').setAttribute('y',Math.max(gapTop-10,18));
  $('openingLabel').textContent=`${controls.opening.value}% OPEN`;
}
function updateUI() {
  Object.values(controls).forEach(updateTrack);
  renderTract();
  const f1v = valueToF1(+controls.rear.value, +controls.opening.value);
  const f2v = valueToF2(+controls.front.value);
  $('pitchOut').value = `${controls.pitch.value} Hz`;
  $('frequencyReadout').textContent = `${controls.pitch.value} Hz`;
  $('larynxOut').value = +controls.larynx.value < 34 ? 'Deep' : +controls.larynx.value > 66 ? 'Clear' : 'Balanced';
  $('rearOut').value = `${100-controls.rear.value}%`;
  $('frontOut').value = `${100-controls.front.value}%`;
  $('openingOut').value = `${controls.opening.value}%`;
  $('levelOut').value = `${controls.level.value}%`;
  if (!ctx) return;
  setParam(oscillator.frequency, +controls.pitch.value);
  setParam(sourceGain.gain, .13 + (+controls.source.value / 100) * .18);
  setParam(personality.frequency, 2100 + (+controls.larynx.value / 100) * 1500);
  setParam(personality.gain, 5 + Math.abs(+controls.larynx.value-50) * .12);
  setParam(f1.frequency, f1v); setParam(f2.frequency, f2v);
  setParam(f1.Q, 5 + (+controls.rear.value / 100) * 5);
  setParam(f2.Q, 7 + (+controls.front.value / 100) * 6);
  const open = +controls.opening.value / 100;
  setParam(radiation.frequency, 900 + open * 5500);
  setParam(master.gain, Math.pow(+controls.level.value / 100, 1.6) * (.12 + open * .2));
}

function makeGlottalWave(audio) {
  const n = 32, real = new Float32Array(n), imag = new Float32Array(n);
  const brightness = .45 + (+controls.source.value / 100) * .8;
  for (let i = 1; i < n; i++) {
    const rolloff = 1 / Math.pow(i, brightness);
    imag[i] = rolloff * (i % 2 ? 1 : .72);
  }
  return audio.createPeriodicWave(real, imag, { disableNormalization: false });
}
function draw() {
  const canvas = $('scope'), dpr = Math.min(devicePixelRatio || 1, 2);
  const rect = canvas.getBoundingClientRect();
  if (canvas.width !== rect.width*dpr || canvas.height !== rect.height*dpr) {
    canvas.width = rect.width*dpr; canvas.height = rect.height*dpr;
  }
  const g = canvas.getContext('2d'), data = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteTimeDomainData(data); g.setTransform(dpr,0,0,dpr,0,0);
  g.clearRect(0,0,rect.width,rect.height); g.strokeStyle='#c9f75c'; g.lineWidth=2;
  g.beginPath();
  for(let i=0;i<data.length;i++) { const x=i/(data.length-1)*rect.width, y=(data[i]/255)*rect.height; i?g.lineTo(x,y):g.moveTo(x,y); }
  g.stroke(); animation=requestAnimationFrame(draw);
}
async function start() {
  ctx = ctx || new (window.AudioContext || window.webkitAudioContext)(); await ctx.resume();
  if (!oscillator) {
    oscillator=ctx.createOscillator(); oscillator.setPeriodicWave(makeGlottalWave(ctx));
    sourceGain=ctx.createGain(); personality=ctx.createBiquadFilter(); f1=ctx.createBiquadFilter(); f2=ctx.createBiquadFilter(); radiation=ctx.createBiquadFilter(); master=ctx.createGain(); analyser=ctx.createAnalyser();
    personality.type='peaking'; personality.Q.value=2.2; f1.type='peaking'; f2.type='peaking'; f1.gain.value=15; f2.gain.value=13; radiation.type='highshelf'; radiation.gain.value=5; analyser.fftSize=1024; master.gain.value=0;
    oscillator.connect(sourceGain).connect(personality).connect(f1).connect(f2).connect(radiation).connect(master).connect(analyser).connect(ctx.destination);
    oscillator.start(); updateUI(); draw();
  } else { updateUI(); }
  $('power').setAttribute('aria-pressed','true'); document.querySelector('.power-label').textContent='Stop sound'; $('status').textContent='Synthesizing'; $('status').classList.add('live'); document.body.classList.add('playing');
}
async function stop() {
  if(ctx) { setParam(master.gain,0,.02); await new Promise(r=>setTimeout(r,90)); await ctx.suspend(); }
  $('power').setAttribute('aria-pressed','false'); document.querySelector('.power-label').textContent='Start sound'; $('status').textContent='Audio off'; $('status').classList.remove('live'); document.body.classList.remove('playing');
}
$('power').addEventListener('click',()=> $('power').getAttribute('aria-pressed')==='true' ? stop() : start());
Object.entries(controls).forEach(([name,el])=>el.addEventListener('input',()=>{ document.querySelectorAll('[data-vowel]').forEach(b=>b.classList.remove('active')); if(name==='source' && oscillator && ctx) oscillator.setPeriodicWave(makeGlottalWave(ctx)); updateUI(); }));
document.querySelectorAll('[data-vowel]').forEach(btn=>btn.addEventListener('click',()=>{ const p=presets[btn.dataset.vowel]; Object.entries(p).forEach(([k,v])=>controls[k].value=v); document.querySelectorAll('[data-vowel]').forEach(b=>b.classList.toggle('active',b===btn)); updateUI(); }));
updateUI();
