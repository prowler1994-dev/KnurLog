// ---- Storage helpers ----
const LS_KEY = 'fitlog_data_v3';
let db = { workouts: [], weight: [], cardio: [] };

function save(){ localStorage.setItem(LS_KEY, JSON.stringify(db)); }
function load(){
  const raw = localStorage.getItem(LS_KEY);
  if(raw){ try{ db = JSON.parse(raw) }catch(e){ db = {workouts:[],weight:[],cardio:[]} } }
}
load();

// ---- UI helpers ----
function $(sel){ return document.querySelector(sel); }
function $all(sel){ return Array.from(document.querySelectorAll(sel)); }
function fmtDate(d){ return new Date(d).toLocaleDateString('pl-PL'); }
function isoToday(){ return new Date().toISOString().slice(0,10); }

// ---- Tabs ----
$all('.nav button').forEach(btn=>btn.addEventListener('click',()=>{
  $all('.nav button').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  const tab = btn.dataset.tab;
  $all('section').forEach(s=>s.style.display='none');
  document.getElementById(tab).style.display='block';
  if(tab==='charts'){ drawWeightChart(); drawStrengthChart(); }
  if(tab==='cardio'){ renderCardio(); drawCardioWeekly(); }
}));

// ---- Theme toggle ----
const themeToggle = $('#themeToggle');
const THEME_KEY = 'fitlog_theme';
function applyTheme(v){ document.documentElement.classList.toggle('light', v==='light'); }
applyTheme(localStorage.getItem(THEME_KEY)||'dark');
themeToggle.checked = (localStorage.getItem(THEME_KEY)==='light');
themeToggle.addEventListener('change', ()=>{
  const v = themeToggle.checked ? 'light' : 'dark';
  localStorage.setItem(THEME_KEY, v);
  applyTheme(v);
});

// ---- Defaults ----
$('#w_date').value = isoToday();
$('#wg_date').value = isoToday();
$('#c_date').value = isoToday();

// ---- Add workout ----
document.getElementById('addWorkout').addEventListener('click',()=>{
  addWorkoutEntry({
    id: crypto.randomUUID(),
    date: $('#w_date').value,
    ex: $('#w_ex').value.trim(),
    sets: +$('#w_sets').value || 0,
    reps: +$('#w_reps').value || 0,
    weight: +$('#w_weight').value || 0,
    note: $('#w_note').value.trim()
  });
});

function addWorkoutEntry(e){
  if(!e.date || !e.ex){ alert('Podaj datę i nazwę ćwiczenia.'); return; }
  db.workouts.push(e); save(); renderWorkouts();
  $('#w_ex').value=''; $('#w_note').value=''; $('#w_weight').value='';
}

// ---- Add multiple sets ----
document.getElementById('addMulti').addEventListener('click',()=>{
  const ex = $('#w_ex').value.trim(); if(!ex){ alert('Najpierw wpisz nazwę ćwiczenia.'); return; }
  const n = +$('#w_sets').value || 1;
  const reps = +$('#w_reps').value || 1;
  const w = +$('#w_weight').value || 0;
  const date = $('#w_date').value;
  const note = $('#w_note').value.trim();
  for(let i=0;i<n;i++){
    addWorkoutEntry({ id: crypto.randomUUID(), date, ex, sets: 1, reps, weight: w, note });
  }
});

// ---- Templates FBW ----
function addTemplateA(){
  const date = $('#w_date').value;
  const items = [
    ['Przysiad',5,5,0], ['Wyciskanie leżąc',5,5,0], ['Wiosłowanie',5,5,0], ['Dipsy',3,8,0]
  ];
  items.forEach(([ex,s,r,w])=> addWorkoutEntry({ id: crypto.randomUUID(), date, ex, sets:s, reps:r, weight:w, note:'FBW A' }));
}
function addTemplateB(){
  const date = $('#w_date').value;
  const items = [
    ['Martwy ciąg',5,3,0], ['OHP',5,5,0], ['Podciąganie',3,8,0], ['Hip thrust',4,8,0]
  ];
  items.forEach(([ex,s,r,w])=> addWorkoutEntry({ id: crypto.randomUUID(), date, ex, sets:s, reps:r, weight:w, note:'FBW B' }));
}
document.getElementById('tplA').addEventListener('click', addTemplateA);
document.getElementById('tplB').addEventListener('click', addTemplateB);

// ---- Render workouts ----
function renderWorkouts(){
  const tbody = $('#workouts_table tbody');
  tbody.innerHTML='';
  const filter = $('#filter_ex').value.trim().toLowerCase();
  let rows = db.workouts.filter(w => !filter || w.ex.toLowerCase().includes(filter));
  const sort = $('#sort_workouts').value;
  rows.sort((a,b)=>{
    if(sort==='date_desc') return b.date.localeCompare(a.date);
    if(sort==='date_asc') return a.date.localeCompare(b.date);
    if(sort==='weight_desc') return b.weight - a.weight;
    if(sort==='weight_asc') return a.weight - b.weight;
    return 0;
  });
  for(const w of rows){
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${fmtDate(w.date)}</td>
                    <td>${w.ex}</td>
                    <td>${w.sets} x ${w.reps}</td>
                    <td>${w.weight} kg</td>
                    <td>${w.note||''}</td>
                    <td><button class="btn btn-danger" data-id="${w.id}">Usuń</button></td>`;
    tbody.appendChild(tr);
  }
  tbody.querySelectorAll('button').forEach(btn=>btn.addEventListener('click',()=>{
    const id = btn.dataset.id;
    db.workouts = db.workouts.filter(w=>w.id!==id); save(); renderWorkouts();
  }));
}
renderWorkouts();
$('#filter_ex').addEventListener('input', renderWorkouts);
$('#sort_workouts').addEventListener('change', renderWorkouts);

// ---- Weight ----
document.getElementById('addWeight').addEventListener('click',()=>{
  const e = {
    id: crypto.randomUUID(),
    date: $('#wg_date').value,
    value: +$('#wg_value').value || 0,
    note: $('#wg_note').value.trim()
  };
  if(!e.date || !e.value){ alert('Podaj datę i masę ciała.'); return; }
  db.weight.push(e); save(); renderWeight();
  $('#wg_value').value=''; $('#wg_note').value='';
});

function renderWeight(){
  const tbody = $('#weight_table tbody');
  tbody.innerHTML='';
  const rows = [...db.weight].sort((a,b)=>b.date.localeCompare(a.date));
  for(const r of rows){
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${fmtDate(r.date)}</td>
                    <td>${r.value.toFixed(1)} kg</td>
                    <td>${r.note||''}</td>
                    <td><button class="btn btn-danger" data-id="${r.id}">Usuń</button></td>`;
    tbody.appendChild(tr);
  }
  tbody.querySelectorAll('button').forEach(btn=>btn.addEventListener('click',()=>{
    const id = btn.dataset.id;
    db.weight = db.weight.filter(x=>x.id!==id); save(); renderWeight(); drawWeightChart();
  }));
}
renderWeight();

// ---- Cardio ----
document.getElementById('addCardio').addEventListener('click', ()=>{
  const e = {
    id: crypto.randomUUID(),
    date: $('#c_date').value,
    type: $('#c_type').value.trim(),
    minutes: +$('#c_minutes').value || 0,
    distance: +$('#c_distance').value || 0,
    hr: +$('#c_hr').value || 0,
    note: $('#c_note').value.trim()
  };
  if(!e.date || !e.type || !e.minutes){ alert('Podaj datę, rodzaj i czas.'); return; }
  db.cardio.push(e); save(); renderCardio(); drawCardioWeekly();
  $('#c_type').value=''; $('#c_note').value=''; $('#c_distance').value=''; $('#c_hr').value='';
});

$all('[data-cpreset]').forEach(btn=>btn.addEventListener('click', ()=>{
  const txt = btn.getAttribute('data-cpreset');
  const [type, minsTxt] = txt.split(' ' + (txt.includes('min')?'':'') );
}));

$all('[data-cpreset]').forEach(btn=>btn.addEventListener('click', ()=>{
  const label = btn.dataset.cpreset; // e.g. "Bieżnia 30 min"
  const m = label.match(/^(.+)\s+(\d+)\s*min/i);
  if(!m) return;
  $('#c_type').value = m[1];
  $('#c_minutes').value = m[2];
}));

function renderCardio(){
  const tbody = $('#cardio_table tbody');
  tbody.innerHTML='';
  const rows = [...db.cardio].sort((a,b)=>b.date.localeCompare(a.date));
  for(const r of rows){
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${fmtDate(r.date)}</td>
                    <td>${r.type}</td>
                    <td>${r.minutes}</td>
                    <td>${r.distance||''}</td>
                    <td>${r.hr||''}</td>
                    <td>${r.note||''}</td>
                    <td><button class="btn btn-danger" data-id="${r.id}">Usuń</button></td>`;
    tbody.appendChild(tr);
  }
  tbody.querySelectorAll('button').forEach(btn=>btn.addEventListener('click',()=>{
    const id = btn.dataset.id;
    db.cardio = db.cardio.filter(x=>x.id!==id); save(); renderCardio(); drawCardioWeekly();
  }));

  // Weekly summary for current week (Mon-Sun)
  const now = new Date();
  const day = (now.getDay() + 6) % 7; // Mon=0
  const monday = new Date(now); monday.setDate(now.getDate() - day);
  const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
  const mins = db.cardio.filter(x=>{
    const d = new Date(x.date);
    return d>= new Date(monday.toDateString()) && d <= new Date(sunday.toDateString());
  }).reduce((acc,x)=>acc + (x.minutes||0), 0);
  const sessions = db.cardio.filter(x=>{
    const d = new Date(x.date);
    return d>= new Date(monday.toDateString()) && d <= new Date(sunday.toDateString());
  }).length;
  $('#c_sum_week').textContent = mins;
  $('#c_sessions_week').textContent = sessions;
}
renderCardio();

// ---- Simple charts ----
function drawLineChart(canvasId, labels, values, options={}){
  const c = document.getElementById(canvasId);
  const ctx = c.getContext('2d');
  const W = c.width = c.clientWidth;
  const H = c.height = c.clientHeight;
  ctx.clearRect(0,0,W,H);

  if(values.length===0){ ctx.fillStyle='#9fb3c8'; ctx.fillText('Brak danych', 10, 20); return; }

  const pad = 28;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const minY = options.minY!==undefined ? options.minY : Math.floor(min-1);
  const maxY = options.maxY!==undefined ? options.maxY : Math.ceil(max+1);
  const range = (maxY-minY) || 1;

  // axes
  ctx.strokeStyle = '#1f2a44'; ctx.beginPath();
  ctx.moveTo(pad, pad); ctx.lineTo(pad, H-pad); ctx.lineTo(W-pad, H-pad); ctx.stroke();

  // grid + labels
  ctx.fillStyle = '#9fb3c8'; ctx.font = '12px system-ui';
  const steps = 4;
  for(let i=0;i<=steps;i++){
    const y = H-pad - (i/steps)*(H-2*pad);
    const val = (minY + (i/steps)*range).toFixed(1);
    ctx.strokeStyle='#13203a'; ctx.beginPath(); ctx.moveTo(pad,y); ctx.lineTo(W-pad,y); ctx.stroke();
    ctx.fillText(val, 4, y+4);
  }

  // line
  ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 2; ctx.beginPath();
  values.forEach((v,i)=>{
    const x = pad + (i/(values.length-1||1))*(W-2*pad);
    const y = H-pad - ((v-minY)/range)*(H-2*pad);
    if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  });
  ctx.stroke();

  // points
  ctx.fillStyle = '#22c55e';
  values.forEach((v,i)=>{
    const x = pad + (i/(values.length-1||1))*(W-2*pad);
    const y = H-pad - ((v-minY)/range)*(H-2*pad);
    ctx.beginPath(); ctx.arc(x,y,3,0,Math.PI*2); ctx.fill();
  });

  // last label
  ctx.fillStyle = '#cdd7e5';
  const last = values[values.length-1];
  ctx.fillText((last).toFixed(1), W-50, pad+12);
}

function drawWeightChart(){
  const rows = [...db.weight].sort((a,b)=>a.date.localeCompare(b.date));
  const labels = rows.map(r=>r.date);
  const vals = rows.map(r=>r.value);
  drawLineChart('chart_weight', labels, vals, {});
}

function drawStrengthChart(){
  const ex = $('#chart_ex_filter').value.trim().toLowerCase();
  const rows = [...db.workouts]
    .filter(w=>!ex || w.ex.toLowerCase().includes(ex))
    .reduce((map,w)=>{ // max weight per day
      const key = w.date;
      map[key] = Math.max(map[key]||0, w.weight||0);
      return map;
    }, {});
  const labels = Object.keys(rows).sort((a,b)=>a.localeCompare(b));
  const vals = labels.map(k=>rows[k]);
  drawLineChart('chart_strength', labels, vals, {});
}
document.getElementById('chart_ex_filter').addEventListener('input', drawStrengthChart);

// ---- Cardio weekly chart ----
function drawCardioWeekly(){
  // group by ISO week (YYYY-WW)
  const byWeek = {};
  db.cardio.forEach(c=>{
    const d = new Date(c.date);
    if(isNaN(d)) return;
    // ISO week calc
    const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = (tmp.getUTCDay() || 7);
    tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(),0,1));
    const weekNo = Math.ceil((((tmp - yearStart) / 86400000) + 1)/7);
    const key = tmp.getUTCFullYear() + '-W' + String(weekNo).padStart(2,'0');
    byWeek[key] = (byWeek[key]||0) + (c.minutes||0);
  });
  const labels = Object.keys(byWeek).sort();
  const vals = labels.map(k=>byWeek[k]);
  drawLineChart('chart_cardio_weekly', labels, vals, {});
}

// ---- RM calculator ----
document.getElementById('calcRM').addEventListener('click',()=>{
  const w = +$('#rm_w').value || 0;
  const r = +$('#rm_r').value || 1;
  if(!w || !r){ $('#rm_out').innerHTML = '<small>Podaj ciężar i powtórzenia.</small>'; return; }
  const epley = w * (1 + r/30);
  const brzycki = w * (36/(37-r));
  $('#rm_out').innerHTML = `<p><b>Szacowane 1RM</b><br>Epley: ${epley.toFixed(1)} kg<br>Brzycki: ${brzycki.toFixed(1)} kg</p>`;
});

// ---- Quick presets ----
$all('[data-preset]').forEach(btn=>btn.addEventListener('click',()=>{
  const p = btn.dataset.preset;
  const map = { '5x5':[5,5], '3x8':[3,8], '4x8':[4,8], '5x3':[5,3] };
  const [s,r] = map[p];
  $('#w_sets').value = s; $('#w_reps').value = r;
  alert(`Ustawiono ${s}x${r} w formularzu Treningi. Uzupełnij ćwiczenie i ciężar.`);
}));

// ---- Export/Import ----
document.getElementById('exportJSON').addEventListener('click',()=>{
  const data = JSON.stringify(db, null, 2);
  const blob = new Blob([data], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'fitlog_backup.json'; a.click();
  URL.revokeObjectURL(url);
});

document.getElementById('exportCSV').addEventListener('click',()=>{
  const rowsW = [['date','exercise','sets','reps','weight','note'], ...db.workouts.map(w=>[w.date,w.ex,w.sets,w.reps,w.weight,w.note||''])];
  const rowsBW = [['date','weight','note'], ...db.weight.map(w=>[w.date,w.value,w.note||''])];
  const rowsC = [['date','type','minutes','distance','hr','note'], ...db.cardio.map(c=>[c.date,c.type,c.minutes,c.distance||'',c.hr||'',c.note||''])];
  const makeCsv = (rows)=> rows.map(r=>r.map(x=>`"${String(x).replace(/"/g,'""')}"`).join(',')).join('\n');
  const files = {
    'workouts.csv': makeCsv(rowsW),
    'bodyweight.csv': makeCsv(rowsBW),
    'cardio.csv': makeCsv(rowsC)
  };
  for(const [name,content] of Object.entries(files)){
    const blob = new Blob([content], {type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download=name; a.click();
    URL.revokeObjectURL(url);
  }
});

document.getElementById('importBtn').addEventListener('click',()=>{
  const file = document.getElementById('importFile').files[0];
  if(!file){ alert('Wybierz plik JSON.'); return; }
  const reader = new FileReader();
  reader.onload = () => {
    try{
      const data = JSON.parse(reader.result);
      if(!data.workouts || !data.weight){ throw new Error('Zły format — brakuje workouts/weight'); }
      if(!data.cardio) data.cardio = [];
      db = data; save();
      renderWorkouts(); renderWeight(); renderCardio();
      drawWeightChart(); drawStrengthChart(); drawCardioWeekly();
      alert('Zaimportowano dane!');
    }catch(e){ alert('Nie udało się zaimportować: ' + e.message); }
  };
  reader.readAsText(file);
});
