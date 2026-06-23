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
  
  // Enable drop from sidebar
  wrap.ondragover = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; };
  wrap.ondrop = (e) => {
    e.preventDefault();
    const itemId = e.dataTransfer.getData('text/plain');
    if(!itemId) return;
    const m = getActiveMap();
    if(!m) return;
    const rect = wrap.getBoundingClientRect();
    const x = e.clientX - rect.left - 30;
    const y = e.clientY - rect.top - 30;
    if(!m.nodes) m.nodes = [];
    m.nodes.push({id:'n_'+Date.now(), itemId, x: Math.max(0,x), y: Math.max(0,y)});
    saveMaps();
    renderMapCanvas();
  };
  
  wrap.innerHTML = `
    <div class="map-toolbar">
      <button class="map-tool-btn" onclick="openCreateItemModal()" title="Create new item"><i class="ti ti-circle-plus"></i> Create Item</button>
      <button class="map-tool-btn" onclick="saveMaps(); alert('Saved!');" title="Save"><i class="ti ti-device-floppy"></i> Save</button>
      <button class="map-tool-btn" onclick="cleanupOrphanedNodes()" title="Remove broken items">Clean Up</button>
      <button class="map-tool-btn" onclick="clearAllNodes()" title="Clear everything">Clear All</button>
    </div>
    <svg id="map-svg" style="position:absolute;top:0;left:0;width:100%;height:100%;overflow:visible;"></svg>
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
    const size = node.size || 60;
    const emojiSize = Math.round(size * 0.4);
    // Ports sit exactly on the icon box border (the 3px bordered square)
    const portStyle = 'position:absolute;width:12px;height:12px;background:#fff;border:2px solid '+hex+';border-radius:50%;cursor:crosshair;z-index:30;';
    const halfSize = size/2;
    // The iconbox IS the bordered square - ports on its edges
    return `<div class="map-node" id="mn_${node.id}" style="left:${node.x}px;top:${node.y}px;position:absolute;">
      <div class="map-node-iconbox" style="position:relative;width:${size}px;height:${size}px;">
        <div style="position:absolute;top:0;left:0;width:${size}px;height:${size}px;background:#FFFFFF;color:#666;border:3px solid ${hex};display:flex;align-items:center;justify-content:center;font-size:${emojiSize}px;border-radius:6px;box-shadow:0 2px 8px rgba(0,0,0,0.1);box-sizing:border-box;cursor:move;" onmousedown="startNodeDrag(event,'${node.id}')">
          ${getEmojiForType(item.type || 'skill')}
        </div>
        <div class="map-node-del" style="position:absolute;top:-8px;right:-8px;width:18px;height:18px;background:#FF4444;color:white;border-radius:50%;cursor:pointer;z-index:40;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:bold;line-height:1;box-shadow:0 1px 4px rgba(0,0,0,0.2);" onclick="removeNodeFromMap('${node.id}')" title="Remove from map">×</div>
        <div class="map-port" style="${portStyle}top:-6px;left:${halfSize-6}px;" onmousedown="startConnect(event,'${node.id}','top')" title="Connect"></div>
        <div class="map-port" style="${portStyle}bottom:-6px;left:${halfSize-6}px;" onmousedown="startConnect(event,'${node.id}','bottom')" title="Connect"></div>
        <div class="map-port" style="${portStyle}left:-6px;top:${halfSize-6}px;" onmousedown="startConnect(event,'${node.id}','left')" title="Connect"></div>
        <div class="map-port" style="${portStyle}right:-6px;top:${halfSize-6}px;" onmousedown="startConnect(event,'${node.id}','right')" title="Connect"></div>
        <div class="map-resize" style="position:absolute;bottom:-6px;right:-6px;width:14px;height:14px;background:${hex};border-radius:50%;cursor:nwse-resize;z-index:30;display:flex;align-items:center;justify-content:center;" onmousedown="startResize(event,'${node.id}')" title="Resize"><span style="color:white;font-size:8px;">⤡</span></div>
      </div>
      <div style="font-size:11px;margin-top:8px;text-align:center;max-width:${Math.max(size,80)}px;font-weight:500;">${esc(item.name)}</div>
      <div style="font-size:9px;text-align:center;color:#999;">${item.type}</div>
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
  
  svg.innerHTML = (map.edges||[]).map((edge, idx)=>{
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
    
    // Bezier curve control points
    const dx = Math.abs(p2.x - p1.x);
    const offset = Math.max(40, dx/2);
    let c1x = p1.x, c1y = p1.y, c2x = p2.x, c2y = p2.y;
    if(fromPort==='right'){ c1x = p1.x + offset; }
    else if(fromPort==='left'){ c1x = p1.x - offset; }
    else if(fromPort==='top'){ c1y = p1.y - offset; }
    else if(fromPort==='bottom'){ c1y = p1.y + offset; }
    if(toPort==='right'){ c2x = p2.x + offset; }
    else if(toPort==='left'){ c2x = p2.x - offset; }
    else if(toPort==='top'){ c2y = p2.y - offset; }
    else if(toPort==='bottom'){ c2y = p2.y + offset; }
    
    const path = `M ${p1.x} ${p1.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
    return `<g>
      <path d="${path}" stroke="#94a3b8" stroke-width="2.5" fill="none" style="pointer-events:stroke;cursor:pointer;" onclick="deleteEdge(${idx})"></path>
      <path d="${path}" stroke="transparent" stroke-width="12" fill="none" style="pointer-events:stroke;cursor:pointer;" onclick="deleteEdge(${idx})"></path>
    </g>`;
  }).join('');
}

// Connection state
let connectStart = null;

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
