// script.js (module-not-required but kept simple)
const VIEW = document.getElementById('view');
const todayLabel = document.getElementById('todayLabel');
const globalHit = document.getElementById('globalHit');
const refreshBtn = document.getElementById('refreshBtn');

const STATE = {
  data: null,
  screen: 'venues', // 'venues' | 'races' | 'race'
  currentVenueId: null,
  currentVenueName: null,
  currentRaceId: null,
};

// format date from data.date if present
function fmtDate(dstr){
  if(!dstr) return new Date().toLocaleDateString('ja-JP');
  const d = new Date(dstr + 'T00:00:00+09:00');
  return d.toLocaleDateString('ja-JP', {year:'numeric', month:'2-digit', day:'2-digit', weekday:'short'});
}

async function loadData(force=false){
  try{
    const url = `./data.json${force ? `?t=${Date.now()}` : ''}`;
    const res = await fetch(url, { cache:'no-store' });
    if(!res.ok) throw new Error('データ取得エラー');
    STATE.data = await res.json();
    // set header date and hit
    todayLabel.textContent = fmtDate(STATE.data.date || '');
    globalHit.textContent = `${STATE.data.ai_accuracy ?? (STATE.data.globalHit ?? 0)}%`;
  }catch(err){
    console.error(err);
    STATE.data = null;
    todayLabel.textContent = "--/--/--";
    globalHit.textContent = "--%";
    VIEW.innerHTML = `<section class="card">データ取得エラー。data.json を確認してください。</section>`;
  }
}

// back button helpers
function mountBack(){
  const existing = document.getElementById('backBtn');
  if(existing) return;
  const tpl = document.getElementById('tpl-back-btn');
  const node = tpl.content.firstElementChild.cloneNode(true);
  document.body.appendChild(node);
  node.addEventListener('click', ()=>{
    if(STATE.screen === 'race'){ STATE.screen = 'races'; render(); return; }
    if(STATE.screen === 'races'){ STATE.screen = 'venues'; render(); return; }
  });
}
function unmountBack(){
  const btn = document.getElementById('backBtn');
  if(btn) btn.remove();
}

/* ---------- Renderers ---------- */

function renderVenues(){
  unmountBack();
  const v24 = STATE.data?.venues ?? [];
  const html = `
    <section class="card">
      <div class="h2">競艇場</div>
      <div class="venue-grid">
        ${v24.map(v=>{
          const active = v.hasRacesToday;
          // button class assignment: show state button for開催中 or gray for none
          return `
          <div class="venue" data-vid="${v.id}">
            <div class="venue-name">${v.name}</div>
            <button class="state-btn ${active ? 'on' : 'off'}" data-vid="${v.id}" ${active ? '' : 'disabled'}>
              ${active ? '開催中' : '本日開催なし'}
            </button>
            <div style="margin-top:6px;font-size:13px;color:#6b7280;">的中率: ${v.aiRate ?? '-' }%</div>
          </div>`;
        }).join('')}
      </div>
    </section>
  `;
  VIEW.innerHTML = html;

  // bind venue buttons
  document.querySelectorAll('.state-btn').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      const vid = btn.getAttribute('data-vid');
      const v = STATE.data.venues.find(x=> String(x.id)===String(vid));
      if(!v) return;
      STATE.currentVenueId = vid;
      STATE.currentVenueName = v.name;
      STATE.screen = 'races';
      render();
    });
  });
}

function renderRaces(){
  mountBack();
  const venue = STATE.data.venues.find(v=> String(v.id)===String(STATE.currentVenueId));
  const races = (STATE.data.races && STATE.data.races[venue.id]) ? STATE.data.races[venue.id] : [];
  // ensure up to 12 buttons (if no races data, create 1..12 disabled)
  const availableNumbers = races.map(r=>r.number);
  const buttons = [];
  for(let i=1;i<=12;i++){
    const r = races.find(x=>x.number===i);
    const disabled = !r;
    buttons.push(`<button class="race-btn ${disabled? 'off':''}" data-r="${r ? r.raceId : ''}" ${disabled? 'disabled':''}>${i}R</button>`);
  }

  const html = `
    <section class="card">
      <div class="h2">${venue.name}（1〜12R）</div>
      <div class="race-grid">
        ${buttons.join('')}
      </div>
    </section>
  `;
  VIEW.innerHTML = html;

  // bind race buttons
  document.querySelectorAll('.race-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const rid = btn.getAttribute('data-r');
      if(!rid) return;
      STATE.currentRaceId = rid;
      STATE.screen = 'race';
      render();
    });
  });
}

function renderRace(){
  mountBack();
  const venue = STATE.data.venues.find(v=> String(v.id)===String(STATE.currentVenueId));
  const races = (STATE.data.races && STATE.data.races[venue.id]) ? STATE.data.races[venue.id] : [];
  const race = races.find(r=> String(r.raceId)===String(STATE.currentRaceId));
  if(!race){ VIEW.innerHTML = `<section class="card">レースデータなし</section>`; return; }

  // table rows for entries
  const tRows = race.entries.map(e=>`
    <tr>
      <td class="mono">${e.lane}</td>
      <td>${e.class}</td>
      <td>${e.name}</td>
      <td class="mono">${(e.avgST ?? 0).toFixed(2)}</td>
      <td>
        <div class="motor">
          <div class="mono">No.${e.motor.no}</div>
          <div class="mono" style="font-size:12px;color:#374151;">2連率: ${e.motor.rate2}%</div>
          <div class="mono" style="font-size:12px;color:#374151;">3連率: ${e.motor.rate3}%</div>
        </div>
      </td>
    </tr>
  `).join('');

  // pred rows
  const predRows = (race.predictions||[]).map(p=>`
    <tr>
      <td>${p.buy}</td>
      <td class="mono">${(p.probability||0)}%</td>
      <td class="mono">${p.odds ? `${p.odds}倍` : '-'}</td>
      <td><button class="btn" data-buy="${p.buy}">詳細</button></td>
    </tr>
  `).join('');

  // comments per course
  const cx = race.comments || {};
  const cBlocks = [1,2,3,4,5,6].map(l => `
    <div class="comment-box">
      <div class="lane">${l}コース</div>
      <div>${cx[String(l)] || 'データ準備中'}</div>
    </div>
  `).join('');

  const env = race.env || {};
  const result = race.result;

  VIEW.innerHTML = `
    <section class="card">
      <div class="h2">${venue.name} ${race.number}R　<span class="pill">発走 ${race.startTime || '-'}</span></div>
      <div style="display:flex; gap:12px; flex-wrap:wrap; margin:8px 0 6px;">
        <div class="pill">風向 ${env.windDir ?? '-'}</div>
        <div class="pill">風速 ${env.windSpeed ?? '-'} m/s</div>
        <div class="pill">波高 ${env.wave ?? '-'} cm</div>
        ${result ? `<div class="pill ok">結果 ${result.kind} ${result.numbers.join('-')}</div>` : `<div class="pill warn">結果 未確定</div>`}
      </div>

      <div class="h2">出走表</div>
      <div class="card" style="padding:0;">
        <table class="table">
          <thead>
            <tr><th>枠</th><th>級</th><th>選手</th><th>平均ST</th><th>モーター</th></tr>
          </thead>
          <tbody>${tRows}</tbody>
        </table>
      </div>

      <div class="h2">AI予想買い目（確率付き・5点）</div>
      <div class="card" style="padding:0;">
        <table class="table">
          <thead>
            <tr><th>買い目</th><th>確率</th><th>参考オッズ</th><th>操作</th></tr>
          </thead>
          <tbody>${predRows}</tbody>
        </table>
      </div>

      <div class="h2">展開予想 AIコメント（コース別）</div>
      <div class="comment-grid">${cBlocks}</div>
    </section>
  `;

  // bind "詳細" buttons to show an expanded modal-like detail (here simple alert)
  document.querySelectorAll('button[data-buy]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const buy = btn.getAttribute('data-buy');
      const c = (race.predictions || []).find(p=>p.buy===buy);
      const comment = c ? `買い目: ${c.buy}\n確率: ${c.probability}%\n参考オッズ: ${c.odds}倍\n\nAI根拠: ${generateAiReason(race, c)}` : '詳細データなし';
      alert(comment);
    });
  });
}

// small AI reasoning generator for modal/detail (simple heuristic for mock)
function generateAiReason(race, pick){
  // build a short (〜50文字) reason using env and top entry avgST
  try{
    const env = race.env || {};
    const best = [...race.entries].sort((a,b)=> a.avgST - b.avgST)[0];
    const wind = env.windDir || '';
    const base = `${best.lane}号艇は平均STが速く(${best.avgST.toFixed(2)})、`;
    const envs = wind ? `${wind}風で水面影響を考慮。` : '';
    const pickTxt = `予想${pick.buy}は確率${pick.probability}%の中穴狙い。`;
    return (base + envs + pickTxt).slice(0,200);
  }catch(e){
    return 'AI根拠: 平均STと環境を元にスコアリング（モック）';
  }
}

function render(){
  if(!STATE.data) return;
  if(STATE.screen==='venues') renderVenues();
  else if(STATE.screen==='races') renderRaces();
  else renderRace();
}

/* ---------- Boot ---------- */
refreshBtn.addEventListener('click', async()=>{
  await loadData(true);
  render();
});

(async()=>{
  await loadData(false);
  render();
})();