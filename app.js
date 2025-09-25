// app.js (完全版 — aiロジック統合済み)
// 特記事項: index.html はそのままで動作します（import などは使っていません）。

const DATA_URL = './data.json'; // 必要に応じて GitHub Pages のフル URL に変更

const VENUE_NAMES = [
  "桐生","戸田","江戸川","平和島","多摩川","浜名湖","蒲郡","常滑",
  "津","三国","びわこ","住之江","尼崎","鳴門","丸亀","児島",
  "宮島","徳山","下関","若松","芦屋","福岡","唐津","大村"
];

// DOM
const dateLabel = document.getElementById('dateLabel');
const todayBtn = document.getElementById('todayBtn');
const yesterdayBtn = document.getElementById('yesterdayBtn');
const refreshBtn = document.getElementById('refreshBtn');

const venuesGrid = document.getElementById('venuesGrid');
const racesGrid = document.getElementById('racesGrid');
const venueTitle = document.getElementById('venueTitle');
const raceTitle = document.getElementById('raceTitle');

const entryTableBody = document.querySelector('#entryTable tbody');
const aiMainBody = document.querySelector('#aiMain tbody');
const aiSubBody = document.querySelector('#aiSub tbody');
const commentTableBody = document.querySelector('#commentTable tbody');

const SCREEN_VENUES = document.getElementById('screen-venues');
const SCREEN_RACES  = document.getElementById('screen-races');
const SCREEN_RACE   = document.getElementById('screen-detail');

const backToVenuesBtn = document.getElementById('backToVenues');
const backToRacesBtn = document.getElementById('backToRaces');

// State
let ALL_PROGRAMS = [];
let CURRENT_MODE = 'today'; // today / yesterday
let CURRENT_VENUE_ID = null;
let CURRENT_RACE_NO = null;

// util
function getIsoDate(d){ return d.toISOString().slice(0,10); }
function formatToDisplay(dstr){
  try { const d = new Date(dstr); return d.toLocaleDateString('ja-JP', { year:'numeric', month:'2-digit', day:'2-digit', weekday:'short' });}
  catch(e){ return dstr; }
}
function showScreen(name){
  SCREEN_VENUES.classList.remove('active');
  SCREEN_RACES.classList.remove('active');
  SCREEN_RACE.classList.remove('active');
  if(name==='venues') SCREEN_VENUES.classList.add('active');
  if(name==='races') SCREEN_RACES.classList.add('active');
  if(name==='race') SCREEN_RACE.classList.add('active');
}

/* ---------------------------
   AI コメント・補助ロジック（ここを index.html に触らず app.js 内に統合）
   - buildPlayerData(b, evalMark)
   - generateComment(player)
   - generateBetsFromRanking(rankedBoats)
   - patterns (補助パターン群)
   --------------------------- */

// 追加補強フレーズ（新聞記者風） — ランダムに選択
const EXTRA_PHRASES = [
  "展開を巧みに生かす狙い目", "差し切りの一手あるか", "スタートが鍵を握る一戦",
  "機力好調で連軸に期待", "立ち回りで頭一つ抜ける可能性あり", "終盤の粘りに注目したい",
  "前節から調子上向き、要警戒", "波に乗れば台頭十分", "展開次第で一発も十分にあり得る",
  "仕上がり良好で主導権を握る期待", "地元巧者の面目躍如に期待", "展開の隙を突く一手がある"
];

// 判定ベースのコメントパーツ生成
function generateDataBasedParts(player){
  const parts = [];
  // ST
  if (player.st != null) {
    if (player.st <= 0.13) parts.push("鋭いスタートで展開有利");
    else if (player.st <= 0.16) parts.push("STまずまずで立ち回り良好");
    else parts.push("スタートに慎重さが残る");
  }
  // motor
  if (player.motor != null) {
    if (player.motor >= 50) parts.push("モーター気配上向き");
    else if (player.motor >= 35) parts.push("機力は水準以上");
    else parts.push("モーターはやや力不足の感");
  }
  // local
  if (player.local != null) {
    if (player.local >= 6) parts.push("当地巧者の実績");
    else if (player.local >= 4) parts.push("当地で安定した走り");
    else parts.push("当地実績は乏しい");
  }
  // course
  if (player.course != null) {
    if (player.course >= 40) parts.push("得意コースからの一戦");
    else if (player.course >= 30) parts.push("コース利あり");
  }
  // 評価記号に応じた一文
  if (player.eval === '◎') parts.push("本命視される実力派");
  else if (player.eval === '○') parts.push("上位争いに食い込みやすい");
  else if (player.eval === '△') parts.push("連下でのひと押し期待");
  else if (player.eval === '✕') parts.push("穴で一考の価値あり");

  return parts;
}

// ランダム補強フレーズを1つ追加
function pickExtraPhrase(){
  return EXTRA_PHRASES[Math.floor(Math.random()*EXTRA_PHRASES.length)];
}

// 総合コメント生成（目標：30〜50文字程度の新聞記者風）
function generateComment(player){
  const parts = generateDataBasedParts(player);
  // メインは判定に基づくフレーズ2つまで
  let selected = [];
  if (parts.length > 0) {
    // ランダムにシャッフルして先頭から2つ
    selected = parts.slice().sort(()=>0.5 - Math.random()).slice(0,2);
  }
  // 補強フレーズを1つ入れる
  selected.push(pickExtraPhrase());
  // join
  let text = selected.join('、') + "。";
  // 文字数が短ければもう1フレーズ追加（上限は50文字に近づける）
  if (text.length < 30) {
    text = selected.concat([pickExtraPhrase()]).join('、') + "。";
  }
  // さらに長すぎる場合は切る（安全策）
  if (text.length > 60) text = text.slice(0, 57) + "…。";
  return text;
}

// playerデータのビルド（出走表のデータからコメント用の最小情報を用意）
function buildPlayerData(b, evalMark){
  return {
    st: (typeof b.racer_average_start_timing === 'number') ? b.racer_average_start_timing : (b.racer_average_start_timing ? Number(b.racer_average_start_timing) : null),
    motor: (b.racer_assigned_motor_top_2_percent ?? b.racer_motor_win_rate) ?? null,
    local: (b.racer_local_top_1_percent ?? b.racer_local_win_rate) ?? null,
    course: (b.racer_assigned_boat_top_2_percent ?? b.racer_course_win_rate) ?? null,
    eval: evalMark || null
  };
}

// 予め用意しておく典型パターン群（サンプル／穴パターン等） — バリエーション確保のため複数用意
const TYPICAL_PATTERNS = [
  [1,2,3],[1,2,4],[1,3,2],[1,3,4],[1,4,2],[1,4,5],
  [2,1,3],[2,1,4],[2,3,1],[2,3,4],[2,4,1],[2,4,5],
  [3,1,2],[3,1,4],[3,4,1],[3,4,5],[3,2,1],[3,2,4],
  [4,1,3],[4,1,5],[4,3,1],[4,3,5],[4,5,1],[4,5,3],
  [5,1,3],[5,1,4],[5,3,6],[5,4,1],[5,6,1],[6,1,3]
];
// 更に多様性のため同パターンを文字列化で使える形で増やす（内部で使用）
const TYPICAL_STRINGS = TYPICAL_PATTERNS.map(a => `${a[0]}-${a[1]}-${a[2]}`);

// 三連単買い目生成（本命5点、穴5点）
// rankedBoats: [top1, top2, top3, ...]（艇番の配列、上位順）
function generate3renBets(rankedBoats){
  const main = [];
  const sub = [];
  const used = new Set();

  function pushUnique(list, a,b,c){
    const key = `${a}-${b}-${c}`;
    if(used.has(key)) return false;
    used.add(key);
    list.push(key);
    return true;
  }

  // safety: rankedBoats length >= 6? それ以外はある範囲で補完
  const r = rankedBoats.concat([1,2,3,4,5,6]).slice(0,6);

  const fav = r[0] || 1;
  const second = r[1] || ((fav===1)?2:1);
  const third = r[2] || ((fav<=2)?3:2);
  const fourth = r[3] || 4;
  const fifth = r[4] || 5;
  const sixth = r[5] || 6;

  // 本命パターン（例に倣った組み立て）
  const mainCandidates = [
    [fav, second, third],
    [fav, third, second],
    [fav, third, fourth],
    [second, fav, third],
    [second, fav, fourth]
  ];
  mainCandidates.forEach(tri => pushUnique(main, tri[0],tri[1],tri[2]));

  // 穴パターン（展開が向いた時の差し込み想定パターン）
  const subCandidates = [
    [second, fav, third],
    [second, fourth, fav],
    [fourth, second, fav],
    [fifth, fav, second],
    [fifth, third, sixth]
  ];
  subCandidates.forEach(tri => pushUnique(sub, tri[0],tri[1],tri[2]));

  // 必要数に満たない場合は典型パターンから埋める
  for(const s of TYPICAL_STRINGS){
    if(main.length < 5) {
      const [a,b,c] = s.split('-').map(Number);
      pushUnique(main,a,b,c);
    }
    if(sub.length < 5) {
      const [a,b,c] = s.split('-').map(Number);
      pushUnique(sub,a,b,c);
    }
    if(main.length>=5 && sub.length>=5) break;
  }

  // 最終調整: 5点ずつにする（不足分は '-' で埋める）
  while(main.length < 5) main.push('-');
  while(sub.length < 5) sub.push('-');

  // 確率（簡易算出）: main/sub内の順位づけに対して疑似確率を付与
  function attachProbs(list, rankingScores){
    // rankingScores: map boatNumber->score for weighting
    const items = list.map(key => {
      if(key === '-') return { bet:key, prob: 0 };
      const [a,b,c] = key.split('-').map(Number);
      const wA = rankingScores[a] || 0.01;
      const wB = rankingScores[b] || 0.01;
      const wC = rankingScores[c] || 0.01;
      const weight = wA*3 + wB*1.5 + wC*1.0;
      return { bet:key, rawW: weight };
    });
    // normalize to 100-scale
    const maxW = Math.max(...items.map(it => it.rawW || 0.0001));
    return items.map(it => {
      const prob = it.bet === '-' ? 0 : Math.max(0, Math.round((it.rawW / maxW) * 100));
      return { bet: it.bet, prob };
    });
  }

  return { main, sub, attachProbs };
}

/* ---------------------------
   データ読み込み・画面描画ロジック（元の構成をなるべく維持）
   --------------------------- */

// load data (expecting structure: { updated: "...", races: { programs: [ ... ] } })
async function loadData(force=false){
  try{
    const url = DATA_URL + (force ? `?t=${Date.now()}` : '');
    const res = await fetch(url, {cache: 'no-store'});
    if(!res.ok) throw new Error('HTTP '+res.status);
    const json = await res.json();
    // normalize
    let progs = null;
    if(json && json.races && Array.isArray(json.races.programs)) progs = json.races.programs;
    else if(Array.isArray(json.programs)) progs = json.programs;
    else if(Array.isArray(json)) progs = json;
    if(!progs) throw new Error('JSON構造違い: programs または races.programs を期待');
    ALL_PROGRAMS = progs;
    // header date
    const d = new Date();
    dateLabel.textContent = formatToDisplay(d.toISOString());
    renderVenues();
    return true;
  }catch(err){
    console.error('データ読み込み失敗', err);
    venuesGrid.innerHTML = `<div class="card">データ取得エラー: ${err.message}</div>`;
    return false;
  }
}

// venues -> always 24
function renderVenues(){
  showScreen('venues');
  venuesGrid.innerHTML = '';
  const targetDate = (CURRENT_MODE==='today') ? getIsoDate(new Date()) : (function(){const d=new Date(); d.setDate(d.getDate()-1); return getIsoDate(d);})();
  // which stadium numbers have races on targetDate
  const hasMap = {};
  ALL_PROGRAMS.forEach(p=>{
    if(p.race_date && p.race_stadium_number && p.race_date === targetDate){
      hasMap[p.race_stadium_number] = true;
    }
  });

  for(let i=0;i<24;i++){
    const id = i+1;
    const name = VENUE_NAMES[i] || `場${id}`;
    const has = !!hasMap[id];
    const card = document.createElement('div');
    card.className = 'venue-card ' + (has ? 'clickable' : 'disabled');
    card.setAttribute('data-venue', id);

    const vname = document.createElement('div'); vname.className='v-name'; vname.textContent = name;
    const status = document.createElement('div'); status.className='v-status'; status.textContent = has ? '開催中' : 'ー';
    const rate = document.createElement('div'); rate.className='v-rate'; rate.textContent = '--%';

    card.appendChild(vname);
    card.appendChild(status);
    card.appendChild(rate);

    if(has){
      card.addEventListener('click', ()=>{
        CURRENT_VENUE_ID = id;
        renderRaces(id);
      });
    }
    venuesGrid.appendChild(card);
  }
}

// render 1..12
function renderRaces(venueId){
  showScreen('races');
  CURRENT_VENUE_ID = venueId;
  venueTitle.textContent = VENUE_NAMES[venueId-1] || `場 ${venueId}`;
  racesGrid.innerHTML = '';

  const targetDate = (CURRENT_MODE==='today') ? getIsoDate(new Date()) : (function(){const d=new Date(); d.setDate(d.getDate()-1); return getIsoDate(d);})();
  const progs = ALL_PROGRAMS.filter(p => p.race_date === targetDate && p.race_stadium_number === venueId);
  const existing = new Set(progs.map(p => Number(p.race_number)));

  for(let no=1; no<=12; no++){
    const btn = document.createElement('button'); btn.className='race-btn';
    const found = existing.has(no);
    btn.textContent = `${no}R`;
    if(found){
      btn.addEventListener('click', ()=>{
        CURRENT_RACE_NO = no;
        renderRaceDetail(venueId, no);
      });
    } else {
      btn.classList.add('disabled');
      btn.disabled = true;
    }
    racesGrid.appendChild(btn);
  }
}

// render single race detail per spec
function renderRaceDetail(venueId, raceNo){
  showScreen('race');
  const targetDate = (CURRENT_MODE==='today') ? getIsoDate(new Date()) : (function(){const d=new Date(); d.setDate(d.getDate()-1); return getIsoDate(d);})();
  const prog = ALL_PROGRAMS.find(p => p.race_date===targetDate && p.race_stadium_number===venueId && Number(p.race_number)===Number(raceNo));
  if(!prog){ alert('レースデータがありません'); renderRaces(venueId); return; }

  raceTitle.textContent = `${VENUE_NAMES[venueId-1] || venueId} ${raceNo}R ${prog.race_title || ''}`;

  // boats sorted by boat number
  const boats = Array.isArray(prog.boats) ? prog.boats.slice().sort((a,b)=> (a.racer_boat_number||0)-(b.racer_boat_number||0)) : [];

  // --- まずは各艇の rawScore を計算して配列化 ---
  const players = [];
  for(let i=1;i<=6;i++){
    const b = boats.find(x => (x.racer_boat_number||i) === i) || null;
    const st = b && (typeof b.racer_average_start_timing === 'number' ? b.racer_average_start_timing : (b && b.racer_average_start_timing ? Number(b.racer_average_start_timing) : null));
    const fcount = b ? Number(b.racer_flying_count || 0) : 0;
    const local = b && (b.racer_local_top_1_percent ? b.racer_local_top_1_percent : (b.racer_local_win_rate ?? null));
    const motor = b && (b.racer_assigned_motor_top_2_percent ? b.racer_assigned_motor_top_2_percent : (b.racer_motor_win_rate ?? null));
    const course = b && (b.racer_assigned_boat_top_2_percent ? b.racer_assigned_boat_top_2_percent : (b.racer_course_win_rate ?? null));

    const stScore = st ? (1/(st || 0.3)) : 1;
    const fScore = (fcount>0) ? 0.7 : 1.0;
    const localScore = (typeof local === 'number') ? (local/100) : 1.0;
    const motorScore = (typeof motor === 'number') ? (motor/100) : 1.0;
    const courseScore = (typeof course === 'number') ? (course/100) : 1.0;
    const rawScore = stScore * fScore * localScore * motorScore * courseScore;

    players.push({
      lane: i,
      b,
      st, fcount, local, motor, course,
      rawScore: rawScore || 0.0001 // 0にならないように
    });
  }

  // --- 順位付けして評価記号を配布（常に ◎,○,△,✕ を使う） ---
  const ranked = players.slice().sort((a,b)=> b.rawScore - a.rawScore);
  const rankMarks = ['◎','○','△','△','✕','✕']; // 上位順に割り当て（アレンジ可）
  const markByLane = {};
  ranked.forEach((p, idx) => {
    const mark = rankMarks[idx] || '✕';
    markByLane[p.lane] = mark;
  });

  // --- 出走表の描画（テーブルに反映） ---
  entryTableBody.innerHTML = '';
  for(const p of players){
    const i = p.lane;
    const b = p.b;
    const klass = b && (b.racer_class_number ? (['','A1','A2','B1','B2'][b.racer_class_number] || '-') : (b.racer_class || '-')) || '-';
    const name = b ? (b.racer_name || '-') : '-';
    const stText = (p.st != null) ? `ST:${p.st.toFixed(2)}` : 'ST:-';
    const fText = (p.fcount>0) ? `F${p.fcount}` : 'ー';
    const localText = (typeof p.local === 'number') ? (p.local + '%') : '-';
    const motorText = (typeof p.motor === 'number') ? (p.motor + '%') : '-';
    const courseText = (typeof p.course === 'number') ? (p.course + '%') : '-';
    const mark = markByLane[i] || '✕';
    const markClass = (mark === '◎') ? 'metric-symbol top' : 'metric-symbol';

    const tr = document.createElement('tr');
    tr.className = `row-${i}`;
    tr.innerHTML = `
      <td class="mono">${i}</td>
      <td>
        <div class="entry-left">
          <div class="klass">${klass}</div>
          <div class="name">${name}</div>
          <div class="st">${stText}</div>
        </div>
      </td>
      <td>${fText}</td>
      <td>${localText}</td>
      <td>${motorText}</td>
      <td>${courseText}</td>
      <td><div class="${markClass}">${mark}</div></td>
    `;
    entryTableBody.appendChild(tr);
  }

  // --- AI予想（三連単）生成 ---
  // rankedBoats は rawScore 順の艇番リスト
  const rankedBoats = ranked.map(r => (r.b && r.b.racer_boat_number) || r.lane);
  const rankingScores = {}; // boatNo -> rawScore
  ranked.forEach(r => {
    const boatNo = (r.b && r.b.racer_boat_number) || r.lane;
    rankingScores[boatNo] = r.rawScore;
  });

  const betsObj = generate3renBets(rankedBoats);
  const mainWithProbs = betsObj.attachProbs(betsObj.main, rankingScores);
  const subWithProbs = betsObj.attachProbs(betsObj.sub, rankingScores);

  // render AI tables (本命5点／穴5点)
  aiMainBody && (aiMainBody.innerHTML = '');
  aiSubBody && (aiSubBody.innerHTML = '');
  mainWithProbs.slice(0,5).forEach(it=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${it.bet}</td><td class="mono">${it.prob}%</td>`;
    aiMainBody.appendChild(tr);
  });
  while(aiMainBody.children.length < 5){
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>-</td><td class="mono">-</td>`;
    aiMainBody.appendChild(tr);
  }
  subWithProbs.slice(0,5).forEach(it=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${it.bet}</td><td class="mono">${it.prob}%</td>`;
    aiSubBody.appendChild(tr);
  });
  while(aiSubBody.children.length < 5){
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>-</td><td class="mono">-</td>`;
    aiSubBody.appendChild(tr);
  }

  // --- コメント（全6艇分）: buildPlayerData を使って generateComment を呼ぶ ---
  commentTableBody.innerHTML = '';
  for(const p of players){
    const b = p.b;
    let text = 'データなし';
    if(b){
      // 評価記号は markByLane から取る
      const evalMark = markByLane[p.lane] || null;
      const player = buildPlayerData(b, evalMark);
      // generateComment はデータ判定 + ランダム補強で新聞調に組み立てる
      text = generateComment(player);
    }
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${p.lane}</td><td style="text-align:left">${text}</td>`;
    commentTableBody.appendChild(tr);
  }
}

// events
todayBtn.addEventListener('click', ()=>{
  CURRENT_MODE = 'today';
  todayBtn.classList.add('active'); yesterdayBtn.classList.remove('active');
  loadData(true);
});
yesterdayBtn.addEventListener('click', ()=>{
  CURRENT_MODE = 'yesterday';
  yesterdayBtn.classList.add('active'); todayBtn.classList.remove('active');
  loadData(true);
});
refreshBtn.addEventListener('click', ()=> loadData(true));
backToVenuesBtn?.addEventListener('click', ()=> { CURRENT_VENUE_ID = null; CURRENT_RACE_NO = null; renderVenues(); });
backToRacesBtn?.addEventListener('click', ()=> { CURRENT_RACE_NO = null; renderRaces(CURRENT_VENUE_ID); });

// boot
(async ()=>{
  todayBtn.classList.add('active');
  await loadData(false);
})();