// ── MAP CANVAS ──────────────────────────────────────────────────────────────
const MAP_KEY = 'sb_maps_v1';
let maps = [];
let activeMapId = null;
let mapSectionOpen = false;

// ── TYPE TO EMOJI MAPPING ──────────────────────────────────────────────────
const typeEmojis = {
  'output': '📦',
  'input': '📩',
  'skill': '🛠️',
  'agent': '🤖',
  'description': '📖',
  'default': '⚙️'
};

function getEmojiForType(type){
  return typeEmojis[type] || typeEmojis['default'];
}

// ── SAFE COLOR HEX FUNCTION ────────────────────────────────────────────────
function colorHex(c){
  if(typeof COLORS !== 'undefined'){
    return COLORS[c] || COLORS.gray;
  }
  const fallback = {
    'blue': '#00B4D8', 'purple': '#7209B7', 'teal': '#00D9FF',
    'pink': '#FF006E', 'orange': '#FB5607', 'green': '#06A77D', 'gray': '#A0AEC0'
  };
  return fallback[c] || fallback.gray;
}

function loadMaps(){
  try { maps = JSON.parse(localStorage.getItem(MAP_KEY)||'[]'); } catch(e){ maps=[]; }
  if(!activeMapId && maps.length) activeMapId = maps[0].id;
  renderMapList();
}

function saveMaps(){
  try { localStorage.setItem(MAP_KEY, JSON.stringify(maps)); } catch(e){}
}

function getActiveMap(){ return maps.find(m=>m.id===activeMapId)||null; }

function newMap(){
  const name = prompt('Map name:','Untitled map');
  if(!name) return;
  pushUndo();
  const id = 'map_'+Date.now();
  maps.push({id, name, nodes:[], edges:[]});
  activeMapId = id;
  saveMaps();
  renderMapList();
  if(mapSectionOpen) renderMapCanvas();
}

function deleteMap(id, e){
  e.stopPropagation();
  const m = maps.find(x=>x.id===id);
  if(!m||!confirm('Delete map "'+m.name+'"?')) return;
  pushUndo();
  maps = maps.filter(x=>x.id!==id);
  if(activeMapId===id) activeMapId = maps.length ? maps[0].id : null;
  saveMaps();
  renderMapList();
  if(mapSectionOpen) renderMapCanvas();
}

function selectMap(id){
  activeMapId = id;
  renderMapList();
  if(mapSectionOpen) renderMapCanvas();
}

function renderMapList(){
  const list = document.getElementById('map-list');
  if(!list) return;
  list.innerHTML = maps.map(m=>`
    <div class="map-item ${m.id===activeMapId?'active':''}" onclick="selectMap('${m.id}')">
      <span>${esc(m.name)}</span>
      <button onclick="deleteMap('${m.id}',event)" title="Delete"><i class="ti ti-trash" style="font-size:11px"></i></button>
    </div>
  `).join('');
}

function renderMapCanvas(){
  const wrap = document.getElementById('map-canvas-wrap');
  if(!wrap) return;
  const map = getActiveMap();
  if(!map){
    wrap.innerHTML = `<div class="map-empty-msg">No map selected</div>`;
    wrap.classList.add('empty-state');
    return;
  }
  wrap.classList.remove('empty-state');
  
  wrap.innerHTML = `
    <div class="map-toolbar">
      <button class="map-tool-btn" onclick="createSkillOnCanvas()" title="Create new item"><i class="ti ti-circle-plus"></i> Create Item</button>
      <button class="map-tool-btn" onclick="saveMaps(); alert('Saved!');" title="Save"><i class="ti ti-device-floppy"></i></button>
    </div>
    <svg id="map-svg" style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;"></svg>
    <div id="map-nodes-layer" style="position:absolute;top:0;left:0;width:100%;height:100%;"></div>
  `;
  
  renderNodes(map);
  renderEdges(map);
}

function renderNodes(map){
  const layer = document.getElementById('map-nodes-layer');
  if(!layer) return;
  const allItems = [...S.personal,...S.shared].filter(i=>!i.archived);
  layer.innerHTML = map.nodes.map(node=>{
    const item = allItems.find(i=>i.id===node.itemId);
    if(!item) return '';
    const hex = colorHex(item.color||'gray');
    return `<div class="map-node" style="left:${node.x}px;top:${node.y}px;" onmousedown="startNodeDrag(event,'${node.id}')">
      <div style="background:#FFFFFF;color:#666;border:3px solid ${hex};display:flex;align-items:center;justify-content:center;font-size:18px;width:50px;height:50px;border-radius:4px;">
        ${getEmojiForType(item.type || 'skill')}
      </div>
      <div style="font-size:12px;margin-top:6px;text-align:center;max-width:70px;">${esc(item.name)}</div>
      <div style="font-size:10px;text-align:center;color:#999;">${item.type}</div>
    </div>`;
  }).join('');
}

function renderEdges(map){}

function addItemToMap(itemId){
  if(!mapSectionOpen) return;
  const map = getActiveMap();
  if(!map) { alert('Create a map first'); return; }
  const col = map.nodes.length % 3;
  const row = Math.floor(map.nodes.length / 3);
  const x = 40 + col * 200;
  const y = 40 + row * 120;
  pushUndo();
  map.nodes.push({id:'n_'+Date.now(), itemId, x, y});
  saveMaps();
  renderMapCanvas();
}

function createSkillOnCanvas(){
  const map = getActiveMap();
  if(!map) { alert('Create a map first'); return; }
  const name = prompt('Item name:');
  if(!name) return;
  const type = prompt('Type (output/input/skill/agent/description):','skill');
  const color = prompt('Color (blue/purple/teal/pink/orange/green/gray):','blue');
  
  const item = {
    id: 'skill_'+Date.now(),
    name: name,
    type: type,
    color: color,
    icon: 'ti-puzzle',
    archived: false
  };
  
  if(!S.personal) S.personal = [];
  S.personal.push(item);
  localStorage.setItem('sb_skills_v2', JSON.stringify(S));
  
  const col = map.nodes.length % 3;
  const row = Math.floor(map.nodes.length / 3);
  const x = 40 + col * 200;
  const y = 40 + row * 120;
  
  pushUndo();
  map.nodes.push({id:'n_'+Date.now(), itemId: item.id, x, y});
  saveMaps();
  renderMapCanvas();
}

function toggleMapSection(id){
  const elem = document.getElementById(id);
  if(!elem) return;
  mapSectionOpen = !mapSectionOpen;
  if(mapSectionOpen){
    elem.classList.remove('collapsed');
    elem.classList.add('expanded');
    if(activeMapId) renderMapCanvas();
  } else {
    elem.classList.add('collapsed');
    elem.classList.remove('expanded');
  }
}

function removeNodeFromMap(nodeId){
  const map = getActiveMap();
  if(!map) return;
  pushUndo();
  map.nodes = map.nodes.filter(n=>n.id!==nodeId);
  saveMaps();
  renderMapCanvas();
}

function startNodeDrag(event, nodeId){
  event.preventDefault();
  const map = getActiveMap();
  if(!map) return;
  const node = map.nodes.find(n=>n.id===nodeId);
  if(!node) return;
  
  const startX = event.clientX;
  const startY = event.clientY;
  const origX = node.x;
  const origY = node.y;
  
  const handleMove = (e) => {
    node.x = origX + (e.clientX - startX);
    node.y = origY + (e.clientY - startY);
    renderMapCanvas();
  };
  
  const handleUp = () => {
    document.removeEventListener('mousemove', handleMove);
    document.removeEventListener('mouseup', handleUp);
    saveMaps();
  };
  
  document.addEventListener('mousemove', handleMove);
  document.addEventListener('mouseup', handleUp);
}

function pushUndo(){}
function esc(s){ return (s+'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
