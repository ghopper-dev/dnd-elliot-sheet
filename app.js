const DEFAULTS = {
  CharacterName:"Elliot", CharLevel:"9", PlayerName:"Elliot", ClassLevel:"Ranger (Drakewarden) 9", Background:"XXXXX", Race:"XXXXX", ProfBonus:"+4",
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

/* ---- tiny DOM helpers -------------------------------------------------
   Everything below builds nodes with createElement/textContent rather than
   innerHTML: character data round-trips through localStorage, so treating
   it as markup would let a tampered save inject script. ------------------ */
function mk(tag, cls){
  const n=document.createElement(tag);
  if(cls) n.className=cls;
  return n;
}

/* One proficiency row: [toggle dot] [name (ABL)] [value] */
function skillRow({label, sub, value, pressed, onToggle}){
  const row=mk("div","skill");

  const dot=mk("button","dot");
  dot.type="button";
  dot.setAttribute("aria-pressed", String(!!pressed));
  dot.setAttribute("aria-label", label+" proficiency");
  dot.addEventListener("click", onToggle);

  const name=mk("span","name");
  name.textContent=label;
  if(sub){
    const s=mk("small");
    s.textContent=" "+sub;
    name.appendChild(s);
  }

  const val=mk("span","val");
  val.textContent=value;

  row.append(dot, name, val);
  return row;
}

function render(){
  Object.keys(DEFAULTS).forEach(k=>{
    const el = document.getElementById(k);
    if(el) el.value = state[k] ?? "";
  });
  document.getElementById("char-title").textContent = state.CharacterName || "Character Sheet";
  // abilities — the input itself is the big readout, so the value is
  // only ever shown once.
  const ab = document.getElementById("abilities");
  ab.replaceChildren(...ABILITIES.map(a=>{
    const d=mk("div","stat");
    const lb=mk("label"); lb.htmlFor="ab-"+a.id; lb.textContent=a.id;
    const inp=document.createElement("input");
    inp.id="ab-"+a.id; inp.dataset.ab=a.id; inp.value=state.abilities[a.id];
    inp.addEventListener("input",()=>{ state.abilities[a.id]=inp.value; saveAll(); });
    d.append(lb,inp);
    return d;
  }));
  // saves
  const sv=document.getElementById("saves");
  sv.replaceChildren(...ABILITIES.map(a=>
    skillRow({
      label: a.id+" save",
      value: state.saves[a.id],
      pressed: state.saveProf.includes(a.id),
      onToggle: ()=>{
        const p=state.saveProf;
        p.includes(a.id) ? p.splice(p.indexOf(a.id),1) : p.push(a.id);
        saveAll(); render();
      }
    })
  ));
  // skills
  const sk=document.getElementById("skills");
  sk.replaceChildren(...state.skills.map(s=>
    skillRow({
      label: s.name,
      sub: "("+s.ab+")",
      value: s.val,
      pressed: !!s.prof,
      onToggle: ()=>{ s.prof=!s.prof; saveAll(); render(); }
    })
  ));
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
const TABS=['char','drake','spells','bag','notes'];

function showTab(t){
  TABS.forEach(x=>{
    const on = x===t;
    // `hidden` rather than an inline style: one source of truth for
    // visibility, and it keeps hidden panels out of the a11y tree.
    document.getElementById('tab-'+x).hidden = !on;
    const btn=document.getElementById('tabbtn-'+x);
    btn.classList.toggle('active', on);
    btn.setAttribute('aria-selected', String(on));
    btn.tabIndex = on ? 0 : -1;   // roving tabindex
  });
}

/* Arrow keys move between tabs, per the ARIA tabs pattern. */
document.addEventListener('keydown', e=>{
  if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key)) return;
  const btn=e.target.closest?.('.tab');
  if(!btn) return;
  const i=TABS.indexOf(btn.id.replace('tabbtn-',''));
  if(i<0) return;
  const next = e.key==='Home' ? 0
             : e.key==='End'  ? TABS.length-1
             : e.key==='ArrowLeft' ? (i-1+TABS.length)%TABS.length
             : (i+1)%TABS.length;
  e.preventDefault();
  showTab(TABS[next]);
  document.getElementById('tabbtn-'+TABS[next]).focus();
});
render();

function adjGold(n){
  const el=document.getElementById('Gold');
  const v=Math.max(0,(parseInt(state.Gold)||0)+n);
  state.Gold=String(v); el.value=String(v); saveAll();
}
function renderItems(){
  const t=document.getElementById('itemTable');

  const head=mk('tr');
  ['Item','Qty',''].forEach((label,c)=>{
    const th=mk('th');
    th.textContent=label;
    if(c===1) th.style.width='76px';
    if(c===2) th.style.width='56px';
    head.appendChild(th);
  });

  const rows=state.items.map((it,i)=>{
    const tr=mk('tr');

    const nm=document.createElement('input');
    nm.value=it.name;
    nm.setAttribute('aria-label','Item name');
    nm.oninput=()=>{ state.items[i].name=nm.value; saveAll(); };

    const q=document.createElement('input');
    q.value=it.qty;
    q.style.textAlign='center';
    q.setAttribute('aria-label','Quantity of '+it.name);
    q.oninput=()=>{ state.items[i].qty=q.value; saveAll(); };

    const del=mk('button','btn ghost');
    del.type='button';
    del.textContent='✕';
    del.style.padding='4px 10px';
    del.title='Remove '+it.name;
    del.setAttribute('aria-label','Remove '+it.name);
    del.onclick=()=>{ state.items.splice(i,1); saveAll(); renderItems(); };

    [nm,q,del].forEach(child=>{
      const td=mk('td');
      if(child!==nm) td.style.textAlign='center';
      td.appendChild(child);
      tr.appendChild(td);
    });
    return tr;
  });

  t.replaceChildren(head, ...rows);
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
const ISO_DATE=/^\d{4}-\d{2}-\d{2}$/;

/* One entry in the notes sidebar. Shared by both render paths so the
   list can't drift between them. */
function noteRow(n, i){
  const row=mk('div','nrow'+(i===activeNote?' active':''));

  const del=mk('span','ndel');
  del.textContent='✕';
  del.title='remove';
  del.onclick=(e)=>{
    e.stopPropagation();
    state.notes.splice(i,1);
    if(activeNote>=state.notes.length) activeNote=state.notes.length-1;
    saveAll(); renderNotes();
  };

  const isDate=ISO_DATE.test(n.title||'');
  const date=mk('span','ndate');
  date.textContent=isDate ? n.title : '';

  const label=mk('span');
  label.textContent=isDate ? 'Untitled' : (n.title||'Untitled');

  row.append(del, date, label);
  row.onclick=(e)=>{
    if(e.target.classList.contains('ndel')) return;
    activeNote=i; renderNotes();
  };
  return row;
}

function renderSideOnly(){
  ensureNotes();
  const side=document.getElementById('noteSide');
  if(!side) return;
  side.replaceChildren(...state.notes.map(noteRow));
}

const NOTE_TOOLS=[
  ['bold',                null, 'B',       'Bold'],
  ['italic',              null, 'I',       'Italic'],
  ['insertUnorderedList', null, '• List',  'Bulleted list'],
  ['insertOrderedList',   null, '1. List', 'Numbered list'],
  ['formatBlock',         'H2', 'H',       'Heading'],
  ['removeFormat',        null, '⤬',       'Clear formatting']
];

function renderNotes(){
  ensureNotes();
  const side=document.getElementById('noteSide');
  const main=document.getElementById('noteMain');

  if(!state.notes.length){
    side.replaceChildren();
    const empty=mk('p','note-empty');
    empty.textContent='No notes yet — hit “+ Add session note”.';
    main.replaceChildren(empty);
    return;
  }

  activeNote=Math.min(Math.max(activeNote,0), state.notes.length-1);
  renderSideOnly();

  const n=state.notes[activeNote];

  const titleEl=document.createElement('input');
  titleEl.className='note-title';
  titleEl.placeholder='Session title / date';
  titleEl.setAttribute('aria-label','Note title');
  titleEl.value=n.title||'';

  const bar=mk('div','wysiwig-bar');
  bar.setAttribute('role','toolbar');
  bar.setAttribute('aria-label','Formatting');
  NOTE_TOOLS.forEach(([cmd,arg,text,title])=>{
    const b=mk('button');
    b.type='button';
    b.textContent=text;
    b.title=title;
    b.setAttribute('aria-label',title);
    b.onclick=()=>fmt(cmd,arg);
    bar.appendChild(b);
  });

  const ed=mk('div','note-editor');
  ed.id='noteEditor';
  ed.contentEditable='true';
  ed.setAttribute('role','textbox');
  ed.setAttribute('aria-multiline','true');
  ed.setAttribute('aria-label','Note body');
  // Rich-text body: this is the user's own content in their own
  // browser, and contenteditable round-trips as HTML by design.
  ed.innerHTML=n.body||'';

  titleEl.oninput=()=>{ state.notes[activeNote].title=titleEl.value; saveAll(); renderSideOnly(); };
  ed.oninput=()=>{ state.notes[activeNote].body=ed.innerHTML; saveAll(); };

  main.replaceChildren(titleEl, bar, ed);
}

function fmt(cmd,val){
  document.execCommand(cmd,false,val||null);
  const ed=document.getElementById('noteEditor');
  if(ed){ ed.focus(); state.notes[activeNote].body=ed.innerHTML; saveAll(); }
}
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
function exportJSON(){
  const data=JSON.stringify(state,null,2);
  const blob=new Blob([data],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url; a.download='elliot-sheet-backup-'+new Date().toISOString().slice(0,10)+'.json';
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}
renderNotes();

// Sync the tab rail once on load so `hidden`, aria-selected and the
// roving tabindex all start from a known state.
showTab('char');
