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

function loadMaps(){
  try { maps = JSON.parse(localStorage.getItem(MAP_KEY)||'[]'); } catch(e){ maps=[]; }
  if(!activeMapId && maps.length) activeMapId = maps[0].id;
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

function renameMap(id, e){
  e.stopPropagation();
  const m = maps.find(x=>x.id===id);
  if(!m) return;
  const name = prompt('Rename map:', m.name);
  if(name && name!==m.name){ m.name=name; saveMaps(); renderMapList(); }
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

// ── ADD SKILL TO MAP ────────────────────────────────────────────────────────
function addItemToMap(itemId){
  if(!mapSectionOpen) return;
  const map = getActiveMap();
  if(!map) { alert('Create a map first'); return; }
  if(map.nodes.find(n=>n.itemId===itemId)) return; // already on map; skip silently
  // place in a grid-ish pattern
  const col = map.nodes.length % 3;
  const row = Math.floor(map.nodes.length / 3);
  const x = 40 + col * 200;
  const y = 40 + row * 120;
  map.nodes.push({id:'n_'+Date.now(), itemId, x, y});
  saveMaps();
  renderMapCanvas();
}

// ── CANVAS RENDER ───────────────────────────────────────────────────────────
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
      <span class="map-hint" style="font-size:11px;color:var(--text-muted);background:rgba(255,255,255,.85);padding:5px 9px;border-radius:7px;border:1px solid var(--border-mid);">Drag a side dot &rarr; another card to connect</span>
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
        <div class="map-node-icon" style="background:${hex}20;color:${hex};border:1px solid ${hex}30;">
          <i class="ti ${item.icon||'ti-puzzle'}" style="font-size:11px"></i>
        </div>
        <span class="map-node-name">${esc(item.name)}</span>
      </div>
      <span class="map-node-badge ${badgeClass}">${item.type}</span>
      <div class="map-node-port port-right" onmousedown="startConnect(event,'${node.id}','right')" title="Connect"></div>
      <div class="map-node-port port-left" onmousedown="startConnect(event,'${node.id}','left')" title="Connect"></div>
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
    const x1 = from.x + fw;
    const y1 = from.y + fh/2;
    const x2 = to.x;
    const y2 = to.y + th/2;
    const cx = (x1+x2)/2;
    return `<path d="M${x1},${y1} C${cx},${y1} ${cx},${y2} ${x2},${y2}"
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
  nodeDragState = {nodeId, startMouseX:e.clientX, startMouseY:e.clientY, origX:node.x, origY:node.y};
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
  const x1 = node.x + (port === 'right' ? w : 0);
  const y1 = node.y + h/2;
  connectDrag = { fromId: nodeId, x1, y1 };
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
  const exists = map.edges.find(ed=>(ed.from===drag.fromId&&ed.to===toId)||(ed.from===toId&&ed.to===drag.fromId));
  if(!exists) map.edges.push({ from: drag.fromId, to: toId });
  saveMaps();
  renderEdges(map);
}

function clearMapEdges(){
  const map = getActiveMap();
  if(!map||!confirm('Clear all connections?')) return;
  map.edges=[];
  saveMaps();
  renderEdges(map);
}
function clearMap(){
  const map = getActiveMap();
  if(!map||!confirm('Clear all nodes and connections from this map?')) return;
  map.nodes=[];
  map.edges=[];
  saveMaps();
  renderMapCanvas();
}
function removeNodeFromMap(nodeId){
  const map = getActiveMap();
  if(!map) return;
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
