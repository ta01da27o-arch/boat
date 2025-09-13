// ===============================
// 要素取得
// ===============================
const screenVenues = document.getElementById("screen-venues");
const screenRaces = document.getElementById("screen-races");
const screenDetail = document.getElementById("screen-detail");

const backBtnRace = document.getElementById("backBtnRace");
const backBtnDetail = document.getElementById("backBtnDetail");
const refreshBtn = document.getElementById("refreshBtn");

const venueList = document.getElementById("venueList");
const raceList = document.getElementById("raceList");
const venueTitle = document.getElementById("venueTitle");
const raceTitle = document.getElementById("raceTitle");
const entryTableBody = document.querySelector("#entryTable tbody");
const aiCommentDiv = document.getElementById("aiComment");
const aiPredictionBody = document.getElementById("aiPredictionBody");
const dateDisplay = document.getElementById("dateDisplay");

let raceData = [];
let selectedDate = "";
let selectedVenue = "";

const venueNames = ["桐生","戸田","江戸川","平和島","多摩川","浜名湖","蒲郡","常滑","津","三国","びわこ","住之江","尼崎","鳴門","丸亀","児島","宮島","徳山","下関","若松","芦屋","福岡","唐津","大村"];

// ===============================
// データロード
// ===============================
async function loadRaceData() {
  try {
    const res = await fetch("https://ta01da27o-arch.github.io/boat/data.json?nocache="+Date.now());
    const json = await res.json();
    if(json && json.races && Array.isArray(json.races.programs)){
      raceData = json.races.programs.map(p=>({
        date: p.race_date.replace(/-/g,""),
        place: `場${p.race_stadium_number}`,
        race_no: p.race_number,
        race_title: p.race_title,
        race_subtitle: p.race_subtitle,
        start_time: p.race_closed_at? p.race_closed_at.split(" ")[1] : "-",
        entries: Array.isArray(p.boats)? p.boats.map(b=>({
          lane: b.racer_boat_number,
          name: b.racer_name,
          f: b.racer_flying_count,
          local1: b.racer_local_top_1_percent,
          local2: b.racer_local_top_2_percent,
          local3: b.racer_local_top_3_percent,
          motor1: b.racer_assigned_motor_top_1_percent,
          motor2: b.racer_assigned_motor_top_2_percent,
          motor3: b.racer_assigned_motor_top_3