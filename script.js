// script.js
const VIEW = document.getElementById('view');
const todayLabel = document.getElementById('todayLabel');
const globalHit = document.getElementById('globalHit');
const refreshBtn = document.getElementById('refreshBtn');

const STATE = {
  data: null,
  screen: 'venues', // 'venues' | 'races' | 'race'
  currentVenueId: null,
  currentRaceId: null,
};

function fmtDate(dstr){
  const d = new Date(dstr + 'T00:00:00+09:00');
  return d.toLocaleDateString('ja-JP', {year:'numeric', month:'2-digit', day:'2-digit', weekday:'short'});
}

async function loadData(force=false){
  // キャッシュ回避
  const url = `./data.json${force ? `?t=${Date.now()}` : ''}`;
  const res = await fetch(url, { cache:'no-store' });
  if(!res.ok) throw new Error('データ取得エラー');
  STATE.data = await res.json();
  todayLabel.textContent = fmtDate(STATE.data.date);
  globalHit.textContent = `${STATE.data.ai_accuracy ?? 0}%`;
}

function mountBack(){
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
  const v24 = STATE.data.venues; // 24場固定
  const html = `
    <section class="card">
      <div class="h2">競艇場</div>
      <div class="venue-grid">
        ${v24.map(v=>{
          const active = v.hasRacesToday;
          return `
          <button class="venue ${active ? '' : 'disabled'}" data-venue="${v.id}">
            <div class="venue-name">${v.name}</div>
            <div class="state">${active ? '開催中' : '本日開催なし'}</div>
          </button>`;
        }).join('')}
      </div>
    </section>
  `;
  VIEW.innerHTML = html;

  document.querySelectorAll('[data-venue]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const id = btn.getAttribute('data-venue');
      STATE.currentVenueId = id;
      STATE.screen = 'races';
      render();
    });
  });
}

function renderRaces(){
  unmountBack();
  mountBack();

  const venue = STATE.data.venues.find(v=> String(v.id) === String(STATE.currentVenueId));
  const races = (STATE.data.races[venue.id] || []).slice(0,12);

  const html = `
    <section class="card">
      <div class="h2">${venue.name}（1〜12R）</div>
      <div class="race-grid">
        ${races.map(r=>{
          const off = r.status==='finished' ? 'off' : '';
          return `<button class="race-btn ${off}" data-race="${r.raceId}">${r.number}R</button>`;
        }).join('')}
      </div>
    </section>
  `;
  VIEW.innerHTML = html;

  document.querySelectorAll('[data-race]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      STATE.currentRaceId = btn.getAttribute('data-race');
      STATE.screen = 'race';
      render();
    });
  });
}

function renderRace(){
  unmountBack();
  mountBack();

  // raceデータ取得
  const venue = STATE.data.venues.find(v=> String(v.id) === String(STATE.currentVenueId));
  const race = (STATE.data.races[venue.id] || []).find(r=> String(r.raceId) === String(STATE.currentRaceId));
  if(!race){ VIEW.innerHTML = `<section class="card">レースデータなし</section>`; return; }

  // 出走表テーブル
  const tRows = race.entries.map(e=>`
    <tr>
      <td class="mono">${e.lane}</td>
      <td>${e.class}</td>
      <td>${e.name}</td>
      <td class="mono">${e.avgST.toFixed(2)}</td>
      <td>
        <div class="motor">
          <div class="mono">No.${e.motor.no}</div>
          <div class="mono" style="font-size:12px;color:#374151;">2連率: ${e.motor.rate2}%</div>
          <div class="mono" style="font-size:12px;color:#374151;">3連率: ${e.motor.rate3}%</div>
        </div>
      </td>
    </tr>
  `).join('');

  // 予想（確率付き）
  const predRows = race.predictions.map(p=>`
    <tr>
      <td>${p.buy}</td>
      <td class="mono">${(p.probability||0)}%</td>
      <td class="mono">${p.odds ? `${p.odds}倍` : '-'}</td>
    </tr>
  `).join('');

  // コース別コメント
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
            <tr><th>買い目</th><th>確率</th><th>参考オッズ</th></tr>
          </thead>
          <tbody>${predRows}</tbody>
        </table>
      </div>

      <div class="h2">展開予想 AIコメント（コース別）</div>
      <div class="comment-grid">${cBlocks}</div>
    </section>
  `;
}

function render(){
  if(!STATE.data) return;
  if(STATE.screen==='venues') renderVenues();
  else if(STATE.screen==='races') renderRaces();
  else renderRace();
}

/* ---------- Boot ---------- */
refreshBtn.addEventListener('click', async()=>{
  try{
    await loadData(true);
    render();
  }catch(e){
    alert('データ取得エラー。data.json を確認してください。');
  }
});

(async()=>{
  try{
    await loadData(false);
    render();
  }catch(e){
    // 初回エラー時もUIだけ描画
    VIEW.innerHTML = `<section class="card">データ取得エラー。<br/>data.json を配置してください。</section>`;
  }
})();