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
      <button class="map-tool-btn" onclick="openCreateItemModal()" title="Create new item"><i class="ti ti-circle-plus"></i> Create Item</button>
      <button class="map-tool-btn" onclick="saveMaps(); alert('Saved!');" title="Save"><i class="ti ti-device-floppy"></i> Save</button>
      <button class="map-tool-btn" onclick="cleanupOrphanedNodes()" title="Remove broken items" style="background:#FFA500;color:white;">Clean Up</button>
      <button class="map-tool-btn" onclick="clearAllNodes()" title="Clear everything" style="background:#FF4444;color:white;">Clear All</button>
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
  
  // Make sure S exists
  if(typeof S === 'undefined') return;
  
  const allItems = [...(S.personal||[]),...(S.shared||[])].filter(i=>!i.archived);
  
  layer.innerHTML = map.nodes.map(node=>{
    const item = allItems.find(i=>i.id===node.itemId);
    if(!item) return '';
    const hex = colorHex(item.color||'gray');
    return `<div class="map-node" style="left:${node.x}px;top:${node.y}px;position:absolute;cursor:move;" onmousedown="startNodeDrag(event,'${node.id}')">
      <div style="background:#FFFFFF;color:#666;border:3px solid ${hex};display:flex;align-items:center;justify-content:center;font-size:24px;width:60px;height:60px;border-radius:6px;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
        ${getEmojiForType(item.type || 'skill')}
      </div>
      <div style="font-size:11px;margin-top:8px;text-align:center;max-width:80px;font-weight:500;">${esc(item.name)}</div>
      <div style="font-size:9px;text-align:center;color:#999;">${item.type}</div>
    </div>`;
  }).join('');
}

function renderEdges(map){}

function openCreateItemModal(){
  const map = getActiveMap();
  if(!map) { alert('Create a map first'); return; }
  
  const modal = document.createElement('div');
  modal.id = 'create-item-modal';
  modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:10000;';
  
  modal.innerHTML = `
    <div style="background:white;border-radius:8px;padding:24px;width:90%;max-width:400px;box-shadow:0 4px 20px rgba(0,0,0,0.2);">
      <h3 style="margin:0 0 16px 0;font-size:18px;font-weight:600;">Create New Item</h3>
      
      <div style="margin-bottom:16px;">
        <label style="display:block;font-size:12px;font-weight:600;margin-bottom:6px;">Item Name</label>
        <input id="modal-name" type="text" placeholder="e.g., Data Processing" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:4px;box-sizing:border-box;font-size:14px;">
      </div>
      
      <div style="margin-bottom:16px;">
        <label style="display:block;font-size:12px;font-weight:600;margin-bottom:6px;">Type</label>
        <select id="modal-type" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:4px;box-sizing:border-box;font-size:14px;">
          <option value="output">Output</option>
          <option value="input">Input</option>
          <option value="skill" selected>Skill</option>
          <option value="agent">Agent</option>
          <option value="description">Description</option>
        </select>
      </div>
      
      <div style="margin-bottom:16px;">
        <label style="display:block;font-size:12px;font-weight:600;margin-bottom:6px;">Color</label>
        <select id="modal-color" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:4px;box-sizing:border-box;font-size:14px;">
          <option value="blue" selected>Blue</option>
          <option value="purple">Purple</option>
          <option value="teal">Teal</option>
          <option value="pink">Pink</option>
          <option value="orange">Orange</option>
          <option value="green">Green</option>
          <option value="gray">Gray</option>
        </select>
      </div>
      
      <div style="display:flex;gap:8px;justify-content:flex-end;">
        <button onclick="document.getElementById('create-item-modal').remove();" style="padding:8px 16px;border:1px solid #ccc;background:white;border-radius:4px;cursor:pointer;font-weight:500;">Cancel</button>
        <button onclick="confirmCreateItem();" style="padding:8px 16px;background:#00B4D8;color:white;border:none;border-radius:4px;cursor:pointer;font-weight:500;">Add to Map</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  document.getElementById('modal-name').focus();
}

function confirmCreateItem(){
  const map = getActiveMap();
  if(!map) return;
  
  const name = document.getElementById('modal-name').value.trim();
  if(!name) { alert('Please enter a name'); return; }
  
  const type = document.getElementById('modal-type').value;
  const color = document.getElementById('modal-color').value;
  
  // Create item
  const item = {
    id: 'skill_'+Date.now(),
    name: name,
    type: type,
    color: color,
    icon: 'ti-puzzle',
    archived: false
  };
  
  // Add to S.personal
  if(typeof S === 'undefined' || !S) return;
  if(!S.personal) S.personal = [];
  S.personal.push(item);
  localStorage.setItem('sb_skills_v2', JSON.stringify(S));
  
  // Add to map
  const col = map.nodes.length % 3;
  const row = Math.floor(map.nodes.length / 3);
  const x = 50 + col * 200;
  const y = 50 + row * 120;
  
  map.nodes.push({id:'n_'+Date.now(), itemId: item.id, x, y});
  saveMaps();
  
  // Close modal and render
  document.getElementById('create-item-modal').remove();
  renderMapCanvas();
}

function addItemToMap(itemId){
  if(!mapSectionOpen) return;
  const map = getActiveMap();
  if(!map) return;
  
  const col = map.nodes.length % 3;
  const row = Math.floor(map.nodes.length / 3);
  const x = 50 + col * 200;
  const y = 50 + row * 120;
  
  map.nodes.push({id:'n_'+Date.now(), itemId, x, y});
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

function removeNodeFromMap(nodeId){
  const map = getActiveMap();
  if(!map) return;
  map.nodes = map.nodes.filter(n=>n.id!==nodeId);
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

function clearAllNodes(){
  const map = getActiveMap();
  if(!map) return;
  if(!confirm('Clear all ' + map.nodes.length + ' items from this map? This cannot be undone.')) return;
  map.nodes = [];
  map.edges = [];
  saveMaps();
  renderMapCanvas();
}

function cleanupOrphanedNodes(){
  const map = getActiveMap();
  if(!map) return;
  if(typeof S === 'undefined' || !S) return;
  const allItems = [...(S.personal||[]),...(S.shared||[])].filter(i=>!i.archived);
  const validIds = new Set(allItems.map(i=>i.id));
  const before = map.nodes.length;
  map.nodes = map.nodes.filter(node => validIds.has(node.itemId));
  const removed = before - map.nodes.length;
  saveMaps();
  renderMapCanvas();
  alert('Removed ' + removed + ' orphaned items. ' + map.nodes.length + ' valid items remain.');
}

function esc(s){
  if(s === null || s === undefined) return '';
  return String(s)
    .split('&').join(String.fromCharCode(38,97,109,112,59))
    .split('<').join(String.fromCharCode(38,108,116,59))
    .split('>').join(String.fromCharCode(38,103,116,59))
    .split('"').join(String.fromCharCode(38,113,117,111,116,59))
    .split("'").join(String.fromCharCode(38,35,51,57,59));
}
