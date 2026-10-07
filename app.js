const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const KEY = "dailyCut2";
const MEALS = [["breakfast","🍳 Breakfast"],["lunch","🍛 Lunch"],["snack","🍎 Snacks"],["dinner","🌙 Dinner"]];
const today = () => new Date().toLocaleDateString("en-CA");
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const RL = {best:"Best", good:"Good", worst:"Limit"};
const defaults = () => JSON.parse(JSON.stringify(FOOD_DATA));

function load(){
  let s; try{ s = JSON.parse(localStorage.getItem(KEY)); }catch(e){}
  if(!s){ // first run: migrate data from the old version
    s = {settings:{maintenance:2200, target:1700, protein:100}, foods:null, plans:{}, weights:{}};
    try{ const f = JSON.parse(localStorage.getItem("dailyCutFoodDatabase")); if(Array.isArray(f)) s.foods = f; }catch(e){}
    try{ const p = JSON.parse(localStorage.getItem("dailyCutPlan")); if(p && p.length) s.plans[today()] = p.map(i => ({id:i.id, qty:i.qty, meal:"snack"})); }catch(e){}
    const w = parseFloat(localStorage.getItem("dailyCutWeight")); if(w) s.weights[today()] = w;
  }
  s.foods = s.foods || defaults();
  return s;
}
let S = load();
let pickMeal = "snack", pickFilter = "all", editId = null;
const save = () => localStorage.setItem(KEY, JSON.stringify(S));
const food = id => S.foods.find(f => f.id === id);
const plan = () => S.plans[today()] || (S.plans[today()] = []);
const totals = items => items.reduce((t,i) => { const f = food(i.id); if(f){ t.k += f.calories*i.qty; t.p += f.protein*i.qty; } return t; }, {k:0, p:0});
const fmt = n => Math.round(n).toLocaleString();

function toast(msg){ const t = $("#toast"); t.textContent = msg; t.classList.add("on"); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("on"), 1800); }

/* ---------- Today ---------- */
function renderToday(){
  const items = plan(), {k, p} = totals(items), t = S.settings.target, left = t - k, C = 2*Math.PI*52;
  const ring = $("#ring");
  ring.style.strokeDasharray = C;
  ring.style.strokeDashoffset = C * (1 - Math.min(k/t, 1));
  ring.classList.toggle("over", k > t);
  $("#rk").textContent = fmt(k); $("#rt").textContent = fmt(t);
  $("#rl").textContent = left >= 0 ? `${fmt(left)} kcal left` : `${fmt(-left)} kcal over target`;
  $("#rl").classList.toggle("over", left < 0);
  $("#pv").textContent = `${fmt(p)} / ${S.settings.protein} g`;
  $("#pbar").style.width = Math.min(p / S.settings.protein * 100, 100) + "%";
  $("#df").textContent = `${fmt(S.settings.maintenance - k)} kcal`;
  $("#wToday").value = S.weights[today()] || "";
  $("#meals").innerHTML = MEALS.map(([m, label]) => {
    const its = items.filter(i => i.meal === m);
    const rows = its.map(i => { const f = food(i.id); if(!f) return "";
      return `<div class="item"><div><b>${esc(f.name)}</b><small>${esc(f.quantity)} · ${fmt(f.calories*i.qty)} kcal · ${Math.round(f.protein*i.qty)} g protein</small></div>
        <div class="step"><button data-act="qty" data-d="-0.5" data-id="${esc(i.id)}" data-meal="${m}" aria-label="Less">−</button><b>${i.qty}</b><button data-act="qty" data-d="0.5" data-id="${esc(i.id)}" data-meal="${m}" aria-label="More">+</button></div>
        <button class="rm" data-act="rm" data-id="${esc(i.id)}" data-meal="${m}" aria-label="Remove">×</button></div>`; }).join("");
    return `<section class="card meal m-${m}"><div class="mh"><h3>${label}</h3><span>${fmt(totals(its).k)} kcal</span></div>${rows || '<p class="empty">Nothing planned yet.</p>'}<button class="btn" data-act="pick" data-meal="${m}">+ Add food</button></section>`;
  }).join("");
}

function addToPlan(id, meal){
  const ex = plan().find(i => i.id === id && i.meal === meal);
  ex ? ex.qty += 1 : plan().push({id, qty:1, meal});
  save(); renderToday();
}

/* ---------- Picker ---------- */
function matches(f, q, flt){
  const ok = !q || (f.name + " " + f.category + " " + f.notes).toLowerCase().includes(q);
  const r = flt === "all" || f.rating === flt || (flt === "protein" && f.protein >= 15) || (flt === "light" && f.calories <= 150);
  return ok && r;
}
function renderPicker(){
  const q = $("#pSearch").value.toLowerCase().trim();
  const list = S.foods.filter(f => matches(f, q, pickFilter));
  $("#pList").innerHTML = list.map(f => `<button class="prow" data-act="add" data-id="${esc(f.id)}"><span><b>${esc(f.name)}</b> <span class="badge ${f.rating}">${RL[f.rating]}</span><small>${esc(f.quantity)} · ${f.calories} kcal · ${f.protein} g protein</small></span><i>+</i></button>`).join("") || '<p class="empty">No foods match. Add one from the Foods tab.</p>';
}

/* ---------- Foods ---------- */
function renderFoods(){
  const q = $("#fSearch").value.toLowerCase().trim(), flt = $("#fFilter").value;
  const list = S.foods.filter(f => matches(f, q, flt));
  $("#fCount").textContent = `${list.length} of ${S.foods.length} foods`;
  $("#foodGrid").innerHTML = list.map(f => `<article class="fcard r-${f.rating}"><div class="ft"><h3>${esc(f.name)}</h3><span class="badge ${f.rating}">${RL[f.rating]}</span></div>
    <div class="meta"><b>${f.calories} kcal</b> · ${f.protein} g protein · ${esc(f.quantity)}</div>
    <div class="note">${esc(f.notes)}</div>
    <div class="fa"><button class="btn" data-act="edit" data-id="${esc(f.id)}">Edit</button><button class="btn danger" data-act="del" data-id="${esc(f.id)}">Delete</button></div></article>`).join("");
}
function openEditor(id){
  editId = id; const f = id ? food(id) : {rating:"good", protein:0};
  const F = $("#foodForm"); $("#eTitle").textContent = id ? "Edit food" : "New food";
  ["name","calories","protein","quantity","rating","category","notes"].forEach(k => F.elements[k].value = f[k] ?? "");
  $("#editor").showModal();
}
$("#foodForm").addEventListener("submit", () => {
  const F = $("#foodForm").elements;
  const data = {name:F.name.value.trim(), category:F.category.value.trim() || "Other", rating:F.rating.value, quantity:F.quantity.value.trim(),
    calories:+F.calories.value, unit:"serving", protein:+F.protein.value, notes:F.notes.value.trim()};
  if(editId) Object.assign(food(editId), data);
  else {
    let id = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "food", n = id, i = 2;
    while(food(n)) n = id + "_" + i++;
    S.foods.push({id:n, ...data});
  }
  save(); renderAll(); toast("Food saved");
});

/* ---------- Settings ---------- */
function renderSettings(){
  $("#sMaint").value = S.settings.maintenance; $("#sTarget").value = S.settings.target; $("#sProt").value = S.settings.protein;
  const rows = [];
  for(let d = 0; d < 7; d++){
    const dt = new Date(); dt.setDate(dt.getDate() - d);
    const key = dt.toLocaleDateString("en-CA"), k = totals(S.plans[key] || []).k;
    rows.push(`<div><span>${d ? dt.toLocaleDateString(undefined, {weekday:"short", day:"numeric", month:"short"}) : "Today"}</span><span>${k ? fmt(k) + " kcal" : "—"}</span><span>${S.weights[key] ? S.weights[key] + " kg" : "—"}</span></div>`);
  }
  $("#history").innerHTML = `<div><span>Day</span><span>Eaten</span><span>Weight</span></div>` + rows.join("");
}
["sMaint:maintenance", "sTarget:target", "sProt:protein"].forEach(p => {
  const [id, key] = p.split(":");
  $("#" + id).addEventListener("change", e => { S.settings[key] = Math.max(1, +e.target.value || S.settings[key]); save(); renderAll(); });
});
$("#wToday").addEventListener("change", e => { const v = parseFloat(e.target.value); v ? S.weights[today()] = v : delete S.weights[today()]; save(); renderSettings(); toast("Weight saved"); });

/* ---------- Actions ---------- */
function backup(){
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([JSON.stringify(S, null, 2)], {type:"application/json"}));
  a.download = `daily-cut-backup-${today()}.json`; a.click(); URL.revokeObjectURL(a.href);
}
$("#importFile").addEventListener("change", async e => {
  try{
    const d = JSON.parse(await e.target.files[0].text());
    if(!Array.isArray(d.foods) || !d.settings) throw 0;
    S = d; save(); renderAll(); toast("Backup imported");
  }catch(err){ toast("That file isn't a Daily Cut backup"); }
  e.target.value = "";
});

document.addEventListener("click", e => {
  const b = e.target.closest("[data-act]"); if(!b) return;
  const {act, id, meal} = b.dataset;
  if(act === "pick"){ pickMeal = meal; $("#pTitle").textContent = "Add to " + MEALS.find(m => m[0] === meal)[1].slice(3); $("#pSearch").value = ""; renderPicker(); $("#picker").showModal(); }
  else if(act === "add"){ addToPlan(id, pickMeal); toast(food(id).name + " added"); }
  else if(act === "qty"){ const it = plan().find(i => i.id === id && i.meal === meal); it.qty = Math.max(0, it.qty + +b.dataset.d); S.plans[today()] = plan().filter(i => i.qty > 0); save(); renderToday(); }
  else if(act === "rm"){ S.plans[today()] = plan().filter(i => !(i.id === id && i.meal === meal)); save(); renderToday(); }
  else if(act === "closePick") $("#picker").close();
  else if(act === "closeEdit") $("#editor").close();
  else if(act === "newFood") openEditor(null);
  else if(act === "edit") openEditor(id);
  else if(act === "del"){ if(confirm(`Delete "${food(id).name}"?`)){ S.foods = S.foods.filter(f => f.id !== id); save(); renderAll(); toast("Food deleted"); } }
  else if(act === "export") backup();
  else if(act === "dataJs"){ const l = document.createElement("a"); l.href = URL.createObjectURL(new Blob(["const FOOD_DATA = " + JSON.stringify(S.foods, null, 2) + ";\n"], {type:"text/javascript"})); l.download = "data.js"; l.click(); URL.revokeObjectURL(l.href); toast("Replace data.js in your folder with this file"); }
  else if(act === "json"){ $("#jsonText").value = JSON.stringify(S.foods, null, 2); $("#jsonMsg").textContent = ""; $("#jsonDlg").showModal(); }
  else if(act === "closeJson") $("#jsonDlg").close();
  else if(act === "saveJson"){ try{ const d = JSON.parse($("#jsonText").value); if(!Array.isArray(d) || d.some(f => !f.id || !f.name)) throw new Error("Must be a list of foods, each with id and name."); S.foods = d; save(); renderAll(); $("#jsonDlg").close(); toast("Foods updated"); }catch(err){ $("#jsonMsg").textContent = "Invalid JSON: " + err.message; } }
  else if(act === "clearToday"){ if(confirm("Clear today's plan?")){ S.plans[today()] = []; save(); renderAll(); } }
  else if(act === "defaults"){ if(confirm("Replace your food list with the original defaults? Custom foods will be lost.")){ S.foods = defaults(); save(); renderAll(); } }
  else if(act === "wipe"){ if(confirm("Erase all foods, plans and weights from this browser?")){ localStorage.removeItem(KEY); S = load(); renderAll(); } }
});
$("#pChips").addEventListener("click", e => { const b = e.target.closest("button"); if(!b) return; pickFilter = b.dataset.f; $$("#pChips button").forEach(x => x.classList.toggle("on", x === b)); renderPicker(); });
$("#pSearch").addEventListener("input", renderPicker);
$("#fSearch").addEventListener("input", renderFoods);
$("#fFilter").addEventListener("change", renderFoods);
$$("dialog").forEach(d => d.addEventListener("click", e => { if(e.target === d) d.close(); }));

$("#tabs").addEventListener("click", e => {
  const b = e.target.closest("button"); if(!b) return;
  $$("#tabs button").forEach(x => x.classList.toggle("on", x === b));
  $$(".view").forEach(v => v.classList.toggle("on", v.id === "view-" + b.dataset.view));
  scrollTo(0, 0);
});

/* ---------- Theme ---------- */
function applyTheme(){ const t = S.settings.theme || (matchMedia("(prefers-color-scheme:dark)").matches ? "dark" : "light"); document.documentElement.dataset.theme = t; }
$("#theme").addEventListener("click", () => { S.settings.theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark"; save(); applyTheme(); });

function renderAll(){ renderToday(); renderFoods(); renderSettings(); }
$("#dateLabel").textContent = new Date().toLocaleDateString(undefined, {weekday:"long", day:"numeric", month:"long"});
applyTheme(); renderAll();