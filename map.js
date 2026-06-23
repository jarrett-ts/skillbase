// ── MAP CANVAS ──────────────────────────────────────────────────────────────
const MAP_KEY = 'sb_maps_v1';
// All map state on window so functions can access them across contexts
if(!window.maps) window.maps = [];
if(!window.activeMapId) window.activeMapId = null;
if(typeof window.mapSectionOpen === 'undefined') window.mapSectionOpen = false;

// Shorthands (local references point to window properties)
Object.defineProperty(window, '_mapsProxy', {value: true, configurable: true});

// ── UNDO ─────────────────────────────────────────────────────────────────────
let undoStack = [];
const MAX_UNDO = 30;

function pushUndo(){
  const map = getActiveMap();
  if(!map) return;
  undoStack.push(JSON.stringify({nodes: map.nodes, edges: map.edges || []}));
  if(undoStack.length > MAX_UNDO) undoStack.shift();
  updateUndoBtn();
}

function undoMap(){
  if(!undoStack.length) return;
  const map = getActiveMap();
  if(!map) return;
  const prev = JSON.parse(undoStack.pop());
  map.nodes = prev.nodes;
  map.edges = prev.edges;
  saveMaps();
  renderMapCanvas();
  updateUndoBtn();
}

function updateUndoBtn(){
  const btn = document.getElementById('map-undo-btn');
  if(btn) btn.disabled = undoStack.length === 0;
}

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
  // Full color map that works regardless of global COLORS
  const allColors = {
    // App.js native colors
    'navy': '#1E3570', 'teal': '#0E6E5C', 'purple': '#4A2080',
    'coral': '#C44A20', 'amber': '#B87800', 'gray': '#4A5060',
    'blue': '#2952A3', 'pink': '#982060',
    // Map dropdown colors
    'maroon': '#8B2252', 'green': '#2D9E5F', 'orange': '#E07020',
  };
  return allColors[c] || allColors['gray'];
}

function loadMaps(){
  try { window.maps = JSON.parse(localStorage.getItem(MAP_KEY)||'[]'); } catch(e){ window.maps=[]; }
  if(!window.activeMapId && window.maps.length) window.activeMapId = window.maps[0].id;
  renderMapList();
  // Install marquee selection once
  installMarquee();
}

function saveMaps(){
  try { localStorage.setItem(MAP_KEY, JSON.stringify(window.maps)); } catch(e){}
}

function getActiveMap(){ return window.maps.find(m=>m.id===window.activeMapId)||null; }

function newMap(){
  const name = prompt('Map name:','Untitled map');
  if(!name) return;
  const id = 'map_'+Date.now();
  window.maps.push({id, name, nodes:[], edges:[]});
  window.activeMapId = id;
  saveMaps();
  renderMapList();
  if(window.mapSectionOpen) renderMapCanvas();
}

function deleteMap(id, e){
  e.stopPropagation();
  const m = window.maps.find(x=>x.id===id);
  if(!m||!confirm('Delete map "'+m.name+'"?')) return;
  window.maps = window.maps.filter(x=>x.id!==id);
  if(window.activeMapId===id) window.activeMapId = window.maps.length ? window.maps[0].id : null;
  saveMaps();
  renderMapList();
  if(window.mapSectionOpen) renderMapCanvas();
}

function selectMap(id){
  window.activeMapId = id;
  renderMapList();
  if(window.mapSectionOpen) renderMapCanvas();
}

function renderMapList(){
  const list = document.getElementById('map-list');
  if(!list) return;
  list.innerHTML = window.maps.map(m=>`
    <div class="map-item ${m.id===window.activeMapId?'active':''}" onclick="selectMap('${m.id}')">
      <span>${esc(m.name)}</span>
      <button onclick="deleteMap('${m.id}',event)" title="Delete"><i class="ti ti-trash" style="font-size:11px"></i></button>
    </div>
  `).join('');
}


// ── GLOBAL DRAG-DROP HANDLER (works for any map-canvas-wrap) ────────────────
let _dropHandlerInstalled = false;
function setupGlobalDropHandler(){
  if(_dropHandlerInstalled) return;
  _dropHandlerInstalled = true;
  let _justDropped = false;
  let _capturedDragId = '';
  console.log('[DND] Global drop handler installed');
  
  // Track last pointer position during drag (dragover gives coords)
  let _lastDragX = 0, _lastDragY = 0;
  document.addEventListener('dragover', (e) => { _lastDragX = e.clientX; _lastDragY = e.clientY; }, true);
  
  document.addEventListener('dragstart', (e) => {
    // Capture the item id NOW, before app.js clears dragState
    const itemEl = e.target.closest ? e.target.closest('.item[data-id]') : null;
    if(itemEl){
      _capturedDragId = itemEl.getAttribute('data-id');
    } else if(typeof dragState !== 'undefined' && dragState && dragState.id){
      _capturedDragId = dragState.id;
    } else {
      _capturedDragId = '';
    }
    console.log('[DND] dragstart captured id:', _capturedDragId);
  });
  
  // PRIMARY mechanism: dragend always fires. Check if released over a canvas wrap.
  document.addEventListener('dragend', (e) => {
    console.log('[DND] dragend - checking drop position');
    if(_justDropped){ _justDropped = false; console.log('[DND] dragend: drop already handled it'); return; }
    const el = document.elementFromPoint(_lastDragX, _lastDragY);
    const wrap = el && el.closest ? el.closest('.map-canvas-wrap') : null;
    if(!wrap){ console.log('[DND] dragend: not over canvas'); return; }
    
    const itemId = _capturedDragId;
    console.log('[DND] dragend itemId:', itemId);
    _capturedDragId = ''; // reset for next drag
    if(!itemId){ console.log('[DND] dragend: no itemId'); return; }
    
    const m = getActiveMap();
    if(!m){ console.log('[DND] dragend: no map'); return; }
    const rect = wrap.getBoundingClientRect();
    const x = _lastDragX - rect.left - 30;
    const y = _lastDragY - rect.top - 30;
    if(!m.nodes) m.nodes = [];
    m.nodes.push({id:'n_'+Date.now(), itemId, x: Math.max(0,x), y: Math.max(0,y)});
    console.log('[DND] dragend SUCCESS: added node, total', m.nodes.length);
    saveMaps();
    renderMapCanvas();
  });
  
  document.addEventListener('dragover', (e) => {
    const wrap = e.target.closest && e.target.closest('.map-canvas-wrap');
    if(wrap){ e.preventDefault(); if(e.dataTransfer) e.dataTransfer.dropEffect = 'copy'; }
  }, true);
  
  document.addEventListener('drop', (e) => {
    console.log('[DND] DROP fired on:', e.target.className || e.target.tagName);
    const wrap = e.target.closest && e.target.closest('.map-canvas-wrap');
    console.log('[DND] closest .map-canvas-wrap:', wrap ? 'FOUND' : 'NOT FOUND');
    if(!wrap) return;
    e.preventDefault();
    e.stopPropagation();
    
    let itemId = '';
    try { itemId = e.dataTransfer.getData('text/plain'); } catch(err) {}
    if(!itemId) itemId = _capturedDragId;
    console.log('[DND] drop final itemId:', itemId);
    if(!itemId) { console.log('[DND] ABORT: no itemId'); return; }
    
    const m = getActiveMap();
    if(!m) { console.log('[DND] ABORT: no active map'); return; }
    const rect = wrap.getBoundingClientRect();
    const x = e.clientX - rect.left - 30;
    const y = e.clientY - rect.top - 30;
    if(!m.nodes) m.nodes = [];
    m.nodes.push({id:'n_'+Date.now(), itemId, x: Math.max(0,x), y: Math.max(0,y)});
    console.log('[DND] SUCCESS: added node, total now', m.nodes.length);
    _justDropped = true;
    saveMaps();
    renderMapCanvas();
  }, true);
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
  
  // Drop handling is set up globally once (see setupGlobalDropHandler)
  setupGlobalDropHandler();
  
  wrap.innerHTML = `
    <div class="map-toolbar">
      <button class="map-tool-btn" id="map-undo-btn" onclick="undoMap()" title="Undo (Cmd+Z)" disabled><i class="ti ti-arrow-back-up"></i> Undo</button>
      <button class="map-tool-btn" onclick="openCreateItemModal()" title="Create new item"><i class="ti ti-circle-plus"></i> Create Item</button>
      <button class="map-tool-btn" onclick="saveMaps(); alert('Saved!');" title="Save"><i class="ti ti-device-floppy"></i> Save</button>
      <button class="map-tool-btn" onclick="cleanupOrphanedNodes()" title="Remove broken items">Clean Up</button>
      <button class="map-tool-btn" onclick="clearAllNodes()" title="Clear everything">Clear All</button>
    </div>
    <svg id="map-svg" style="position:absolute;top:0;left:0;width:100%;height:100%;overflow:visible;"></svg>
    <div id="map-nodes-layer" style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;"></div>
  `;
  
  renderNodes(map);
  renderEdges(map);
  updateUndoBtn();
}

function renderNodes(map){
  const layer = document.getElementById('map-nodes-layer');
  if(!layer) return;
  
  // Make sure S exists
  if(typeof S === 'undefined') return;
  
  const allItems = [...(S.personal||[]),...(S.shared||[])].filter(i=>!i.archived);
  
  layer.innerHTML = map.nodes.map(node=>{
    // Support both: nodes that reference a skill (itemId) and standalone canvas nodes (no itemId)
    const item = node.itemId ? allItems.find(i=>i.id===node.itemId) : null;
    // Build a display object from whichever source has the data
    const displayName = node.label || (item ? item.name : node.name) || 'Unnamed';
    const displayType = item ? item.type : (node.type || 'skill');
    const displayColor = item ? item.color : (node.color || 'gray');
    if(!item && !node.name) return ''; // skip truly orphaned nodes
    const hex = colorHex(displayColor);
    const size = node.size || 60;
    const emojiSize = Math.round(size * 0.4);
    // Ports sit exactly on the icon box border (the 3px bordered square)
    const portStyle = 'position:absolute;width:12px;height:12px;background:#fff;border:2px solid '+hex+';border-radius:50%;cursor:crosshair;z-index:30;';
    const halfSize = size/2;
    // The iconbox IS the bordered square - ports on its edges
    const isSelected = window._selectedNodeIds.has(node.id);
    return `<div class="map-node" id="mn_${node.id}" style="left:${node.x}px;top:${node.y}px;position:absolute;pointer-events:auto;background:transparent;border:none;padding:0;min-width:0;max-width:none;box-shadow:none;border-radius:0;cursor:default;display:flex;flex-direction:column;align-items:center;" onclick="selectNode('${node.id}')">
      <div class="map-node-iconbox" style="position:relative;width:${size}px;height:${size}px;">
        <div style="position:absolute;top:0;left:0;width:${size}px;height:${size}px;background:#FFFFFF;color:#666;border:3px solid ${hex};display:flex;align-items:center;justify-content:center;font-size:${emojiSize}px;border-radius:6px;box-shadow:${isSelected ? '0 0 0 3px #00B4D8, 0 2px 8px rgba(0,0,0,0.1)' : '0 2px 8px rgba(0,0,0,0.1)'};box-sizing:border-box;cursor:move;outline:${isSelected ? '2px dashed #00B4D8' : 'none'};outline-offset:3px;" onmousedown="startNodeDrag(event,'${node.id}')">
          ${getEmojiForType(displayType)}
        </div>
        <div class="map-node-del" style="position:absolute;top:-8px;right:-8px;width:18px;height:18px;background:#FF4444;color:white;border-radius:50%;cursor:pointer;z-index:40;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:bold;line-height:1;box-shadow:0 1px 4px rgba(0,0,0,0.2);" onclick="removeNodeFromMap('${node.id}')" title="Remove from map">×</div>
        <div class="map-port" style="${portStyle}top:-6px;left:${halfSize-6}px;" onmousedown="startConnect(event,'${node.id}','top')" title="Connect"></div>
        <div class="map-port" style="${portStyle}bottom:-6px;left:${halfSize-6}px;" onmousedown="startConnect(event,'${node.id}','bottom')" title="Connect"></div>
        <div class="map-port" style="${portStyle}left:-6px;top:${halfSize-6}px;" onmousedown="startConnect(event,'${node.id}','left')" title="Connect"></div>
        <div class="map-port" style="${portStyle}right:-6px;top:${halfSize-6}px;" onmousedown="startConnect(event,'${node.id}','right')" title="Connect"></div>
        <div class="map-resize" style="position:absolute;bottom:-6px;right:-6px;width:14px;height:14px;background:${hex};border-radius:50%;cursor:nwse-resize;z-index:30;display:flex;align-items:center;justify-content:center;" onmousedown="startResize(event,'${node.id}')" title="Resize"><span style="color:white;font-size:8px;">⤡</span></div>
      </div>
      <div class="map-node-label" data-node-id="${node.id}" style="font-size:13px;margin-top:8px;text-align:center;max-width:${Math.max(size,90)}px;font-weight:500;cursor:text;pointer-events:auto;border-radius:4px;padding:1px 4px;outline:none;" onclick="event.stopPropagation()" ondblclick="startInlineEdit(event,'${node.id}')" title="Double-click to rename">${esc(displayName)}</div>
      <div style="font-size:11px;text-align:center;color:#999;">${displayType}</div>
    </div>`;
  }).join('');
}

function startResize(event, nodeId){
  event.preventDefault();
  event.stopPropagation();
  const map = getActiveMap();
  if(!map) return;
  const node = map.nodes.find(n=>n.id===nodeId);
  if(!node) return;
  
  const startX = event.clientX;
  const startSize = node.size || 60;
  
  const handleMove = (e) => {
    const delta = e.clientX - startX;
    node.size = Math.max(40, Math.min(160, startSize + delta));
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

function renderEdges(map){
  const svg = document.getElementById('map-svg');
  if(!svg) return;
  
  // Arrow marker definition (defined once in defs)
  const defs = `<defs>
    <marker id="arrowhead" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto" markerUnits="userSpaceOnUse">
      <polygon points="0 0, 10 4, 0 8" fill="#94a3b8"></polygon>
    </marker>
  </defs>`;
  
  svg.innerHTML = defs + (map.edges||[]).map((edge, idx)=>{
    const fromNode = map.nodes.find(n=>n.id===edge.from);
    const toNode = map.nodes.find(n=>n.id===edge.to);
    if(!fromNode || !toNode) return '';
    
    const fromPort = edge.fromPort || 'right';
    const toPort = edge.toPort || 'left';
    
    // Use node size for port positions
    const getPortPos = (node, port) => {
      const sz = node.size || 60;
      const cx = node.x + sz/2;
      const cy = node.y + sz/2;
      switch(port){
        case 'top': return {x: cx, y: node.y};
        case 'bottom': return {x: cx, y: node.y + sz};
        case 'left': return {x: node.x, y: cy};
        case 'right': return {x: node.x + sz, y: cy};
        default: return {x: cx, y: cy};
      }
    };
    
    const p1 = getPortPos(fromNode, fromPort);
    const p2 = getPortPos(toNode, toPort);
    
    // Pull the arrow endpoint back slightly so the arrowhead tip sits right at the port
    const backoff = 6;
    let endX = p2.x, endY = p2.y;
    if(toPort==='right'){ endX = p2.x + backoff; }
    else if(toPort==='left'){ endX = p2.x - backoff; }
    else if(toPort==='top'){ endY = p2.y - backoff; }
    else if(toPort==='bottom'){ endY = p2.y + backoff; }
    
    // Bezier curve control points
    const dx = Math.abs(p2.x - p1.x);
    const offset = Math.max(40, dx/2);
    let c1x = p1.x, c1y = p1.y, c2x = endX, c2y = endY;
    if(fromPort==='right'){ c1x = p1.x + offset; }
    else if(fromPort==='left'){ c1x = p1.x - offset; }
    else if(fromPort==='top'){ c1y = p1.y - offset; }
    else if(fromPort==='bottom'){ c1y = p1.y + offset; }
    if(toPort==='right'){ c2x = endX + offset; }
    else if(toPort==='left'){ c2x = endX - offset; }
    else if(toPort==='top'){ c2y = endY - offset; }
    else if(toPort==='bottom'){ c2y = endY + offset; }
    
    const path = `M ${p1.x} ${p1.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${endX} ${endY}`;
    return `<g>
      <path d="${path}" stroke="#94a3b8" stroke-width="2.5" fill="none" marker-end="url(#arrowhead)" style="pointer-events:stroke;cursor:pointer;" onclick="deleteEdge(${idx})"></path>
      <path d="${path}" stroke="transparent" stroke-width="12" fill="none" style="pointer-events:stroke;cursor:pointer;" onclick="deleteEdge(${idx})"></path>
    </g>`;
  }).join('');
}

// Connection state
let connectStart = null;

// Copy-paste state
let copiedNodeId = null;
let _copiedNode = null;

// Multi-select state  
if(!window._selectedNodeIds) window._selectedNodeIds = new Set();
let _marqueeActive = false;

function startConnect(event, nodeId, port){
  event.preventDefault();
  event.stopPropagation();
  connectStart = {nodeId, port};
  
  const moveHandler = (e) => {
    const svg = document.getElementById('map-svg');
    if(!svg) return;
    const map = getActiveMap();
    if(!map) return;
    const fromNode = map.nodes.find(n=>n.id===nodeId);
    if(!fromNode) return;
    
    const sz = fromNode.size || 60;
    const cx = fromNode.x + sz/2, cy = fromNode.y + sz/2;
    let x1 = cx, y1 = cy;
    if(port==='top'){ y1 = fromNode.y; }
    else if(port==='bottom'){ y1 = fromNode.y + sz; }
    else if(port==='left'){ x1 = fromNode.x; }
    else if(port==='right'){ x1 = fromNode.x + sz; }
    
    const wrap = document.getElementById('map-canvas-wrap');
    const rect = wrap.getBoundingClientRect();
    const x2 = e.clientX - rect.left;
    const y2 = e.clientY - rect.top;
    
    renderEdges(map);
    svg.innerHTML += `<path d="M ${x1} ${y1} L ${x2} ${y2}" stroke="#00B4D8" stroke-width="2.5" stroke-dasharray="5,5" fill="none"></path>`;
  };
  
  const upHandler = (e) => {
    document.removeEventListener('mousemove', moveHandler);
    document.removeEventListener('mouseup', upHandler);
    
    // Find target port
    const target = e.target;
    if(target && target.classList.contains('map-port')){
      const targetNodeEl = target.closest('.map-node');
      if(targetNodeEl){
        const targetNodeId = targetNodeEl.id.replace('mn_','');
        if(targetNodeId !== nodeId){
          // Determine which port was hit
          const onclickAttr = target.getAttribute('onmousedown')||'';
          const portMatch = onclickAttr.match(/'(top|bottom|left|right)'/);
          const toPort = portMatch ? portMatch[1] : 'left';
          
          const map = getActiveMap();
          if(map){
            if(!map.edges) map.edges = [];
            map.edges.push({from: nodeId, to: targetNodeId, fromPort: port, toPort: toPort});
            saveMaps();
            renderMapCanvas();
          }
        }
      }
    } else {
      // No valid target, just re-render to clear the temp line
      const map = getActiveMap();
      if(map) renderEdges(map);
    }
    connectStart = null;
  };
  
  document.addEventListener('mousemove', moveHandler);
  document.addEventListener('mouseup', upHandler);
}

function deleteEdge(idx){
  const map = getActiveMap();
  if(!map || !map.edges) return;
  if(!confirm('Delete this connection?')) return;
  pushUndo();
  map.edges.splice(idx, 1);
  saveMaps();
  renderMapCanvas();
}

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
          <option value="navy">Navy</option>
          <option value="maroon">Maroon</option>
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
  // If no active map, try selecting the first one
  if(!window.activeMapId && window.maps.length) window.activeMapId = window.maps[0].id;
  // Also ensure mapSectionOpen is true if canvas is visible
  if(document.getElementById('map-canvas-wrap')) window.mapSectionOpen = true;
  const map = getActiveMap();
  if(!map) { alert('No map available. Create a map first.'); return; }
  
  const name = document.getElementById('modal-name').value.trim();
  if(!name) { alert('Please enter a name'); return; }
  
  const type = document.getElementById('modal-type').value;
  const color = document.getElementById('modal-color').value;
  
  // Store everything directly on the node — no skill created, no Supabase, no sidebar
  const col = map.nodes.length % 3;
  const row = Math.floor(map.nodes.length / 3);
  const x = 50 + col * 200;
  const y = 50 + row * 120;
  
  pushUndo();
  map.nodes.push({
    id: 'n_'+Date.now(),
    itemId: null,        // no skill reference
    name: name,          // stored directly on node
    type: type,
    color: color,
    x, y
  });
  saveMaps();
  
  document.getElementById('create-item-modal').remove();
  renderMapCanvas();
}

function addItemToMap(itemId){
  if(!window.mapSectionOpen) return;
  const map = getActiveMap();
  if(!map) return;
  
  const col = map.nodes.length % 3;
  const row = Math.floor(map.nodes.length / 3);
  const x = 50 + col * 200;
  const y = 50 + row * 120;
  
  pushUndo();
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

function startInlineEdit(event, nodeId){
  event.stopPropagation();
  event.preventDefault();
  const el = event.currentTarget;
  
  // Make it editable and focus
  el.setAttribute('contenteditable', 'true');
  el.style.background = '#fff';
  el.style.boxShadow = '0 0 0 2px #00B4D8';
  el.focus();
  
  // Select all text inside
  const range = document.createRange();
  range.selectNodeContents(el);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
  
  const finish = (save) => {
    el.removeAttribute('contenteditable');
    el.style.background = '';
    el.style.boxShadow = '';
    el.removeEventListener('blur', onBlur);
    el.removeEventListener('keydown', onKey);
    
    if(save){
      const map = getActiveMap();
      if(map){
        const node = map.nodes.find(n=>n.id===nodeId);
        if(node){
          const allItems = [...(S.personal||[]),...(S.shared||[])].filter(i=>!i.archived);
          const item = allItems.find(i=>i.id===node.itemId);
          const newName = el.textContent.trim();
          if(node.itemId){
            // Skill-referenced node: store as label override
            if(newName === '' || (item && newName === item.name)){
              delete node.label;
            } else {
              node.label = newName;
            }
          } else {
            // Standalone canvas node: store directly as node.name
            node.name = newName || node.name;
          }
          saveMaps();
        }
      }
    }
    renderMapCanvas();
  };
  
  const onBlur = () => finish(true);
  const onKey = (e) => {
    if(e.key === 'Enter'){ e.preventDefault(); el.blur(); }
    else if(e.key === 'Escape'){ e.preventDefault(); finish(false); }
  };
  
  el.addEventListener('blur', onBlur);
  el.addEventListener('keydown', onKey);
}

function removeNodeFromMap(nodeId){
  const map = getActiveMap();
  if(!map) return;
  pushUndo();
  map.nodes = map.nodes.filter(n=>n.id!==nodeId);
  // Also remove any edges connected to this node
  map.edges = (map.edges||[]).filter(e => e.from !== nodeId && e.to !== nodeId);
  saveMaps();
  renderMapCanvas();
}

function toggleMapsSection(){
  const body=document.getElementById('maps-body');
  const chevron=document.getElementById('maps-chevron');
  if(!body)return;
  const isOpen=body.style.maxHeight!=='0px'&&body.style.maxHeight!=='';
  body.style.maxHeight=isOpen?'0px':'500px';
  if(chevron)chevron.style.transform=isOpen?'rotate(180deg)':'rotate(0deg)';
}

function addMapFolder(){
  const name=prompt('Map folder name:');
  if(!name)return;
  const list=document.getElementById('map-list');
  if(!list)return;
  const el=document.createElement('div');
  el.className='map-folder-header';
  el.style.cssText='padding:5px 8px;font-size:10px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.08em;margin-top:6px;display:flex;align-items:center;gap:4px;border-top:1px solid var(--border-mid);';
  el.innerHTML='<i class="ti ti-folder" style="font-size:11px"></i>'+name;
  list.appendChild(el);
}

function toggleMapSection(id){
  const elem = document.getElementById(id);
  if(!elem) return;
  window.mapSectionOpen = !window.mapSectionOpen;
  if(window.mapSectionOpen){
    elem.classList.remove('collapsed');
    elem.classList.add('expanded');
    if(window.activeMapId) renderMapCanvas();
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
  map.nodes = map.nodes.filter(node => !node.itemId || validIds.has(node.itemId));
  const removed = before - map.nodes.length;
  saveMaps();
  renderMapCanvas();
  alert('Removed ' + removed + ' orphaned items. ' + map.nodes.length + ' valid items remain.');
}

// ── COPY / PASTE ───────────────────────────────────────────────────────────
if(typeof window._selectedNodeId === 'undefined') window._selectedNodeId = null;

function selectNode(nodeId, addToSelection=false){
  if(!addToSelection){
    window._selectedNodeId = nodeId;
    window._selectedNodeIds.clear();
    window._selectedNodeIds.add(nodeId);
  } else {
    window._selectedNodeIds.add(nodeId);
    window._selectedNodeId = nodeId;
  }
  highlightSelected();
}

function highlightSelected(){
  // Re-render so selection state is embedded in the node HTML
  const map = getActiveMap();
  if(map) renderNodes(map);
}

function copySelectedNode(){
  if(!window._selectedNodeId) return;
  const map = getActiveMap();
  if(!map) return;
  const node = map.nodes.find(n => n.id === window._selectedNodeId);
  if(!node) return;
  copiedNodeId = node.itemId;
  _copiedNode = {...node}; // store full node data for standalone node support
  // Brief visual feedback - flash green
  window._selectedNodeIds.forEach(nid => {
    const el = document.getElementById('mn_' + nid);
    if(el){ el.style.outline = '2px dashed #06A77D'; setTimeout(()=>{ if(el) el.style.outline = '2px dashed #00B4D8'; }, 400); }
  });
}

function pasteCopiedNode(){
  if(!_copiedNode) return; // check _copiedNode, not copiedNodeId (which is null for standalone)
  const map = getActiveMap();
  if(!map) return;
  
  // Offset from the copied node's position
  const x = (_copiedNode.x || 100) + 80;
  const y = (_copiedNode.y || 100) + 80;
  
  pushUndo();
  const newId = 'n_' + Date.now();
  map.nodes.push({
    id: newId,
    itemId: _copiedNode.itemId || null,
    name: _copiedNode.name,
    type: _copiedNode.type,
    color: _copiedNode.color,
    label: _copiedNode.label,
    size: _copiedNode.size,
    x, y
  });
  saveMaps();
  renderMapCanvas();
  
  // Auto-select the new node
  setTimeout(() => selectNode(newId), 50);
}

// Keyboard shortcuts: Ctrl+C to copy, Ctrl+V to paste, Delete/Backspace to remove selected
document.addEventListener('keydown', (e) => {
  // Don't fire if user is typing in an input/contenteditable
  const tag = document.activeElement && document.activeElement.tagName;
  const isEditing = tag === 'INPUT' || tag === 'TEXTAREA' || 
    document.activeElement.isContentEditable;
  if(isEditing) return;
  
  if((e.ctrlKey || e.metaKey) && e.key === 'z'){
    e.preventDefault();
    undoMap();
  } else if((e.ctrlKey || e.metaKey) && e.key === 'c'){
    copySelectedNode();
  } else if((e.ctrlKey || e.metaKey) && e.key === 'v'){
    e.preventDefault();
    pasteCopiedNode();
  } else if((e.key === 'Delete' || e.key === 'Backspace') && window._selectedNodeIds.size > 0){
    e.preventDefault();
    const map = getActiveMap();
    if(map && window._selectedNodeIds.size > 0){
      pushUndo();
      // Remove selected nodes
      map.nodes = map.nodes.filter(n => !window._selectedNodeIds.has(n.id));
      // Remove any edges connected to deleted nodes
      map.edges = (map.edges||[]).filter(edge =>
        !window._selectedNodeIds.has(edge.from) && !window._selectedNodeIds.has(edge.to)
      );
      saveMaps();
      renderMapCanvas();
    }
    window._selectedNodeId = null;
    window._selectedNodeIds.clear();
  }
});

// Clear selection when clicking canvas background (not on a node)
document.addEventListener('click', (e) => {
  const wrap = e.target.closest('.map-canvas-wrap');
  if(!wrap) return; // only care about clicks inside canvas
  const map = getActiveMap();
  if(map && !isPointOverNode(e.clientX, e.clientY, wrap, map) && !e.target.closest('.map-toolbar')){
    if(window._selectedNodeIds.size > 0){
      window._selectedNodeId = null;
      window._selectedNodeIds.clear();
      renderNodes(map);
    }
  }
});

// ── MARQUEE SELECTION ────────────────────────────────────────────────────────
// ── MARQUEE SELECTION (set up once globally) ────────────────────────────────
let _marqueeEl = null;
let _marqueeStartX = 0, _marqueeStartY = 0;
let _marqueeInstalled = false;

function installMarquee(){
  if(_marqueeInstalled) return;
  _marqueeInstalled = true;
  // Attach directly to the canvas wrap element (not document)
  // so we don't have to worry about closest() on SVG children
  const attachToWrap = () => {
    const wrap = document.getElementById('map-canvas-wrap');
    if(!wrap || wrap._marqueeAttached) return;
    wrap._marqueeAttached = true;

    let _dsx=0, _dsy=0, _dragging=false, _boxEl=null;

    wrap.addEventListener('mousedown', (e) => {
      if(e.button !== 0) return;
      if(e.target.closest('.map-toolbar')) return;
      // Check if over a node bbox
      const map = getActiveMap();
      if(!map) return;
      const rect = wrap.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const overNode = map.nodes.some(n => {
        const sz = (n.size||60) + 16;
        return px >= n.x-8 && px <= n.x+sz && py >= n.y-8 && py <= n.y+sz;
      });
      if(overNode) return;

      _dsx = e.clientX; _dsy = e.clientY;
      _dragging = true;
      _boxEl = document.createElement('div');
      _boxEl.style.cssText = 'position:fixed;border:2px dashed #00B4D8;background:rgba(0,180,216,0.07);pointer-events:none;z-index:9999;left:'+_dsx+'px;top:'+_dsy+'px;width:0;height:0;';
      document.body.appendChild(_boxEl);
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if(!_dragging || !_boxEl) return;
      const x=Math.min(_dsx,e.clientX), y=Math.min(_dsy,e.clientY);
      const w=Math.abs(e.clientX-_dsx), h=Math.abs(e.clientY-_dsy);
      _boxEl.style.left=x+'px'; _boxEl.style.top=y+'px';
      _boxEl.style.width=w+'px'; _boxEl.style.height=h+'px';
    });

    document.addEventListener('mouseup', (e) => {
      if(!_dragging) return;
      _dragging = false;
      if(_boxEl){ _boxEl.remove(); _boxEl=null; }
      const selW=Math.abs(e.clientX-_dsx), selH=Math.abs(e.clientY-_dsy);
      if(selW<10 || selH<10) return;
      const rect = wrap.getBoundingClientRect();
      const selX=Math.min(_dsx,e.clientX)-rect.left;
      const selY=Math.min(_dsy,e.clientY)-rect.top;
      const selX2=selX+selW, selY2=selY+selH;
      const map = getActiveMap();
      if(!map) return;
      window._selectedNodeIds.clear();
      window._selectedNodeId = null;
      map.nodes.forEach(node => {
        const sz = node.size||60;
        if(node.x<selX2 && node.x+sz>selX && node.y<selY2 && node.y+sz>selY){
          window._selectedNodeIds.add(node.id);
          window._selectedNodeId = node.id;
        }
      });
      highlightSelected();
    });
  };

  // Attach now and re-attach after each render (wrap gets recreated)
  attachToWrap();
  const _origRender = window.renderMapCanvas;
  window.renderMapCanvas = function(){
    _origRender && _origRender();
    setTimeout(attachToWrap, 0);
  };
}

function isPointOverNode(clientX, clientY, wrap, map){
  const rect = wrap.getBoundingClientRect();
  const x = clientX - rect.left;
  const y = clientY - rect.top;
  return map.nodes.some(node => {
    const sz = (node.size || 60) + 20; // small padding for ports/resize handle
    return x >= node.x - 10 && x <= node.x + sz && y >= node.y - 10 && y <= node.y + sz;
  });
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
