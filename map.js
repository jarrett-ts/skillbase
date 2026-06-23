// ── MAP CANVAS ─────────────────────────────────────────────────────────────
const MAP_KEY = 'sb_maps_v1';
let maps = [];          // [{id, name, nodes:[{id,itemId,x,y}], edges:[{from,to}]}]
let activeMapId = null;
let mapSectionOpen = false;

// canvas interaction state
let canvasNodes = [];   // rendered nodes for active map
let canvasEdges = [];
let dragNode = null;    // {nodeId, startX, startY, origX, origY}
let connectStart = null; // nodeId we started a connection from
let canvasEl = null;
let mousePos = {x:0,y:0};

// ── UNDO ─────────────────────────────────────────────────────────────────────
let undoStack = [];
const UNDO_LIMIT = 60;
function pushUndo(){
  try{
    undoStack.push(JSON.stringify(maps));
    if(undoStack.length > UNDO_LIMIT) undoStack.shift();
  }catch(e){}
  updateUndoBtn();
}
function updateUndoBtn(){
  const b = document.getElementById('map-undo-btn');
  if(b) b.disabled = undoStack.length === 0;
}
function undoMap(){
  if(!undoStack.length) return;
  let prev;
  try{ prev = JSON.parse(undoStack.pop()); }catch(e){ return; }
  maps = prev;
  if(!maps.find(m=>m.id===activeMapId)) activeMapId = maps.length ? maps[0].id : null;
  saveMaps();
  renderMapList();
  if(mapSectionOpen) renderMapCanvas();
  updateUndoBtn();
}

function loadMaps(){
  try { maps = JSON.parse(localStorage.getItem(MAP_KEY)||'[]'); } catch(e){ maps=[]; }
  if(!activeMapId && maps.length) activeMapId = maps[0].id;
  // Render the map list after loading (fixes visibility issue)
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

function renameMap(id, e){
  e.stopPropagation();
  const m = maps.find(x=>x.id===id);
  if(!m) return;
  const name = prompt('Rename map:', m.name);
  if(name && name!==m.name){ pushUndo(); m.name=name; saveMaps(); renderMapList(); }
}

function selectMap(id){
  activeMapId = id;
  renderMapList();
  if(mapSectionOpen) renderMapCanvas();
}

function renderMapList(){
  const el = document.getElementById('map-list');
  if(!el) return;
  if(!maps.length){
    el.innerHTML = '<div class="map-empty">No maps yet</div>';
    return;
  }
  el.innerHTML = maps.map(m=>`
    <div class="map-item ${m.id===activeMapId?'active':''}" onclick="selectMap('${m.id}')">
      <i class="ti ti-map-2" style="font-size:12px;color:var(--ts-navy);flex-shrink:0"></i>
      <span class="map-item-name">${esc(m.name)}</span>
      <div class="map-item-actions">
        <button class="ia-btn" onclick="renameMap('${m.id}',event)" title="Rename"><i class="ti ti-pencil"></i></button>
        <button class="ia-btn danger" onclick="deleteMap('${m.id}',event)" title="Delete"><i class="ti ti-trash"></i></button>
      </div>
    </div>`).join('');
}

// ── ADD SKILL TO MAP (ALLOW MULTIPLE INSTANCES) ────────────────────────────
function addItemToMap(itemId){
  if(!mapSectionOpen) return;
  const map = getActiveMap();
  if(!map) { alert('Create a map first'); return; }
  // NOW ALLOWS MULTIPLE INSTANCES OF SAME SKILL!
  // place in a grid-ish pattern
  const col = map.nodes.length % 3;
  const row = Math.floor(map.nodes.length / 3);
  const x = 40 + col * 200;
  const y = 40 + row * 120;
  pushUndo();
  map.nodes.push({id:'n_'+Date.now(), itemId, x, y});
  saveMaps();
  renderMapCanvas();
}

// ── CREATE NEW SKILL DIRECTLY ON CANVAS ────────────────────────────────────
function createSkillOnCanvas(){
  const map = getActiveMap();
  if(!map) { alert('Create a map first'); return; }
  
  // Show modal dialog to create a new skill
  const modalHTML = `
    <div id="create-skill-modal" style="
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      font-family: inherit;
    ">
      <div style="
        background: white;
        border-radius: 10px;
        padding: 24px;
        width: 90%;
        max-width: 450px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      ">
        <h3 style="margin: 0 0 16px 0; font-size: 18px; color: var(--color-text-primary);">Create New Item</h3>
        
        <div style="margin-bottom: 16px;">
          <label style="display: block; font-size: 12px; font-weight: 600; color: var(--color-text-secondary); margin-bottom: 6px;">Skill Name *</label>
          <input 
            id="create-skill-name" 
            type="text" 
            placeholder="e.g., Data Processing"
            style="
              width: 100%;
              padding: 8px 12px;
              border: 1px solid var(--color-border-primary);
              border-radius: 6px;
              font-size: 14px;
              box-sizing: border-box;
            "
            autofocus
          />
        </div>
        
        <div style="margin-bottom: 16px;">
          <label style="display: block; font-size: 12px; font-weight: 600; color: var(--color-text-secondary); margin-bottom: 6px;">Type</label>
          <select 
            id="create-skill-type"
            style="
              width: 100%;
              padding: 8px 12px;
              border: 1px solid var(--color-border-primary);
              border-radius: 6px;
              font-size: 14px;
              box-sizing: border-box;
            "
          >
            <option value="output">Output</option>
            <option value="input">Input</option>
            <option value="skill">Skill</option>
            <option value="agent">Agent</option>
            <option value="description">Description</option>
          </select>
        </div>
        
        <div style="margin-bottom: 16px;">
          <label style="display: block; font-size: 12px; font-weight: 600; color: var(--color-text-secondary); margin-bottom: 6px;">Color</label>
          <select 
            id="create-skill-color"
            style="
              width: 100%;
              padding: 8px 12px;
              border: 1px solid var(--color-border-primary);
              border-radius: 6px;
              font-size: 14px;
              box-sizing: border-box;
            "
          >
            <option value="blue">Blue</option>
            <option value="purple">Purple</option>
            <option value="teal">Teal</option>
            <option value="pink">Pink</option>
            <option value="orange">Orange</option>
            <option value="green">Green</option>
            <option value="gray">Gray</option>
          </select>
        </div>
        
        <div style="margin-bottom: 20px;">
          <label style="display: block; font-size: 12px; font-weight: 600; color: var(--color-text-secondary); margin-bottom: 6px;">Description</label>
          <textarea 
            id="create-skill-desc"
            placeholder="What does this skill do?"
            style="
              width: 100%;
              padding: 8px 12px;
              border: 1px solid var(--color-border-primary);
              border-radius: 6px;
              font-size: 14px;
              resize: vertical;
              min-height: 80px;
              box-sizing: border-box;
            "
          ></textarea>
        </div>
        
        <div style="display: flex; gap: 12px; justify-content: flex-end;">
          <button 
            onclick="closeCreateSkillModal()"
            style="
              padding: 8px 16px;
              border: 1px solid var(--color-border-primary);
              background: white;
              color: var(--color-text-primary);
              border-radius: 6px;
              cursor: pointer;
              font-size: 14px;
              font-weight: 500;
            "
          >Cancel</button>
          <button 
            onclick="confirmCreateSkillOnCanvas()"
            style="
              padding: 8px 16px;
              border: none;
              background: var(--color-primary, #00B4D8);
              color: white;
              border-radius: 6px;
              cursor: pointer;
              font-size: 14px;
              font-weight: 500;
            "
          >Add to Map</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  document.getElementById('create-skill-name').focus();
}

function closeCreateSkillModal(){
  const modal = document.getElementById('create-skill-modal');
  if(modal) modal.remove();
}

function confirmCreateSkillOnCanvas(){
  const name = document.getElementById('create-skill-name').value.trim();
  const type = document.getElementById('create-skill-type').value;
  const color = document.getElementById('create-skill-color').value;
  const description = document.getElementById('create-skill-desc').value.trim();
  
  if(!name){
    alert('Please enter a skill name');
    return;
  }
  
  // Create a new skill item in the global S object
  const newItem = {
    id: 'skill_'+Date.now(),
    name: name,
    type: type,
    color: color,
    description: description,
    icon: 'ti-puzzle', // default icon
    tags: [],
    private: true,
    archived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  // Add to personal skills
  if(!S.personal) S.personal = [];
  S.personal.push(newItem);
  
  // CRITICAL: Save skills to localStorage so they persist
  try{
    localStorage.setItem('sb_skills_v2', JSON.stringify(S));
  }catch(e){
    console.error('Failed to save skills:', e);
  }
  
  // Close modal
  closeCreateSkillModal();
  
  // Add this new skill to the canvas
  const map = getActiveMap();
  if(!map) { alert('Create a map first'); return; }
  
  const col = map.nodes.length % 3;
  const row = Math.floor(map.nodes.length / 3);
  const x = 40 + col * 200;
  const y = 40 + row * 120;
  
  pushUndo();
  map.nodes.push({id:'n_'+Date.now(), itemId: newItem.id, x, y});
  saveMaps();
  
  // Update skill list and re-render
  if(typeof renderSkillsUI === 'function') renderSkillsUI();
  renderMapCanvas();
}

// ── CANVAS RENDER ───────────────────────────────────────────────────────────
// ── TYPE TO EMOJI MAPPING ──────────────────────────────────────────────────
const typeEmojis = {
  'output': '📦',
  'input': '📩',
  'skill': '🛠️',
  'agent': '🤖',
  'description': '📖',
  // Fallback for any other types
  'default': '⚙️'
};

function getEmojiForType(type){
  return typeEmojis[type] || typeEmojis['default'];
}

function renderMapCanvas(){
  const wrap = document.getElementById('map-canvas-wrap');
  if(!wrap) return;
  const map = getActiveMap();
  if(!map){
    wrap.innerHTML = `<div class="map-empty-msg">No map selected</div><div class="map-empty-hint">Create a map using the Maps section in the sidebar</div>`;
    wrap.classList.add('empty-state');
    return;
  }
  wrap.classList.remove('empty-state');

  const isEmpty = map.nodes.length===0;
  wrap.innerHTML = `
    <div class="map-toolbar">
      <button class="map-tool-btn" id="map-undo-btn" onclick="undoMap()" title="Undo (Cmd/Ctrl+Z)"><i class="ti ti-arrow-back-up" style="font-size:12px"></i> Undo</button>
      <button class="map-tool-btn" onclick="createSkillOnCanvas()" title="Create new item on map"><i class="ti ti-circle-plus" style="font-size:12px"></i> Create Item</button>
      <span class="map-hint" style="font-size:11px;color:var(--text-muted);background:rgba(255,255,255,.85);padding:5px 9px;border-radius:7px;border:1px solid var(--border-mid);">Drag a side dot → another card to connect</span>
      <button class="map-tool-btn" onclick="clearMapEdges()" title="Clear connections"><i class="ti ti-eraser" style="font-size:12px"></i></button>
      <button class="map-tool-btn" onclick="clearMap()" title="Clear all"><i class="ti ti-trash" style="font-size:12px"></i> Clear</button>
    </div>
    <svg id="map-svg" style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;overflow:visible;"></svg>
    <div id="map-nodes-layer" style="position:absolute;top:0;left:0;width:100%;height:100%;"></div>
    ${isEmpty?'<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;pointer-events:none;"><div style="font-size:13px;color:var(--text-muted);">Click a skill in the sidebar to add it</div><div style="font-size:11px;color:var(--border-strong);margin-top:4px;">Then drag a dot on a card to another card to connect them</div></div>':''}
  `;
  // Add resize handle after canvas wrap
  const resizeHandle = document.createElement('div');
  resizeHandle.className = 'map-resize-handle';
  resizeHandle.title = 'Drag to resize';
  wrap.after(resizeHandle);
  initMapResize(resizeHandle, wrap);

  renderNodes(map);
  renderEdges(map);
  updateUndoBtn();
  enableEdgeDeletion();
  enableNodeResize();
}

function initMapResize(handle, wrap){
  let dragging = false, startY = 0, startH = 0;
  handle.addEventListener('mousedown', e=>{
    dragging = true;
    startY = e.clientY;
    startH = wrap.offsetHeight;
    handle.classList.add('dragging');
    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  });
  document.addEventListener('mousemove', e=>{
    if(!dragging) return;
    const newH = Math.max(150, startH + (e.clientY - startY));
    wrap.style.flex = 'none';
    wrap.style.height = newH + 'px';
  });
  document.addEventListener('mouseup', ()=>{
    if(!dragging) return;
    dragging = false;
    handle.classList.remove('dragging');
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    try { localStorage.setItem('sb_map_height', wrap.offsetHeight); } catch(e){}
  });
  // Restore saved height
  try {
    const saved = localStorage.getItem('sb_map_height');
    if(saved){ wrap.style.flex='none'; wrap.style.height=saved+'px'; }
  } catch(e){}
}

function renderNodes(map){
  const layer = document.getElementById('map-nodes-layer');
  if(!layer) return;
  const allItems = [...S.personal,...S.shared].filter(i=>!i.archived);
  layer.innerHTML = map.nodes.map(node=>{
    const item = allItems.find(i=>i.id===node.itemId);
    if(!item) return '';
    const hex = colorHex(item.color||'gray');
    const badgeClass = 'b-'+item.type;
    return `<div class="map-node" id="mn_${node.id}"
      style="left:${node.x}px;top:${node.y}px;"
      onmousedown="startNodeDrag(event,'${node.id}')">
      <button class="map-node-del" onclick="removeNodeFromMap('${node.id}')" title="Remove"><i class="ti ti-x"></i></button>
      <div class="map-node-header">
        <div class="map-node-icon" style="background:#FFFFFF;color:#666;border:3px solid ${hex};display:flex;align-items:center;justify-content:center;font-size:18px;">
          ${getEmojiForType(item.type || 'skill')}
        </div>
        <span class="map-node-name">${esc(item.name)}</span>
      </div>
      <span class="map-node-badge ${badgeClass}">${item.type}</span>
      <div class="map-node-port port-left" onmousedown="startConnect(event,'${node.id}','left')" title="Connect (input)"></div>
      <div class="map-node-port port-right" onmousedown="startConnect(event,'${node.id}','right')" title="Connect (output)"></div>
      <div class="map-node-port port-top" onmousedown="startConnect(event,'${node.id}','top')" title="Connect (input)"></div>
      <div class="map-node-port port-bottom" onmousedown="startConnect(event,'${node.id}','bottom')" title="Connect (output)"></div>
    </div>`;
  }).join('');
}

function renderEdges(map){
  const svg = document.getElementById('map-svg');
  if(!svg) return;
  const allNodes = map.nodes;
  svg.innerHTML = map.edges.map(edge=>{
    const from = allNodes.find(n=>n.id===edge.from);
    const to = allNodes.find(n=>n.id===edge.to);
    if(!from||!to) return '';
    const fromEl = document.getElementById('mn_'+from.id);
    const toEl = document.getElementById('mn_'+to.id);
    if(!fromEl||!toEl) return '';
    const fw = fromEl.offsetWidth, fh = fromEl.offsetHeight;
    const tw = toEl.offsetWidth, th = toEl.offsetHeight;
    const fromPort = edge.fromPort || 'right';
    const toPort = edge.toPort || 'left';
    let x1, y1, x2, y2;
    switch(fromPort) {
      case 'right': x1 = from.x + fw; y1 = from.y + fh/2; break;
      case 'left': x1 = from.x; y1 = from.y + fh/2; break;
      case 'top': x1 = from.x + fw/2; y1 = from.y; break;
      case 'bottom': x1 = from.x + fw/2; y1 = from.y + fh; break;
      default: x1 = from.x + fw; y1 = from.y + fh/2;
    }
    switch(toPort) {
      case 'right': x2 = to.x + tw; y2 = to.y + th/2; break;
      case 'left': x2 = to.x; y2 = to.y + th/2; break;
      case 'top': x2 = to.x + tw/2; y2 = to.y; break;
      case 'bottom': x2 = to.x + tw/2; y2 = to.y + th; break;
      default: x2 = to.x; y2 = to.y + th/2;
    }
    const cx = (x1+x2)/2, cy = (y1+y2)/2;
    const d = `M${x1},${y1} Q${cx},${cy} ${x2},${y2}`;
    return `<path d="${d}"
      fill="none" stroke="#0F1B3F" stroke-width="1.5" stroke-opacity="0.5"
      marker-end="url(#arrowhead)"/>`;
  }).join('');

  // arrowhead marker
  if(map.edges.length){
    svg.innerHTML = `<defs><marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
      <polygon points="0 0, 8 3, 0 6" fill="#0F1B3F" opacity="0.5"/>
    </marker></defs>` + svg.innerHTML;
  }
}

// ── NODE DRAG ────────────────────────────────────────────────────────────────
let nodeDragState = null;
function startNodeDrag(e, nodeId){
  if(connectStart) return; // in connect mode, don't drag
  if(e.target.classList.contains('map-node-port')) return;
  if(e.target.classList.contains('map-node-del')) return;
  e.stopPropagation();
  const map = getActiveMap();
  if(!map) return;
  const node = map.nodes.find(n=>n.id===nodeId);
  if(!node) return;
  const el = document.getElementById('mn_'+nodeId);
  if(el) el.classList.add('dragging');
  nodeDragState = {nodeId, startMouseX:e.clientX, startMouseY:e.clientY, origX:node.x, origY:node.y, snap:JSON.stringify(maps)};
  document.addEventListener('mousemove', onNodeDrag);
  document.addEventListener('mouseup', endNodeDrag, {once:true});
}
function onNodeDrag(e){
  if(!nodeDragState) return;
  const map = getActiveMap();
  if(!map) return;
  const node = map.nodes.find(n=>n.id===nodeDragState.nodeId);
  if(!node) return;
  node.x = Math.max(0, nodeDragState.origX + (e.clientX - nodeDragState.startMouseX));
  node.y = Math.max(0, nodeDragState.origY + (e.clientY - nodeDragState.startMouseY));
  const el = document.getElementById('mn_'+nodeDragState.nodeId);
  if(el){ el.style.left=node.x+'px'; el.style.top=node.y+'px'; }
  renderEdges(map);
}
function endNodeDrag(){
  if(!nodeDragState) return;
  const el = document.getElementById('mn_'+nodeDragState.nodeId);
  if(el) el.classList.remove('dragging');
  const map = getActiveMap();
  const node = map ? map.nodes.find(n=>n.id===nodeDragState.nodeId) : null;
  const moved = node && (node.x!==nodeDragState.origX || node.y!==nodeDragState.origY);
  if(moved && nodeDragState.snap){
    try{ undoStack.push(nodeDragState.snap); if(undoStack.length>UNDO_LIMIT) undoStack.shift(); }catch(e){}
    updateUndoBtn();
  }
  saveMaps();
  nodeDragState = null;
  document.removeEventListener('mousemove', onNodeDrag);
}

// ── CONNECT (drag from a side dot to another card) ───────────────────────────
let connectMode = false;       // kept for compatibility; no longer gates connecting
let connectDrag = null;        // {fromId, x1, y1}

function toggleConnectMode(){ /* no-op: connecting is now drag-based */ }

function _canvasPoint(e){
  const wrap = document.getElementById('map-canvas-wrap');
  if(!wrap) return {x:0,y:0};
  const r = wrap.getBoundingClientRect();
  return { x: e.clientX - r.left + wrap.scrollLeft, y: e.clientY - r.top + wrap.scrollTop };
}

function _nodeElFromPoint(e){
  const els = document.elementsFromPoint(e.clientX, e.clientY);
  for(const el of els){
    const n = el.closest ? el.closest('.map-node') : null;
    if(n) return n;
  }
  return null;
}

// Begin a connection drag from a node's port
function startConnect(e, nodeId, port){
  e.stopPropagation();
  e.preventDefault();
  const map = getActiveMap();
  if(!map) return;
  const node = map.nodes.find(n=>n.id===nodeId);
  if(!node) return;
  const el = document.getElementById('mn_'+nodeId);
  const w = el ? el.offsetWidth : 160;
  const h = el ? el.offsetHeight : 60;
  let x1, y1;
  switch(port) {
    case 'right': x1 = node.x + w; y1 = node.y + h/2; break;
    case 'left': x1 = node.x; y1 = node.y + h/2; break;
    case 'top': x1 = node.x + w/2; y1 = node.y; break;
    case 'bottom': x1 = node.x + w/2; y1 = node.y + h; break;
    default: x1 = node.x + w; y1 = node.y + h/2;
  }
  connectDrag = { fromId: nodeId, fromPort: port, x1, y1 };
  document.addEventListener('mousemove', onConnectDrag);
  document.addEventListener('mouseup', endConnect, { once:true });
}

function onConnectDrag(e){
  if(!connectDrag) return;
  const svg = document.getElementById('map-svg');
  if(!svg) return;
  const p = _canvasPoint(e);
  const { x1, y1 } = connectDrag;
  const cx = (x1 + p.x)/2;
  const d = `M${x1},${y1} C${cx},${y1} ${cx},${p.y} ${p.x},${p.y}`;
  let temp = document.getElementById('map-temp-edge');
  if(!temp){
    temp = document.createElementNS('http://www.w3.org/2000/svg','path');
    temp.id = 'map-temp-edge';
    temp.setAttribute('fill','none');
    temp.setAttribute('stroke','#0F1B3F');
    temp.setAttribute('stroke-width','2');
    temp.setAttribute('stroke-dasharray','5,4');
    temp.setAttribute('stroke-opacity','0.7');
    svg.appendChild(temp);
  }
  temp.setAttribute('d', d);
  document.querySelectorAll('.map-node.connect-target').forEach(n=>n.classList.remove('connect-target'));
  const over = _nodeElFromPoint(e);
  if(over && over.id !== 'mn_'+connectDrag.fromId) over.classList.add('connect-target');
}

function endConnect(e){
  document.removeEventListener('mousemove', onConnectDrag);
  const temp = document.getElementById('map-temp-edge');
  if(temp) temp.remove();
  document.querySelectorAll('.map-node.connect-target').forEach(n=>n.classList.remove('connect-target'));
  const drag = connectDrag; connectDrag = null;
  if(!drag) return;
  const over = _nodeElFromPoint(e);
  if(!over) return;
  const toId = over.id.replace('mn_','');
  if(!toId || toId === drag.fromId) return;
  const map = getActiveMap();
  if(!map) return;
  const toNode = map.nodes.find(n=>n.id===toId);
  if(!toNode) return;
  const toEl = document.getElementById('mn_'+toId);
  const toW = toEl ? toEl.offsetWidth : 160;
  const toH = toEl ? toEl.offsetHeight : 60;
  const r = toEl.getBoundingClientRect();
  const mouseX = e.clientX - r.left;
  const mouseY = e.clientY - r.top;
  const distLeft = Math.abs(mouseX);
  const distRight = Math.abs(mouseX - toW);
  const distTop = Math.abs(mouseY);
  const distBottom = Math.abs(mouseY - toH);
  const minDist = Math.min(distLeft, distRight, distTop, distBottom);
  let toPort = 'left';
  if(minDist === distRight) toPort = 'right';
  else if(minDist === distTop) toPort = 'top';
  else if(minDist === distBottom) toPort = 'bottom';
  const exists = map.edges.find(ed=>(ed.from===drag.fromId&&ed.to===toId&&ed.fromPort===drag.fromPort&&ed.toPort===toPort));
  if(!exists){ pushUndo(); map.edges.push({ from: drag.fromId, to: toId, fromPort: drag.fromPort, toPort: toPort }); }
  saveMaps();
  renderEdges(map);
}

function clearMapEdges(){
  const map = getActiveMap();
  if(!map||!confirm('Clear all connections?')) return;
  pushUndo();
  map.edges=[];
  saveMaps();
  renderEdges(map);
}
function clearMap(){
  const map = getActiveMap();
  if(!map||!confirm('Clear all nodes and connections from this map?')) return;
  pushUndo();
  map.nodes=[];
  map.edges=[];
  saveMaps();
  renderMapCanvas();
}
function removeNodeFromMap(nodeId){
  const map = getActiveMap();
  if(!map) return;
  pushUndo();
  map.nodes = map.nodes.filter(n=>n.id!==nodeId);
  map.edges = map.edges.filter(e=>e.from!==nodeId&&e.to!==nodeId);
  saveMaps();
  renderMapCanvas();
}

// ── MAP SECTION TOGGLE ────────────────────────────────────────────────────────
function toggleMapSection(bodyId){
  const el = document.getElementById(bodyId);
  if(!el) return;
  const isOpen = el.classList.contains('expanded');
  el.classList.remove('expanded','collapsed');
  el.classList.add(isOpen ? 'collapsed' : 'expanded');
  mapSectionOpen = !isOpen;
  const chevron = el.previousElementSibling && el.previousElementSibling.querySelector('.section-chevron');
  if(chevron) chevron.classList.toggle('open', mapSectionOpen);
  if(mapSectionOpen) renderMapCanvas();
}



// ── DELETE INDIVIDUAL CONNECTION LINES (NEW) ──────────────────────────────

// Show delete buttons on hover over connections
let hoveredEdgeIndex = null;

function setupEdgeHover(){
  const svg = document.getElementById('map-svg');
  if(!svg) return;
  
  // Add click handlers to paths for deleting edges
  const paths = svg.querySelectorAll('path');
  paths.forEach((path, index) => {
    path.style.cursor = 'pointer';
    path.addEventListener('mouseenter', () => {
      hoveredEdgeIndex = index;
      path.style.strokeWidth = '2.5';
      path.style.strokeOpacity = '0.8';
    });
    path.addEventListener('mouseleave', () => {
      hoveredEdgeIndex = null;
      path.style.strokeWidth = '1.5';
      path.style.strokeOpacity = '0.5';
    });
    path.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteConnection(index);
    });
  });
}

function deleteConnection(edgeIndex){
  const map = getActiveMap();
  if(!map || edgeIndex >= map.edges.length) return;
  
  const edge = map.edges[edgeIndex];
  const fromNode = map.nodes.find(n=>n.id===edge.from);
  const toNode = map.nodes.find(n=>n.id===edge.to);
  const allItems = [...S.personal,...S.shared].filter(i=>!i.archived);
  const fromItem = allItems.find(i=>i.id===fromNode?.itemId);
  const toItem = allItems.find(i=>i.id===toNode?.itemId);
  
  const confirm_delete = confirm(`Delete connection from "${fromItem?.name || 'Node'}" to "${toItem?.name || 'Node'}"?`);
  
  if(!confirm_delete) return;
  
  pushUndo();
  map.edges.splice(edgeIndex, 1);
  saveMaps();
  renderEdges(map);
  enableEdgeDeletion();
}

function enableEdgeDeletion(){
  setTimeout(() => setupEdgeHover(), 50);
}


// ── RESIZE SKILL ICONS (NEW) ──────────────────────────────────────────────

let nodeIconSizes = {};

function loadIconSizes(){
  try{
    const saved = localStorage.getItem('sb_node_icon_sizes');
    if(saved) nodeIconSizes = JSON.parse(saved);
  }catch(e){}
}

function saveIconSizes(){
  try{
    localStorage.setItem('sb_node_icon_sizes', JSON.stringify(nodeIconSizes));
  }catch(e){}
}

function setupNodeResize(){
  const layer = document.getElementById('map-nodes-layer');
  if(!layer) return;
  
  const nodes = layer.querySelectorAll('.map-node');
  nodes.forEach(nodeEl => {
    if(nodeEl.querySelector('.map-node-resize-handle')) return; // Already has handle
    
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'map-node-resize-handle';
    resizeHandle.innerHTML = '⤡';
    resizeHandle.title = 'Drag to resize card';
    resizeHandle.style.cssText = `position:absolute;bottom:-8px;right:-8px;width:16px;height:16px;background:var(--ts-navy,#0F1B3F);color:white;border-radius:50%;cursor:se-resize;display:flex;align-items:center;justify-content:center;font-size:10px;z-index:10;user-select:none;`;
    
    nodeEl.style.position = 'absolute';
    nodeEl.appendChild(resizeHandle);
    
    let resizing = false;
    let startX = 0, startY = 0, startWidth = 80, startHeight = 60;
    
    resizeHandle.addEventListener('mousedown', (e) => {
      e.preventDefault();
      resizing = true;
      startX = e.clientX;
      startY = e.clientY;
      startWidth = nodeEl.offsetWidth;
      startHeight = nodeEl.offsetHeight;
      nodeEl.style.opacity = '0.7';
      document.body.style.cursor = 'se-resize';
      document.body.style.userSelect = 'none';
      
      const onMouseMove = (moveEvent) => {
        if(!resizing) return;
        const deltaX = moveEvent.clientX - startX;
        const deltaY = moveEvent.clientY - startY;
        const newWidth = Math.max(60, startWidth + deltaX);
        const newHeight = Math.max(50, startHeight + deltaY);
        nodeEl.style.width = newWidth + 'px';
        nodeEl.style.height = newHeight + 'px';
        const map = getActiveMap();
        if(map) renderEdges(map);
      };
      
      const onMouseUp = () => {
        if(!resizing) return;
        resizing = false;
        nodeEl.style.opacity = '1';
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        const nodeId = nodeEl.id.replace('mn_', '');
        nodeIconSizes[nodeId] = { width: nodeEl.offsetWidth, height: nodeEl.offsetHeight };
        saveIconSizes();
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        renderEdges(getActiveMap());
      };
      
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });
    
    const nodeId = nodeEl.id.replace('mn_', '');
    if(nodeIconSizes[nodeId]){
      nodeEl.style.width = nodeIconSizes[nodeId].width + 'px';
      nodeEl.style.height = nodeIconSizes[nodeId].height + 'px';
    }
    
    nodeEl.addEventListener('wheel', (e) => {
      if(e.ctrlKey || e.metaKey){
        e.preventDefault();
        const scaleFactor = e.deltaY > 0 ? 0.95 : 1.05;
        const newWidth = Math.max(60, Math.min(250, nodeEl.offsetWidth * scaleFactor));
        const newHeight = Math.max(50, Math.min(200, nodeEl.offsetHeight * scaleFactor));
        nodeEl.style.width = newWidth + 'px';
        nodeEl.style.height = newHeight + 'px';
        const nodeId = nodeEl.id.replace('mn_', '');
        nodeIconSizes[nodeId] = { width: newWidth, height: newHeight };
        saveIconSizes();
        renderEdges(getActiveMap());
      }
    });
  });
}

function enableNodeResize(){
  loadIconSizes();
  setTimeout(() => setupNodeResize(), 50);
}


// ── UNDO keyboard shortcut (Cmd/Ctrl+Z) ──────────────────────────────────────
document.addEventListener('keydown', (e)=>{
  if((e.metaKey || e.ctrlKey) && !e.shiftKey && (e.key === 'z' || e.key === 'Z')){
    const t = e.target;
    if(t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    if(typeof undoStack !== 'undefined' && undoStack.length){
      e.preventDefault();
      undoMap();
    }
  }
});
