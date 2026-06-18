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
  if(map.nodes.find(n=>n.itemId===itemId)){
    alert('Already on this map'); return;
  }
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
      <button class="map-tool-btn" id="connect-btn" onclick="toggleConnectMode()" title="Draw connections"><i class="ti ti-git-branch" style="font-size:12px"></i> Connect</button>
      <button class="map-tool-btn" onclick="clearMapEdges()" title="Clear connections"><i class="ti ti-eraser" style="font-size:12px"></i></button>
      <button class="map-tool-btn" onclick="clearMap()" title="Clear all"><i class="ti ti-trash" style="font-size:12px"></i> Clear</button>
    </div>
    <svg id="map-svg" style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;overflow:visible;"></svg>
    <div id="map-nodes-layer" style="position:absolute;top:0;left:0;width:100%;height:100%;"></div>
    ${isEmpty?'<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;pointer-events:none;"><div style="font-size:13px;color:var(--text-muted);">Click a skill in the sidebar to add it</div><div style="font-size:11px;color:var(--border-strong);margin-top:4px;">Then connect them by clicking Connect and dragging between nodes</div></div>':''}
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
      fill="none" stroke="#1E3570" stroke-width="1.5" stroke-opacity="0.5"
      marker-end="url(#arrowhead)"/>`;
  }).join('');

  // arrowhead marker
  if(map.edges.length){
    svg.innerHTML = `<defs><marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
      <polygon points="0 0, 8 3, 0 6" fill="#1E3570" opacity="0.5"/>
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

// ── CONNECT MODE ─────────────────────────────────────────────────────────────
let connectMode = false;
let connectFromId = null;
function toggleConnectMode(){
  connectMode = !connectMode;
  connectFromId = null;
  const btn = document.getElementById('connect-btn');
  if(btn) btn.classList.toggle('active', connectMode);
}
function startConnect(e, nodeId, port){
  if(!connectMode) return;
  e.stopPropagation();
  if(!connectFromId){
    connectFromId = nodeId;
    const el = document.getElementById('mn_'+nodeId);
    if(el) el.classList.add('selected');
  } else {
    if(connectFromId !== nodeId){
      const map = getActiveMap();
      if(map){
        const exists = map.edges.find(ed=>(ed.from===connectFromId&&ed.to===nodeId)||(ed.from===nodeId&&ed.to===connectFromId));
        if(!exists) map.edges.push({from:connectFromId, to:nodeId});
        saveMaps();
        renderEdges(map);
      }
    }
    // reset
    document.querySelectorAll('.map-node.selected').forEach(el=>el.classList.remove('selected'));
    connectFromId = null;
    // turn off connect mode after one connection
    connectMode = false;
    const btn = document.getElementById('connect-btn');
    if(btn) btn.classList.remove('active');
  }
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
