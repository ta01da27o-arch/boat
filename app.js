// app.js (ES module)
const VIEW = document.getElementById('view');
const dateLabel = document.getElementById('dateLabel');
const globalHit = document.getElementById('globalHit');
const refreshBtn = document.getElementById('refreshBtn');
const tplBack = document.getElementById('tpl-back');

let DATA = null;
let STATE = { screen: 'venues', venueId: null, raceNo: null };

// date formatting
function fmtDateIso(iso){
  const d = iso ? new Date(iso) : new Date();
  return d.toLocaleDateString('ja-JP', {year:'numeric', month:'2-digit', day:'2-digit', weekday:'short'});
}

// load data (network-first, cache-bust optional)
async function loadData(force=false){
  try{
    const url = './data.json' + (force ? `?t=${Date.now()}` : '');
    const res = await fetch(url, { cache: 'no-store' });
    if(!res.ok){
      throw new Error(`HTTP ${res.status}`);
    }
    const text = await res.text();
    // quick protection: if returned HTML (starts with <), throw meaningful error
    if(text.trim().startsWith('<')){
      throw new Error('data.json が見つからないか HTML が返っています（パスを確認）');
    }
    DATA = JSON.parse(text);
    dateLabel.textContent = fmtDateIso(DATA.date || new Date().toISOString());
    globalHit.textContent = (DATA.ai_accuracy != null) ? `${DATA.ai_accuracy}%` : '--%';
    return true;
  }catch(err){
    DATA = null;
    VIEW.innerHTML = `<div class="card">データ取得エラー：${err.message}.<br>data.json を同じフォルダに置いてください。</div>`;
    console.error(err);
    return false;
  }
}

// ranking symbols: top->◎ (red), 2->○, 3->△, 4->✕, 5->ー, 6->ー
function rankSymbols(values){
  const indexed = values.map((v,i)=>({v:Number(v)||0,i}));
  indexed.sort((a,b)=>b.v - a.v);
  const marks = ["◎","○","△","✕","ー","ー"];
  const out = Array(values.length).fill("ー");
  indexed.forEach((it, idx)=>{ out[it.i] = marks[idx] || 'ー'; });
  return out;
}

// render venues grid (always 24 venues)
function renderVenues(){
  if(!DATA){ VIEW.innerHTML = '<div class="card">データがありません</div>'; return; }
  const venues = DATA.venues;
  const html = `<section class="card"><h2>競艇場一覧</h2><div class="venues-grid">` +
    venues.map(v=>`
      <div class="venue" data-vid="${v.id}">
        <div class="venue-name">${v.name}</div>
        <div class="venue-hit">的中率: ${(v.hitRate!=null)? v.hitRate+'%':'--'}</div>
        <div class="venue-actions">
          <button class="btn-venue ${v.hasRacesToday? '':'disabled'}" data-vid="${v.id}" ${v.hasRacesToday? '':'disabled'}>${v.hasRacesToday? '開催中' : '本日無し'}</button>
        </div>
      </div>
    `).join('') + `</div></section>`;
  VIEW.innerHTML = html;

  VIEW.querySelectorAll('.btn-venue').forEach(b=>{
    b.addEventListener('click', ()=>{
      const vid = b.dataset.vid;
      STATE.screen = 'races'; STATE.venueId = vid; render();
    });
  });
}

// render races for current venue (1..12) in 3x4 grid
function renderRaces(){
  const venue = (DATA.venues || []).find(v=>String(v.id) === String(STATE.venueId));
  if(!venue){ renderVenues(); return; }
  const venueRaces = (DATA.races && DATA.races[venue.id]) || (venue.races || []);
  const hasRaceNumber = (no) => !!(venueRaces.find(r=>r.number===no) || venue.races && venue.races.find(r=>r.no===no));
  const html = `<section class="card">
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <h2>${venue.name} - レース選択</h2><div><button class="btn" id="backToVenues">戻る</button></div>
    </div>
    <div class="race-grid">` +
    Array.from({length:12}, (_,i)=>i+1).map(no=>`<button class="race-btn ${hasRaceNumber(no)? '' : 'off'}" data-rno="${no}" ${hasRaceNumber(no)? '' : 'disabled'}>${no}R</button>`).join('') +
    `</div></section>`;
  VIEW.innerHTML = html;

  document.getElementById('backToVenues').addEventListener('click', ()=>{ STATE.screen='venues'; STATE.venueId=null; render(); });
  VIEW.querySelectorAll('.race-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{ STATE.screen='race'; STATE.raceNo = Number(btn.dataset.rno); render(); });
  });
}

// render single race (出走表)
function renderRace(){
  const venue = (DATA.venues || []).find(v=>String(v.id) === String(STATE.venueId));
  if(!venue){ renderVenues(); return; }

  // find race: prefer DATA.races[venue.id], else venue.races
  let race = null;
  if(DATA.races && DATA.races[venue.id]) race = DATA.races[venue.id].find(r=>r.number === STATE.raceNo);
  if(!race && venue.races) race = venue.races.find(r=>r.no === STATE.raceNo);
  if(!race){
    VIEW.innerHTML = `<section class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <h2>${venue.name} ${STATE.raceNo}R</h2><div><button class="btn" id="backToRaces">戻る</button></div>
      </div>
      <div class="card">レースデータがありません（data.json を確認）</div>
    </section>`;
    document.getElementById('backToRaces').addEventListener('click', ()=>{ STATE.screen='races'; render(); });
    return;
  }

  const env = race.env || {};
  const entries = race.entries || [];
  // compute symbols (use first element of arrays if arrays)
  const localVals = entries.map(e => (Array.isArray(e.local)? e.local[0] : e.local) || 0);
  const motorVals = entries.map(e => (Array.isArray(e.motor)? e.motor[0] : e.motor) || 0);
  const courseVals = entries.map(e => (Array.isArray(e.course)? e.course[0] : e.course) || 0);
  const localSym = rankSymbols(localVals);
  const motorSym = rankSymbols(motorVals);
  const courseSym = rankSymbols(courseVals);

  const entryRows = entries.map((e,i)=>`
    <tr>
      <td class="mono">${e.waku}</td>
      <td>${e.class ?? '-'}</td>
      <td>${e.name}${e.f ? ' ('+e.f+')' : ''}</td>
      <td class="mono">${(typeof e.st === 'number') ? e.st.toFixed(2) : e.st}</td>
      <td>${e.f || '-'}</td>
      <td><span class="${localSym[i]==='◎' ? 'symbol-top' : 'symbol'}">${localSym[i]}</span>${localVals[i]}%</td>
      <td><span class="${motorSym[i]==='◎' ? 'symbol-top' : 'symbol'}">${motorSym[i]}</span>${motorVals[i]}%</td>
      <td><span class="${courseSym[i]==='◎' ? 'symbol-top' : 'symbol'}">${courseSym[i]}</span>${courseVals[i]}%</td>
    </tr>
  `).join('');

  // predictions: prefer race.predictions, else race.ai.main/sub
  const main = race.predictions ? (race.predictions.slice(0,5).map(p=>({buy:p.buy,probability:p.probability,odds:p.odds}))) : ((race.ai && race.ai.main) ? race.ai.main.slice(0,5).map(x=>({buy:x.bet || x.buy, probability:x.rate || x.probability})) : []);
  const sub = (race.ai && race.ai.sub) ? race.ai.sub.slice(0,5).map(x=>({buy:x.bet || x.buy, probability:x.rate || x.probability})) : [];

  const commentRows = (race.comments || []).map(c=>`<tr><td>${c.no}コース</td><td>${c.text || '-'}</td></tr>`).join('');

  VIEW.innerHTML = `<section class="card">
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <h2>${venue.name} ${STATE.raceNo}R</h2>
      <div><button class="btn" id="backToRaces">戻る</button></div>
    </div>

    <div style="display:flex;gap:8px;flex-wrap:wrap;margin:8px 0 6px;">
      <div class="pill">風向 ${env.windDir ?? '-'}</div>
      <div class="pill">風速 ${env.windSpeed ?? '-' } m/s</div>
      <div class="pill">波高 ${env.wave ?? '-' } cm</div>
    </div>

    <h3>出走表</h3>
    <div class="card">
      <table class="table">
        <thead><tr><th>枠</th><th>級</th><th>選手名</th><th>平均ST</th><th>F</th><th>当地</th><th>モーター</th><th>コース</th></tr></thead>
        <tbody>${entryRows}</tbody>
      </table>
    </div>

    <h3>AI予想（本命 5点）</h3>
    <div class="card">
      <table class="table">
        <thead><tr><th>買い目</th><th>確率</th><th>参考オッズ</th></tr></thead>
        <tbody>${main.map(m=>`<tr><td>${m.buy}</td><td class="mono">${m.probability ?? '-'}%</td><td>${m.odds ? m.odds+'倍' : '-'}</td></tr>`).join('')}</tbody>
      </table>
    </div>

    <h3>AI穴予想（5点）</h3>
    <div class="card">
      <table class="table">
        <thead><tr><th>買い目</th><th>確率</th></tr></thead>
        <tbody>${sub.map(s=>`<tr><td>${s.buy}</td><td class="mono">${s.probability ?? '-'}%</td></tr>`).join('')}</tbody>
      </table>
    </div>

    <h3>展開予想 AIコメント（コース別）</h3>
    <div class="card">
      <table class="table"><thead><tr><th>コース</th><th>コメント</th></tr></thead><tbody>${commentRows}</tbody></table>
    </div>

  </section>`;

  document.getElementById('backToRaces').addEventListener('click', ()=>{ STATE.screen='races'; render(); });
}

// main render
function render(){
  if(!DATA){ VIEW.innerHTML = `<div class="card">データが読み込まれていません。更新ボタンで読み込んでください。</div>`; return; }
  if(STATE.screen === 'venues') renderVenues();
  else if(STATE.screen === 'races') renderRaces();
  else if(STATE.screen === 'race') renderRace();
}

// initial load + bindings
(async ()=>{
  await loadData(false);
  render();
})();

refreshBtn.addEventListener('click', async ()=>{ await loadData(true); render(); });