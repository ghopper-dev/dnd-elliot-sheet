const DEFAULTS = {
  CharacterName:"Elliot", PlayerName:"Elliot", ClassLevel:"Ranger (Drakewarden) 9", ProfBonus:"+4",
  Inspiration:"0", AC:"17", Initiative:"+4", Speed:"30 ft",
  HPMax:"64", HPCurrent:"64", HPTemp:"0", HDTotal:"9", HD:"9", SpellDC:"15",
  PassiveWis:"12",
  Wpn1Name:"Whisper", Wpn1Atk:"+10", Wpn1Dmg:"2d4+5 +1d6 (hidden, psychic optional) · Elven Accuracy",
  Wpn2Name:"Longbow +1", Wpn2Atk:"+9", Wpn2Dmg:"1d8+5",
  Wpn3Name:"Shortsword", Wpn3Atk:"+6", Wpn3Dmg:"1d6+4",
  Features:"Whisper — Perfect Hide (1/day): while in cover, Elliot can hide flawlessly. While hidden, Whisper's attacks deal an extra 1d6 damage and Elliot can choose for it to be psychic. After hitting an enemy, Elliot can use a bonus action to slip back into hiding. Hidden attacks can also deliver Vicious Mockery — on a crit the target has disadvantage on its attacks. If the Vicious Mockery save fails, the target's next attack against Elliot has disadvantage.\n\nElven Accuracy (feat): whenever Elliot has advantage on an attack roll using Dexterity — e.g. attacking while hidden — Elliot can reroll ONE of the dice once (roll 3d20, keep best 2). Works with Whisper, the Longbow +1, and the Shortsword; it's what makes hiding before every shot so deadly (~14% crit chance per shot).\n\nLongbow +1.",
  Slots1:"4", Slots1Left:"4", Slots2:"3", Slots2Left:"3", Slots3:"2", Slots3Left:"2",
  DrakeName:"Drake", DrakeEssence:"fire", DrakeAC:"18", DrakeHP:"50", DrakeSpeed:"40 ft, fly 40 ft",
  DrakeBiteName:"Bite", DrakeBiteAtk:"+7", DrakeBiteDmg:"1d6+4 piercing + 1d6 essence",
  DrakeInfused:"+1d6 essence dmg", DrakeNotes:"",
  Spells:"Cantrip: Thaumaturgy\n1st: Cure Wounds, Speak with Animals, Hunter's Mark\n2nd: Pass without Trace\n3rd: Nondetection — 8h, can't be detected by divination magic or scrying",
  Gold:"1000", Silver:"0", Copper:"0"
};
const ABILITIES = [
  {id:"STR", mod:"+1"}, {id:"DEX", mod:"+4"}, {id:"CON", mod:"+3"},
  {id:"INT", mod:"-1"}, {id:"WIS", mod:"+2"}, {id:"CHA", mod:"-1"}
];
const SAVES = {STR:"1", DEX:"6", CON:"3", INT:"-1", WIS:"6", CHA:"-1"};
const SAVE_PROF = ["DEX","WIS"];
const SKILLS = [
  ["Acrobatics","DEX","4",0],["Animal Handling","WIS","2",0],["Arcana","INT","-1",0],
  ["Athletics","STR","1",0],["Deception","CHA","-1",0],["History","INT","-1",0],
  ["Insight","WIS","5",1],["Intimidation","CHA","-1",0],["Investigation","INT","-1",0],
  ["Medicine","WIS","1",0],["Nature","INT","1",0],["Perception","WIS","5",1],
  ["Performance","CHA","0",0],["Persuasion","CHA","0",0],["Religion","INT","1",0],
  ["Sleight of Hand","DEX","4",0],["Stealth","DEX","7",1],["Survival","WIS","5",1]
];
const KEY = "elliot-sheet-v1";
let state = JSON.parse(JSON.stringify(DEFAULTS));
state.abilities = {}; ABILITIES.forEach(a=>state.abilities[a.id]=a.mod);
state.saves = Object.assign({}, SAVES);
state.saveProf = SAVE_PROF.slice();
state.skills = SKILLS.map(s=>({name:s[0], ab:s[1], val:s[2], prof:!!s[3]}));

// load saved
try{
  const s = JSON.parse(localStorage.getItem(KEY));
  if(s) state = Object.assign(state, s);
}catch(e){}
if(!Array.isArray(state.items)) state.items = [];
if(!Array.isArray(state.notes)) state.notes = [];

function render(){
  Object.keys(DEFAULTS).forEach(k=>{
    const el = document.getElementById(k);
    if(el) el.value = state[k] ?? "";
  });
  document.getElementById("char-title").textContent = state.CharacterName || "Character Sheet";
  // abilities
  const ab = document.getElementById("abilities"); ab.innerHTML="";
  ABILITIES.forEach(a=>{
    const d=document.createElement("div"); d.className="stat";
    d.innerHTML=`<label>${a.id}</label><div class="mod">${state.abilities[a.id]}</div>`+
      `<input data-ab="${a.id}" value="${state.abilities[a.id]}">`;
    ab.appendChild(d);
  });
  ab.querySelectorAll("input").forEach(i=>i.addEventListener("input",e=>{
    state.abilities[e.target.dataset.ab]=e.target.value;
    e.target.previousElementSibling.textContent=e.target.value; saveAll();
  }));
  // saves
  const sv=document.getElementById("saves"); sv.innerHTML="";
  ABILITIES.forEach(a=>{
    const d=document.createElement("div"); d.className="skill";
    d.innerHTML=`<span class="dot ${state.saveProf.includes(a.id)?'prof':''}" data-save="${a.id}"></span>`+
      `<span style="flex:1">${a.id} save</span><span class="val">${state.saves[a.id]}</span>`;
    sv.appendChild(d);
  });
  // skills
  const sk=document.getElementById("skills"); sk.innerHTML="";
  state.skills.forEach((s,i)=>{
    const d=document.createElement("div"); d.className="skill";
    d.innerHTML=`<span class="dot ${s.prof?'prof':''}" data-skill="${i}"></span>`+
      `<span style="flex:1">${s.name} <small style="color:var(--muted)">(${s.ab})</small></span>`+
      `<span class="val">${s.val}</span>`;
    sk.appendChild(d);
  });
  document.querySelectorAll("[data-save]").forEach(el=>el.onclick=()=>{
    const id=el.dataset.save, p=state.saveProf;
    p.includes(id)?p.splice(p.indexOf(id),1):p.push(id); saveAll(); render();
  });
  document.querySelectorAll("[data-skill]").forEach(el=>el.onclick=()=>{
    const s=state.skills[el.dataset.skill]; s.prof=!s.prof; saveAll(); render();
  });
  // bind top fields
  Object.keys(DEFAULTS).forEach(k=>{
    const el=document.getElementById(k);
    if(el) el.oninput=()=>{ state[k]=el.value;
      if(k==="CharacterName") document.getElementById("char-title").textContent=el.value||"Character Sheet";
      saveAll(); };
  });
}
let t;
function saveAll(manual){
  clearTimeout(t);
  t=setTimeout(()=>{
    localStorage.setItem(KEY, JSON.stringify(state));
    const tag=document.getElementById("savedTag");
    tag.style.opacity=1; setTimeout(()=>tag.style.opacity=0,1200);
  }, manual?0:400);
}
function resetAll(){
  if(confirm("Reset the sheet back to the defaults from your PDF? This wipes your saved edits.")){
    localStorage.removeItem(KEY); location.reload();
  }
}
function adjHP(d){
  const el=document.getElementById('HPCurrent');
  const cur=parseInt(state.HPCurrent)||0;
  const max=parseInt(state.HPMax)||999;
  const next=Math.min(max, Math.max(0, cur+d));
  state.HPCurrent=String(next); el.value=String(next); saveAll();
}
function showTab(t){
  ['char','drake','spells','bag','notes'].forEach(x=>{
    document.getElementById('tab-'+x).style.display = x===t?'':'none';
    document.getElementById('tabbtn-'+x).classList.toggle('active', x===t);
  });
}
render();

function adjGold(n){
  const el=document.getElementById('Gold');
  const v=Math.max(0,(parseInt(state.Gold)||0)+n);
  state.Gold=String(v); el.value=String(v); saveAll();
}
function renderItems(){
  const t=document.getElementById('itemTable');
  t.innerHTML='<tr><th style="text-align:left">Item</th><th style="width:70px">Qty</th><th style="width:60px"></th></tr>';
  state.items.forEach((it,i)=>{
    const tr=document.createElement('tr');
    tr.innerHTML='<td style="padding:4px 6px"><input style="width:100%" value=""></td><td style="text-align:center"><input style="text-align:center" value=""></td><td style="text-align:center"><button class="ghost" style="padding:2px 8px" title="remove">✕</button></td>';
    const nm=tr.children[0].firstChild; nm.value=it.name;
    nm.oninput=()=>{state.items[i].name=nm.value; saveAll();};
    const q=tr.children[1].firstChild; q.value=it.qty;
    q.oninput=()=>{state.items[i].qty=q.value; saveAll();};
    tr.children[2].firstChild.onclick=()=>{state.items.splice(i,1); saveAll(); renderItems();};
    t.appendChild(tr);
  });
}
function addItem(){
  const n=document.getElementById('newItemName'), q=document.getElementById('newItemQty');
  const name=n.value.trim(); if(!name) return;
  state.items.push({name:name, qty:q.value.trim()||"1"});
  n.value=""; q.value=""; n.focus();
  saveAll(); renderItems();
}
renderItems();
let activeNote = 0;
function ensureNotes(){ if(!Array.isArray(state.notes)) state.notes=[]; }
function renderNotes(){
  ensureNotes();
  const side=document.getElementById('noteSide');
  const main=document.getElementById('noteMain');
  if(!state.notes.length){
    side.innerHTML='';
    main.innerHTML='<p class="note-empty">No notes yet — hit “+ Add session note”.</p>';
    return;
  }
  if(activeNote>=state.notes.length) activeNote=state.notes.length-1;
  if(activeNote<0) activeNote=0;
  side.innerHTML='';
  state.notes.forEach((n,i)=>{
    const row=document.createElement('div');
    row.className='nrow'+(i===activeNote?' active':'');
    const date=(n.title&&/^\d{4}-\d{2}-\d{2}$/.test(n.title))?n.title:'';
    const label=(date? '' : (n.title||'Untitled')) || (date?'Untitled':'');
    row.innerHTML='<span class="ndel" title="remove">✕</span><span class="ndate">'+(date||'')+'</span>'+escapeHtml(label||'Untitled');
    row.onclick=(e)=>{ if(e.target.classList.contains('ndel')) return; activeNote=i; renderNotes(); };
    row.querySelector('.ndel').onclick=(e)=>{ e.stopPropagation(); state.notes.splice(i,1); if(activeNote>=state.notes.length) activeNote=state.notes.length-1; saveAll(); renderNotes(); };
    side.appendChild(row);
  });
  const n=state.notes[activeNote];
  main.innerHTML=
    '<input class="note-title" placeholder="Session title / date">'+
    '<div class="wysiwig-bar">'+
      '<button onclick="fmt(\'bold\')"><b>B</b></button>'+
      '<button onclick="fmt(\'italic\')"><i>I</i></button>'+
      '<button onclick="fmt(\'insertUnorderedList\')">• List</button>'+
      '<button onclick="fmt(\'insertOrderedList\')">1. List</button>'+
      '<button onclick="fmt(\'formatBlock\',\'H2\')">H</button>'+
      '<button onclick="fmt(\'removeFormat\')">⤬</button>'+
    '</div>'+
    '<div class="note-editor" contenteditable="true" id="noteEditor"></div>';
  const titleEl=main.querySelector('.note-title');
  const ed=main.querySelector('#noteEditor');
  titleEl.value=n.title||'';
  ed.innerHTML=n.body||'';
  titleEl.oninput=()=>{ state.notes[activeNote].title=titleEl.value; saveAll(); renderSideOnly(); };
  ed.oninput=()=>{ state.notes[activeNote].body=ed.innerHTML; saveAll(); };
}
function renderSideOnly(){
  ensureNotes();
  const side=document.getElementById('noteSide'); if(!side) return;
  side.innerHTML='';
  state.notes.forEach((n,i)=>{
    const row=document.createElement('div');
    row.className='nrow'+(i===activeNote?' active':'');
    const date=(n.title&&/^\d{4}-\d{2}-\d{2}$/.test(n.title))?n.title:'';
    const label=(date? '' : (n.title||'Untitled'));
    row.innerHTML='<span class="ndel" title="remove">✕</span><span class="ndate">'+(date||'')+'</span>'+escapeHtml(label||'Untitled');
    row.onclick=(e)=>{ if(e.target.classList.contains('ndel')) return; activeNote=i; renderNotes(); };
    row.querySelector('.ndel').onclick=(e)=>{ e.stopPropagation(); state.notes.splice(i,1); if(activeNote>=state.notes.length) activeNote=state.notes.length-1; saveAll(); renderNotes(); };
    side.appendChild(row);
  });
}
function fmt(cmd,val){ document.execCommand(cmd,false,val||null); const ed=document.getElementById('noteEditor'); if(ed){ ed.focus(); state.notes[activeNote].body=ed.innerHTML; saveAll(); } }
function escapeHtml(s){ return (s||'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])); }
function addNote(){
  ensureNotes();
  const ds=new Date().toISOString().slice(0,10);
  state.notes.unshift({title:ds, body:""});
  activeNote=0;
  saveAll(); renderNotes();
  const t=document.querySelector('.note-title'); if(t) t.focus();
}
function copyNotes(){
  ensureNotes();
  const txt=state.notes.map(n=>{
    const d=document.createElement('div'); d.innerHTML=(n.body||'');
    const plain=(d.textContent||'')+(d.querySelector('li')? '' : '');
    return ((n.title||'Untitled')+'\n'+plain).trim();
  }).join('\n\n---\n\n');
  navigator.clipboard.writeText(txt).then(()=>{
    const tag=document.getElementById('savedTag'); tag.textContent='📋 notes copied'; tag.style.opacity=1;
    setTimeout(()=>{tag.style.opacity=0; tag.textContent='✓ saved';},1400);
  }).catch(()=>alert('Copy blocked by browser — select the text and copy manually.'));
}
renderNotes();
function exportJSON(){
  const data=JSON.stringify(state,null,2);
  const blob=new Blob([data],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url; a.download='elliot-sheet-backup-'+new Date().toISOString().slice(0,10)+'.json';
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}
renderNotes();
