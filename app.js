// app.js (ES module style)
const VIEW = document.getElementById('view');
const dateLabel = document.getElementById('dateLabel');
const globalHit = document.getElementById('globalHit');
const refreshBtn = document.getElementById('refreshBtn');
const tplBack = document.getElementById('tpl-back');

let DATA = null;
let STATE = { screen: 'venues', venueId: null, raceNo: null };

// helper: format date
function fmtDateIso(iso){
  const d = iso ? new Date(iso) : new Date();
  return d.toLocaleDateString('ja-JP', {year:'numeric', month:'2-digit', day:'2-digit', weekday:'short'});
}

// helper: fetch JSON with cache-bust option
async function loadData(force=false){
  try{
    const url = './data.json' + (force ? `?t=${Date.now()}` : '');
    const res = await fetch(url, {cache:'no-store'});
    if(!res.ok) throw new Error('fetch failed');
    DATA = await res.json();
    dateLabel.textContent = fmtDateIso(DATA.date || (new Date()).toISOString());
    globalHit.textContent = (DATA.ai_accuracy != null ? `${DATA.ai_accuracy}%` : '--%');
    return true;
  }catch(e){
    DATA = null;
    VIEW.innerHTML = `<div class="card">データ取得エラー：${e.message || e}.<br>data.json を確認してください。</div>`;
    return false;
  }
}

// init
(async ()=>{
  await loadData(false);
  render();
})();

// refresh button
refreshBtn.addEventListener('click', async ()=>{
  await loadData(true);
  render();
});

// ranking -> symbols function (values array) returns symbols array
function rankSymbols(values){
  // values: array of numbers (length 6)
  const indexed = values.map((v,i)=>({v,i}));
  // sort desc
  indexed.sort((a,b)=>b.v - a.v);
  const marks = ["◎","○","△","✕","ー","ー"];
  const out = Array(values.length).fill("ー");
  indexed.forEach((it, idx)=>{
    out[it.i] = marks[idx] || 'ー';
  });
  return out;
}

// render entry table row building
function renderEntryRows(entries){
  const localVals = entries.map(e=>Number(e.local?.[0]??0));
  const motorVals = entries.map(e=>Number(e.motor?.[0]??0));
  const courseVals = entries.map(e=>Number(e.course?.[0]??0));
  const localSym = rankSymbols(localVals);
  const motorSym = rankSymbols(motorVals);
  const courseSym = rankSymbols(courseVals);

  return entries.map((e,i)=>`
    <tr>
      <td>${e.waku}</td>
      <td>${e.class ?? '-'}</td>
      <td>${e.name}${e.f ? ' ('+e.f+')' : ''}</td>
      <td class="mono">${(typeof e.st==='number')? e.st.toFixed(2) : '-'}</td>
      <td>${e.f || '-'}</td>
      <td><span class="${localSym[i]==='◎' ? 'symbol-top' : 'symbol'}">${localSym[i]}</span>${(e.local?.[0] ?? '-')}%</td>
      <td><span class="${motorSym[i]==='◎' ? 'symbol-top' : 'symbol'}">${motorSym[i]}</span>${(e.motor?.[0] ?? '-')}%</td>
      <td><span class="${courseSym[i]==='◎' ? 'symbol-top' : 'symbol'}">${courseSym[i]}</span>${(e.course?.[0] ?? '-')}%</td>
    </tr>
  `).join('');
}

// render venues grid (4x6)
function renderVenues(){
  if(!DATA){ VIEW.innerHTML = '<div class="card">データがありません</div>'; return; }
  const venues = DATA.venues;
  const html = `<section class="card">
    <h2>競艇場一覧</h2>
    <div class="venues-grid">
      ${venues.map(v=>`
        <div class="venue" data-vid="${v.id}">
          <div class="venue-name">${v.name}</div>
          <div class="venue-hit">的中率: ${(v.hitRate!=null)? v.hitRate+'%':'--'}</div>
          <div class="venue-actions">
            <button class="btn-venue ${v.hasRacesToday ? '' : 'disabled'}" data-vid="${v.id}" ${v.hasRacesToday ? '' : 'disabled'}>${v.hasRacesToday ? '開催中' : '本日無し'}</button>
          </div>
        </div>
      `).join('')}
    </div>
  </section>`;
  VIEW.innerHTML = html;

  // bind venue buttons
  VIEW.querySelectorAll('.btn-venue').forEach(b=>{
    b.addEventListener('click', (ev)=>{
      const vid = b.dataset.vid;
      STATE.screen='races'; STATE.venueId=vid; render();
    });
  });
}

// render races (1..12)
function renderRaces(){
  const venue = (DATA.venues||[]).find(v=>v.id === STATE.venueId);
  if(!venue){ renderVenues(); return; }
  const html = `<section class="card">
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <h2>${venue.name} - レース選択</h2>
      <div><button class="btn" id="backToVenues">戻る</button></div>
    </div>
    <div class="race-grid">
      ${Array.from({length:12}, (_,i)=>i+1).map(no=>{
        // enabled if race data exists in DATA.races[venue.id] or in venue.races array
        const has = (DATA.races && DATA.races[venue.id] && DATA.races[venue.id].some(r=>r.number===no))
                  || (venue.races && venue.races.some(r=>r.no===no));
        return `<button class="race-btn ${has? '' : 'off'}" data-rno="${no}" ${has? '' : 'disabled'}>${no}R</button>`;
      }).join('')}
    </div>
  </section>`;
  VIEW.innerHTML = html;
  document.getElementById('backToVenues').addEventListener('click', ()=>{
    STATE.screen='venues'; STATE.venueId=null; render();
  });
  VIEW.querySelectorAll('.race-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const rno = Number(btn.dataset.rno);
      STATE.screen='race'; STATE.raceNo=rno; render();
    });
  });
}

// render specific race detail (出走表)
function renderRace(){
  const venue = (DATA.venues||[]).find(v=>v.id === STATE.venueId);
  if(!venue){ renderVenues(); return; }

  // find race data: prefer DATA.races[vid], else venue.races
  let race = null;
  if(DATA.races && DATA.races[venue.id]){
    race = DATA.races[venue.id].find(r=>r.number===STATE.raceNo);
  }
  if(!race && venue.races){
    race = venue.races.find(r=>r.no===STATE.raceNo);
  }

  if(!race){
    VIEW.innerHTML = `<section class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <h2>${venue.name} ${STATE.raceNo}R</h2>
        <div><button class="btn" id="backToRaces">戻る</button></div>
      </div>
      <div class="card">レースデータがありません（data.json に該当レースを追加してください）</div>
    </section>`;
    document.getElementById('backToRaces').addEventListener('click', ()=>{ STATE.screen='races'; render(); });
    return;
  }

  const env = race.env || {};
  const entries = race.entries || [];
  const entryRows = renderEntryRows(entries);

  // AI predictions (main 5, sub 5)
  const main = (race.predictions && race.predictions.slice(0,5)) || (race.ai && race.ai.main) || [];
  const sub = (race.ai && race.ai.sub) || [];

  VIEW.innerHTML = `<section class="card">
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <h2>${venue.name} ${STATE.raceNo}R</h2>
      <div><button class="btn" id="backToRaces">戻る</button></div>
    </div>

    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;">
      <div class="pill">風向: ${env.windDir ?? '-'}</div>
      <div class="pill">風速: ${env.windSpeed ?? '-' } m/s</div>
      <div class="pill">波高: ${env.wave ?? '-' } cm</div>
    </div>

    <h3 style="margin-top:12px">出走表</h3>
    <div class="card">
      <table class="table">
        <thead><tr><th>枠</th><th>級</th><th>選手名</th><th>平均ST</th><th>F</th><th>当地</th><th>モーター</th><th>コース</th></tr></thead>
        <tbody>${entryRows}</tbody>
      </table>
    </div>

    <h3 style="margin-top:12px">AI予想（本命 5点）</h3>
    <div class="card">
      <table class="table">
        <thead><tr><th>買い目</th><th>確率</th><th>参考オッズ</th></tr></thead>
        <tbody>
          ${main.map(m=>`<tr><td>${m.buy ?? m.bet}</td><td>${m.probability ?? m.rate ?? '-'}%</td><td>${m.odds ? m.odds+'倍' : '-'}</td></tr>`).join('')}
        </tbody>
      </table>
    </div>

    <h3 style="margin-top:12px">AI穴予想（5点）</h3>
    <div class="card">
      <table class="table">
        <thead><tr><th>買い目</th><th>確率</th></tr></thead>
        <tbody>
          ${sub.map(s=>`<tr><td>${s.buy ?? s.bet}</td><td>${s.probability ?? s.rate ?? '-'}%</td></tr>`).join('')}
        </tbody>
      </table>
    </div>

    <h3 style="margin-top:12px">展開予想 AIコメント（コース別）</h3>
    <div class="card">
      <table class="table">
        <thead><tr><th>コース</th><th>コメント</th></tr></thead>
        <tbody>
          ${ (race.comments || []).map(c=>`<tr><td>${c.no}コース</td><td>${c.text || '-'}</td></tr>`).join('') }
        </tbody>
      </table>
    </div>

  </section>`;

  document.getElementById('backToRaces').addEventListener('click', ()=>{ STATE.screen='races'; render(); });
}

// main render
function render(){
  if(!DATA){ VIEW.innerHTML = `<div class="card">データなし（data.json を配置してください）</div>`; return; }
  if(STATE.screen==='venues') renderVenues();
  else if(STATE.screen==='races') renderRaces();
  else if(STATE.screen==='race') renderRace();
}