const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';
const SB_URL = 'https://zjruwkdmvpgfpyxpnffj.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqcnV3a2RtdnBnZnB5eHBuZmZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MDg5NjksImV4cCI6MjA5NzM4NDk2OX0.jlQkFpYtkh497qFWkG03tJZGQ-5R_bWx4QxwRUNEO1E';

async function sbFetch(path, opts={}) {
  const r = await fetch(SB_URL+'/rest/v1/'+path, {
    ...opts,
    headers: { 'apikey': SB_KEY, 'Authorization': 'Bearer '+SB_KEY,
      'Content-Type': 'application/json', 'Prefer': 'return=minimal', ...(opts.headers||{}) }
  });
  return r;
}
const PK='sb_personal_v1';const SK='sb_shared_v1';
const COLORS={navy:'#1E3570',teal:'#0E6E5C',purple:'#4A2080',coral:'#C44A20',amber:'#B87800',gray:'#4A5060',blue:'#2952A3',pink:'#982060'};
const ICONS=['ti-puzzle','ti-bolt','ti-brain','ti-chart-bar','ti-edit','ti-file','ti-folder','ti-star','ti-microphone','ti-video','ti-camera','ti-list','ti-wand','ti-robot','ti-sparkles','ti-target'];
let drawerOpen=false,pickerOpen=false,menuOpen=false,sidebarOpen=true;
let deferredPrompt=null;

// PWA install prompt
window.addEventListener('beforeinstallprompt',(e)=>{
  e.preventDefault();deferredPrompt=e;
  document.getElementById('install-banner').classList.add('show');
});
function installApp(){
  if(deferredPrompt){deferredPrompt.prompt();deferredPrompt.then(()=>{deferredPrompt=null;document.getElementById('install-banner').classList.remove('show');});}
}

function colorHex(c){return COLORS[c]||COLORS.gray;}
function iconEl(icon,color,size){const bg=colorHex(color);return`<div class="item-icon" style="background:${bg}18;color:${bg};border:1px solid ${bg}30;"><i class="ti ${icon||'ti-puzzle'}" style="font-size:${size||11}px"></i></div>`;}
function esc(t){return(t||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function timeAgo(ts){if(!ts)return'';const d=Math.floor((Date.now()-ts)/1000);if(d<60)return'just now';if(d<3600)return Math.floor(d/60)+'m ago';if(d<86400)return Math.floor(d/3600)+'h ago';return Math.floor(d/86400)+'d ago';}
function initials(n){return(n||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();}
function fullDate(ts){return ts?new Date(ts).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}):'-';}
function toggleSidebar(){sidebarOpen=!sidebarOpen;const sb=document.getElementById('sidebar');sb.className='sidebar '+(sidebarOpen?'expanded':'collapsed');if(sidebarOpen){let w=240;try{const s=localStorage.getItem('sb_sidebar_w');if(s)w=parseInt(s,10)||240;}catch(e){}sb.style.width=w+'px';}else{sb.style.width='0px';}}
function toggleMenu(){menuOpen=!menuOpen;const m=document.getElementById('action-menu');if(m)m.className='menu-dropdown '+(menuOpen?'open':'');if(menuOpen)setTimeout(()=>document.addEventListener('click',closeMenu,{once:true}),0);}
function closeMenu(){menuOpen=false;const m=document.getElementById('action-menu');if(m)m.className='menu-dropdown';}

function md(raw){
  const cleaned=raw.replace(/^#\s+[^\n]+\n?/,'').trimStart();
  const lines=cleaned.split('\n');let html='',inPre=false,inTable=false,inUL=false;
  for(let i=0;i<lines.length;i++){
    const line=lines[i];
    if(line.startsWith('```')){if(!inPre){html+='<pre><code>';inPre=true;}else{html+='</code></pre>';inPre=false;}continue;}
    if(inPre){html+=esc(line)+'\n';continue;}
    if(line.startsWith('|')){
      if(!inTable){html+='<table>';inTable=true;const cells=line.split('|').filter((_,j)=>j>0&&j<line.split('|').length-1);html+='<tr>'+cells.map(c=>`<th>${inl(c.trim())}</th>`).join('')+'</tr>';i++;continue;}
      const cells=line.split('|').filter((_,j)=>j>0&&j<line.split('|').length-1);
      if(cells.every(c=>/^[-: ]+$/.test(c)))continue;
      html+='<tr>'+cells.map(c=>`<td>${inl(c.trim())}</td>`).join('')+'</tr>';continue;
    }else if(inTable){html+='</table>';inTable=false;}
    if(/^### /.test(line)){if(inUL){html+='</ul>';inUL=false;}html+=`<h3>${inl(line.slice(4))}</h3>`;continue;}
    if(/^## /.test(line)){if(inUL){html+='</ul>';inUL=false;}html+=`<h2>${inl(line.slice(3))}</h2>`;continue;}
    if(/^---$/.test(line.trim())){if(inUL){html+='</ul>';inUL=false;}html+='<hr>';continue;}
    if(/^[\s]*[-*] /.test(line)){if(!inUL){html+='<ul>';inUL=true;}html+=`<li>${inl(line.replace(/^[\s]*[-*] /,''))}</li>`;continue;}
    if(inUL){html+='</ul>';inUL=false;}
    if(!line.trim())continue;
    html+=`<p>${inl(line)}</p>`;
  }
  if(inPre)html+='</code></pre>';if(inTable)html+='</table>';if(inUL)html+='</ul>';
  return html;
}
function inl(t){return esc(t).replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/\*([^*]+)\*/g,'<em>$1</em>');}

const PBAB=`---
name: brief-asset-breakdown
description: "Reads a Google Doc or Google Slides production brief and extracts the creative assets needed for production: soundbites (the dialogue lines talent will say, from SS1–SS5+) and B-roll shots (the visual moments to capture on set). Counterpart to Production Brief Resource Breakdown, which extracts logistics (Props, SKU, Locations, Talent)."
icon: mic
color: Green
related_server_ids:
- gdocs
- gslides
---

# Production Brief Asset Breakdown

## What This Skill Does

Production Brief Asset Breakdown reads a TubeScience production brief and pulls out the two **substance** elements of a shoot:

- **Soundbites** — the actual dialogue lines talent will say, organized by sales sequence (SS1–SS5+) and header (H1–H4+)
- **B-roll shots** — the specific actions and things that need to be captured on set

These are the substance layer of the brief in SVS terms: *what* is being said and *what* is being done — not how it's filmed. The how (camera angles, tone, pacing, performance direction) is style and is explicitly excluded from this extraction.

### How This Differs from Production Brief Resource Breakdown

| Skill | Extracts | Answers |
|---|---|---|
| **Resource Breakdown** | Props, SKU, Locations, Talent | What do we need *to* shoot? |
| **Asset Breakdown** | Soundbites, B-roll shots | What do we need *to capture* during the shoot? |

Both read the same brief. Neither overlaps with the other. See **Joint Extraction Mode** at the bottom of this skill for how to run both on the same brief.

---

## Workflow

1. Identify the brief source type from the URL:
   - **Google Doc**: URL contains \`docs.google.com/document\` → use \`gdocs__read_doc\`
   - **Google Slides**: URL contains \`docs.google.com/presentation\` → use \`gslides__get_presentation\`
2. Extract the doc/presentation ID from the URL
3. Read and parse the brief text (see Parsing Notes)
4. Extract soundbites from all SS blocks and H blocks
5. Extract B-roll shots from the ADDITIONAL / B-roll section and inline visual notes
6. Format and return the Asset Summary

---

## Extraction Rules

### 🎙️ Soundbites

Soundbites are the spoken dialogue lines from the sales sequences (SS1–SS5+) and the hook copy from the headers (H1–H4+).

**Include:**
- Every dialogue line from each SS block — these are the lines talent will actually say on camera
- Header copy (H1–H4+) — these are the opening hook lines, typically text on screen or spoken
- Voiceover lines where specified (label them \`[VO]\` in the output)

**Exclude:**
- Visual direction notes that appear alongside dialogue lines (e.g., "cut to product shot", "talent looks at camera", "CU of face")
- Performance direction (e.g., "delivered warmly", "frustrated tone", "direct to camera")
- Camera angle instructions
- GFX/animation callouts (e.g., "pop-up of bottle appears")
- Production notes and concept descriptions

**How to separate dialogue from visual notes:**
TubeScience briefs typically present each SS line as a dialogue line followed by a visual note in parentheses, brackets, or on the next indented line. Extract only the spoken text. When in doubt: if a person could say it out loud on camera, it's a soundbite.

**Quotation marks as a soundbite signal:**
In briefs of any format — including unfamiliar or non-standard layouts — lines with quotation marks around them are almost always intended to be spoken by talent. Quotation marks are the brief writer's way of indicating "this is the exact line." When parsing an unfamiliar brief and unsure whether a line is dialogue or direction, treat the presence of quotation marks as a strong positive signal that it is a soundbite.

**Duplicate and misread detection:**
As soundbites are extracted, cross-reference each new line against already-extracted soundbites. If a line is identical or near-identical to one already captured (e.g., pulled from a different SS block or a repeated section), flag it as a possible duplicate rather than listing it twice. Similarly, if a line was extracted without quotation marks and a near-identical version with quotation marks exists elsewhere in the brief, prefer the quoted version as the authoritative read and flag the unquoted one for review.

**Output structure:**
Organize soundbites by their source block — SS1, SS2, SS3, etc., then H1, H2, H3, etc. Keep the sequence order intact. This preserves the persuasion arc for downstream analysis.

---

### 🎬 B-Roll Shots

B-roll shots are the specific visual moments — actions, objects, or scenes — that need to be captured on set outside of the main talking head footage.

**Include:**
- The ADDITIONAL / B roll shots section of the brief
- Inline visual notes from SS blocks that describe a distinct shot (e.g., "shot of talent opening delivery box", "close-up of product in hand", "talent applying product to skin")
- Any shot described as "b-roll", "cutaway", "insert shot", or "reaction shot"
- Product interaction shots (talent using, holding, or demonstrating the product)

**Exclude:**
- Talking head coverage of the main sales sequence dialogue — that's the primary footage, not B-roll
- GFX, animations, or post-production overlays
- Vague directional notes that don't describe a specific capturable moment (e.g., "feel free to add lifestyle shots")
- Camera angle descriptions without a subject (e.g., "wide shot" with no subject specified)

**Flag ambiguous shots:**
If a brief describes a B-roll shot vaguely (e.g., "something showing the product working"), flag it with ⚠️ and note that it needs clarification before the shoot.

**Non-standard B-roll section names:**
TubeScience briefs are not always formatted with an "ADDITIONAL" or "B-roll shots" header. The following section names must also be recognized as B-roll sources:

| Section header | Treat as |
|---|---|
| \`ADDITIONAL\` | B-roll list |
| \`B roll shots\` / \`B-roll shots\` / \`B-Roll\` | B-roll list |
| \`VIDEO / SHOT REQUESTS\` | B-roll list |
| \`SHOT REQUESTS\` | B-roll list |
| \`SHOTLIST\` / \`SHOT LIST\` | B-roll list (filter out pure camera/framing direction lines) |
| \`ADDITIONAL NOTES\` | Scan for shot descriptions — only extract lines that describe a capturable visual moment |

Regex to match all variants:
\`\`\`python
BROLL_PATTERN = re.compile(
    r'(?:B[\\s\\-]?roll\\s+shots?|ADDITIONAL(?!\\s+NOTES)|VIDEO\\s*/\\s*SHOT\\s+REQUESTS?|SHOT\\s+(?:LIST|REQUESTS?))\\s*\\n(.*?)(?:\\n\\n|\\nAD\\s+SET|\\Z)',
    re.IGNORECASE | re.DOTALL
)

---

## Output Format

\`\`\`
📋 Asset Summary — [Job Name]

🎙️ SOUNDBITES

SS1:
• "[dialogue line 1]"
• "[dialogue line 2]"
• "[dialogue line 3]"

SS2:
• "[dialogue line 1]"
• "[dialogue line 2]"

[continue for all SS blocks]

HEADERS:
• H1: "[hook copy]"
• H2: "[hook copy]"
• H3: "[hook copy]"
• H4: "[hook copy]"

---

🎬 B-ROLL SHOTS
• [shot description]
• [shot description]
• ⚠️ [ambiguous shot] — needs clarification before shoot

---
🔗 Brief: [Google Doc URL]
\`\`\`

---

## Script

Main script: \`scripts/run.py\`

\`\`\`bash
python3 scripts/run.py <google_doc_url>
\`\`\`

Or from sandbox_python:
\`\`\`python
import sys
sys.path.insert(0, '/home/user/skills/production-brief-asset-breakdown/scripts')
from run import run_extraction
run_extraction("https://docs.google.com/document/d/DOC_ID/edit")
\`\`\`

---

## Parsing Notes

### Google Docs
Google Docs JSON is deeply nested. Use this recursive extractor to get all plain text:

\`\`\`python
def extract_text_from_body(body):
    parts = []
    def process_elements(elements):
        for el in elements:
            if 'paragraph' in el:
                for run in el['paragraph'].get('elements', []):
                    if 'textRun' in run:
                        parts.append(run['textRun'].get('content', ''))
            elif 'table' in el:
                for row in el['table'].get('tableRows', []):
                    for cell in row.get('tableCells', []):
                        process_elements(cell.get('content', []))
    process_elements(body)
    return ''.join(parts)
\`\`\`

### Google Slides
Call \`gslides__get_presentation(presentation_id=PRESENTATION_ID)\`. Join all slides in order:
\`\`\`python
text = '\\n'.join(slide.get('text_content', '') for slide in result['slides'])
\`\`\`

---

## TubeScience Brief Structure Reference

- **Header table**: Job Name, Job Owner, Client, SKU, Aspect Ratio, Goal Demo
- **Job Goal/Strategy**: Creative archetype, \`[Setting]:\`, \`[Casting]:\` inline fields
- **PRODUCTION NOTES**: CONCEPT, SETTING, TALENTS, CAMERA ANGLES, ADDITIONAL (b-roll list), AD SETS
- **Sales Sequences (SS1–SS5+)**: Dialogue scripts with visual notes per line
- **Headers (H1–H4+)**: Opening hook copy

---

## SS/H Block Detection — Robust Parsing Rules

### Matching SS and H block labels

TubeScience briefs are not always perfectly formatted. SS and H label variants that must all be detected:

| Canonical | Also match |
|---|---|
| \`SS1\` | \`SS 1\`, \`SS-1\`, \`Sales Sequence 1\`, \`Sales Sequence #1\`, \`SS1:\`, \`SS 1:\` |
| \`H1\` | \`H 1\`, \`H-1\`, \`Header 1\`, \`Header #1\`, \`H1:\`, \`H 1:\` |

**Regex patterns (Python \`re\` with \`re.IGNORECASE | re.DOTALL\`):**

\`\`\`python
import re

# SS block — matches SS1, SS 1, SS-1, SS1:, Sales Sequence 1, Sales Sequence #1
SS_LABEL = r'(?:Sales\\s+Sequence\\s+#?(\\d+)|SS[\\s\\-]?(\\d+))'
SS_BLOCK_PATTERN = re.compile(
    r'(?:Sales\\s+Sequence\\s+#?(?P<n1>\\d+)|SS[\\s\\-]?(?P<n2>\\d+))\\s*:?\\s*
(.*?)(?=(?:Sales\\s+Sequence\\s+#?\\d+|SS[\\s\\-]?\\d+|H[\\s\\-]?\\d+|Header[\\s\\-]?\\d+|\\Z))',
    re.IGNORECASE | re.DOTALL
)

# H block — matches H1, H 1, H-1, H1:, Header 1, Header #1
H_BLOCK_PATTERN = re.compile(
    r'(?:Header\\s+#?(?P<n1>\\d+)|H[\\s\\-]?(?P<n2>\\d+))\\s*:?\\s*
?(.*?)(?=(?:Header\\s+#?\\d+|H[\\s\\-]?\\d+|SS[\\s\\-]?\\d+|Sales\\s+Sequence|\\Z))',
    re.IGNORECASE | re.DOTALL
)

# B-roll section — matches ADDITIONAL, B-roll shots, B roll shots, B-Roll, B Roll
BROLL_PATTERN = re.compile(
    r'(?:B[\\s\\-]?roll\\s+shots?|ADDITIONAL)\\s*
(.*?)(?:

|
AD\\s+SET|\\Z)',
    re.IGNORECASE | re.DOTALL
)
\`\`\`

### Handling H blocks that appear before or after SS blocks

H blocks (headers/hooks) can appear at the **top or bottom** of a brief. The H block pattern above terminates on any SS or H label, so order does not matter — scan the full document text for both patterns independently and then merge results:

1. Find all SS blocks → collect into \`{1: [...lines], 2: [...lines], ...}\`
2. Find all H blocks → collect into \`{1: "hook copy", 2: "hook copy", ...}\`
3. Find B-roll section
4. Merge into the Asset Summary output

### Multi-talent briefs

Some briefs present the same SS sequence multiple times for different talent (e.g., "Talent A — SS1", "Talent B — SS1"). When this pattern appears:

1. Detect the talent prefix using: \`r'(?:Talent\\s+[A-Z]|Talent\\s+\\d+|[A-Z]\\s+\\-)\\s*[–\\-]\\s*SS'\`
2. Group SS blocks by talent: \`SS1 (Talent A)\`, \`SS1 (Talent B)\`
3. In the output, present each talent as a sub-group under the SS block:

\`\`\`
SS1:
  [Talent A]
  • "line 1"
  • "line 2"

  [Talent B]
  • "line 1"
  • "line 2"
\`\`\`

### Voiceover vs. on-camera lines

When a brief contains both VO and on-camera lines within the same SS block:

- Look for labels: \`(VO)\`, \`[VO]\`, \`Voiceover:\`, \`V.O.:\`, \`V/O:\`
- Tag extracted VO lines with \`[VO]\` in the output: \`• [VO] "line text"\`
- On-camera lines are unlabeled (default assumption)

### Script blocks as SS equivalents

Some briefs use \`Script #1\`, \`Script #2\`, \`Script 1\`, \`Script 2\` instead of \`SS1\`, \`SS2\`. Treat these identically to SS blocks:

- Regex: \`r'Script\\s+#?(\\d+)\\s*[-–—:]?\\s*([^\\n]*)\\n(.*?)(?=Script\\s+#?\\d+|H[\\s\\-]?\\d+|\\Z)'\` with \`re.IGNORECASE | re.DOTALL\`
- Label them as \`Script 1\`, \`Script 2\`, etc. in the output (do not rename to SS — preserve the brief's own language)
- The optional subtitle after the script number (e.g., \`Script #1 - Mom/Dad Confession\`) should be captured and shown as a subheader beneath the label

### Dialogue in table columns

Some briefs (especially "Full Concept Production Request" format and shotlist-style briefs) contain dialogue inside a table column labeled \`DIALOGUE\`. When SS/Script block patterns return no results:

1. Scan all table cell content for a cell whose text is exactly or approximately \`DIALOGUE\` (case-insensitive)
2. Treat every non-empty cell in that same column as a soundbite candidate
3. Apply the same direction-filtering rules — exclude cells that are purely stage direction
4. Present extracted lines in a \`SOUNDBITES (from DIALOGUE column)\` block
5. Flag: ⚠️ \`Soundbites extracted from DIALOGUE table column — no SS/Script block structure found. Manual review recommended.\`

Note: The Google Docs API returns table cells in row order. To identify which cells share a column with the DIALOGUE header, track the column index of the header cell and collect all cells at that index across subsequent rows.

### Missing SS/H labels — fallback extraction

If a brief has no SS/Script labels AND no DIALOGUE table column (non-standard format):

1. Fall back to quotation mark detection — extract every line or sentence that is fully or substantially enclosed in quotation marks
2. Present them in a single flat \`SOUNDBITES (unlabeled)\` block
3. Flag the output: ⚠️ \`No SS/H block structure detected — soundbites extracted from quoted text only. Manual review recommended.\`

---

## Joint Extraction Mode — Running with Resource Breakdown

When a user provides a production brief and wants a **complete pre-production summary**, run both this skill and the Production Brief Resource Breakdown on the same brief document. The two skills read the same source but extract completely different things and never overlap.

**When to trigger Joint Extraction Mode:**
- User explicitly asks for "everything from the brief"
- User asks to "prep for the shoot" or "get the brief summary"
- User is running a pre-production checklist

**Execution order:**
1. Read the brief document once (reuse the same text for both extractions)
2. Run Production Brief Asset Breakdown → produce the Asset Summary
3. Run Production Brief Resource Breakdown → produce the Resource Summary
4. Present both summaries back-to-back, separated by a divider

**Joint output format:**
\`\`\`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 ASSET SUMMARY — [Job Name]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[full soundbites + b-roll output]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🗂️ RESOURCE SUMMARY — [Job Name]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[props / SKU / locations / talent output]
\`\`\`

**Cross-validation check:**
After running both extractions, do one cross-check:
- Every named talent in the Resource Summary should also appear in the B-roll or Soundbite sections (talent names referenced in SS dialogue are a signal)
- Every SKU or product name in the Resource Summary should appear in at least one soundbite or B-roll shot (if a product is listed but never mentioned in substance, flag it: ⚠️ \`[Product] appears in resources but is not referenced in any soundbite or B-roll shot — confirm it is needed on set\`)

---

## Integration with Ad Grammar

Production Brief Asset Breakdown feeds the **Substance Mapping (TMG)** step of Ad Grammar.

When Ad Grammar is activated on a **creative brief** (as opposed to a finished ad), it should call Production Brief Asset Breakdown first to get the clean soundbite list before running the TMG beat-by-beat classification. This ensures the TMG analysis is working from the actual extracted dialogue lines rather than from raw brief text, which may contain visual notes, direction, and other noise that would distort the beat mapping.

**Handoff protocol:**
1. Ad Grammar (brief mode) calls Production Brief Asset Breakdown on the brief URL
2. Production Brief Asset Breakdown returns the Asset Summary (soundbites + B-roll)
3. Ad Grammar feeds **only the soundbites** into the TMG classification step
4. Ad Grammar feeds **the B-roll shots** into the Visual Archetypes step as evidence of the intended visual execution
5. The SVS coherence check uses both soundbites and B-roll together — soundbites = substance layer, B-roll = style evidence

**What Ad Grammar should NOT do:**
- Run TMG directly on raw brief text — always extract soundbites first via this skill
- Treat B-roll shots as part of the substance — they are style execution evidence`;

const PBRB=`---
name: production-brief-resource-breakdown
description: "Reads a Google Doc, Google Slides, Google Sheet, or PDF production brief, extracts Props, Product, Location, and Talent, then posts a structured bullet-list resource summary to the Updates section of the matching Monday.com item on the Footage Planning board."
icon: square
color: Green
related_server_ids:
- gdocs
- gslides
- gsheets
- monday
---

# Production Brief Resource Breakdown

## Overview

When given a production brief — as a Google Doc, Google Slides, Google Sheet, or PDF — and a Monday.com item URL, this skill reads the brief, extracts four key resource categories, and posts a clean bullet-list summary to the item's Updates section so the production team knows exactly what to source.

## Workflow

1. Identify the brief source type:
   - **Google Doc**: URL contains \`docs.google.com/document\` → use \`gdocs__read_doc\`
   - **Google Slides**: URL contains \`docs.google.com/presentation\` → use \`gslides__get_presentation\`
   - **Google Sheet**: URL contains \`docs.google.com/spreadsheets\` → use \`gsheets__read_spreadsheet\`
   - **PDF**: file path ends in \`.pdf\` or user provides a PDF attachment → extract text using \`PyMuPDF\` (\`fitz\`) in sandbox (see Parsing Notes)
2. Extract the **doc/presentation/sheet ID** from the URL (alphanumeric string between \`/d/\` and \`/edit\`, \`/present\`, or \`/pub\`)
3. Extract the **item ID** from the Monday.com URL (number after \`/pulses/\`)
4. Read the brief:
   - **Google Doc**: call \`gdocs__read_doc\`, then recursively extract plain text from the nested JSON (see Parsing Notes)
   - **Google Slides**: call \`gslides__get_presentation\`, then concatenate the \`text_content\` field from each slide in order. Speaker notes can be ignored unless no body text is found on a slide.
   - **Google Sheet**: call \`gsheets__read_spreadsheet\`, then join all cell values row by row into a flat text string for extraction
   - **PDF**: load with \`fitz.open(path)\`, iterate pages, call \`page.get_text()\`, join all pages (see Parsing Notes)
5. Extract the four resource categories using the rules below
6. Format and post the update via \`monday__create_update\`

---

## Extraction Rules

### 📦 Props

Physical set dressing and non-product items needed on set.

**Include:**
- Explicit "Props" sections in the brief
- Set dressing inferred from the SETTING description (e.g., candles, dinner table, tablecloth, glassware)
- Unbranded physical objects talent interacts with (e.g., smartphone for a scrolling shot)

**Branded product vs. prop distinction:** Before labeling an item, identify what the brand actually sells or delivers to the consumer:
- If the item would be received/provided by the brand (e.g., Thrive Market ships a grocery box with products inside, a skincare brand ships a kit) → it belongs in **Product/SKU**, not Props, even if it looks like a everyday item (food, packaging, etc.)
- If the item is something talent needs to source independently that the brand does not provide (e.g., a lunchbox, a receipt, a dog leash for a dog-walking app) → it is a **Prop**
- When in doubt, ask: would a consumer receive this item from the brand? If yes → Product/SKU. If no → Prop.

**Exclude:**
- B-roll shot descriptions — "B-roll" is a shot type, not a prop. Extract the physical object only if it is a genuine non-product prop; otherwise skip it entirely.
- The advertised product, its pill form, or branded SKU items — those go in Product/SKU
- Branded packaging or delivery boxes — those go in Product/SKU

**Vague prop requests:** If a brief calls for something non-specific like "chewing on something they shouldn't be" or "something to throw," provide 1–2 concrete examples in parentheses (e.g., "Chewed/destroyed item (e.g. shoe, cushion)"). Use context clues — dog briefs → human items a dog would chew; kitchen scenes → food/utensils, etc.

**Visual reference images as prop indicators:** If the brief includes or references a photo showing a specific prop (e.g., a chewed-up pillow with stuffing ripped out), treat that as a prop callout even if the text is vague.

**Feeding/eating scenes:** Whenever the shotlist includes feeding a dog or person on camera, add the relevant food item as a prop (e.g., "dog food" for a dog feeding shot, "dog treats" for a reward/training shot).

**If no props are identified:** write \`• No specific props required\` — no further explanation needed.

**Flag all real props as:** \`📋 Verify inventory\`

**Optional/conditional props:** If a prop is explicitly framed as optional or conditional in the brief (e.g., "if you have one", "if available", "optional", "if nearby"), still list it but replace the \`📋 Verify inventory\` flag with \`(Optional)\` or \`(If available)\` matching the brief's language.

**Contrast/alternative props:** If the brief calls for a "vs." shot, a comparison, or a scene where a prop is used as the inferior alternative to the advertised product (e.g., TFD vs. kibble, Hims vs. "magic shampoos", app vs. manual process), add a parenthetical clarifying its role as the negative/inferior alternative. Example: \`Kibble + zip-lock bag (unbranded, shown as inferior alternative for TFD vs. kibble comparison shots) — 📋 Verify inventory\`. This makes it clear the prop is not the product and should not look branded or appealing.

---

### 🧴 Product

The specific products and branded items that need to be sourced for the shoot.

**Include:**
- The \`SKU:\` field from the brief header — this is the primary product name, **but only if the brief also contains an explicit physical product shot callout** (e.g., "product shot featuring X", "close-up of X", "hand holding X")
- Branded product packaging and delivery boxes only if a physical shot of them is called out
- Use the product name as written in the brief — do not repeat or rephrase it

**Exclude:**
- Products only mentioned in dialogue or as GFX/animation pop-ins (e.g., "pop-up of chew/bottle", "puzzle combining to chew") — these are editorial/GFX directions, not physical sourcing needs
- Active ingredients or chemical compound names (e.g., "tadalafil", "sildenafil", "finasteride", "minoxidil") — these are ingredients, not products
- Context about how the product will be used in the shoot — that is creative direction, not a resource need
- Generic descriptors that aren't distinct SKUs

**Key test:** Would a producer need to physically bring this item to set or source it from inventory? If yes, include it. If it's handled in post via GFX or only exists in dialogue, exclude it.

**Apps, subscriptions, and digital-only products:** These have no physical SKU to source. Do NOT add a prop phone simply because the client is an app company. Only add a phone prop if the brief **explicitly** calls for a shot of talent using the app on screen, scrolling through the app, or showing the app UI on a device:
- If the brief explicitly calls for talent using a phone/app on camera → add \`Prop phone — 📋 Verify inventory\` to **Props** (not Product/SKU)
- If the brief also explicitly calls for a green screen phone overlay, GFX tracker screen, or app UI displayed on screen while filming → list it as \`Prop phone with green screen tracker screenshot — 📋 Verify inventory\` in **Props**
- If the client is an app but no phone/app UI shots are called for → no prop phone needed
- Product/SKU line → \`• No physical product shot required\`

**Flag all items as:** \`📋 Check available stock\`

---

### 📍 Locations

All distinct shooting environments needed for the production.

**Include:**
- \`SETTING:\` or \`[Setting]:\` fields
- Environments described across different Sales Sequences (SS1–SS5+)
- DTC UGC setups (usually a separate environment from the main narrative)
- Multiple shooting styles within the same space (e.g., stationary + on-the-move) count as separate entries if they require different crew/setup planning
- Deduplicate — if the same location appears in multiple places, list it once
- **Optional/conditional locations:** If a location is explicitly framed as optional or conditional (e.g., "if park is nearby", "if available", "optional"), still list it but append \`(If available)\` or \`(Optional)\` to the entry

---

### 🎭 Talent

Casting requirements and specifications.

**Include:**
- Count and gender only (e.g., \`1x male\`, \`2x female\`) — no role descriptions or creative direction
- \`[Casting]:\` inline field
- Vibe/style references to previous jobs (e.g., \`Style ref: J572v1C\`) — keep brief
- Casting structure notes only if they affect how many people to book (e.g., "1x couple + 1x bystander")
- When casting a couple or group, list the top-level count (e.g., \`1x couple\`) and then break out the individual headcount as sub-bullets (e.g., \`- 1x male\` / \`- 1x female\`) so it's always clear exactly how many people need to be booked
- Named/specific talent requests → flag with ⚠️ and note day rate lookup required
- Specific/uncommon skills or abilities required (e.g., horse riding, playing guitar, skateboarding, fluent in Spanish) — only if the talent must possess a skill beyond standard on-camera performance
- **Wardrobe:** If the brief mentions any wardrobe guidance — including fashion style, colors, outfit type, or restrictions (e.g., no logos, no black) — list it as a \`- Wardrobe: ...\` sub-bullet under the relevant talent entry. Omit only if wardrobe is not mentioned at all in the brief.

**Exclude:**
- Descriptions of how the talent will perform (e.g., "seated on bed", "direct-to-camera delivery", "speaking to camera", "female partner POV") — these are common performance directions, not resource specs
- Tone/energy notes (e.g., "exasperated but relatable", "warm and friendly") — creative direction only
- Wardrobe restrictions only (e.g., "no logos", "no black") should be included in the Wardrobe sub-bullet alongside any positive style notes, not omitted

---

## Output Format

Keep every bullet point as concise as possible. No extra context beyond what is needed to identify and source the resource.

\`\`\`
**Production Resource Summary 📋 [Job Name]**

🪄 **Props**
• [item] — 📋 Verify inventory
(or: • No specific props required)

📦 **Product**
• [product name as written in brief] — 📋 Check available stock
(or: • No physical product shot required)

🏠 **Location**
• [location]

🎭 **Talent**
• [count] x [gender/type], [age range]
  - [Role]: [age range], [any casting notes]
    - Wardrobe: [if specified]
• 1x couple, [age range]
  - 1x male
  - 1x female
• ⚠️ Specific talent requested: [Name] — day rate lookup required (if applicable)

---
🔗 Brief: [Google Doc URL]
\`\`\`

---

## Script

Main script: \`scripts/run.py\`

\`\`\`bash
# Full run
python3 scripts/run.py <google_doc_url> <monday_item_url>

# Dry run (preview without posting)
python3 scripts/run.py <google_doc_url> <monday_item_url> --dry-run
\`\`\`

Or from sandbox_python:
\`\`\`python
import sys
sys.path.insert(0, '/home/user/skills/production-brief-resource-breakdown/scripts')
from run import run_analysis
run_analysis(
    "https://docs.google.com/document/d/DOC_ID/edit",
    "https://tubescience-company.monday.com/boards/7235282519/pulses/ITEM_ID"
)
\`\`\`

---

## Parsing Notes

### Google Docs
Google Docs JSON is deeply nested. Use this recursive extractor to get all plain text:

\`\`\`python
def extract_text_from_body(body):
    parts = []
    def process_elements(elements):
        for el in elements:
            if 'paragraph' in el:
                for run in el['paragraph'].get('elements', []):
                    if 'textRun' in run:
                        parts.append(run['textRun'].get('content', ''))
            elif 'table' in el:
                for row in el['table'].get('tableRows', []):
                    for cell in row.get('tableCells', []):
                        process_elements(cell.get('content', []))
    process_elements(body)
    return ''.join(parts)
\`\`\`

When the doc is large, the result is saved to \`/home/user/.spillover/\`. Load it with:
\`\`\`python
import json
with open('/home/user/.spillover/<filename>.txt') as f:
    data = json.load(f)
text = extract_text_from_body(data['body'])
\`\`\`

### Google Slides
Call \`gslides__get_presentation(presentation_id=PRESENTATION_ID)\`. The result contains a \`slides\` array where each slide has a \`text_content\` field with all text from that slide concatenated. Join all slides in order:
\`\`\`python
text = '\\n'.join(slide.get('text_content', '') for slide in result['slides'])
\`\`\`
Speaker notes are in \`slide['speaker_notes']\` — only use these if a slide's \`text_content\` is empty.

---

## Annotated Examples

See \`references/annotated-examples.md\` for three fully worked examples with correct outputs and key lessons:
- **Example 1** — Ashley Furniture Memorial Day UGC (UGC talking-head; no product on set; wardrobe-only talent notes)
- **Example 2** — Dr. Squatch Dating Show (Full Concept form; green suits as props; multi-SKU physical product; group talent count)
- **Example 3** — Dr. Squatch Product Abundance (no-talent product shoot; multiple SKU lines; table/sink as location features not props)

Also includes a **Brief Template Recognition Guide** covering all three TubeScience brief formats.

---


### PDF Files
PDF briefs are provided as file attachments (not URLs). Use \`PyMuPDF\` (\`fitz\`) to extract text:

\`\`\`python
import fitz  # PyMuPDF — pre-installed in sandbox

doc = fitz.open(pdf_path)
text = '\\n'.join(page.get_text() for page in doc)
\`\`\`

PDFs from TubeScience typically follow the **SHOOT BRIEF (Studio/UGC)** or **Full Concept Production Request Form** template layouts — refer to the Brief Template Recognition Guide in \`references/annotated-examples.md\` to identify the format and extract fields accordingly.

### Google Sheets
Call \`gsheets__read_spreadsheet\` with the spreadsheet ID. Flatten all rows and columns into a single text block for extraction — treat each cell value as a line of brief text.

---

## TubeScience Brief Structure Reference

TubeScience briefs follow this consistent structure:
- **Header table**: Job Name, Job Owner, Client, SKU, Aspect Ratio, Goal Demo
- **Job Goal/Strategy**: Creative archetype, \`[Setting]:\`, \`[Casting]:\` inline fields
- **PRODUCTION NOTES**: CONCEPT, SETTING, TALENTS, CAMERA ANGLES, ADDITIONAL (b-roll list), AD SETS
- **Sales Sequences (SS1–SS5+)**: Dialogue scripts with visual notes per line
- **Headers (H1–H4+)**: Opening hook copy

Key regex patterns:
- Job name: \`Job Name:\\s*(.+)\`
- SKU: \`\\bSKU:\\s*(.+)\`
- Setting block: \`SETTING\\n(.+?)(?:\\n\\n)\`
- Talent block: \`TALENTS?\\n(.*?)(?:\\n\\n|\\nCAMERA)\`
- Casting inline: \`\\[Casting\\]:\\s*(.+)\`
- B-roll list: \`B roll shots?\\n(.*?)(?:\\n\\n|\\nAD SET)\`
- Setting inline: \`\\[Setting\\]:\\s*(.+)\`
- Specific talent: look for named individuals in the TALENT section (e.g., "Would love to get [Name]", "talent: [Name]")

---

# Annotated Examples — Production Brief Resource Breakdown

Each example below shows key brief inputs and the correct output for that brief type.
Use these as ground-truth calibration when analyzing new briefs.

---

## Example 1 — Ashley Furniture Memorial Day UGC (UGC Talking Head)

**Brief type:** UGC Shoot Brief (Studio) — talent films themselves at home  
**Client:** Ashley Furniture  
**Product/SKU field in header:** N/A  
**Talent field:** Aspirational Female/Male 20-30s  
**Location field:** Livingroom, Kitchen, Diningroom  
**Wardrobe field:** Solid bright color tops; no visible logos; no distracting patterns; avoid black, white, neon  
**Key brief signals:**
- No physical product on set — talent talks about the Larce Sectional from memory/experience
- "Talking head style" scripts; talent films at their own home
- Reactions section: blank white wall, pointing-up gestures

**Correct output:**

\`\`\`
Production Resource Summary 📋 Ashley Furniture Memorial Day UGC

🪄 Props
• No specific props required

📦 Product
• No physical product shot required

🏠 Location
• In-home: living room, kitchen, or dining room (avoid wide shots showing full furniture)
• Outside (Optional)
• Blank white wall (reactions section)

🎭 Talent
• 1x female or male, 20s–30s, aspirational
  - Wardrobe: solid bright color tops; no logos, no distracting patterns; avoid black, white, neon
\`\`\`

**Key lessons from this brief:**
- **Product/SKU = N/A in header + UGC talking-head format = no physical product to source.** Output is simply \`• No physical product shot required\` — no inline explanation of why. The reasoning stays in the skill logic, not in the posted update.
- **"Reactions" shots (pointing up, smiling, etc.) against a white wall are NOT props.** They are performance/shot direction only.
- When a brief has multiple location options ("in a home OR outside"), list both and mark the secondary as \`(Optional)\` only if the brief frames it as optional. Here "or outside" is an alternative, not a firm requirement — list it softly.
- Wardrobe always goes as a sub-bullet under the relevant talent entry.

---

## Example 2 — Dr. Squatch Dating Show (White Cyc, Full Concept)

**Brief type:** Full Concept Production Request Form  
**Client:** Dr. Squatch  
**Location:** White cyc studio  
**Talent:** 3x male mid-20s (in green suits, faces hidden) + 1x female mid-20s (street casual, very attractive)  
**Product Info field:** Dr. Squatch Invisible Glide Deodorant (physically applied on camera); Spray Deodorant (sprayed on camera); Cologne (DTC dialogue)  
**Additional Notes:** Green suits for each male talent — numbers pinned onto front

**Correct output:**

\`\`\`
Production Resource Summary 📋 Dr. Squatch Dating Show

🪄 Props
• 3x green morphsuit (full body, with hood) — 🔖 Verify inventory
• 3x number pins (1, 2, 3) for front of suits — 🔖 Verify inventory

📦 Product
• Dr. Squatch Invisible Glide Deodorant — physically applied to green suit on camera; stick tossed to talent — 🔖 Check available stock
• Dr. Squatch Spray Deodorant — sprayed on suit on camera — 🔖 Check available stock
• Dr. Squatch Cologne — referenced in dialogue DTC shots — 🔖 Check available stock

🏠 Location
• White cyc studio

🎭 Talent
• 4x total talent
  - 3x male, mid-20s, physically fit (faces hidden in green suits; improv/TikTok-native delivery)
  - 1x female, mid-20s, very attractive
    - Wardrobe: street casual
\`\`\`

**Key lessons from this brief:**
- **Green suits are props, not wardrobe.** They are costume pieces that production must source and bring to set. They go in Props, not Talent notes. (The number pins are also props.)
- **"Full Concept Production Request Form" is a different brief template** than the TubeScience SHOOT BRIEF template. It has fields named: SHOOT DESCRIPTION, STRATEGIC GOAL, USABILITY, VISUAL REFERENCES, TALENT INFO, PRODUCT INFO, ADDITIONAL NOTES. Map these to the four resource categories accordingly.
- **Distinguish product usage type:** Invisible Glide is physically used on camera (applied to suit, tossed to talent → physical sourcing needed). Spray Deo is physically sprayed on camera. Cologne is mentioned only in DTC dialogue lines — but still include it because it's a SKU being called out as worn/used by talent on camera ("I'm wearing Dr. Squatch cologne").
- **Talent count:** When the brief says "3 men, 1 woman," the group total is 4. List the top-level count and break out sub-bullets for gender/type so it's always clear how many people to book.
- The "Additional Notes" section is a critical supplementary source — it can contain props (green suits, numbers) not mentioned elsewhere.

---

## Example 3 — Dr. Squatch Product Abundance (No-Talent Product Shoot)

**Brief type:** Production Request (product-only, no talent)  
**Client:** Dr. Squatch  
**Shoot Goal:** Footage with abundance of products from different Dr. Squatch SKUs together  
**Products field:** Bar Soap, Deodorant, Cologne, Body Wash (all different scents) — do NOT use any limited edition soaps  
**Location:** House Location (table, outdoors, bathroom sink)  
**Camera:** iPhone  
**Talent:** None mentioned anywhere in brief

**Correct output:**

\`\`\`
Production Resource Summary 📋 Dr. Squatch Product Abundance

🪄 Props
• No specific props required (table and bathroom sink are location features, not sourced props)

📦 Product
• Dr. Squatch Bar Soap — multiple scents, all non-limited-edition varieties — 🔖 Check available stock
• Dr. Squatch Deodorant — multiple scents — 🔖 Check available stock
• Dr. Squatch Cologne — multiple scents — 🔖 Check available stock
• Dr. Squatch Body Wash — multiple scents, all non-limited-edition varieties — 🔖 Check available stock
(Goal: visual abundance/overload of full SKU range together on camera)

🏠 Location
• In-home: table/surface area (table sweep + drop-in shots)
• Outdoors (outdoor pan shots)
• In-home: bathroom near sink (bathroom pan shots)

🎭 Talent
• No talent required (product-only shoot; hand-in-frame as needed)
\`\`\`

**Key lessons from this brief:**
- **No talent = explicitly call it out.** Write \`• No talent required (product-only shoot; hand-in-frame as needed)\` so production knows this is intentional, not an omission.
- **Product abundance briefs list multiple SKU lines, not a single product.** Each distinct product category (Bar Soap, Deodorant, Cologne, Body Wash) gets its own bullet — even if individual scent names are not specified, note "multiple scents."
- **Important product exclusion callouts:** "do NOT use limited edition soaps" is a restriction that affects what to pull from inventory. Flag this parenthetically on the relevant SKU line or as a note.
- **Table, bathroom sink, outdoor surfaces are location features, not props.** They are part of the shooting environment. Only add a surface as a prop if the brief specifically calls for a unique/sourced table or prop surface to be obtained separately.
- **"Production Request" is a third brief template format.** Fields: SP, CLIENT, SHOOT GOAL, Products, VISUAL STYLE REFERENCES / NOTES, LOCATION / DESIGN, VIDEO / SHOT REQUESTS.
- Shot descriptions like "Table Sweep Overload," "Drop-In Abundance," "Outdoors pan" are shot direction, not props or locations requiring separate sourcing beyond what's already listed.

---

## Brief Template Recognition Guide

TubeScience uses at least three distinct brief formats. Recognize them by their header fields:

| Template | Key Fields | Typical Use |
|---|---|---|
| **SHOOT BRIEF (Studio/UGC)** | ACCOUNT, PRODUCT/SKU(s), TALENT, LOCATION, WARDROBE, SHOT LIST, SCRIPT | UGC creator briefs, studio talking-head shoots |
| **Full Concept Production Request Form** | CLIENT, SHOOT DESCRIPTION, STRATEGIC GOAL, USABILITY, VISUAL REFERENCES, TALENT INFO, PRODUCT INFO, ADDITIONAL NOTES, SHOTLIST | Full concept/narrative shoots, multi-talent setups |
| **PRODUCTION REQUEST** | SP, CLIENT, SHOOT GOAL, Products, VISUAL STYLE REFERENCES / NOTES, LOCATION / DESIGN, VIDEO / SHOT REQUESTS | Product-only or B-roll focused shoots |

All three formats map to the same four output categories: Props, Product/SKU, Locations, Talent.`;

function mkItem(o){return{color:'gray',icon:'ti-puzzle',notes:'',updatedAt:Date.now(),...o};}
const DEFAULT_PERSONAL=[
  mkItem({id:'pbab',type:'skill',name:'Production Brief Asset Breakdown',author:'Jarrett',connectedSkills:[],color:'teal',icon:'ti-microphone',description:'Reads a Google Doc or Slides production brief and extracts soundbites (SS1–SS5+ dialogue lines) and B-roll shots. Use before any shoot prep, TMG classification, or Ad Grammar analysis on a brief.',prompt:PBAB,runs:[]}),
  mkItem({id:'pbrb',type:'skill',name:'Production Brief Resource Breakdown',author:'Jarrett',connectedSkills:['pbab'],color:'navy',icon:'ti-package',description:'Reads a production brief and extracts Props, Product/SKU, Locations, and Talent. Use alongside Asset Breakdown to get a complete pre-production picture from a single brief URL.',prompt:PBRB,runs:[]}),
  mkItem({id:'adgrammar',type:'skill',name:'Ad Grammar',author:'Jarrett',connectedSkills:[],color:'purple',icon:'ti-wand',description:'Orchestrates four specialist skills into a unified ad analysis protocol. Entry point for analyzing, critiquing, or building any video ad or creative brief.',prompt:`---
name: ad-grammar
description: "The main brain for video ad and brief analysis. Orchestrates four specialist skills — Testimonial Messaging Groups, Substance vs Style, Visual Archetypes, and Thumbstop Shop — into a unified analysis protocol. Use this skill as the entry point whenever analyzing, critiquing, or building a video ad or creative brief."
icon: clapperboard
color: Black
---

# Ad Grammar

## What This Skill Does

Ad Grammar is the **orchestration layer** for video ad analysis. It does not replace the four specialist skills beneath it — it directs when and how each one is called, what questions each one answers, and how their outputs combine into a single coherent analysis.

When activated, Ad Grammar runs a structured protocol that moves through four analytical lenses in a deliberate sequence, each building on the last. The result is a complete picture of any video ad or creative brief: what it's saying, how it's saying it, whether it earns the viewer's attention in the first three seconds, and whether its creative choices reinforce or undermine its message.

---

## The Four Skills and What They Each Answer

| Skill | Layer | The Question It Answers |
|---|---|---|
| **Thumbstop Shop** | Hook / Style | Does the first 3 seconds stop the right person? What visual category is the hook, and does the messaging reinforce it? |
| **Testimonial Messaging Groups (TMG)** | Substance | What persuasion beats are present? Which TMG categories and sub-categories are covered, and in what order? |
| **Visual Archetypes** | Style | Which of the six visual execution formats is this ad? How does that archetype shape the viewer's experience of the substance? |
| **Substance vs Style (SVS)** | Both | Are the substance and style choices coherent? Where do they amplify each other, and where do they create friction? |

---

## The Analysis Protocol

When analyzing a video ad or creative brief, run through the following sequence. Each step draws on one or more of the specialist skills.

---

### Step 1 — Thumbstop Diagnosis
*Activate: \`thumbstop-shop\`*

Evaluate the opening 3 seconds as a standalone unit.

1. **Visual Category** — Which of the 6 Thumbstop visual categories does the hook belong to? (Complete/Incomplete Action, Talking Head Direct Address, Social Proof Reaction, Text-Dominant Hook, POV/Immersive, Pattern Interrupt)
2. **Hook Messaging** — What does the header text or opening line communicate? Is it a problem, a promise, a curiosity gap, or a social proof claim?
3. **Audience Filter** — Does the hook stop *the right* viewer, or does it cast too wide a net?
4. **Visual–Messaging Coherence** — Do the visual and messaging halves of the hook reinforce each other, or do they pull in different directions?

> **Output:** A thumbstop assessment that names the hook category, evaluates the messaging, and makes a judgment on audience relevance.

---

### Step 2 — Substance Mapping (TMG)
*Activate: \`testimonial-messaging-groups\`*

Map the full ad body (everything after the hook) onto the TMG framework.

1. **Beat-by-Beat Classification** — For each segment of the script or storyboard, assign the TMG category and sub-category (e.g., 🔵 Personal Context → Problems; 🟢 Service Information → CTA).
2. **Coverage Check** — Which TMG categories are present? Which are absent? Is the persuasion arc complete?
3. **Sequence Check** — Are the beats in a logical order that mirrors the viewer's persuasion journey? (Generally: Personal Context first → Service Information → Product Interaction → Results → CTA)
4. **Formula Mapping** — Does the beat sequence map to a named persuasion formula? (PAS+, AIDA, 4Ps, Problem–Proof–Promise, etc.)

> **Output:** A TMG beat map — a labeled breakdown of the ad's substance structure, a coverage verdict, and a formula identification.

---

### Step 3 — Visual Archetype Classification
*Activate: \`visual-archetypes\`*

Classify the ad's visual execution format.

1. **Primary Archetype** — Which of the six Visual Archetypes best describes this ad? (Talking Head, Demonstration, Lifestyle, UGC/Raw, Narrator-Led, Text-Driven)
2. **Archetype Fit** — Does the chosen archetype suit the substance? Some TMG beat combinations perform better in certain archetypes (e.g., heavy Personal Context pairs naturally with UGC/Raw or Talking Head; Demonstration works best for Product Interaction beats).
3. **Archetype Diversity Signal** — If analyzing multiple ads in an account, flag if the same archetype is overrepresented.

> **Output:** Archetype name, a fit assessment against the substance map from Step 2, and any diversity flags.

---

### Step 4 — Substance vs Style Coherence Check
*Activate: \`substance-vs-style\`*

Use SVS as the diagnostic lens across everything identified in Steps 1–3.

1. **Separation** — Explicitly state what is Substance (the claims, arguments, persuasion beats, offer) and what is Style (the visual archetype, hook format, tone, pacing, talent, aesthetic).
2. **Coherence Audit** — For each major style choice, ask: does this amplify or undermine the substance it's carrying?
   - Does the visual archetype reinforce the TMG substance, or create tonal friction?
   - Does the hook style match the emotional register of the persuasion formula?
   - Are there style choices that are doing heavy lifting for weak substance (style masking a messaging gap)?
   - Are there strong substance beats being buried by style choices that don't match their weight?
3. **Verdict** — Rate the overall coherence: **Aligned**, **Minor Friction**, or **Misaligned**. State the primary source of any friction.

> **Output:** A Substance/Style separation table, a coherence audit with specific callouts, and a coherence verdict.

---

## Summary Output Format

After running all four steps, deliver a structured summary:

\`\`\`
AD GRAMMAR ANALYSIS
═══════════════════════════════════════

THUMBSTOP
• Hook Category: [category name]
• Visual: [description]
• Messaging: [header/opening line + judgment]
• Audience Filter: [tight / broad / mismatched]
• V/M Coherence: [aligned / friction + reason]

TMG SUBSTANCE MAP
• Beat 1: [TMG category → sub-category] — "[quote or description]"
• Beat 2: [TMG category → sub-category] — "[quote or description]"
• [continue for all beats]
• Coverage: [categories present] / [categories absent]
• Formula: [PAS+ / AIDA / 4Ps / other]

VISUAL ARCHETYPE
• Primary Archetype: [name]
• Archetype–Substance Fit: [strong / acceptable / weak] + reason
• Diversity Flag: [none / flag if relevant]

SUBSTANCE vs STYLE
• Substance: [one-sentence summary of the core argument]
• Style: [one-sentence summary of executional choices]
• Coherence: [Aligned / Minor Friction / Misaligned]
• Key Callouts:
  - [callout 1]
  - [callout 2]
  - [callout 3]

OVERALL VERDICT
[2–4 sentences synthesizing the full analysis into a single judgment — what this ad does well, what creates friction, and the single highest-leverage change if one were needed]
\`\`\`

---

## Using Ad Grammar on a Brief (vs. a Finished Ad)

When analyzing a **creative brief** rather than a finished ad, the protocol adapts:

| Step | What to Evaluate in a Brief |
|---|---|
| **Thumbstop** | Does the brief specify a hook concept? Evaluate the hook *as written* — is the visual category identifiable? Is the messaging hook strong? |
| **TMG** | Does the brief's script or talking points cover the necessary persuasion beats? Map what's there and flag gaps. |
| **Visual Archetype** | Does the brief specify or imply an archetype? Is that archetype the right fit for the substance? |
| **SVS** | Does the brief conflate substance and style decisions? (A common brief failure: prescribing style without defining substance, or vice versa.) |

> **Brief-specific output:** Add a "Brief Gaps" section after the Summary that lists any missing elements the production team will need to resolve before the ad can be executed.

---

## Activation Instructions

When this skill is activated, read and internalize the following skills before beginning analysis:

1. \`/home/user/skills/thumbstop-shop/SKILL.md\`
2. \`/home/user/skills/testimonial-messaging-groups/SKILL.md\`
3. \`/home/user/skills/visual-archetypes/SKILL.md\`
4. \`/home/user/skills/substance-vs-style/SKILL.md\`

Do not begin analysis until all four have been read. Each skill contains the full framework definitions, sub-categories, examples, and classification rules needed to apply that lens accurately.

**When analyzing a brief (not a finished ad):** also read \`/home/user/skills/production-brief-asset-breakdown/SKILL.md\` and run Production Brief Asset Breakdown on the brief URL *before* beginning the TMG step. Feed the extracted soundbites — not the raw brief text — into the TMG beat-by-beat classification. Feed the B-roll shots into the Visual Archetypes step as evidence of intended visual execution. See the "Integration with Ad Grammar" section of the Production Brief Asset Breakdown skill for the full handoff protocol.

---

## When to Use This Skill

- Analyzing a finished video ad for creative quality or diagnostic purposes
- Reviewing a creative brief before production begins
- Diagnosing underperforming creative in an ad account
- Generating a structured teardown of a competitor ad
- Auditing a batch of ads for substance diversity, archetype diversity, or hook variety
- Giving structured creative feedback to a writer, director, or strategist
`,runs:[]}),
  mkItem({id:'mosaic',type:'skill',name:'Mosaic Video Editor',author:'Jarrett',connectedSkills:[],color:'blue',icon:'ti-video',description:'Programmatic interface to the Mosaic AI video editing API. Triggers agent runs, configures tiles, manages assets, and polls run status.',prompt:`---
name: mosaic-video-editor
description: Programmatic interface to the Mosaic AI video editing API. Use to trigger agent runs, configure tiles, manage assets, and poll run status. Pairs with the testimonial-messaging-groups skill to generate TMG-guided Rough Cut prompts.
icon: video
color: Purple
---

# Mosaic Video Editor

## Overview

Mosaic (https://api.mosaic.so) is an AI video editing platform that lets you programmatically build and run video editing workflows.

**Key concepts:**
- **Agents** — saved workflow templates, each containing an ordered graph of tiles
- **Agent Runs** — a single execution of an Agent against one or more video files
- **Tiles / Node Types** — individual processing nodes (Rough Cut, Captions, Color Correction, etc.)
- **Webhooks** — optional \`callback_url\` on a run; Mosaic POSTs results when the run completes
- **Asset Management** — three-step S3 presigned-URL flow to upload source footage

**Base URL:** \`https://api.mosaic.so\`

**Authentication:** Every request requires:
\`\`\`
Authorization: Bearer $MOSAIC_API_KEY
Content-Type: application/json
\`\`\`

---

## Authentication

Store the API key in Gumloop Secrets as \`MOSAIC_API_KEY\`. Keys begin with \`mk_\`.

**Test connectivity:**
\`\`\`python
import os, requests

BASE = "https://api.mosaic.so"
HEADERS = {"Authorization": f"Bearer {os.environ['MOSAIC_API_KEY']}"}

r = requests.get(f"{BASE}/whoami", headers=HEADERS)
r.raise_for_status()
print(r.json())   # {"user_id": "...", "email": "...", "org": "..."}
\`\`\`

A \`200\` response confirms the key is valid. A \`401\` means the key is missing or malformed.

---

## Core Concepts

| Concept | Description |
|---|---|
| **Agent** | A named, reusable workflow. Contains an ordered tile graph. Created via \`POST /agent/create\`, updated via \`POST /agent/update\`. |
| **Agent Run** | One execution of an Agent. Triggered via \`POST /agent/{agent_id}/run\`. Returns a \`run_id\` to poll. |
| **Tile / Node Type** | A processing step (e.g., Rough Cut, Captions). Each has a fixed \`node_id\` UUID and a set of configurable params. |
| **Webhook / callback_url** | Optional URL included in the run request body. Mosaic sends a POST when the run reaches a terminal state. |
| **Asset Management** | Source footage must be uploaded via a three-step presigned-URL flow before referencing in a run. |

---

## Available Tiles

Known tile Node IDs (use \`GET /agent-nodes\` to fetch the full canonical list):

| Tile Name | Node ID | Key Parameters |
|---|---|---|
| **Rough Cut** | \`e6098dd4-4a6e-470f-981e-2618c11eee21\` | \`prompt\` (required string), \`model_tier\` (\`fast\`\\|\`pro\`), \`combine_input_renders\` (boolean) |
| **Clips** | \`bcc5cb04-76b7-48e9-a344-0e8a29c19be0\` | \`prompt\` (optional string), \`num_clips\` (int 1–20), \`target_duration\` (seconds, float) |
| **Captions** | *(fetch via \`GET /agent-nodes\`)* | Style, font, color, position options |
| **Reframe** | *(fetch via \`GET /agent-nodes\`)* | Aspect ratio, focus subject, padding |
| **AI B-Roll** | *(fetch via \`GET /agent-nodes\`)* | Prompt, source library, duration per clip |
| **AI Music** | *(fetch via \`GET /agent-nodes\`)* | Genre, mood, duration, fade settings |
| **AI Voiceover** | *(fetch via \`GET /agent-nodes\`)* | Script, voice ID, speed |
| **Silence Removal** | *(fetch via \`GET /agent-nodes\`)* | Threshold (dB), padding (ms) |
| **Color Correction** | *(fetch via \`GET /agent-nodes\`)* | Preset, LUT path, exposure/contrast |
| **Watermark** | *(fetch via \`GET /agent-nodes\`)* | Image URL, position, opacity, size |
| **Montage** | *(fetch via \`GET /agent-nodes\`)* | Pacing, transition style, beat-sync |
| **Intro** | *(fetch via \`GET /agent-nodes\`)* | Template ID, duration, overlay text |
| **Outro** | *(fetch via \`GET /agent-nodes\`)* | Template ID, duration, CTA text |
| **Destination** | *(fetch via \`GET /agent-nodes\`)* | Output format, resolution, bitrate |
| **Voice** | *(fetch via \`GET /agent-nodes\`)* | Voice clone ID, enhancement settings |
| **Motion Graphics** | *(fetch via \`GET /agent-nodes\`)* | Template ID, data bindings |

> **Tip:** Run \`GET /agent-nodes\` once and cache the response. It returns every node type with its full parameter schema.

---

## Key API Endpoints

### Identity

| Method | Path | Purpose |
|---|---|---|
| \`GET\` | \`/whoami\` | Verify API key; returns user/org info |

### Agents

| Method | Path | Purpose |
|---|---|---|
| \`GET\` | \`/agents\` | List all agents in the account |
| \`GET\` | \`/agent/{agent_id}\` | Get a single agent with its full tile graph |
| \`POST\` | \`/agent/create\` | Create a new agent |
| \`POST\` | \`/agent/update\` | Update an existing agent's name, tiles, or config |

### Running Agents

| Method | Path | Purpose |
|---|---|---|
| \`POST\` | \`/agent/{agent_id}/run\` | Trigger a run; returns \`{"run_id": "..."}\` |
| \`GET\` | \`/agent_run/{run_id}\` | Poll run status (\`queued\`, \`running\`, \`completed\`, \`failed\`) |
| \`GET\` | \`/agent_run/{run_id}/nodes\` | Per-tile progress and output for a run |
| \`POST\` | \`/agent_run/{run_id}/cancel\` | Cancel an in-progress run |

**Example run request body:**
\`\`\`json
{
  "video_urls": ["https://storage.example.com/footage.mp4"],
  "update_params": {
    "e6098dd4-4a6e-470f-981e-2618c11eee21": {
      "prompt": "Hook: fear of missing gains. Problem: inconsistent workouts. Solution: 90-day system. CTA: link in bio.",
      "model_tier": "pro"
    }
  },
  "callback_url": "https://hooks.example.com/mosaic-done"
}
\`\`\`

\`update_params\` keys are tile Node IDs. Values are the param overrides for that tile in this run only — the agent's saved config is not mutated.

### Node Discovery

| Method | Path | Purpose |
|---|---|---|
| \`GET\` | \`/agent-nodes\` | List every available node type with full parameter schemas |

### Asset Upload (3-Step Flow)

1. **Get presigned URL:**
   \`\`\`
   POST /assets/get-upload-url
   Body: {"filename": "footage.mp4", "content_type": "video/mp4"}
   Response: {"upload_url": "https://s3...", "asset_id": "ast_..."}
   \`\`\`

2. **Upload to S3:**
   \`\`\`
   PUT {upload_url}
   Headers: Content-Type: video/mp4
   Body: <raw file bytes>
   \`\`\`

3. **Finalize asset:**
   \`\`\`
   POST /assets/finalize
   Body: {"asset_id": "ast_..."}
   Response: {"asset_url": "https://cdn.mosaic.so/..."}
   \`\`\`

Use \`asset_url\` in \`video_urls\` when triggering a run.

---

## Workflow Patterns

### a. TMG-Guided Rough Cut

Use this pattern to inject a Testimonial Messaging Group narrative into the Rough Cut tile prompt.

\`\`\`
1. Read brief from Google Drive (gdrive / gdocs skill)
2. Extract formula type (PAS+, AIDA, 4P's) and hook/problem/solution/CTA from brief
3. Use testimonial-messaging-groups skill to select matching TMG and generate prompt string
4. POST /agent/{agent_id}/run with update_params targeting the Rough Cut node ID:
     "e6098dd4-4a6e-470f-981e-2618c11eee21": {"prompt": <generated_prompt>, "model_tier": "pro"}
5. Poll GET /agent_run/{run_id} every 15s until status == "completed"
6. Return output video URL from completed run
\`\`\`

**Rough Cut prompt format (TMG-derived):**
\`\`\`
Hook: {hook_statement}
Problem: {problem_statement}
Solution: {solution_statement}
Social Proof: {testimonial_quote}
CTA: {call_to_action}
Tone: {tone_descriptor}
\`\`\`

---

### b. Footage Sorting & TMG Tagging

Use this pattern to classify raw clips and label them by messaging group.

\`\`\`
1. Upload footage via 3-step asset flow (or pass GDrive URLs directly)
2. POST /agent/{agent_id}/run using a Clips-only agent
   update_params: {"bcc5cb04-76b7-48e9-a344-0e8a29c19be0": {"num_clips": 20}}
3. GET /agent_run/{run_id}/nodes → extract per-clip metadata (transcript, visual tags)
4. For each clip: match transcript against TMG database using testimonial-messaging-groups skill
5. Write labeled rows to Google Sheet (gsheets skill):
   Columns: clip_url | duration | tmg_name | formula_match | hook_score | notes
\`\`\`

---

### c. Brief → Auto-Configure Agent

Use this pattern to create or update a Mosaic agent directly from a creative brief.

\`\`\`
1. Read brief from Google Drive
2. Detect video formula: PAS+, AIDA, 4P's (look for hook/problem/agitate/solution/CTA structure)
3. Map formula to tile sequence:
   - PAS+:  Rough Cut → Clips → Captions → Color Correction → Destination
   - AIDA:  Rough Cut → AI B-Roll → Captions → Outro → Destination
   - 4P's:  Rough Cut → Montage → AI Music → Captions → Destination
4. POST /agent/create with tile graph for new agent, OR
   POST /agent/update to reconfigure existing agent
5. Inject brief-derived Rough Cut prompt via update_params at run time (Pattern a)
\`\`\`

---

## Error Handling

| HTTP Status | Cause | Resolution |
|---|---|---|
| \`400 Bad Request\` | Malformed JSON, missing required field, invalid param value | Check request body against schema; validate \`node_id\` UUIDs |
| \`401 Unauthorized\` | Missing or invalid \`Authorization\` header | Confirm \`MOSAIC_API_KEY\` secret is set and starts with \`mk_\` |
| \`403 Forbidden\` | Key lacks permission for the requested resource | Check org-level permissions; contact Mosaic support |
| \`404 Not Found\` | Agent ID or Run ID does not exist | Re-fetch agent list; confirm IDs are correct |
| \`429 Too Many Requests\` | Rate limit exceeded | Back off with exponential retry (start at 5s) |
| \`500 Internal Server Error\` | Mosaic-side error | Retry once after 30s; if persistent, cancel run and re-trigger |

---

## Usage Notes

### Calling the API from sandbox_python

\`\`\`python
import os
import time
import requests

BASE = "https://api.mosaic.so"
HEADERS = {
    "Authorization": f"Bearer {os.environ['MOSAIC_API_KEY']}",
    "Content-Type": "application/json",
}

# --- Trigger a run ---
AGENT_ID = "your-agent-id"
payload = {
    "video_urls": ["https://your-cdn.com/footage.mp4"],
    "update_params": {
        "e6098dd4-4a6e-470f-981e-2618c11eee21": {
            "prompt": "Hook: pain point. Problem: root cause. Solution: your product. CTA: shop now.",
            "model_tier": "pro",
        }
    },
}

run = requests.post(f"{BASE}/agent/{AGENT_ID}/run", json=payload, headers=HEADERS)
run.raise_for_status()
run_id = run.json()["run_id"]
print(f"Run started: {run_id}")

# --- Poll until complete ---
for _ in range(40):   # max ~10 minutes at 15s intervals
    time.sleep(15)
    status_r = requests.get(f"{BASE}/agent_run/{run_id}", headers=HEADERS)
    status_r.raise_for_status()
    data = status_r.json()
    state = data.get("status")
    print(f"  status: {state}")
    if state in ("completed", "failed"):
        break

if state == "completed":
    output_url = data.get("output_url") or data.get("video_url")
    print(f"Output video: {output_url}")
else:
    print(f"Run did not complete: {data}")
\`\`\`

### Environment variable setup
Add \`MOSAIC_API_KEY\` in Gumloop → Settings → Secrets. The sandbox injects it automatically at runtime. Never hardcode the key or print it.

### Node ID lookup helper
\`\`\`python
nodes_r = requests.get(f"{BASE}/agent-nodes", headers=HEADERS)
nodes_r.raise_for_status()
for node in nodes_r.json():
    print(node["id"], node["name"])
\`\`\`
Run this once to populate the tile table above with any IDs currently marked as "unknown".
`,runs:[]}),
  mkItem({id:'salescomp',type:'skill',name:'Sales Components Footage',author:'Jarrett',connectedSkills:[],color:'teal',icon:'ti-camera',description:'Defines the Sales Components framework — a shot-level visual classification system identifying Problem Shots, Product Interaction Shots, and Results & Desirable Outcomes.',prompt:`---
name: sales-components-footage
description: Defines the Sales Components framework — a shot-level visual classification system that identifies what type of footage is on screen at any moment in an ad. Three components (Problem Shots, Product Interaction Shots, Results & Desirable Outcomes) and five camera angles (POV, Selfie, Wide/Medium, Close Up/ECU, Top Down) form the complete shot-level vocabulary. Bridges TMG (what is said) and Visual Archetypes (how the ad is executed). Use when classifying individual shots in an ad, building shot lists, briefing production, or performing shot-level SVS analysis.
icon: square
color: Purple
---

# Sales Components — Footage

---

## Overview

Sales Components is the **shot-level** classification layer of the TubeScience creative framework. Where TMG classifies what an ad *says* and Visual Archetypes classifies how an ad *looks and feels as a whole*, Sales Components classifies what is *shown* in any individual shot or sequence — the footage itself, independent of the words spoken over it.

> **Core definition:** Sales Components answer the question *"What is the camera showing right now, and what persuasive job is that footage doing?"*

This is the footage-side mirror of TMG. They were developed as parallel systems — one for messaging, one for visuals — because in any given ad, what is said and what is shown are independent editorial decisions. A talent can *say* "I had a terrible problem" while the camera *shows* a Product Beauty shot — that mismatch is a diagnostic finding. Sales Components gives you the vocabulary to catch it.

---

## Where Sales Components Fits in the Full Framework

\`\`\`
AD LEVEL      →  Visual Archetype   (Confessional, Skit, Sitcom, etc.)
SECTION LEVEL →  Sales Component    (Problem Shot, Product Interaction, Results)
SHOT LEVEL    →  Camera Angle       (Selfie, POV, Wide, Close Up, Top Down)
QUALITY LEVEL →  Relatable ◄──────────────────────► Aspirational
\`\`\`

| Layer | Skill | Question Answered |
|---|---|---|
| **Messaging** | TMG | What is being *said*? |
| **Footage** | Sales Components ← *this skill* | What is being *shown*? |
| **Execution format** | Visual Archetypes | How is the whole ad *structured and executed*? |
| **Quality signal** | Visual Archetypes → R/A Spectrum | Where does each shot sit on Relatable → Aspirational? |
| **Diagnostic lens** | Substance vs Style | Is the Style serving the Substance? |

---

## The Three Sales Components

---

### 1. 🔴 Problem Shots

> *"Problem shots are used to convey problems that the brand can easily solve. These problems should be visceral, painful and evocative, while being mass market and easy to understand. Seeing an image of the issue should cause consumers to think: 'If you can solve this problem for me, I'll buy this product.' More extreme images are often more effective."*

**The job of a Problem Shot:** Activate recognition. The viewer needs to see their own pain reflected on screen before they'll care about a solution. A Problem Shot that doesn't feel real or personal doesn't open the door — the rest of the ad is selling to a closed room.

**Key principle:** Problem Shots should be visceral enough to be felt, mass-market enough to be widely recognized, and simple enough to be understood in under two seconds. Subtlety is the enemy of an effective Problem Shot.

---

#### Types of Problem Shots

**1. Realistic Problems**

Direct depictions of the actual problem — nothing metaphorical, nothing abstract. The viewer sees the problem as it exists in the real world.

| Subtype | Definition | Example |
|---|---|---|
| **Direct Problems** | Footage of the actual, literal problem the product solves | Close-up of a scratched non-stick pan — the direct problem that a better pan solves |
| **Indirect Problems** | Footage of the *emotional or social consequences* of the problem — what having the problem feels like in life | A person looking embarrassed or hiding their face — the indirect consequence of razor bumps, not the bumps themselves |

> **Note:** Indirect Problem Shots typically accompany the **Agitate** beat in the messaging sequence (TMG: Personal Context → Agitate). The direct problem establishes *what's wrong*; the indirect problem deepens *why it matters*.

---

**2. Visual Metaphors of Real Problems**

Using unrelated objects or imagery to *represent* a real problem rather than showing it directly. Effective when the actual problem is difficult to film, too graphic, or benefits from creative amplification.

- A straw broom's dry, brittle bristles → dry, damaged hair
- A credit card on fire → financial stress or wasted money
- Someone smashing a TV with a baseball bat → frustration with cable bills or bad content

**Why metaphors work:** They're often more visceral than realistic footage because they're surprising and immediate. The viewer's brain makes the connection in an instant — and that active inference makes the problem feel more urgent, not less.

---

**3. Discrediting Alternatives**

Footage showing competing products, previous solutions, or old methods failing, being inferior, or causing harm — establishing that alternatives are inadequate before the product is introduced.

- Showing a cheap pan scratching immediately after purchase
- Showing a stack of pill bottles next to a single supplement product
- Showing a messy, complicated process that the product simplifies

**TMG alignment:** Maps directly to **Personal Context → Discredit**. The footage is making the same argument as the messaging — "everything else failed, that's why this matters."

---

### 2. 🟡 Product Interaction Shots

> *"Product Interaction Shots show the product in action. These shots are meant to highlight the unique features of the product or service, make the product look high quality and desirable, while showing the consumer exactly how to use the product."*

**The job of a Product Interaction Shot:** Bridge the gap between problem and result. The viewer now understands the problem — they need to understand *what the product actually is, how it works, and why it's the right solution.* Product Interaction Shots are the visual equivalent of Service Information and Product Interaction in TMG.

---

#### Types of Product Interaction Shots

**1. Product Demonstration**

The product being used — actively, in real time, by a real person.

| Subtype | Definition | Notes |
|---|---|---|
| **Usage Shots** | Talent using the product as intended | The most fundamental shot type — showing the product working |
| **Reaction Shots** | Talent responding emotionally to the product in the moment | Most effective when either *genuinely authentic* or *deliberately over-the-top* — the middle ground (polite, mild approval) lands flat |
| **Tactile Shots** | Close-up footage emphasizing the sensory experience — texture, smell, softness, pour, etc. | Particularly powerful for food, skincare, apparel, and home goods where the physical experience is part of the value |
| **Product Features** | Shots specifically showing how a unique feature works | Either demonstrated physically or narrated by talent while the feature is visible on screen |

> **On Reaction Shots specifically:** The two poles — *authentic* and *over-the-top* — both work because they're each internally coherent. Authentic reactions are believable because they're understated. Over-the-top reactions are understood as theatrical and don't trigger skepticism. The middle ground — slightly performed, slightly enthusiastic — reads as fake without the permission of theatrics.

---

**2. Product Beauty**

The product as a visual object — staged, lit, and framed to be desirable in its own right. No talent, no usage — just the product and its environment.

| Subtype | Definition | Example |
|---|---|---|
| **Natural Environment** | Product placed in the environment where it's actually used | Shampoo bottle in the shower; protein powder on a kitchen counter next to a blender |
| **Metaphorical Environment** | Product placed in an environment that *represents* a brand attribute | A natural-ingredients skincare product photographed outdoors in soft green light — nature stands in for "clean" |

**Spectrum note:** Product Beauty shots are almost always **Aspirational** — they exist to make the product look desirable, not authentic. The Natural Environment subtype can edge toward center on the spectrum when the environment itself is Relatable (a real, lived-in bathroom vs. a styled set), but the intent is always elevation.

---

**3. Unboxing**

The product arriving — the moment before regular use, when it's still new and the viewer experiences it for the first time alongside the talent.

| Subtype | Definition | Notes |
|---|---|---|
| **First Impressions** | Talent's genuine (or performed) first reaction to seeing and holding the product | Should evoke curiosity and the desire to know more — this shot is a bridge that pulls the viewer into product interest |
| **In-Hand** | Talent holding the product toward camera, showing packaging details | Creates the sense that the viewer is physically holding it — effective for premium packaging or products where the physical form is a selling point |

**Why Unboxing works:** It exploits the novelty response. Even a viewer who has heard of the product hasn't *held* it — the Unboxing shot closes that gap vicariously and activates curiosity at a moment when the viewer's attention is high.

---

### 3. 🟢 Results & Desirable Outcomes

> *"Results & Desirable Outcome Shots highlight how this product or service will improve the consumer's life by showing the direct results and desirable situations that come from using the product."*

**The job of a Results Shot:** Close the persuasion loop. The viewer has seen the problem, they've seen the product — now they need to see the life they get on the other side. Results Shots are the visual proof and the aspirational carrot simultaneously.

**Key distinction from Problem Shots:** Problem Shots move the viewer *toward* the product by amplifying pain. Results Shots move them *toward* the product by amplifying desire. Both are pulling in the same direction from opposite ends.

---

#### Types of Results Shots

**1. Real Results**

Direct or indirect evidence that the product works.

| Subtype | Definition | Example |
|---|---|---|
| **Direct Results** | Visible, tangible evidence of the product's effect | Before & after skin photos; a clean, unscratched pan; a body transformation |
| **Indirect Results** | Footage of the *life improvements* that come from the product's results — not the result itself, but what having that result enables | A woman laughing on the phone (confidence from clear skin); a sunlit selfie outdoors (energy from a supplement); friends gathered around a meal (connection from a meal kit) |

> **Indirect Results are often more powerful than Direct Results** because they sell the *feeling* of the outcome, not just the outcome. The viewer doesn't just want clear skin — they want the version of life where they have clear skin. Indirect Results shots show them that life.

---

**2. Visual Metaphors of Real Results**

Using objects or imagery to *represent* a desirable result rather than showing it directly — the results-side mirror of Visual Metaphor Problem Shots.

- A wilting plant reviving in time-lapse → energy returning
- A key fitting perfectly into a lock → a solution finally working
- A sunrise through clean windows → clarity, renewal, a fresh start

**Spectrum note:** Visual Metaphor Results shots tend to sit in the **Aspirational** direction — they're crafted, intentional, often cinematic. They're the opposite of the raw documentation of a Direct Result.

---

## Camera Angles

Camera angles are the **technical sub-layer** of every Sales Component shot. Every Problem Shot, Product Interaction Shot, and Results Shot is also shot from a specific angle — and that angle carries its own signal about where the shot sits on the Relatable/Aspirational spectrum and what relationship it creates between the viewer and the subject.

---

### The Five Camera Angles

---

#### 1. 📱 POV (Point of View)

> *"Shots where we're seeing the Point of View of the talent — meant to focus the viewer's attention on a specific action or subject."*

The camera takes the physical perspective of the talent. The viewer is *in the body* of the character, not observing them.

| Variant | Description | Spectrum Position |
|---|---|---|
| **Handheld POV** | Camera held by talent, natural shake present — we are the character | Strongly Relatable — the instability and intimacy signal authenticity |
| **Static POV** | Camera on tripod at the talent's eye level, no movement — native tutorial/influencer vibe | Center to Relatable — stable and clean but still subjective |

**Best used for:** Product Interaction shots where the action itself is what matters (applying a product, cooking, assembling something) — the POV removes the distance between viewer and action.

---

#### 2. 🤳 Selfie

> *"Talent holding the phone while looking into the front camera, as if talking to a friend on FaceTime. Meant to connect the viewer with the character in hopes of making them seem more relatable and trustworthy."*

The talent is both camera operator and subject. They are looking directly into the lens — which means they are looking directly at the viewer.

**Spectrum position:** Strongly Relatable. The selfie angle carries an implicit social context — this is how people share personal moments with people they know. It signals informality, directness, and intimacy.

**Best used for:** Confessional delivery, Reaction Shots, Indirect Results (the "I can't believe how I feel now" moment), and any shot where the goal is maximum viewer-to-talent connection.

**Note:** The Selfie angle is the signature shot of the Confessional archetype. A Confessional delivered on a Selfie angle with Relatable production and Relatable talent is the most trust-maximizing combination in the toolkit.

---

#### 3. 🎥 Wide / Medium

> *"Shots where the subject's framing ranges from waist up to full body — meant to capture a larger action or show more of the space."*

The observer angle. The viewer is watching the talent from outside — they're no longer *in* the scene, they're watching it.

| Variant | Description | Spectrum Position |
|---|---|---|
| **Static Wide** | Tripod, locked-off — native influencer vibe, tutorial energy, as if filming alone | Relatable-Center — clean but clearly self-shot |
| **Handheld Wide** | Another person is holding the camera — signals crew, presence, a world beyond the frame | Center — implies production without going full cinematic |
| **Sliding Wide** | Camera moves smoothly along a single axis (glide/dolly) — floating, elevated aesthetic | Aspirational — the mechanical precision of the movement signals craft |

**Best used for:** Day in the Life sequences (showing the space and context), Sitcom scenes (the ensemble needs to be in frame), Results shots showing the full person or full environment.

---

#### 4. 🔍 Close Up / ECU (Extreme Close Up)

> *"Shots where we're really close up to the product or subject — meant to highlight a detail or feature, such as texture, quality, etc."*

The intimacy angle. At this distance, everything becomes tactile — the viewer can almost feel what they're seeing.

**Spectrum position:** Variable — but Close Ups are the primary tool for **Aspirational product elevation**. A well-lit close up of a product's texture, pour, or surface detail is one of the highest-impact Aspirational shots in the toolkit. Conversely, an extreme close-up of a Direct Problem (cracked skin, scratched pan) is one of the most visceral Relatable problem shots.

**Best used for:**
- **Problem Shots:** Direct Problems where the damage or issue needs to be undeniable up close
- **Tactile Shots:** The sensory experience of a product (the pour, the texture, the application)
- **Product Beauty:** Hero product shots where detail = quality signal
- **Direct Results:** Before/after close ups where the transformation is visible at the surface level

---

#### 5. ⬆️ Top Down

An overhead angle looking straight down at the subject — the bird's eye or flat-lay perspective.

**Spectrum position:** Aspirational-leaning. Top-down shots require deliberate setup — a talent can't hold this angle themselves. The framing signals intentionality and craft.

**Best used for:**
- Food/ingredient shots (flat-lay ingredient spreads, product on a styled surface)
- Product Beauty in natural environment (product placed in context, shot from above)
- Process shots where the full workspace needs to be visible (meal prep, skincare routine steps)
- Any shot where the product-to-environment relationship is the story

---

## The TMG Mirror

Sales Components and TMG are parallel classification systems — one for footage, one for messaging. They should align within a well-constructed ad, but diagnosing a mismatch is one of the highest-value applications of this framework.

| TMG Category | TMG Subcategory | Sales Component Equivalent | Notes |
|---|---|---|---|
| 🔵 Personal Context | Problems | Problem Shots → Direct Problems | Direct 1:1 match |
| 🔵 Personal Context | Agitate | Problem Shots → Indirect Problems | Agitate messaging pairs with the emotional/social consequence footage |
| 🔵 Personal Context | Discredit | Problem Shots → Discrediting Alternatives | Direct 1:1 match |
| 🟢 Service Information | Brand intro, How it works, CTA | Product Interaction → Features / Product Beauty | Service Info is messaging-heavy; the footage is usually product-focused |
| 🟡 Product Interaction | Product experience | Product Interaction → Demonstration (Usage, Reaction, Tactile) | Near-direct match |
| 🔴 Results | Transformation, Testimonial | Results & Desirable Outcomes → Direct & Indirect Results | Direct 1:1 match |

**The gap:** Service Information (the TMG category covering brand intro, mechanism explanations, credibility, and CTA) has no dedicated Sales Component equivalent because it is fundamentally a *talking* layer — it requires talent narration and is not primarily communicated through footage. This is why Service Information leans most heavily on the Confessional and Interview archetypes: those formats are built around a person explaining, not showing.

---

## Sales Components × Relatable / Aspirational

Every Sales Component shot also lives somewhere on the Relatable/Aspirational spectrum. These tendencies are defaults, not rules:

| Sales Component | Natural Spectrum Position | Why |
|---|---|---|
| **Problem Shots — Direct** | Relatable | Raw, real evidence of a problem — polish undermines believability |
| **Problem Shots — Indirect** | Relatable-Center | Emotional consequence footage can be slightly more composed without losing trust |
| **Problem Shots — Metaphorical** | Center-Aspirational | Metaphors are constructed — they signal creative intent rather than documentation |
| **Problem Shots — Discrediting** | Center | Showing competing products failing can be raw or polished depending on the tone |
| **Product Interaction — Usage** | Relatable-Center | Should still feel real and accessible, not overly staged |
| **Product Interaction — Reaction** | Full spectrum | Authentic reactions are Relatable; over-the-top reactions are theatrical and Aspirational-adjacent |
| **Product Interaction — Tactile** | Aspirational | Macro/sensory shots require deliberate setup — they signal craft |
| **Product Beauty — Natural** | Center-Aspirational | The product is being elevated even in a real environment |
| **Product Beauty — Metaphorical** | Aspirational | Fully constructed — environment, lighting, and placement are all intentional |
| **Unboxing** | Relatable-Center | The "arrival" moment should feel real and accessible |
| **Results — Direct** | Relatable | Before/after evidence needs to feel unmanipulated to be credible |
| **Results — Indirect** | Center-Aspirational | Lifestyle footage showing the life you could have — aspirational by definition |
| **Results — Metaphorical** | Aspirational | Constructed imagery representing a desirable state |

---

## Camera Angle × Spectrum

| Camera Angle | Spectrum Tendency | Why |
|---|---|---|
| **Selfie** | Strongly Relatable | Personal, direct, socially native — the format of real moments |
| **POV Handheld** | Strongly Relatable | Instability and subjectivity signal documentation over production |
| **POV Static** | Center-Relatable | Clean but still first-person — controlled without being cinematic |
| **Wide Static** | Center-Relatable | Self-shot native vibe — influencer, tutorial energy |
| **Wide Handheld** | Center | Implies another person in the room — more produced but still grounded |
| **Wide Sliding** | Aspirational | The smooth mechanical motion signals a rig, a crew, an elevated shoot |
| **Close Up / ECU** | Variable — depends on subject | Raw Close Up of a problem = Relatable; Lit hero Close Up of product = Aspirational |
| **Top Down** | Aspirational | Requires deliberate setup — signals craft and intentionality |

---

## Using Sales Components in Analysis

### The Shot-Level Analysis Workflow

For any shot in an ad, ask three questions:

1. **What Sales Component is this?**
   - Problem Shot (Direct, Indirect, Metaphorical, Discrediting)?
   - Product Interaction (Usage, Reaction, Tactile, Features, Beauty, Unboxing)?
   - Results (Direct, Indirect, Metaphorical)?

2. **What Camera Angle is it shot on?**
   - POV, Selfie, Wide/Medium, Close Up, Top Down?
   - What variant? (Handheld, Static, Sliding)

3. **Where does it sit on the Relatable/Aspirational spectrum?**
   - What production signals place it there?
   - Is that placement serving the Sales Component's job?

### The Mismatch Diagnostic

The highest-value use of Sales Components analysis is catching **TMG ↔ Sales Component mismatches**:

- Talent is *saying* "I had a serious problem" (TMG: Personal Context → Problems) but the footage *shows* a polished Product Beauty shot — the Aspirational visual undercuts the Relatable claim
- Talent is *saying* "the results were incredible" (TMG: Results) but the footage shows a medium-production lifestyle shot that doesn't visually prove anything — the words are doing all the work and the footage is coasting
- An ad opens on a Product Interaction shot before any Problem Shot has been established — the viewer doesn't yet have a reason to care about seeing the product work

These mismatches are SVS findings at the shot level: the Style (what's shown) is not serving the Substance (what's being said).

### Shot List Application

When building a shot list from a production brief, Sales Components provide the vocabulary for naming what each shot needs to accomplish:

> *"We need: (1) a Direct Problem Shot on a Selfie angle — raw, Relatable; (2) a Tactile Usage Shot on Close Up — show the texture; (3) an Indirect Results Shot on Wide Handheld — she's laughing with friends, sunlit, outdoors."*

This gives production a precise brief that covers not just *what to film* but *what job that footage needs to do* and *where it should sit on the quality spectrum*.
`,runs:[]}),
  mkItem({id:'shotlist',type:'skill',name:'Shot List Creator',author:'Jarrett',connectedSkills:[],color:'navy',icon:'ti-list',description:'Generates a structured scene-by-scene shot list from a TubeScience production brief. Produces a table of shots organized by location, shot type, subject, and action.',prompt:`---
name: shot-list-creator
description: "Generates a structured, scene-by-scene shot list from a TubeScience production brief. Reads Sales Sequences, Headers, and PRODUCTION NOTES to produce a table of shots organized by location, including shot type, subject, action, and which ad sequence each shot belongs to. Use after reading the brief with production-brief-resource-breakdown."
icon: square
color: Purple
---

# Shot List Creator

## Overview

This skill generates a concrete, scene-by-scene shot list from a TubeScience production brief. It parses Sales Sequences (SS1–SS5+), Headers (H1–H4+), and PRODUCTION NOTES to produce an ordered table of shots grouped by location, each labeled with shot type, subject, action or dialogue note, and the ad sequence it serves. Use this skill after \`production-brief-resource-breakdown\` has identified the brief's Props, SKU, Locations, and Talent — the shot list is the next step that turns those resources into an actionable shooting plan.

---

## Workflow

### Step 1 — Read the Brief

Open the Google Doc (or Slides) for the job using the same parsing approach as \`production-brief-resource-breakdown\`:

- Use \`gdocs__get_document_content\` (or \`gdrive__get_file\` for Slides) to pull the full text.
- Locate the **header table** at the top: Job Name, Job Owner, Client, SKU, Aspect Ratio, Goal Demo.
- Locate the **Job Goal/Strategy** block: note the Creative Archetype, \`[Setting]:\` value, and \`[Casting]:\` value.
- Locate the **PRODUCTION NOTES** block and extract:
  - \`CONCEPT\` — the overarching creative idea
  - \`SETTING\` — primary and secondary shoot locations
  - \`TALENTS\` — talent descriptions (age range, gender, role)
  - \`CAMERA ANGLES\` — any mandated angles or rig notes
  - \`ADDITIONAL\` — the b-roll list (these become B-Roll shots)
  - \`AD SETS\` — which platform/placement this ad runs on

### Step 2 — Extract Sales Sequences and Headers

Scan the document for all labeled sections:

- **Sales Sequences**: blocks labeled \`SS1\`, \`SS2\`, … \`SS5\` (or more). Each SS is a dialogue-heavy script block.
- **Headers**: blocks labeled \`H1\`, \`H2\`, \`H3\`, \`H4\` (or more). Each Header is a short opening hook — a single line of copy or a visual direction that starts the ad.

Collect them in order. Note the label (e.g. \`SS2\`, \`H3\`) for every line — this becomes the **Ad Sequence** column in the output.

### Step 3 — Parse Each Block Line by Line

For each Sales Sequence and Header block, iterate line by line and classify each line as one of:

| Line Type | How to Identify |
|---|---|
| **DIALOGUE** | Plain text spoken by talent — treat as OC or VO depending on context |
| **VISUAL NOTE** | Italicized text, text in \`[brackets]\`, or text in \`(parentheses)\` — a production direction, not spoken |
| **PRODUCT MENTION** | Any line that calls out the SKU by name or says "show product", "product shot", etc. |
| **B-ROLL CALL** | Lines in the ADDITIONAL section, or visual notes that describe non-talent footage |

Each classified line becomes one or more rows in the shot list. A single SS can produce multiple shots if it contains intercut visual notes alongside dialogue.

### Step 4 — Group Shots by Location

Using the \`SETTING\` field from PRODUCTION NOTES (and any inline location tags in visual notes), assign every shot to a **Scene/Location**. Common location labels:

- \`INT. [Room] — [Time of Day]\` (e.g. \`INT. Kitchen — Day\`)
- \`EXT. [Place] — [Time of Day]\` (e.g. \`EXT. Backyard — Day\`)
- \`STUDIO\` for clean/white-cyc product shots
- \`GFX\` for on-screen text, motion graphics, and animated overlays

If a visual note specifies a different location than the primary SETTING, create a separate scene group for it.

### Step 5 — Determine Shot Type

Apply the Shot Type Classification rules (see section below) to each line to assign a shot type.

### Step 6 — Output the Shot List

Render the final shot list as a markdown table grouped by scene. Add a bold scene header above each group. See **Output Format** and **Example** sections below.

---

## Shot Type Classification

Use these rules to assign a shot type to every row:

| Shot Type | Rule |
|---|---|
| **OC (On Camera)** | Talent is speaking directly to camera. The dialogue line is in a Sales Sequence, no visual note overrides it, and no VO instruction is present. Default shot type for plain SS dialogue. |
| **VO (Voiceover)** | Dialogue is delivered as narration *over* other footage. Indicated by a visual note on the same line (e.g. \`[show product]\`, \`[cut to b-roll]\`) or an explicit \`VO:\` label in the script. |
| **B-Roll** | Supporting footage with no talent dialogue. Source: ADDITIONAL b-roll list, visual notes describing an environment or action without talent speech, or VO lines where the visual is non-product footage. |
| **Product Shot** | Close-up or hero shot of the SKU. Triggered by lines referencing the product by name with no talent in frame, or notes like "show product", "product close-up", "pack shot". |
| **Text / GFX** | On-screen text, animated pop-ups, lower thirds, motion graphic overlays, or end cards. Triggered by lines like "title card", "text pop", "GFX:", "end card", or any line in an \`[GFX]\` note. |
| **Hook** | The opening shot of the ad. Always assigned to H1–H4 lines. Typically OC or a high-impact visual — note the original shot type in the Subject or Action column if it differs. |

**Tiebreaker**: if a line could be OC *or* VO, check the next visual note. If there's an intercut direction immediately after the dialogue, mark it VO. If the talent speaks uninterrupted, mark it OC.

---

## Output Format

Render the shot list as a markdown table. Add a \`**Scene: [Location]**\` header above each location group.

\`\`\`
**Scene: [Location Label]**

| # | Scene/Location | Shot Type | Subject | Action / Dialogue Note | Ad Sequence |
|---|---|---|---|---|---|
| 1 | INT. Kitchen — Day | Hook | Talent (Female, 30s) | Looks at camera, says "I was so tired..." | H1 |
| 2 | INT. Kitchen — Day | OC | Talent (Female, 30s) | "Nothing worked until I tried this." | SS1 |
\`\`\`

**Column definitions:**

| Column | Content |
|---|---|
| **#** | Sequential shot number across the entire list (do not reset per scene) |
| **Scene/Location** | The location label (INT./EXT. + room + time of day, or STUDIO, or GFX) |
| **Shot Type** | OC, VO, B-Roll, Product Shot, Text/GFX, or Hook |
| **Subject** | Who or what is in frame: talent descriptor, product name, or "N/A" for GFX |
| **Action / Dialogue Note** | Spoken line (truncated to ~10 words if long) or visual action description |
| **Ad Sequence** | The SS or Header label this shot originates from (e.g. SS1, H2, SS3) |

---

## Example

Below is a sample shot list for a hypothetical skincare ad (one talent, kitchen setting, 3 SS + 2 Headers):

---

**Scene: INT. Kitchen — Day**

| # | Scene/Location | Shot Type | Subject | Action / Dialogue Note | Ad Sequence |
|---|---|---|---|---|---|
| 1 | INT. Kitchen — Day | Hook | Talent (Female, 30s) | Direct to cam: "My skin was a disaster." | H1 |
| 2 | INT. Kitchen — Day | Hook | Talent (Female, 30s) | Holds up product, wide smile | H2 |
| 3 | INT. Kitchen — Day | OC | Talent (Female, 30s) | "I've tried every serum on the market…" | SS1 |
| 4 | INT. Kitchen — Day | VO | Product (GlowSerum bottle) | Talent narrates over slow product rotation | SS1 |
| 5 | INT. Kitchen — Day | OC | Talent (Female, 30s) | "Then I found GlowSerum and everything changed." | SS2 |

---

**Scene: STUDIO**

| # | Scene/Location | Shot Type | Subject | Action / Dialogue Note | Ad Sequence |
|---|---|---|---|---|---|
| 6 | STUDIO | Product Shot | GlowSerum (30ml bottle) | Hero close-up, clean white background | SS2 |
| 7 | STUDIO | B-Roll | Talent (Female, 30s) | Applies serum to cheek, smiles at mirror | SS3 |

---

**Scene: GFX**

| # | Scene/Location | Shot Type | Subject | Action / Dialogue Note | Ad Sequence |
|---|---|---|---|---|---|
| 8 | GFX | Text / GFX | N/A | "50% off — Limited Time" pop-up over product shot | SS3 |

---

## Integration with Other Skills

This skill sits in the middle of the TubeScience production workflow and connects to several other skills:

### Upstream: \`production-brief-resource-breakdown\`
Run \`production-brief-resource-breakdown\` first. It extracts the brief's **Props**, **Product/SKU**, **Locations**, and **Talent** into a structured resource list. The shot list creator consumes those extracted values — particularly Locations (→ Scene groups) and Talent descriptors (→ Subject column) — so you are not re-parsing the brief from scratch.

### Downstream: Mosaic Video Editing
The completed shot list becomes the blueprint for Rough Cut prompts in the **Mosaic** video editing workflow. Each row maps to a clip selection task: the Shot Type and Subject fields tell Mosaic which footage bucket to draw from, and the Action / Dialogue Note provides the pacing context. When invoking Mosaic, pass the shot list table directly in the prompt.

### Alongside: \`testimonial-messaging-groups\` (TMG)
Each OC and VO shot can be tagged with its TMG category to align the shot list with the messaging architecture of the ad:

| TMG Tag | Meaning | Typical Shot Types |
|---|---|---|
| 🔵 **PC** (Pain/Concern) | Talent describes the problem | OC, Hook |
| 🟢 **SI** (Solution Introduction) | Talent introduces the product | OC, VO, Product Shot |
| 🟣 **PI** (Product Information) | Features, ingredients, how it works | OC, VO, Text/GFX |
| 🔴 **Results** | Outcomes, transformation, social proof | OC, B-Roll, Product Shot |

To apply TMG tags, run \`testimonial-messaging-groups\` on the Sales Sequence dialogue after the shot list is complete, then add a **TMG** column to the shot list table.
`,runs:[]}),
  mkItem({id:'soundbite',type:'skill',name:'Soundbite Checker',author:'Jarrett',connectedSkills:[],color:'teal',icon:'ti-microphone',description:'Checks raw footage clips against required soundbites from a production brief. Downloads videos from Google Drive, analyzes each with Gemini, and posts results to Slack.',prompt:`---
name: soundbite-checker
description: Checks raw footage clips against required soundbites from a production brief. Downloads videos from a Google Drive folder, analyzes each with Gemini to detect which required dialogue lines were spoken, and posts results to Slack.
icon: mic
color: Green
related_server_ids:
- gdrive
- gdocs
- gsheets
- gslides
- slack
---

# Soundbite Checker Skill

## Purpose
Given a Google Drive folder of raw footage clips and a source brief containing required soundbites, check each video to confirm which lines were spoken. Post a formatted Slack message summarizing the results per clip.

## When to Activate
Activate when the user asks to:
- Check if required soundbites / dialogue lines are present in footage
- QA raw clips against a production brief
- Verify which takes contain which lines

---

## Inputs Required

| Input | Format | Notes |
|---|---|---|
| \`drive_folder_url\` | Google Drive folder URL | Contains the .MOV/.MP4 clips to check |
| \`brief_source\` | Google Doc URL, Slides URL, or PDF | Source of the soundbites |
| \`slack_channel\` | Slack channel name or ID | Where results are posted |
| \`sequences\` | Parsed soundbite list | See Soundbite Extraction below |

---

## Workflow

### Step 1 — Extract Soundbites from Brief

Use \`gdocs__read_doc\` (or \`gslides__read\` for Slides) to read the brief.

Parse the soundbite table:
- Look for table columns labeled "Soundbites" 
- Extract all text in the Soundbites column per Sales Sequence
- Organize as: \`{sequence_name: [line1, line2, ...]}\`

**If the brief is complex**, use the \`strategy-brief-to-production-brief\` skill first to extract a clean asset list.

### Step 2 — List Drive Folder Videos

Use \`gdrive__list_contents\` with \`folder_url\` and \`recursive=false\`.
Filter to \`mimeType\` containing \`video/\`.

Sort by file size ascending (process small files first for faster feedback).

### Step 3 — Run Soundbite Check Script

Execute \`scripts/soundbite_checker.py\` via \`sandbox_python\`.

**Critical implementation notes:**
- \`.MOV\` files MUST be re-muxed to \`.MP4\` via ffmpeg before uploading to Gemini (MOV container causes Gemini to report "no audio")
- Command: \`ffmpeg -i input.mov -c copy -y output.mp4\`
- Use \`gemini-2.5-flash\` model
- Wait for Gemini file state \`ACTIVE\` before generating
- Pass ALL sequences' soundbites to each video (let Gemini figure out which apply)
- Retry up to 3 times on transient errors

### Step 4 — Post Results to Slack

Use \`slack__send_message\` with a formatted message.

**Slack message format:**
\`\`\`
🎬 *Soundbite Check — [Folder Name]* 
_[N] clips analyzed · [date]_

*✅ COMPLETE TAKES*
• \`IMG_2176.MOV\` — SS1: 8/8 ✅
• ...

*⚠️ PARTIAL TAKES*
• \`IMG_2177.MOV\` — SS1: 6/8 (missing: "No in-person visits", "Get a personalized plan today.")

*❌ MISSING / NO MATCH*
• \`HODL9705.MOV\` — no soundbites detected (0/N lines found)

_Brief: [doc title/link] · Drive: [folder link]_
\`\`\`

---

## Script Reference

Main script: \`scripts/soundbite_checker.py\`

Key functions:
- \`download_video(file_id, file_name, dest)\` — Downloads from Drive export URL
- \`remux_to_mp4(mov_path)\` — Re-muxes .MOV to .MP4 via ffmpeg (REQUIRED for audio detection)
- \`analyze_video(mp4_path, file_name, sequences, client)\` — Uploads to Gemini, runs analysis
- \`format_slack_message(results, folder_url, brief_url)\` — Formats final Slack output

---

## Known Issues & Fixes

| Issue | Fix |
|---|---|
| Gemini reports "no audio present" on MOV files | Re-mux to MP4 with \`ffmpeg -c copy\` before uploading |
| Download fails for large files (>100MB) | Use Drive API via Gumloop SDK as fallback |
| Gemini file stuck in PROCESSING state | Retry upload after 60s |
| Sandbox credential error on subagent | Transient — retry the run |
`,runs:[]}),
  mkItem({id:'svs',type:'skill',name:'Substance vs Style',author:'Jarrett',connectedSkills:[],color:'coral',icon:'ti-brain',description:'Framework for decomposing any video ad into Substance (what is being communicated) and Style (how it is being communicated). Use when analyzing, comparing, or evaluating ad creative.',prompt:`---
name: substance-vs-style
description: A framework brain for analyzing video ads (and all creative works) by decomposing them into their two fundamental components — Substance (what is being communicated) and Style (how it is being communicated). Use this skill whenever analyzing, comparing, or evaluating ad creative.
icon: layers
color: Blue
---

# Substance vs Style

---

## Definitions

### Substance
Substance is the core conviction of a work — the idea, argument, or truth being communicated that would survive any change in how it's delivered. It exists before expression: strip away every executional choice and what remains is the Substance. In advertising, it is the message itself — the hook concept, the claim structure, the offer, the logical argument made to the consumer. It is the slower-moving, more durable layer; the messaging argument that converts a customer today will likely still work in five years.

### Style
Style is every choice made in service of delivering Substance to an audience — and it is never neutral. It is the instrument the melody is played on, the actor who embodies the character, the format an ad runs in. Style is how the idea becomes *perceivable*, and it has the power to amplify, undermine, or quietly transform the Substance it carries. Two ads with identical scripts can produce completely different consumer responses because Style recontextualized the Substance underneath — learning to see exactly where and how that's happening is what this framework trains.

> **Key principle:** Two pieces of creative can share identical Substance but feel entirely different because of Style — and vice versa. Separating the two is the foundation of rigorous creative analysis.

---

## The Framework Across Art Forms

### Physical Art
*Painting, drawing, sculpture, photography, installation, etc.*

| Substance | Style |
|---|---|
| The subject being depicted (figure, landscape, concept, emotion) | The medium: oil, watercolor, charcoal, marble, bronze, clay, digital |
| The compositional intent — what elements are present and how they relate | The tool: brush, palette knife, chisel, hands, camera |
| The idea or truth the artist intends to express through the work | The technique: impressionist brushstrokes, photorealism, abstract expressionism |
| The narrative or emotional meaning the work is meant to carry | The color palette, tonal range, and textural choices |
| | The scale and physical presence of the finished work |
| | For sculpture: carved (subtractive) vs. modeled (additive); rough-hewn vs. polished |

The same human figure as subject can be rendered in marble by Michelangelo, painted in oils by Rembrandt, or captured by a modern portrait photographer. What each artist is *saying* about the human form — the Substance — may even be similar. The Style is entirely distinct. Conversely, two painters working from the same landscape are sharing Substance while each expresses it through their own Style: one with loose impressionist brushwork, another with photographic precision. The scene is the same; the experience of it is not.

A worth noting nuance in physical art: the consistent *choice* of medium can itself become a carrier of meaning. An artist who works exclusively in charcoal, or only with reclaimed materials, is making a Style choice so repeated and deliberate that it begins to feel inseparable from what they are saying — edging toward Substance. This mirrors Ives's warning about local color: when a Style element is sustained long enough and with enough intention, it can stop being purely presentational and start becoming part of the message itself.

---

### Musical Art
*Songs, compositions, sound therapy, ambient music, live performance, etc.*

| Substance | Style |
|---|---|
| The musical notes and chords present in the piece | The instrument(s) the melody is performed on |
| The core melody and its harmonic structure | The singer's voice, delivery, and interpretive choices |
| The relative arrangement of the notes and how they build the emotional arc | Production: reverb, distortion, layering, processing, mixing |
| The compositional intent — what the piece is for or about | Tempo interpretation: played fast or slow, rigidly or with rubato |
| In sound therapy: the specific frequency, tonal center, or therapeutic intention | Adding or stripping layers: full orchestral vs. solo acoustic guitar |
| | The performer's energy, phrasing, and physical presence |

This is where Charles Ives's framework does its clearest work. Two musicians can play the same melody — identical notes, identical arrangement — and one version lands as profound and moving while the other falls flat. The Substance is the same. What differs is the Style: the instrument, the interpretation, the choices the performer brings to the material. The cover version is the most familiar illustration: when a song is re-recorded acoustically by a different artist and feels like an entirely new emotional experience, nothing about the Substance has changed. The chord progression, the lyrics, the melody are all intact. The Style has done all the work of transformation.

In sound therapy and healing music, the distinction sharpens further. The specific frequency being used — a 432 Hz tone, a binaural beat pattern at a particular interval — is Substance. It is the therapeutic intention, the measurable "what" being delivered to the listener's nervous system. Whether it's produced by a Tibetan singing bowl, a crystal bowl, a tuning fork, or a synthesized oscillator is Style. The intended effect is the same; the texture and experience through which it arrives changes everything about how it's received.

A further Ives-informed observation: two pieces of music in which the notes are nearly identical can register as entirely different works — one as hollow and mannered, one as genuinely moving — because one has Substance and the other only has Style. The notes were the same. The conviction behind them was not.

---

### Performance Art
*Film, live theater, television, advertising, live events, etc.*

| Substance | Style |
|---|---|
| The story, characters, and themes | The medium: animated film vs. live action vs. live stage vs. immersive experience |
| The dialogue and specific language | The cast: which actors embody the characters |
| The emotional and thematic arc of the work | The director's visual language: camera work, editing rhythm, color grading |
| The sequence and structure of information being delivered | Extended vs. condensed cuts of the same work |
| In advertising: messaging formula, hook concept, claims, offer, logical argument | The setting, production design, and era |
| | In advertising: UGC vs. produced, founder vs. actor, voiceover vs. on-camera, platform/format |

Aristotle laid out this separation in the *Poetics* when he divided tragedy into its constituent parts: plot and character (Substance) versus spectacle (Style). He was unambiguous — spectacle has emotional power, but it is the component least connected to the artistic core of the work. The same story told on a bare stage by two actors, or produced with a $200 million budget, carries the same Substance. The Lion King is a clean modern example: the 1994 animated film and the 2019 live-action remake share the same story, songs, characters, and themes — identical Substance. Completely different Style. The near-universal critical preference for the original is a judgment about which Style execution served the Substance better, not a judgment about the Substance itself.

Live theater makes the distinction especially vivid because every performance of the same play is technically a distinct Style rendering of the same Substance. The script is the Substance; each night's production is a Style execution of it. Two stagings of Hamlet in the same season — one spare and modern, one period and grand — can feel like completely different works while saying exactly the same thing.

In advertising, this plays out most directly in creative testing. Two ads built on the same messaging formula — same hook type, same claim structure, same call to action — can test at dramatically different efficiencies because one Style execution connected and the other didn't. The correct insight is not "this message doesn't work." It is "this Style didn't serve this Substance." Equally, an ad with exceptional production value, charismatic talent, and a polished aesthetic (strong Style) can still fail to convert because the Substance underneath was unclear or weak. Style can make people feel something; Substance is what makes them act.

---

## How to Use This Skill When Analyzing a Video Ad

When asked to analyze a video ad or piece of creative, apply this decomposition:

1. **Identify the Substance**
   - What is the ad *saying*? What claims, messages, or information is it communicating?
   - What is the hook concept (the core idea being used to grab attention)?
   - What messaging formula or structure is being used?
   - What is the offer or call to action?

2. **Identify the Style**
   - How is the message being *delivered*? (format, tone, aesthetic)
   - What creative execution choices were made? (UGC vs. produced, animation vs. live, etc.)
   - Who is delivering the message and how? (founder, actor, voiceover, text-only)
   - What visual and audio elements shape the viewer's experience?

3. **Separate the two cleanly**
   - Ask: "If I re-executed this ad in a completely different visual style but kept the same script and messaging structure, would the Substance survive?" If yes, it's Style.
   - Ask: "If I changed this element, would the core message change?" If yes, it's Substance.

4. **Surface the insight**
   - What is working at the Substance level vs. the Style level?
   - Could the same Substance perform better with a different Style?
   - Is a Style element being mistaken for a Substance insight (or vice versa)?

---

## Boundary Cases & Nuances

- Some elements straddle both: a brand's signature visual style can become so associated with their identity that it *becomes* part of their message (Substance). Acknowledge these overlaps when they arise, but default to the objective classification.
- For UGC-style ads, the "rawness" and authenticity of the format is a Style choice — the claims being made are still Substance.
- Music and sound design are almost always Style, but a jingle with a repeated product claim crosses into Substance.
- Length/format (15s vs. 60s, Reel vs. Story) is Style. The core message being conveyed is Substance.
- A Style element applied consistently enough and with enough deliberate intention can begin to carry meaning — edging toward Substance. Treat these cases explicitly rather than forcing a binary.

---

## Foundational Voices

This framework did not emerge in isolation. Thinkers across centuries have circled the same fundamental duality — each arriving at it through a different medium or discipline. What follows is a record of those voices, kept here not as academic decoration but as a reference for the depth of the idea and where each perspective aligns with or diverges from how we define these terms in this workshop.

---

### Charles Ives — *Essays Before a Sonata* (1920)
**The primary inspiration for this framework.**

Ives is the closest intellectual parallel. Writing about music, literature, and art at large, he used the exact terms — **Substance** and **Manner** — to describe the same duality, arriving at them independently through his own experience as a composer. His Epilogue in *Essays Before a Sonata* is perhaps the most direct articulation of this idea ever written.

> *"So close a relation exists between his content and expression, his substance and manner, that if he were more definite in the latter he would lose power in the former."*
> — Charles Ives, *Essays Before a Sonata* (on Emerson)

This quote captures something essential: in the greatest works, Substance and Style are deeply entangled — but that entanglement is a *product* of the work's power, not an argument against separating them analytically. Ives also wrote: *"Substance has something to do with character. Manner has nothing to do with it."* and *"Substance tends to create affection; manner prejudice."*

**Where Ives diverges from this workshop:** Ives imposed a moral hierarchy — Substance was spiritually superior to Manner, rooted in his Transcendentalist beliefs. In this workshop, **neither is ranked above the other**. Both are necessary. The goal is clean separation for the purpose of analysis, not judgment of which layer is more virtuous.

---

### Aristotle — *Poetics* (~335 BC)
**The oldest formulation of the same split.**

Aristotle broke tragedy into six constituent parts: plot, character, thought, diction, song, and spectacle. The first three are roughly Substance — the story, the people, the ideas. The last three are roughly Style — how the work is performed, heard, and seen. He was explicit about which he valued more:

> *"Spectacle has, indeed, an emotional attraction of its own, but, of all the parts, it is the least artistic, and connected least with the art of poetry."*
> — Aristotle, *Poetics*, Chapter 6

Style (spectacle) can move an audience, but it is the component most disconnected from the work's core artistic identity. Substance carries the art; Style carries the experience.

**Where Aristotle diverges from this workshop:** Like Ives, Aristotle ranked Substance above Style. This workshop treats them as equally important components of creative analysis — not a hierarchy.

---

### G.W.F. Hegel — *Lectures on Aesthetics* (1820s)
**The philosopher who argued they cannot be separated — which is exactly the challenge this framework addresses.**

Hegel believed that in great art, Substance and Style are so thoroughly unified that separating them is an act of reduction. He saw their unity as the very definition of artistic beauty.

> *"Art is the sensuous shining-forth of the Idea."*
> — G.W.F. Hegel, *Lectures on Aesthetics*

The "Idea" is Substance — the spiritual, conceptual content of the work. The "sensuous shining-forth" is Style — the material, experiential form through which that Idea becomes perceivable. For Hegel, these are not two separate things; they are one thing, mutually constitutive.

**Where Hegel diverges from this workshop — and why it matters:** Hegel is the most important counterpoint to hold. He is *right* that in the best creative work, Substance and Style are deeply fused. But his insistence on inseparability is a philosophical claim about the nature of great art, not a practical tool for creative analysis. We separate them *for analysis*, knowing full well that the goal of great creative work is to reunite them seamlessly.

---

### Susan Sontag — *Against Interpretation* (1966)
**The critic who argued the world focuses too much on Substance and not enough on Style.**

Sontag wrote her landmark essay as a direct challenge to the critical establishment, which she felt had become so obsessed with *what* art means (Substance) that it had forgotten *how* art works (Style).

> *"In place of a hermeneutics we need an erotics of art."*
> — Susan Sontag, *Against Interpretation*

"Hermeneutics" = the endless interpretation of Substance. "Erotics" = a direct, sensory, experiential relationship with Style. Her argument was that the critical obsession with content was actually *taming* art — making it manageable by reducing it to its message rather than letting its form act on the viewer.

**Why this matters for ad analysis:** Sontag is a corrective against the natural bias toward leading with Substance in creative analysis. Style is not packaging applied to a finished idea. It is doing half the work — sometimes more. An analysis that only extracts the message and moves on has only done half the job.

---

### Marshall McLuhan — *Understanding Media* (1964)
**The theorist who argued Style can become Substance — and sometimes overrides it entirely.**

McLuhan's thesis is a direct challenge to the clean separation this framework proposes. He argued that the form through which something is delivered so fundamentally reshapes the content that the two cannot be treated independently.

> *"The content of any medium is always another medium."*
> — Marshall McLuhan, *Understanding Media*

Applied to advertising: the Style of an ad (UGC rawness, polished brand film, lo-fi testimonial) is not a neutral carrier of the Substance. It actively shapes what the viewer *receives* as the message.

**Where McLuhan diverges from this workshop — and the practical answer:** McLuhan is correct that Style can bleed into and reshape perceived Substance. The practical answer is: yes, Style affects how Substance lands — but separating them is still the most actionable lens for creative analysis. McLuhan describes what happens in the audience's mind; this framework describes what the creator put in the work. Both are true. Both are useful. They are answers to different questions.
`,runs:[]}),
  mkItem({id:'tmg',type:'skill',name:'Testimonial Messaging Groups',author:'Jarrett',connectedSkills:[],color:'purple',icon:'ti-chart-bar',description:'Defines the TMG framework: Personal Context, Service Information, Product Interaction, and Results. Use for classifying ad content, tagging clips, or generating Rough Cut prompts.',prompt:`---
name: testimonial-messaging-groups
description: "Defines the Testimonial Messaging Groups (TMG) framework: a four-category system for classifying the content of any ad or testimonial clip. Categories are Personal Context, Service Information, Product Interaction, and Results. Use this skill when classifying ad content, tagging clips for Mosaic video editing, generating Rough Cut prompts, or mapping ad copy to TMG categories."
icon: "message-square-text"
color: Blue
---

# Testimonial Messaging Groups

## Overview

Testimonial Messaging Groups (TMG) is a four-category classification framework for breaking down ad and testimonial content into the type of message being communicated. Each category — Personal Context, Service Information, Product Interaction, and Results — maps directly to a distinct phase of the viewer's persuasion journey, and each contains sub-categories that define the specific kind of claim or content within that phase. Use this skill to classify ad copy, tag video clips, build Rough Cut prompts in Mosaic, or validate that an ad covers the right narrative beats.

---

## TMG Categories and Sub-Categories

### 🔵 Personal Context

Content that lives entirely in the viewer's world — before the brand has entered the conversation. The speaker is talking about themselves, their struggles, past attempts, or the environment they were in before finding the product.

**Sub-categories:**

- **Problems** — The specific pain, frustration, or unmet need the person experienced. The core "before state."
  - *Example: "I was exhausted every morning no matter how much I slept."*

- **Agitate** — Emotional deepening of the problem. The speaker elaborates on how bad it was, how long it lasted, or how much it affected their life.
  - *Example: "It was affecting my work, my relationships — I felt like I was just surviving."*

- **Discredit** — Critique of alternatives, past methods, or competing solutions that failed. The brand has NOT yet been named; the speaker is still in their own story.
  - *Example: "I tried every supplement on the market. None of them worked for more than a week."*

> **Brand Entry Rule:** The moment the brand or product is named or referenced, the content exits Personal Context. See the Brand Entry Rule section below for full guidance.

---

### 🟢 Service Information

Content that introduces and explains the brand. This is where the brand enters the conversation. The speaker is now talking about the product/service itself — what it is, how it works, why it's different, and why it's trustworthy.

**Sub-categories:**

- **Brand Entry** — The first moment the brand or product is named or introduced. Often a pivot sentence.
  - *Example: "Then I found Thesis — a nootropics company that actually customizes your formula."*

- **How It Works** — Explanation of the mechanism, process, or delivery model. Not specific features, but the service-level description.
  - *Example: "You take a quiz, they analyze your goals, and they build a blend specific to your neurotype."*

- **Differentiation** — What makes this brand meaningfully different from alternatives. The brand is named in the comparison.
  - *Example: "Unlike generic supplements, Thesis doesn't give you a one-size-fits-all formula."*

- **Credibility** — Statistics, press mentions, expert endorsements, certifications, or scale indicators that establish authority.
  - *Example: "Over 200,000 people have used Thesis, and it's been featured in the Wall Street Journal."*

- **Offer** — Pricing, discounts, free trials, bundles, or any purchase incentive.
  - *Example: "Right now you can get your first month for 40% off."*

- **CTA** — Direct call to action telling the viewer what to do next.
  - *Example: "Click the link below to take the quiz and get started."*

---

### 🟣 Product Interaction

Content where the speaker is directly engaging with the product — describing specific features, explaining tangible benefits, or demonstrating how it works through their own hands-on experience.

**Sub-categories:**

- **Features** — Specific, named attributes of the product. What it has or what it does.
  - *Example: "The formula includes lion's mane, alpha-GPC, and ashwagandha."*

- **Benefits** — The experiential or functional outcomes of those features — what the user gets out of using it.
  - *Example: "I noticed clearer thinking and better focus within the first hour."*

- **Demo** — Visual or verbal walkthrough of using the product — unboxing, applying, navigating an app, following a process.
  - *Example: "So here's how the quiz works — you answer questions about your energy levels, mood, and focus goals..."*

---

### 🔴 Results

Content focused on outcomes — what happened after using the product. This is the "after state." Includes both personal transformation and third-party validation.

**Sub-categories:**

- **Outcome** — Concrete, specific results the speaker experienced. Measurable or observable changes.
  - *Example: "I lost 18 pounds in 10 weeks."*

- **Transformation** — The broader life or emotional shift beyond the specific outcome. The "new me" framing.
  - *Example: "I feel like a completely different person. I have energy again. I actually enjoy mornings."*

- **Social Proof / Testimonial** — Third-party validation: other users' results, reviews, star ratings, or community outcomes.
  - *Example: "Over 3,000 five-star reviews — people are saying it changed their lives."*

---

## Classification Decision Tree

Use this step-by-step process to classify any piece of ad content — a sentence, a clip, a paragraph — into its TMG category.

### Step 1 — Has the brand been mentioned yet?

- **No** → The content is 🔵 **Personal Context**. Proceed to Step 2 to identify the sub-category.
- **Yes** → Continue to Step 3.

> If the brand is mentioned for the first time in this line, this line is likely **Brand Entry** (🟢 Service Information). But confirm with Step 3.

### Step 2 — Which Personal Context sub-category? (Brand not yet mentioned)

Ask: *What is the speaker doing with this content?*

- Describing a pain, problem, or unmet need → **Problems**
- Elaborating on how bad or pervasive the problem was → **Agitate**
- Criticizing a past solution, alternative product, or old method they tried → **Discredit**

### Step 3 — Is the speaker talking about the brand/service as a concept, or physically using the product?

- **Talking about the brand** (what it is, how it works, what makes it different, offers, CTAs, credibility) → 🟢 **Service Information**. Proceed to Step 4.
- **Physically interacting with or describing specific product attributes** → 🟣 **Product Interaction**. Proceed to Step 5.
- **Describing an outcome, transformation, or quoting other users' results** → 🔴 **Results**. Proceed to Step 6.

### Step 4 — Which Service Information sub-category?

- First time the brand is named or introduced → **Brand Entry**
- Explaining the mechanism, process, or delivery model → **How It Works**
- Comparing to alternatives (brand is now named in the comparison) → **Differentiation**
- Stats, press, endorsements, scale indicators → **Credibility**
- Pricing, discounts, trials, bundles → **Offer**
- Telling the viewer to click, buy, or act → **CTA**

### Step 5 — Which Product Interaction sub-category?

- Naming a specific ingredient, feature, or attribute → **Features**
- Describing what that feature does or how it felt → **Benefits**
- Walking through using the product step-by-step (visual or verbal) → **Demo**

### Step 6 — Which Results sub-category?

- Specific measurable or observable change the speaker experienced → **Outcome**
- Broader emotional/life shift, "new me" language → **Transformation**
- Quoting others, showing reviews, citing aggregate data → **Social Proof / Testimonial**

---

## Mosaic Integration

Mosaic is TubeScience's video editing workflow system. TMG categories are the primary classification layer used when tagging clips and generating Rough Cut prompts. Here's how the two systems connect.

### Clip Tagging

Every raw testimonial clip should be tagged with its TMG category and sub-category before entering the Mosaic editing queue. This enables:
- **Filtering clips by narrative role** — find all "Agitate" clips for a brand vs. all "Transformation" clips
- **Detecting coverage gaps** — identify when an ad is missing a critical beat (e.g., no CTA, no Outcome)
- **Reordering without re-watching** — editors can build narrative sequences by sorting tags without scrubbing footage

**Tag format:** \`TMG:{Category}:{SubCategory}\` — e.g., \`TMG:PersonalContext:Problems\`, \`TMG:Results:Transformation\`

### Rough Cut Prompt Generation

When generating a Mosaic Rough Cut prompt, TMG categories map to structural slots in the prompt. A standard Rough Cut prompt follows the natural narrative order (PC → SI → PI → Results), pulling clips for each slot:

| Prompt Slot | TMG Category | Recommended Sub-categories |
|---|---|---|
| Hook / Opening | 🔵 Personal Context | Problems, Agitate |
| Problem Deepening | 🔵 Personal Context | Agitate, Discredit |
| Brand Introduction | 🟢 Service Information | Brand Entry, How It Works |
| Why This Brand | 🟢 Service Information | Differentiation, Credibility |
| Product Experience | 🟣 Product Interaction | Features, Benefits, Demo |
| Payoff | 🔴 Results | Outcome, Transformation |
| Close | 🟢 Service Information + 🔴 Results | CTA, Social Proof / Testimonial |

**Generating a prompt:** When asked to generate a Rough Cut prompt for a brand:
1. Identify which TMG sub-categories have sufficient clip coverage
2. Map available clips to the prompt slots above
3. Flag any slots with no coverage as gaps to be filled with scripted or b-roll content
4. Output the prompt with TMG tags annotating each clip slot

### Coverage Analysis

Before generating a Rough Cut, assess coverage by listing how many clips exist per sub-category. A well-covered ad typically has:
- At least 1 clip for **Problems** or **Agitate** (to establish the hook)
- At least 1 clip for **Brand Entry** and **How It Works**
- At least 1 clip for **Outcome** or **Transformation** (the payoff)
- At least 1 **CTA**

Ads with only Results or only Service Information coverage will feel incomplete — use this analysis to recommend reshoots or scripted additions.

---

## The Brand Entry Rule

**The transition from Personal Context into Service Information is the moment the brand enters the conversation.**

Everything before that — including critiques of alternatives, failure of past methods, or why the old way didn't work — is still about the user's world (Personal Context), not the brand's.

Examples using a Spanish learning app:
- *"I had an 800 day streak on Duolingo and still couldn't hold a real conversation"* → 🔵 **Personal Context** — about the user's failed experience with an alternative
- *"Flashcard apps only teach you to passively recognize words, not to actually speak"* → 🔵 **Personal Context** — still critiquing alternatives, brand not yet mentioned
- *"Unlike Duolingo, Speak actually makes you practice speaking out loud"* → 🟢 **Service Information** — the brand is now named and positioned

**The test:** Does this line name or refer to the brand/product? If no → Personal Context. If yes → Service Information or beyond.

This means Discredit (from the PAS+ formula) is always Personal Context, not Service Information, even when it sounds like a product comparison. The moment the brand enters = the moment we exit Personal Context.

---

## Narrative Order

TMG content can technically appear in any order in an ad — and it does, especially when a format leads with an outcome to hook the viewer first, then walks back to the problem. However, **the categories most naturally and most commonly follow the PC → SI → PI → Results sequence** because this is simply the most logical way to present information to someone passively absorbing content:

1. First establish the viewer's world and pain (Personal Context)
2. Then introduce the brand/service as the answer (Service Information)
3. Then show how the product works (Product Interaction)
4. Then reveal the transformation (Results)

This order mirrors how humans naturally tell a story: setup → discovery → experience → outcome. It's not a rule — it's just good storytelling logic, which is why it shows up so consistently across all ad formulas (PAS, AIDA, 4P's) even though they were developed independently.

---

## Cross-Framework Mapping (AIDA / PAS+ / 4P's → TMGs)

These ad formulas are different schools of thought trying to define the same thing: the building blocks of a persuasive ad. Here's how each maps to the TMG framework:

### AIDA

| AIDA | TMG | Notes |
|---|---|---|
| **Attention** | Primarily 🔵 Personal Context | Grabs attention through relatable problems or situations from the viewer's world. Note: Attention is a *structural position* (how you open an ad) more than a content category — the same opening slot can technically draw from any TMG depending on format (e.g., leading with a result). |
| **Interest** | 🟢 Service Information | Teases information that makes the viewer curious about the product — facts, use cases, what it does. This is the brand entering the conversation. |
| **Desire** | 🟣 Product Interaction + 🔴 Results | Split: features/benefits = Product Interaction; aspirational outcomes = Results. |
| **Action** | 🟢 Service Information → CTA | Direct match with the CTA sub-section. |

### PAS+

| PAS+ | TMG | Notes |
|---|---|---|
| **Problem** | 🔵 Personal Context → Problems | Exact match. |
| **Agitate** | 🔵 Personal Context | Still PC — emotionally deepening the problem so the viewer sees themselves in the story. |
| **Discredit** | 🔵 Personal Context | Critiquing alternatives is still the user's world. The brand hasn't entered yet. Once the brand is named in the comparison, it crosses into Service Information. |
| **Solution** | 🟢 Service Information + 🟣 Product Interaction | Split: service-level explanation = Service Information; specific product features = Product Interaction. |
| **Outcome** | 🔴 Results | Direct match. |
| **Encourage** | 🟢 Service Information → CTA | Direct match. |

### 4P's

| 4P's | TMG | Notes |
|---|---|---|
| **Problem** | 🔵 Personal Context → Problems | Direct match. |
| **Promise** | 🟢 Service Information | The brand-level claim about what the product will deliver. Brand has entered; this is Service Information. |
| **Proof** | 🔴 Results + 🟢 Service Information | User testimonials/before-afters = Results. Credibility statistics = Service Information. |
| **Push** | 🟢 Service Information → CTA | Direct match. |

### Key Observation

**🟢 Service Information absorbs the most building blocks** across all three frameworks: Interest (AIDA), Solution (PAS+), Encourage (PAS+), Promise (4P's), Push (4P's), and Action (AIDA) all land here. This reflects how broad Service Information is — it covers brand intro, how it works, differentiation, credibility, offers, AND CTAs. Other frameworks tend to split these into separate named steps.
`,runs:[]}),
  mkItem({id:'thumbstop',type:'skill',name:'Thumbstop Shop',author:'Jarrett',connectedSkills:[],color:'amber',icon:'ti-bolt',description:'Guides ideation and critique of video ad opening hooks using TubeScience\'s Thumbstop 101 framework. Use when creating or iterating on the first 3 seconds of a video ad.',prompt:`---
name: thumbstop-shop
description: Guides the ideation and critique of video ad opening hooks (thumbstops) using TubeScience's Thumbstop 101 framework. Use when creating, evaluating, or iterating on the first 3 seconds of a video ad to maximize the 3-second view rate on social feeds.
icon: zap
color: Blue
---

# Thumbstop Shop

## What Is Thumbstop?

**Thumbstop** = the percentage of people who watched an ad for 3+ seconds out of everyone who saw it in their feed.

**Formula:** \`3-Second Views ÷ Impressions = Thumbstop %\`

A high thumbstop doesn't guarantee conversions — we must stop *the right* people. The hook must be relevant to the product's target audience.

---

## The Hook = Two Pieces

Every hook is defined by exactly two components working together:

| Component | What it is |
|---|---|
| **Visual** | The footage the viewer is watching — the image, action, or scene in the first 3 seconds |
| **Messaging** | The header text baked onto the footage that the viewer reads — typically a single bold line |

The 6 categories below define the **visual** half of the hook. Copy and visual always work in tandem — the strength of either can be hypothesized through creative analysis and confirmed through iteration. These are not messaging categories.

---

## The 6 Thumbstop Visual Categories

### 1. Complete / Incomplete Action

**Stop mechanism:** The brain perceives an action in progress and is wired to seek resolution — it stops scrolling to find out how it ends.

**Performance Factors:**
- Center the frame on one clear focal point
- Focus on a single, unambiguous action
- Use *unresolved tension* (action paused mid-way) OR *resolved tension* (satisfying completion payoff)

**What the footage looks like:**
- Razor dragging mid-stroke down a hairy leg — the shave isn't done yet (unresolved)
- Hands clasping a bra strap behind the back, fingers slipping and struggling (incomplete)
- Woman mid-lunge at a gym, body in unstable position (action in progress)
- Woman frustratedly rubbing wet hair with a towel, not finished (incomplete)
- Woman holding a long braid as if deciding whether to cut it (unresolved decision)
- Hand slowly turning a door lock in a single mechanical motion (completing)
- Fork scooping food from a single-serving plate (completing a mundane action)
- Auction countdown ticking, two competitor faces side by side (unresolved competitive tension)

**Benchmarks:** 30–49% thumbstop

---

### 2. Tactile / Sensory Visuals

**Stop mechanism:** The footage triggers a near-physical sensory response in the viewer — texture, touch, and repetitive close-up motion create an involuntary visceral reaction (ASMR-adjacent).

**Performance Factors:**
- Eye-catching colors and surface patterns
- Hypnotic or repetitive movement loops naturally
- Often involves hands actively touching or applying something
- Extreme close-ups that fill the entire frame
- Emphasizes the feel, texture, or material of a product

**What the footage looks like:**
- Hands squeezing and stretching vibrant leggings fabric — material tactility on display
- Razor gliding through shaving foam across skin in one smooth arc — satisfying foam clearance
- Man lathering shaving cream over his face, foam building and expanding
- Glittery/sparkly hair product being spread through hair in close-up — hypnotic shimmer
- Translucent skin-clearing product squeezed from a tube onto a finger — texture reveal
- Pink razor being dragged slowly across skin — repetitive, smooth motion
- Lipstick being swatched across skin in a single slow stroke — color payoff
- Green bar of soap being rubbed between palms, lather forming — eco-product texture

**Benchmarks:** 39–53% thumbstop

---

### 3. Relatable Problems / Desirable Situations

**Stop mechanism:** The viewer sees a person in a situation they emotionally recognize as their own problem or a life they want — the response is identification ("that's me") or aspiration ("I want that").

**Performance Factors:**
- Clear center focus (usually a person)
- Environment establishes context immediately (gym, bathroom, bedroom, kitchen)
- Body/person-focused — the human subject carries the hook
- Results must be believable and/or aspirational
- Problems should be exaggerated enough to be undeniably relatable
- Talent matters — energy, authenticity, and relatability are critical

**What the footage looks like:**
- Woman walking/strutting in ill-fitting flared pants, visibly uncomfortable ("HATE PANTS?")
- Man at a gym attempting a lift with uncertain, hesitant form
- Close-up of leggings on legs doing yoga, fabric being visually tested
- Person repeatedly adjusting and pulling at a cloth mask on their face
- Woman in a sparkly bra gesturing at the difficulty of finding her size
- Person carefully, hesitantly shaving legs in a shower — sensitivity visible
- Athlete sprinting on a sports field, shoes clearly in frame
- Woman running hands through frizzy, unmanageable hair with exasperation

**Sub-type — Splitscreens:**

Splitscreens show two visuals simultaneously (before/after, comparison, problem vs. solution). The mechanism is the same — identification or aspiration — but the format delivers two data points at once.

Additional Splitscreen Performance Factors:
- Subject is the same size in both frames
- Minimal motion — neither panel should be hard to process
- Neither frame is cluttered

Splitscreen footage examples:
- Two women side by side in different bra fits — same body, different support
- Regular leggings vs. Fabletics leggings worn side by side on similar bodies
- Man with matted, messy hair (left) vs. clean healthy hair (right) — Prose before/after
- Messy stovetop vs. clean meal-prep container
- Heavy foundation face (left) vs. natural skin (right)
- Two before/after shave faces — clearly different result
- Woman in shapewear struggle (left) vs. fitted dress result (right)
- Plate of grapes vs. plate of raisins — visual information comparison

**Benchmarks:** 37–53% thumbstop

---

### 4. Unexpected Visual

**Stop mechanism:** The image is jarring, visually wrong, or unconventional enough that the brain's orienting reflex fires before the decision to scroll — the viewer stops to make sense of what they're seeing.

**Performance Factors:**
- Exaggerated problems pushed to extreme, almost absurd levels
- Eye-catching, saturated, or unusual colors and patterns
- Unnatural or suggestive imagery
- Unconventional camera angles (extreme macro, low angle, overhead)
- Often features a "reveal" — something hidden or unexpected comes into view
- High room for visual experimentation

**What the footage looks like:**
- Blotting pad pressed to face and lifted away to reveal it's completely dark and soaked — extreme oiliness reveal
- Businesswoman dramatically standing at her desk and kicking off her leggings mid-workday
- Lotion/cream being applied up legs from a camera angle below the feet — disorienting perspective
- Thick cotton socks being pulled from under a comforter — unexpected product reveal
- Foundation applied in a clearly mismatched, exaggerated stripe across the face
- Woman pulling a long section of hair extensions away from her scalp — visual contrast
- Pink slime being slowly stretched in extreme close-up — unnatural, hypnotic
- A sleek product "unveiled" from behind an ordinary or ugly version of the same category

**Benchmarks:** 33–58% thumbstop

---

### 5. Direct-to-Camera Confession / Callout

**Stop mechanism:** A face making direct eye contact triggers an involuntary social attention response — the brain is hardwired to register someone addressing it before conscious filtering can dismiss it as an ad.

This is distinct from Relatable Problems because the viewer isn't watching a *situation* — they're being *spoken to*. The hook is the human-to-human signal, not the scene. Raw, imperfect, iPhone-quality footage outperforms polished studio here because authenticity reinforces the social signal. (VidMob data: everyday creators are 1.7x more likely to hook than celebrity talent; direct-to-camera close-up style gives ~50% higher hooking power.)

**Performance Factors:**
- Talent faces the camera dead-on, close-up — no profile shot, no looking away
- First line delivered with energy before 1.5 seconds
- Raw, slightly imperfect quality is a feature, not a bug
- No logo slate, no brand color, no intro — the person leads immediately
- Reaction/expression in the first frame carries the opening before words register

**Sub-types:**
- **Confession** — Person admitting a past belief or behavior, creating curiosity about what changed their mind ("I used to be all for the pretty pink razors...")
- **Direct callout** — Viewer is specifically summoned by identity or problem ("If you hate shaving, stop scrolling")
- **Hot take** — Polarizing first-person opinion that triggers agreement or argument ("This is the only razor worth buying and I'll die on this hill")

**What the footage looks like:**
- Person leaning close to camera, speaking directly, mid-sentence in the opening frame
- Exaggerated reaction face filling most of the frame before words are processed
- Someone pointing at the camera or at text on screen that calls out the viewer
- Founder or creator in a casual setting (bathroom, kitchen) addressing the viewer like a friend

**Benchmarks:** 38–52% thumbstop (VidMob / MHI 2024–2026 data)

---

### 6. Live Demonstration

**Stop mechanism:** The viewer sees a claim being tested in real-time and can't look away until they know if it worked — the footage itself is the proof, and proof curiosity locks attention.

This is distinct from Complete/Incomplete Action because the tension is *evidential*, not emotional. The viewer isn't waiting for satisfying resolution — they're waiting to see if something is real. It's also distinct from Tactile/Sensory because the texture and feel aren't the point — the *result* is. The camera serves as a witness, not a sensory delivery device.

**Performance Factors:**
- The "before" state must be clear within the first 0.5 seconds
- Single, uncut shot — no edits during the transformation underscore authenticity
- Camera is close enough to see the detail of the change
- Action must either complete in 3 seconds OR be deliberately cut off to pull the viewer through

**Sub-types:**
- **Instant transformation** — Product applied → immediate, dramatic visible change in one shot (stain vanishing, skin tone shifting, a wrinkle steaming out)
- **Surprising capacity** — A small or unassuming product producing a disproportionately large effect (a drop expanding, one bar lasting unexpectedly long)
- **"Wait, that actually works?"** — Product solving a problem in a way that seems implausible until seen (razor self-cleaning, bag vacuum-sealing flat, product dissolving buildup)

**What the footage looks like:**
- White fabric with a stain being touched by a product — stain disappears in the same shot
- A single drop of serum hitting skin and visibly spreading/absorbing
- A dull, cloudy surface being wiped to reveal clarity underneath
- A before-state product (damaged, dirty, broken) transforming in a single continuous shot
- Something small producing a surprisingly large physical reaction (foaming, expanding, lathering)

**Benchmarks:** 38–52% thumbstop

---

## Creative Techniques (Amplifiers)

These are modifiers that can strengthen any of the 6 categories above. They are not categories themselves — they are applied on top of the underlying visual type.

| Technique | What it is | Example |
|---|---|---|
| **Motion** | Movement creates visual energy that holds attention | Yellow criss-cross leggings being pulled on, straps settling — hypnotic pattern shift |
| **Time** | Speed manipulation (slow-mo or time-lapse) exaggerates the action | Razor passing over a wet leg in slow motion — every detail amplified |
| **Color** | Dramatic color contrast or transformation signals change visually | Red unhealthy food (Before) → white/gray controlled portion (After Albert) |

> **Note on production style:** How footage is filmed (UGC/raw vs. studio polish, vertical vs. horizontal, handheld vs. stabilized) is a *style* variable that can be applied to any category. It is not a category itself. Native, raw production typically outperforms polished studio on social feeds — but this is a modifier on execution, not a definition of the hook's substance.

---

## The Power of Iteration

Thumbstop is a testing flywheel, not a one-shot guess. Dollar Shave Club iterated 7 creatives on the same product:

| Hook visual | Thumbstop | Spend |
|---|---|---|
| Shaving leg close-up | 29% | $341K |
| Bold text open | 39% | $106K |
| "Pretty pink razors" confession | **58%** | $188K |
| Same copy, varied visual | 43% | $171K |
| "My old razor doesn't have a trimmer!" | 38% | $127K |
| "I've been shaving wrong all my life" | 32% | $324K |
| "Get rid of your grimey razor" | 53% | $110K |

Moving from 29% → 58% on the same product is achievable through visual + copy iteration alone. Each test teaches what the audience actually stops for.

---

## How to Use This Skill

### Generating Hook Concepts

For any product, generate at least one concept per category:

1. **Complete/Incomplete** — What single action involving this product (or the problem it solves) creates tension or resolution?
2. **Tactile/Sensory** — What texture, material, or application looks satisfying, hypnotic, or physically compelling in close-up?
3. **Relatable/Desirable** — What is the most exaggerated, instantly recognizable version of the problem this product solves? What does the aspirational outcome look like on a real person?
4. **Unexpected** — What is the most visually jarring, extreme, or unconventional way to show this product's problem or benefit?
5. **Direct-to-Camera** — Who is the most credible, relatable person to confess, callout, or take a hot take about this product? What do they say in the first 1.5 seconds?
6. **Live Demo** — What is the single most visually undeniable proof of this product working? Can it be shown in 3 seconds, uncut?
7. For each: does Motion, Time, or Color amplify it?

### Evaluating an Existing Hook

- Is there a clear center focal point?
- Does the viewer's eye know where to look within 0.5 seconds?
- Is there a reason to keep watching beyond 3 seconds? (tension, curiosity, proof, social reflex)
- Does the visual match the target audience's lived experience?
- Is the problem exaggerated enough to be instantly recognizable?
- Is it stopping the *right* people — relevant to the product?
- Do the visual and messaging reinforce each other, or work against each other?

### Output Format for Hook Concepts

\`\`\`
Hook Type: [Complete/Incomplete | Tactile/Sensory | Relatable/Desirable | Unexpected | Direct-to-Camera | Live Demo]
Visual (first 3 seconds): [Describe exactly what is seen in the footage]
GIF/Action: [The looping motion or 3-second action happening on screen]
Messaging (header text): [The exact text baked onto the footage]
Creative Technique: [Motion / Time / Color / None]
Stop mechanism: [1-sentence — why does this specific footage make a thumb stop?]
\`\`\`

---

## Future Workshop Additions (Suggested)

- **Visual Comedy / Absurdity** — Using exaggerated, over-the-top physical performance or absurd scenarios as the visual hook. Distinct from Unexpected Visual (which stops via disorientation) because comedy stops via *recognition* — the brain identifies something as funny and slows down to get the payoff. Shelved for now due to scalability constraints — comedy requires strong performance/timing and is harder to systematize than other categories. Revisit when expanding the workshop.


---

# Reference Documentation for Thumbstop Blender

This is a placeholder for detailed reference documentation.
Replace with actual reference content or delete if not needed.

## Structure Suggestions

### API Reference Example
- Overview
- Authentication
- Endpoints with examples
- Error codes

### Workflow Guide Example
- Prerequisites
- Step-by-step instructions
- Common patterns
- Troubleshooting
`,runs:[]}),
  mkItem({id:'videoshotlist',type:'skill',name:'Video Shot List',author:'Jarrett',connectedSkills:[],color:'navy',icon:'ti-video',description:'Analyzes a video ad from Google Drive, detects every shot cut using OpenCV, describes each shot with GPT-4o Vision, and builds a branded TubeScience-style Google Slides shot list deck.',prompt:`---
name: video-shot-list
description: Analyzes a video ad from Google Drive, detects every shot cut using OpenCV, describes each shot with GPT-4o Vision, and builds a branded TubeScience-style Google Slides shot list deck with portrait thumbnails, timecodes, and descriptions.
icon: square
color: Purple
related_server_ids:
- gdrive
- gslides
---

# video-shot-list

Analyzes a video ad from Google Drive, detects shot cuts using OpenCV frame-diff analysis, describes each shot with GPT-4o Vision, and builds a branded Google Slides shot list deck in the TubeScience style.

## Required Secret
- \`OPENAI_API_KEY\` — Get from platform.openai.com -> API Keys -> Create new secret key

## How It Works

### Stage 1 — OpenCV Cut Detection (local, no API)
Scans every frame for pixel-difference spikes that indicate a hard cut or transition.
Fast, free, handles most ad edits reliably. Tunable sensitivity via \`cut_threshold\`.

### Stage 2 — GPT-4o Vision Descriptions
Sends each detected shot frame to GPT-4o as a base64 image.
Returns a brief technical description (shot type, subject, action, setting, lighting).

### Stage 3 — Slides Build
Builds a branded Google Slides deck: cover + content slides with portrait thumbnails,
timecodes, descriptions, and CONFIDENTIAL footer.

## Inputs
| Parameter | Type | Description |
|---|---|---|
| \`video_drive_url\` | string | Google Drive URL or file ID |
| \`presentation_title\` | string | e.g. "Hims ED — Climax Control" |
| \`brand_name\` | string | e.g. "Hims" |
| \`shots_per_slide\` | int | Thumbnails per row (4-8, default 6) |
| \`cut_threshold\` | float | OpenCV sensitivity — lower = more shots (default 30.0) |
| \`output_drive_folder_id\` | string | Optional Drive folder for extracted frames |

## Scripts
- scripts/run_shot_list.py    — Main entry point
- scripts/openai_analyzer.py  — OpenCV cut detection + GPT-4o descriptions
- scripts/frame_extractor.py  — OpenCV frame extraction
- scripts/slides_builder.py   — Google Slides presentation builder

## Usage
\`\`\`python
import sys
sys.path.insert(0, "/home/user/skills/video-shot-list/scripts")
from run_shot_list import run_shot_list

result = run_shot_list(
    video_drive_url="https://drive.google.com/file/d/XXXX/view",
    presentation_title="Hims ED — Climax Control",
    brand_name="Hims",
    shots_per_slide=6,
    cut_threshold=30.0,
)
print(result["slides_url"])
\`\`\`
`,runs:[]}),
  mkItem({id:'visarch',type:'skill',name:'Visual Archetypes',author:'Jarrett',connectedSkills:[],color:'pink',icon:'ti-sparkles',description:'Defines six Visual Archetype execution formats for the Testimonial Archetype. Use when classifying visual execution style, distinguishing style-level variation, or ensuring creative diversity.',prompt:`---
name: visual-archetypes
description: Defines the Visual Archetypes framework — six execution formats for the Testimonial Archetype that describe how an ad looks and feels independently of what it says. Use when classifying the visual execution style of an ad, distinguishing style-level variation from substance-level variation, or ensuring creative diversity in an ad account. Pairs with testimonial-messaging-groups (Substance) and substance-vs-style (the unifying lens).
icon: clapperboard
color: Blue
---

# Visual Archetypes

---

## Overview

Visual Archetypes define **how** an ad is executed visually and conceptually — the vehicle that carries the story. They are entirely a **Style-layer** classification. Two ads with identical Substance (same TMG beats, same persuasion formula) can belong to completely different Visual Archetypes and, as a result, appear to have nothing to do with each other on screen.

This is the core creative power of the framework: **Visual Archetypes allow the same message to reach the same audience multiple times without fatigue**, because each execution looks and feels like a different kind of content.

> **The central principle:** Visual Archetype diversity is to an ad account what biodiversity is to an ecosystem. Accounts that run only one archetype are fragile — a single creative fatigue event kills the whole system. Accounts that run across multiple archetypes have redundancy: when one format saturates, others continue performing.

---

## Where Visual Archetypes Fit in the Three-Skill Ecosystem

| Skill | Layer | Answers |
|---|---|---|
| **Testimonial Messaging Groups (TMG)** | Substance | *What* is being said — which persuasion beats, in which order |
| **Visual Archetypes** | Style | *How* it looks — the execution format, the visual identity of the ad |
| **Substance vs Style (SVS)** | Both | The diagnostic lens — separates what's working from how it's being delivered; ties the two layers together |
| **Ad Grammar** | Substance + Structure | The formula skeleton — the named building blocks (PAS+, AIDA, 4Ps) that TMG categories map onto |

**When to use this skill:**
- Classifying an existing ad by its visual execution format
- Generating creative concepts where you need to vary the format without changing the message
- Diagnosing creative fatigue (all ads look the same → likely stuck in one archetype)
- Briefing production on the visual execution style required for a shoot
- Auditing an ad account for Visual Archetype diversity

---

## The Testimonial Archetype — Parent Category

All six Visual Archetypes live under the **Testimonial Archetype**, which is defined as:

> *A visual archetype where there's a character in the video that the viewer is meant to relate to, aspire to, or at least somehow attach and connect to — as we follow their journey with the product, highlighting the specific ways this product has improved their life.*

The Testimonial Archetype is character-driven by definition. If no character exists in the ad for the viewer to connect with, it is not a Testimonial Archetype execution.

The six sub-archetypes within it are:

1. The Confessional
2. Day in the Life
3. The Skit
4. The Interview
5. The Roto React
6. The Sitcom

---

## The Six Visual Archetypes

---

### 1. 🗣️ The Confessional

> *"As if they just set down their phone on the counter because they had to talk to their followers, friends, or family."*

**Core identity:** The rawest, most hyper-native execution format. The character addresses the camera directly as if sharing something personal and unfiltered — not performing, not presenting, just talking.

**Key characteristics:**
- Filmed in a single location with minimal or no b-roll
- Character talks directly to camera throughout
- Feels unscripted and spontaneous, even when it isn't
- Low production polish is a feature, not a bug — it signals authenticity
- The viewer should feel like they're watching something private

**Visual Executions (Subcategories):**

| Subcategory | Description |
|---|---|
| **Static Solo** | One talent, fixed camera, single location — the purest Confessional form |
| **Static Multi** | Multiple talent appearances within a fixed-camera, single-location setup (e.g., two people on the same couch) |
| **Dynamic Solo** | One talent, but camera moves — handheld, panning, walking — adds energy while retaining the raw feel |
| **Dynamic Multi** | Multiple talent with camera movement — most visually active of the Confessional subcategories |

**SVS lens:** The Confessional is a Style choice that signals raw authenticity. The same TMG message (e.g., Problem → Results) delivered in a Confessional vs. a Sitcom will land with different trust levels and different audience segments — even with the same script.

---

### 2. 📅 Day in the Life

> *"Follows a similar story to The Confessional, but visually expressed with a wider variety of camera angles, locations, and points in time."*

**Core identity:** A more visually developed Confessional. The story is still character-driven and testimonial in nature, but the footage on screen actively supports what the talent is saying at any given moment. The visual and verbal track are in sync.

**Key characteristics:**
- Multiple locations, camera angles, and time periods within the same ad
- More engaging camera movement than the Confessional
- B-roll directly illustrates what the talent is narrating ("I was at the gym when…" — we see the gym)
- Visual storytelling is explicit: viewer doesn't have to imagine the story, they see it
- More polished than the Confessional, but still character-led and relatively grounded

**Subcategories:**

| Subcategory | Description |
|---|---|
| **Get Ready With Me (GRWM)** | Talent walks through a personal routine (morning, pre-event, etc.) while weaving the product into the narrative naturally |
| **The Classic Journey** | A chronological before-to-after narrative — talent's life before the product, discovery, and transformation — shown across time and location |

**Confessional vs. Day in the Life — the key distinction:**
- Confessional = static environment, viewer fills in the imagery from the words
- Day in the Life = active visual storytelling, the footage *shows* what the words describe

---

### 3. 🎭 The Skit

> *"One talent plays all of the characters in the scene, as they play through some sort of scenario, typically having a comedic and self-aware tone."*

**Core identity:** Performance-driven. The talent steps *out* of their own testimonial voice and into characters — usually including at least one version of themselves. The format is theatrical, self-aware, and often comedic.

**Key characteristics:**
- One actor, multiple roles — the talent plays all characters through costume changes, camera switches, or editing cuts
- Comedic and self-aware tone is typical (though not required)
- Scenario-based: there is a situation being acted out, not just narrated
- The "fourth wall" is understood — viewers know this is a bit, and that's the point

**Subcategories:**

| Subcategory | Description |
|---|---|
| **Self Talk** | Talent plays two versions of themselves (e.g., before-self vs. after-self, skeptical-self vs. convinced-self) in dialogue with each other |
| **Personified Problems & Product** | The problem or the product is embodied as a character the talent interacts with |
| **Eyes and Mouth** | A visual format where only the talent's eyes and/or mouth are shown — creates an abstract, playful aesthetic often used for humor or emphasis |
| **POV** | The camera takes the point of view of another character — typically the product, the viewer, or a situation — putting the audience inside the scene |
| **Situational** | A broadly relatable scenario is staged (e.g., being asked about your results, arguing with a skeptical friend) to dramatize the testimonial claim |

**SVS lens:** The Skit moves furthest from the "real person talking" trust signal of the Confessional. It trades raw authenticity for entertainment and memorability. The Substance can be identical to a Confessional, but the Style reframes the message as entertainment rather than testimony.

---

### 4. 🎙️ The Interview

> *"Our story is communicated through at least two characters, where one is typically leading the conversation as the expert and the other is learning about the product or service."*

**Core identity:** A two-person format that externalizes the viewer's own persuasion journey. One character holds authority and knowledge; the other represents the curious, skeptical, or newly-interested viewer. The persuasion happens *between* the characters — and the viewer watches it happen.

**Key characteristics:**
- Minimum two characters on screen
- Clear role asymmetry: one expert/authority, one learner/proxy-viewer
- The "learner" character mirrors the emotional journey the target viewer is being taken on
- Questions drive structure — information is revealed in response to curiosity, not delivered as a monologue
- Social proof is baked into the format: the "learner" asking credulous questions signals that this information is noteworthy

**Variations:**

| Variation | Description |
|---|---|
| **Podcast** | Two people in a sit-down conversation, often with microphones — borrows credibility from the podcast format; feels editorial and thoughtful |
| **Street Interview / Big Sign** | One interviewer approaches strangers or willing participants; results are shown as a social experiment — high novelty, high trust signal |
| **Game Show** | Competitive or gamified format with a host; product knowledge or results are framed as prizes or correct answers — entertaining and energetic |

---

### 5. 🖼️ The Roto React

> *"The talent's face is rotoscoped out of their original background, which is then replaced with b-roll from a different shoot."*

**Core identity:** A post-production hybrid format. Talent is filmed in a native, self-shot style (selfie camera, chest-and-up framing) — but that footage is then composited over separate b-roll. The result blends the intimacy of a direct-to-camera Confessional with the visual richness of polished b-roll.

**Key characteristics:**
- Selfie camera angle is standard (chest and face visible, handheld or mounted at face level)
- The talent's original background is replaced entirely through rotoscoping
- B-roll underneath is from a different shoot — often more professional, branded, or product-focused
- The composite creates a "reacting to the visuals" dynamic even if the two shoots were independent
- Allows native-feeling talent performance to be elevated without a full production overhaul

**Subcategories:**

| Subcategory | Description |
|---|---|
| **The Transformation Ad React** | Talent's reaction/commentary is composited over before-and-after transformation footage — the emotional reaction is layered on top of the visual proof |
| **The Explainer** | Talent explains a concept or product while relevant b-roll plays behind them — creates an "explainer video" feel with a more native talent presence |

**Production note:** The rotoscoping requirement means this archetype has a post-production dependency that others don't. It is worth flagging in production briefs that two separate shoots (talent + b-roll) may be needed, or that existing b-roll libraries should be identified before briefing.

---

### 6. 🎬 The Sitcom

> *"Always more than one character, typically three, where the camera person is also actively involved in the scene."*

**Core identity:** The most ensemble-driven, highest-energy archetype. It shares story territory with Day in the Life, but is distinct in its casting, pacing, and camera philosophy. The Sitcom is entertainment-first — ads in this format feel like short-form social content people actively choose to watch.

**Key characteristics:**
- Always multiple characters — typically three or more
- The camera operator is a **participant in the scene**, not an observer (their presence is felt or acknowledged)
- Camera movement is constant, handheld, reactive — rarely static
- Editing is fast — rarely holding on a single shot for more than a second or two
- The characters are having a genuinely great time; energy and joy are visible throughout

**Sitcom vs. Day in the Life — the critical distinctions:**

| Dimension | Day in the Life | The Sitcom |
|---|---|---|
| **Characters** | Usually one (or two) | Three or more |
| **Camera operator** | Invisible — a neutral recorder | A participant — present in the energy of the scene |
| **Editing pace** | Moderate — holds on shots to let the story breathe | Fast — quick cuts, kinetic energy |
| **Tone** | Authentic, grounded, personal | Fun, high-energy, ensemble |
| **Viewer relationship** | "I relate to this person's story" | "I want to be in that room" |

**SVS lens:** The Sitcom is the most aspirational of the six archetypes in terms of lifestyle signaling. Where the Confessional earns trust through rawness, the Sitcom earns engagement through desirability. Both can carry the same Substance — but the emotional register the viewer ends up in is different.

---

## The Relatable vs. Aspirational Spectrum

This is the foundational visual spectrum of the entire framework — a way of reading *any* piece of footage, any shot, any concept, at any level of granularity. It is a broader and more analytically useful lens than "raw vs. polished" because it describes not just production quality, but the **identity signal the footage is sending to the viewer.**

> **Core definition:** Relatable footage says *"this could be you — this is real, this is from someone like you."* Aspirational footage says *"this is what you want — this is beyond your current reality, and the product bridges that gap."*

Both ends of the spectrum have power. Neither is superior. The skill is knowing where a given shot, concept, or full ad sits — and whether that placement is intentional and serving the Substance.

---

### The Relatable End

**What it looks and feels like:**

Relatable footage genuinely looks like it was created by someone with no professional background — and that's the point. The authenticity isn't performed; it's structural. The absence of production craft *is* the craft, because it creates an immediate signal to the viewer: *this is real, this is from someone like me.*

**Technical markers of Relatable footage:**

| Dimension | What Relatable Looks Like |
|---|---|
| **Composition** | No rule of thirds, no golden ratio, no intentional framing — subject may be off-center, partially cropped, or awkwardly placed in frame |
| **Lighting** | No 3-point lighting setup, often underlit or relying entirely on available light (window light, overhead room lighting), no intentional shadows, no soft box, no rim light |
| **Color** | No deliberate color theory applied — no Albers squares, no complementary color palette, no LUT or grade applied in post; colors are whatever the environment happened to produce |
| **Camera/device** | Older or mid-range phone, not 4K, no stabilization (natural handheld shake present), no professional filters applied in capture or post |
| **Set / environment** | Wherever the person actually is — their kitchen, their bathroom, their car. No set dressing, no intentional prop placement, no cleaned-up background |
| **Product presentation** | Product sitting wherever it was — on a counter, in a hand, next to random objects. Not staged. Doesn't look "commercial." |
| **Editing** | Jump cuts, no color grade, natural audio with ambient noise, no transitions or motion graphics |

**The emotional signal it sends:**
> *"This person was so excited they just grabbed their phone and started filming. They weren't trying to make content — they were trying to share something real."*

This is the energy of a text to a close friend. Not a post. Not an ad. A recommendation from someone who couldn't wait to tell you.

**When it's the right choice:**
- Cold audiences who don't know the brand — skepticism is high, trust must be earned through authenticity
- Products where the primary purchase driver is *"does this actually work for people like me?"*
- Problem-forward narratives where the viewer needs to feel the pain being described is real
- Any context where the viewer's guard needs to come down before the message can land

---

### The Aspirational End

**What it looks and feels like:**

Aspirational footage is what you picture when you think of a TV commercial, a polished influencer post, or a brand's own content. Every shot follows — or deliberately breaks in a sophisticated way — the established rules of visual production. The product isn't shown as it exists in someone's ordinary life; it's shown as it could exist in the life you *want.*

**Technical markers of Aspirational footage:**

| Dimension | What Aspirational Looks Like |
|---|---|
| **Composition** | Intentional — rule of thirds, golden ratio, leading lines, negative space used deliberately. Every element in frame has a reason to be there |
| **Lighting** | 3-point lighting or equivalent, soft boxes, intentional practical lights, controlled shadows, rim lights for separation, product lit to highlight texture and form |
| **Color** | Color theory applied — Albers squares, complementary palettes, consistent grade, LUT applied in post, deliberate warm/cool contrast or monochromatic harmony |
| **Camera/device** | High-end phone (latest flagship, ProRes mode) or cinema camera, 4K or higher, stabilized (gimbal or tripod), calibrated lenses |
| **Set / environment** | Intentionally designed or selected — set dressed, background cleaned and controlled, props chosen for visual and brand alignment |
| **Product presentation** | Staged, lit, and styled to look larger than life — the product is a *hero*, not an incidental object. Macro shots, surface textures, pour shots, hero angles |
| **Editing** | Color graded, music scored, transitions deliberate, motion graphics optionally present, pacing intentional |

**The emotional signal it sends:**
> *"This is what this product looks like at its best. This is the version of your life where you're using it."*

This is the language of brand authority, aspiration, and desire. The viewer isn't being told the product works — they're being shown a world in which it belongs, and invited to inhabit that world.

**When it's the right choice:**
- Warm audiences or retargeting — trust is already partially established, now desire needs to be activated
- Products where aesthetics, lifestyle, or status are part of the value proposition
- Moments in an ad where the product itself needs to be the focal point (hero shots, transformation reveals)
- Any context where the viewer needs to *want* the outcome before they'll act on it

---

### The Spectrum — Not a Binary

Relatable and Aspirational are endpoints, not categories. Every shot, every concept, every ad lives somewhere on the continuum between them. And critically: **a single ad can — and often should — move across the spectrum within itself.**

\`\`\`
RELATABLE ◄──────────────────────────────────────────────► ASPIRATIONAL
  Shaky handheld        Available light        Styled set        Hero product shot
  Old phone             Window light           Gimbal shot        3-point lit
  Real environment      Natural color          Color graded       LUT + grade
  No set dress          Raw edit               Clean B-roll       TV-quality product
\`\`\`

**Example of intentional spectrum movement within a single ad:**
1. The ad opens with shaky, underlit phone footage of the talent complaining about their problem — *deeply Relatable*
2. A few clips in, the product is introduced with a clean, well-lit product shot — *shifting toward Aspirational*
3. The talent's "after" footage is slightly more polished — better lighting, steadier camera, brighter setting — visually signaling that their life improved — *Aspirational-leaning*

This is not inconsistency. This is **visual storytelling using the spectrum as a narrative tool.** The shift from Relatable to Aspirational *is* the transformation arc.

---

### Talent on the Relatable vs. Aspirational Spectrum

The same spectrum applies to the people on screen — independently of how the footage around them is shot. **Talent position on this spectrum is determined by how the viewer's brain categorizes them, not by how "good-looking" they are in an objective sense.**

---

#### Relatable Talent

> *"Your brain often doesn't do too much background analysis when categorizing them — it doesn't fire off as many questions in your subconscious processing."*

Relatable talent are people whose appearance is average or unremarkable — not because they are unattractive in a clearly negative way, but because they don't trigger the elevated pattern-recognition that highly distinctive or conventionally beautiful faces do. They may have what could be described as "ugly" or mediocre features. Their on-screen personality isn't necessarily charming, charismatic, or particularly engaging to watch. They simply look and feel like the kind of person you'd pass in a grocery store and not think twice about.

**The psychological mechanism — how they build trust:**

When the brain encounters an average-looking, unremarkable person, it processes them quickly and without high engagement. There is no status evaluation happening, no aspiration or desire being triggered, no subconscious competition or comparison. The viewer's mental guard stays low because the brain doesn't perceive anything worth analyzing closely.

The result: **the viewer simply believes them.** Not because they've been convinced — but because nothing about this person's presence triggered the skepticism filters. The trust is passive, automatic, and structural. It emerges from the absence of elevated processing, not from active persuasion.

This is **identification-based trust**: *"They look like me. They're not trying to sell me anything. They're just someone who found something that worked."*

**What Relatable talent looks like in practice:**
- Average or irregular features — not conventionally symmetrical or "model" beautiful
- Body language that is natural and unperformed — not trained, not telegraphed
- Delivery that feels unrehearsed — pauses, filler words, imperfect phrasing all increase believability
- Wardrobe and grooming that matches what a real person would actually wear in that context
- Emotional expression that feels proportional and genuine, not heightened or performed

---

#### Aspirational Talent

> *"You either want to sleep with them, be friends with them, or be them."*

Aspirational talent are the unreasonably beautiful, the naturally charming, the magnetic — people whose presence on screen activates immediate and involuntary social and emotional responses in the viewer. They are physically striking, have commanding or effortlessly engaging personalities, and carry an energy that makes the viewer want to inhabit their world.

**The psychological mechanism — how they build trust:**

When the brain encounters an Aspirational person, it enters a heightened state of processing. The viewer subconsciously evaluates: *Do I want to be this person? Do I want to be near this person? Do I want them to like me?* This is the opposite of the Relatable trust pathway — instead of the guard lowering because there's nothing to analyze, the guard lowers because the viewer wants something from this person.

The trust that follows is **aspiration-based and authority-adjacent**: *"If this works for someone like them, it must actually be something. And if I use it, maybe I get a little closer to being like them."*

This is why Aspirational talent don't need to prove anything in the way Relatable talent do — the viewer's desire to believe them does most of the persuasive work. The product becomes a bridge between the viewer's current reality and the version of life that Aspirational talent appears to already inhabit.

**What Aspirational talent looks like in practice:**
- Conventionally or strikingly beautiful — symmetrical, high-contrast features, physically memorable
- Charismatic and naturally engaging — the camera gravitates toward them without any deliberate effort
- Delivery that feels effortless and confident — comfortable in front of a lens, unhurried
- Wardrobe and styling that elevates the scene — not necessarily expensive, but intentional and elevated
- A visible sense that their life is going well — the product exists in a context of success, not struggle

---

#### The Critical Distinction — Two Opposite Trust Pathways

Both Relatable and Aspirational talent build genuine viewer trust. But the mechanism is structurally opposite:

| | Relatable Talent | Aspirational Talent |
|---|---|---|
| **Trust pathway** | Passive, automatic — low processing → no skepticism | Active, desire-driven — high attraction → want to believe |
| **Viewer relationship** | *"They're like me"* — identification | *"I want to be them"* — aspiration |
| **Brain state** | Low engagement → guard down → belief | High engagement → desire activated → compliance |
| **Persuasive work done by** | The absence of triggers | The presence of magnetism |
| **Best for claims about** | "This works for real people" | "This is what your life could look like" |
| **Risk if miscast** | Claim feels too mundane to be worth paying attention to | Claim feels unattainable — "that only works for people like them" |

---

#### The Production × Talent Matrix

Because footage and talent are independent variables on the same spectrum, they create four distinct combinations — each producing a different emotional signature:

| | **Relatable Production** | **Aspirational Production** |
|---|---|---|
| **Relatable Talent** | **Max authenticity** — the viewer's guard is fully down; this is as believable as advertising gets. Best for cold audiences, problem-forward narratives, and products where "does this actually work?" is the primary purchase question. | **Everyman gets the upgrade** — a real-looking person in a polished visual world. The production elevation signals the product delivers real change; the relatable talent keeps the outcome feeling attainable. |
| **Aspirational Talent** | **Caught in a real moment** — the beautiful or charismatic person in raw, unpolished footage. Creates a powerful tension: the aspiration is present, but the rawness signals they're not performing. Can feel like privileged access to their real life. | **Full aspirational world** — the lifestyle ad in its purest form. Maximum desire activation. Best for brand-building, warm audiences, and products where the aspiration *is* the value proposition. |

---

### Applying the Spectrum to Ad Analysis

When analyzing any shot or ad, ask:

1. **Where does this footage sit on the spectrum?** Be specific — note the lighting, the device signal, the environment, the composition.
2. **Is that placement intentional?** Does it serve the Substance of the ad?
3. **Does the footage's position on the spectrum match the claim being made?**
   - A deeply Relatable shot making an aspirational lifestyle claim creates cognitive dissonance
   - An Aspirational product shot paired with a raw, Relatable testimonial creates productive contrast — the product is elevated while the person stays credible
4. **Does the spectrum position shift across the ad?** If so, does the shift serve the narrative arc?

**Red flags:**
- Aspirational footage making authenticity-dependent claims (the polish undercuts the trust signal)
- Relatable footage trying to communicate brand authority or premium positioning (the rawness undercuts the aspiration)
- A spectrum position that is inconsistent without narrative purpose (looks like a budget mismatch, not a creative choice)

---

### Relatable vs. Aspirational Across the Six Visual Archetypes

Each archetype has a natural home on the spectrum, though any archetype can be executed anywhere on it:

| Visual Archetype | Natural Spectrum Position | Why |
|---|---|---|
| **Confessional** | Strongly Relatable | The format's entire trust signal depends on authenticity — production polish undermines it |
| **Day in the Life** | Relatable-to-Center | More visual variety allows for a wider range, but the character-led authenticity keeps it anchored toward Relatable |
| **Skit** | Center | The theatrical nature gives permission for production quality; comedy can work in either direction |
| **Interview** | Center-to-Aspirational | The format borrows credibility from editorial/media contexts — slightly more polish is expected and trusted |
| **Roto React** | Center-to-Aspirational | The compositing itself signals production sophistication, even when the talent footage is raw |
| **Sitcom** | Aspirational-leaning | Ensemble energy, fast editing, and high-fun tone naturally read as more produced and desirable |

**Key insight:** A Confessional executed with Aspirational production values is no longer a Confessional in the emotional sense — the visual identity has overwritten the format's trust signal. Conversely, a Sitcom shot on a shaky phone in available light may retain its ensemble energy but will lose some of its aspirational lifestyle appeal.

---

## Visual Archetype Spectrum

The six archetypes form a rough spectrum from **Relatable** to **Aspirational** (which also maps to raw/authentic → produced/entertaining):

\`\`\`
RELATABLE ◄────────────────────────────────────────────► ASPIRATIONAL
  Confessional → Day in the Life → Roto React → Skit → Interview → Sitcom
\`\`\`

And a spectrum from **individual** to **ensemble**:

\`\`\`
SOLO ◄──────────────────────────────────────────► ENSEMBLE
  Confessional → Day in the Life → Roto React → Skit → Interview → Sitcom
\`\`\`

These spectrums matter for **audience targeting and trust calibration**. Different audience segments respond differently to different positions on these axes:
- Skeptical, first-time audiences often convert better on raw/individual formats (Confessional, Day in the Life)
- Warm or retargeted audiences may respond better to aspirational/ensemble formats (Sitcom, Interview)
- Awareness campaigns may favor entertainment-forward formats (Skit, Sitcom)
- Direct-response campaigns may favor authenticity-forward formats (Confessional, Interview)

---

## Using Visual Archetypes in Analysis

### Step 1 — Identify the archetype
Watch or read the ad and answer:
- How many characters are present?
- Is the camera operator part of the scene?
- Is the talent performing characters, or speaking as themselves?
- Is there a second character asking questions?
- Is there rotoscoping / compositing?
- What is the editing pace and camera style?

Use the answers to match against the six archetypes above.

### Step 2 — Identify the subcategory (if applicable)
Most archetypes have subcategories that narrow the classification further (e.g., a Confessional → Static Solo vs. Dynamic Multi; a Skit → POV vs. Self Talk).

### Step 3 — Map to SVS and TMG
Once the Visual Archetype is identified:
- Use **TMG** to classify what is being *said* (Substance layer)
- Use **SVS** to assess whether the Style (archetype) is serving the Substance — or whether a different archetype might carry the same message more effectively

### Step 4 — Assess archetype diversity
If analyzing a full ad account or creative set:
- List which archetypes are present
- Note any that are absent or underrepresented
- Flag if the account is over-indexed on one archetype (creative fatigue risk)
- Recommend underrepresented archetypes as creative expansion opportunities

---

## Visual Archetype × TMG Quick Reference

Different archetypes tend to naturally carry different TMG categories more effectively — though any archetype *can* carry any TMG beat:

| Visual Archetype | Natural TMG Strength | Why |
|---|---|---|
| **Confessional** | Personal Context (Problems, Agitate), Results | Raw authenticity makes emotional claims believable |
| **Day in the Life** | Product Interaction, Results | Visual storytelling shows the product working in real life |
| **Skit** | Personal Context (Problems, Discredit), Service Information | Comedy is efficient at externalizing relatable pain and delivering product education |
| **Interview** | Service Information, Results | Q&A format naturally surfaces benefits and proof points |
| **Roto React** | Results, Product Interaction | Reaction format emotionally punctuates visual proof |
| **Sitcom** | Personal Context (Lifestyle), Results | Ensemble energy makes aspirational outcomes feel achievable and fun |

---

## Creative Diversity Principle

> *"Creative diversity helps accounts thrive in the social media ecosystem just how biodiversity helps ecosystems in nature thrive."*
> — Visual Archetypes Workshop

An account running exclusively Confessionals will fatigue Confessional audiences. The same Substance delivered through a Sitcom, an Interview, or a Day in the Life reaches:
- Different audience segments (different people respond to different formats)
- The same audience segment at different stages of the funnel
- The same audience segment at different times without triggering fatigue

**The goal is not to pick the best archetype — it is to build a portfolio of archetypes that all carry your core Substance.**

All types of footage have value. iPhone-quality and cinema-quality each shine in different archetype contexts. Relatability and aspiration are not opposites — they are different instruments in the same account.
`,runs:[]}),
];
const DEFAULT_SHARED=[];

let S={personal:[],shared:[],lib:'personal',type:'all',selected:null,selLib:null,renaming:null};

async function load(){
  loadFolders();
  if(typeof loadMaps === 'function') loadMaps();
  try {
    const r = await sbFetch('skills?archived=eq.false&order=name');
    if(r.ok) {
      const data = await r.json();
      if(data.length) {
        S.personal = data.map(row=>mkItem({
          id:row.id, type:row.type, name:row.name, author:row.author,
          color:row.color, icon:row.icon, description:row.description,
          prompt:row.prompt, notes:row.notes, archived:row.archived,
          runs:row.runs||[], connectedSkills:row.connected_skills||[],
          updatedAt: new Date(row.updated_at).getTime()
        }));
        S.shared = [];
        console.log('Loaded '+S.personal.length+' skills from Supabase');
      } else {
        // Empty DB — seed with defaults
        S.personal = DEFAULT_PERSONAL;
        await saveP();
      }
    } else { throw new Error('Supabase error '+r.status); }
  } catch(e) {
    console.warn('Supabase unavailable, using localStorage:', e.message);
    try{const r=await storage_get(PK);S.personal=r?JSON.parse(r):DEFAULT_PERSONAL;}catch(e2){S.personal=DEFAULT_PERSONAL;}
    try{const r=await storage_get(SK,true);S.shared=r?JSON.parse(r):DEFAULT_SHARED;}catch(e2){S.shared=DEFAULT_SHARED;}
    if(!S.personal||!S.personal.length)S.personal=DEFAULT_PERSONAL;
  }
  rerender();
  if(S.personal.length)selectItem(S.personal[0].id,'personal');
}

// localStorage-based storage (works in deployed app)
async function storage_get(key,shared=false){
  try{return localStorage.getItem(key);}catch(e){return null;}
}
async function storage_set(key,val,shared=false){
  try{localStorage.setItem(key,val);}catch(e){}
}
async function saveP(){
  try{await storage_set(PK,JSON.stringify(S.personal));}catch(e){}
  try{
    for(const item of S.personal){
      const row={id:item.id,type:item.type,name:item.name,author:item.author||'Jarrett',
        color:item.color,icon:item.icon,description:item.description||'',
        prompt:item.prompt||'',notes:item.notes||'',archived:item.archived||false,
        runs:item.runs||[],connected_skills:item.connectedSkills||[],
        updated_at:new Date(item.updatedAt||Date.now()).toISOString()};
      const r=await sbFetch('skills?id=eq.'+item.id,{method:'PATCH',headers:{'Prefer':'return=minimal'},body:JSON.stringify(row)});
      if(r.status===404||r.status===204&&false) await sbFetch('skills',{method:'POST',body:JSON.stringify(row)});
    }
  }catch(e){console.warn('Supabase save:',e.message);}
}
async function saveSh(){await storage_set(SK,JSON.stringify(S.shared),true);}

function setLib(l){} // Mine/Team removed — single library
function setType(t,btn){S.type=t;document.querySelectorAll('.type-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');rerender();}
function getSrc(l){return [...S.personal,...S.shared];}
function getFiltered(){const src=getSrc('all'),q=(document.getElementById('search')||{}).value||'';return src.filter(i=>!i.archived&&(S.type==='all'||i.type===S.type)&&(!q||i.name.toLowerCase().includes(q.toLowerCase())||(i.author||'').toLowerCase().includes(q.toLowerCase())));}
function toggleDrawer(){drawerOpen=!drawerOpen;const d=document.getElementById('top-drawer');const ch=document.getElementById('drawer-chevron');if(d)d.className='section-body '+(drawerOpen?'expanded':'collapsed');if(ch)ch.classList.toggle('open',drawerOpen);}

function rerender(){
  const totalCount = [...S.personal,...S.shared].filter(i=>!i.archived).length;
  // counts now shown in type filter if needed
  const items=getFiltered(),list=document.getElementById('item-list');
  if(!list)return;
  if(!items.length){list.innerHTML='<div style="padding:16px 8px;font-size:12px;color:#5A6280;text-align:center;">No items found</div>';return;}
  // All tab gets folders + drag/drop; Agents/Skills get flat list
  if(S.type==='all') {
    renderAllTab(items);
  } else {
    list.innerHTML = items.map(item=>renderItem(item,false)).join('');
    if(S.renaming){const el=document.getElementById('rename-'+S.renaming);if(el){el.focus();el.select();}}
  }
  if(S.selected)renderMain();
  else{
    document.getElementById('topbar').innerHTML=`<div class="topbar-left"><button class="icon-btn" onclick="toggleSidebar()"><i class="ti ti-layout-sidebar"></i></button><span style="font-size:14px;color:var(--text-muted)">Select an item</span></div>`;
    document.getElementById('content-area').innerHTML='<div class="no-select">Select an agent or skill to view</div>';
  }
}

function startRename(id){S.renaming=id;rerender();}
async function finishRename(id){
  const el=document.getElementById('rename-'+id);if(!el)return;
  const val=el.value.trim();if(!val){S.renaming=null;rerender();return;}
  const src=getSrc(S.lib);const item=src.find(i=>i.id===id);
  if(item){item.name=val;item.updatedAt=Date.now();if(S.lib==='personal')await saveP();else await saveSh();}
  S.renaming=null;rerender();
}
async function archiveItem(id,lib){
  const src=getSrc(lib);const item=src.find(i=>i.id===id);
  if(!item||!confirm(`Archive "${item.name}"?`))return;
  item.archived=true;item.updatedAt=Date.now();
  if(lib==='personal')await saveP();else await saveSh();
  if(S.selected===id){S.selected=null;S.selLib=null;}
  rerender();
}
function selectItem(id,lib){
  S.selected=id;S.selLib=lib;menuOpen=false;pickerOpen=false;rerender();renderMain();
  // drag and drop to add items instead of auto-add
}
function getSelected(){return getSrc(S.selLib||S.lib).find(i=>i.id===S.selected);}
function getAllSkills(){return[...S.personal,...S.shared].filter(i=>i.type==='skill'&&!i.archived);}

function buildMapSection(item){
  const mapBodyId = 'map-section-body';
  if(mapSectionOpen === null || mapSectionOpen === undefined) mapSectionOpen = true; const isOpen = mapSectionOpen;
  return `
    <div class="section-header" onclick="toggleMapSection('${mapBodyId}')">
      <div class="section-title"><i class="ti ti-map-2" style="font-size:12px"></i> Map</div>
      <i class="ti ti-chevron-up section-chevron ${isOpen?'open':''}" id="map-section-chevron"></i>
    </div>
    <div id="${mapBodyId}" class="section-body map-body ${isOpen?'expanded':'collapsed'}">
      <div id="map-canvas-wrap" class="map-canvas-wrap empty-state">
        <div class="map-empty-msg">Click a skill to add it to the active map</div>
        <div class="map-empty-hint">Select or create a map in the sidebar first</div>
      </div>
    </div>`;
}


function toggleKBSection(){
  const el = document.getElementById('kb-section-body');
  if(!el) return;
  const isOpen = el.classList.contains('expanded');
  el.classList.remove('expanded','collapsed');
  el.classList.add(isOpen ? 'collapsed' : 'expanded');
  if(!isOpen){
    // Reset to natural flex fill when opening (unless user-sized)
    if(!el.classList.contains('user-sized')){
      el.style.flex=''; el.style.height='';
    }
  }
  localStorage.setItem('sb_kb_open', isOpen ? '0' : '1');
  const chevron = document.getElementById('kb-chevron');
  if(chevron) chevron.classList.toggle('open', !isOpen);
}






function switchViewMode(mode) {
  window.currentViewMode = mode;
  if(mode === 'map') mapSectionOpen = true;
  renderMain();
}

function toggleTestNotesSection() {
  window.testNotesCollapsed = !window.testNotesCollapsed;
  renderMain();
}

function renderMain(){
  const item=getSelected();if(!item)return;
  const viewMode=window.currentViewMode||'map';
  const testNotesCollapsed=window.testNotesCollapsed||false;
  const isPersonal=S.selLib==='personal';
  const hex=colorHex(item.color||'gray');
  document.getElementById('topbar').innerHTML=`
    <div class="topbar-left">
      <button class="icon-btn" onclick="toggleSidebar()"><i class="ti ti-layout-sidebar"></i></button>
      <div class="menu-wrap">
        <button class="icon-btn" onclick="toggleMenu()"><i class="ti ti-adjustments-horizontal"></i></button>
        <div class="menu-dropdown" id="action-menu">
          <button class="menu-item" onclick="openInClaude();closeMenu()"><i class="ti ti-message" style="font-size:14px;color:#5A6280"></i> Open in Claude</button>
          <button class="menu-item" onclick="editItem();closeMenu()"><i class="ti ti-pencil" style="font-size:14px;color:#5A6280"></i> Edit prompt</button>
          ${isPersonal?`<button class="menu-item" onclick="publishToTeam();closeMenu()"><i class="ti ti-arrow-up" style="font-size:14px;color:#5A6280"></i> Publish to team</button>`:''}
          <hr class="menu-divider">
          <button class="menu-item" onclick="startRename('${item.id}');closeMenu()"><i class="ti ti-cursor-text" style="font-size:14px;color:#5A6280"></i> Rename</button>
          <button class="menu-item danger" onclick="archiveItem('${item.id}','${S.selLib}');closeMenu()"><i class="ti ti-archive" style="font-size:14px"></i> Archive</button>
        </div>
      </div>
      <div class="badge-stack">
        <span class="badge b-${item.type}">${item.type}</span>
        <span class="badge ${isPersonal?'b-personal':'b-shared'}">${isPersonal?'mine':'team'}</span>
      </div>
      <div class="item-icon-lg" style="background:${hex}18;color:${hex};border:1.5px solid ${hex}40;" onclick="openPicker()">
        <i class="ti ${item.icon||'ti-puzzle'}" style="font-size:14px;"></i>
      </div>
      <span class="topbar-title">${esc(item.name)}</span>
    </div>`;

  const pickerHTML=pickerOpen?`
    <div class="picker-popup open">
      <div class="picker-label">Color</div>
      <div class="color-row">${Object.entries(COLORS).map(([n,h])=>`<div class="color-dot${item.color===n?' active':''}" style="background:${h}" onclick="setColor('${n}')" title="${n}"></div>`).join('')}</div>
      <div class="picker-label">Icon</div>
      <div class="icon-row">${ICONS.map(ic=>`<div class="icon-opt${item.icon===ic?' active':''}" onclick="setIcon('${ic}')"><i class="ti ${ic}"></i></div>`).join('')}</div>
    </div>`:'';


  const drawer=`
    <div class="section-header" onclick="toggleDrawer()">
      <div class="section-title"><i class="ti ti-tools" style="font-size:12px"></i> Test · Notes</div>
      <i class="ti ti-chevron-up section-chevron ${drawerOpen?'open':''}" id="drawer-chevron"></i>
    </div>
    <div class="section-body ${drawerOpen?'expanded':'collapsed'}" id="top-drawer">
      <div class="drawer-body">
        <div class="drawer-section">
          <div class="drawer-section-label">Test input</div>
          <textarea id="test-input" placeholder="Paste a sample input…"></textarea>
          <button class="run-btn" id="run-btn" onclick="runTest()"><i class="ti ti-player-play"></i> Run test</button>
        </div>
        <div class="drawer-section">
          <div class="drawer-section-label">Notes</div>
          <textarea id="notes-input" placeholder="Scratchpad…">${esc(item.notes||'')}</textarea>
          <button class="notes-save" onclick="saveNotes()"><i class="ti ti-device-floppy"></i> Save notes</button>
        </div>
      </div>
    </div>`;

  let mainContent='';
  if(item.type==='skill'){
    const kbOpen = localStorage.getItem('sb_kb_open') !== '0'; // defaults to open
    mainContent=`
      <div class="section-header" onclick="toggleKBSection()">
        <div class="section-title"><i class="ti ti-books" style="font-size:12px;color:#0E6E5C"></i> Skill knowledge base</div>
        <div style="display:flex;align-items:center;gap:8px;">
          <div class="author-chip"><div class="avatar">${initials(item.author||'Me')}</div>${esc(item.author||'You')}</div>
          <i class="ti ti-chevron-up section-chevron ${kbOpen?'open':''}" id="kb-chevron"></i>
        </div>
      </div>
      <div id="kb-section-body" class="section-body ${kbOpen?'expanded':'collapsed'}">
      <div class="main-scroll">
        <div class="skill-desc-block">
          <div class="skill-desc-name">${esc(item.name)}</div>
          ${item.description?`<div class="skill-desc-text">${inl(item.description)}</div>`:`<div class="skill-desc-empty">No description yet</div>`}
        </div>
        <div class="md-body">${md(item.prompt)}</div>
        <div class="skill-meta-footer">
          <div><div class="meta-label">Author</div><div class="meta-value">${esc(item.author||'You')}</div></div>
          <div><div class="meta-label">Updated</div><div class="meta-value">${fullDate(item.updatedAt)}</div></div>
        </div>
        ${historyPanel(item)}
      </div>
      </div>`;
  } else {
    const connectedIds=item.connectedSkills||[];
    const allSkills=getAllSkills();
    const connected=allSkills.filter(s=>connectedIds.includes(s.id));
    const unconnected=allSkills.filter(s=>!connectedIds.includes(s.id));
    const kbOpen = localStorage.getItem('sb_kb_open') !== '0'; // defaults to open
    mainContent=`
      <div class="section-header" onclick="toggleKBSection()">
        <div class="section-title"><i class="ti ti-code" style="font-size:12px;color:#4A2080"></i> System prompt</div>
        <div style="display:flex;align-items:center;gap:8px;">
          <div class="author-chip"><div class="avatar">${initials(item.author||'Me')}</div>${esc(item.author||'You')}</div>
          <i class="ti ti-chevron-up section-chevron ${kbOpen?'open':''}" id="kb-chevron"></i>
        </div>
      </div>
      <div id="kb-section-body" class="section-body ${kbOpen?'expanded':'collapsed'}">
      <div class="main-scroll">
        <div class="prompt-text">${esc(item.prompt)}</div>
        <div class="skills-section">
          <div style="padding:7px 12px;font-size:10px;font-weight:700;color:#0E6E5C;text-transform:uppercase;letter-spacing:.08em;display:flex;align-items:center;justify-content:space-between;border-bottom:1.5px solid var(--border-mid);">
            <div style="display:flex;align-items:center;gap:6px;"><i class="ti ti-plug" style="font-size:12px"></i> Connected skills</div>
            <span style="color:var(--text-muted);text-transform:none;letter-spacing:0;font-size:11px;font-weight:400;">${connected.length} of ${allSkills.length}</span>
          </div>
          <div class="skills-list">
            ${connected.length?connected.map(s=>`<div class="skill-chip" onclick="selectItem('${s.id}','${S.personal.find(x=>x.id===s.id)?'personal':'shared'}')">${iconEl(s.icon,s.color,11)}${esc(s.name)}<i class="ti ti-x" style="font-size:11px;opacity:.4" onclick="event.stopPropagation();disconnectSkill('${item.id}','${s.id}')"></i></div>`).join(''):'<span class="skill-chip-empty">No skills connected yet</span>'}
            ${unconnected.length?`<div class="add-skill-chip" onclick="addSkillPrompt()"><i class="ti ti-plus" style="font-size:12px"></i> Connect skill</div>`:''}
          </div>
        </div>
        ${historyPanel(item)}
      </div>
      <div class="section-resize" id="kb-resize"></div>
      </div>`;
  }

  // ===== Right panel: Map / Skills toggle, Test-Notes pinned at bottom =====
  if(viewMode === 'map') mapSectionOpen = true;

  const tabStyle = (active) =>
    'padding:7px 16px;border-radius:8px;cursor:pointer;font-size:12px;font-weight:600;'+
    'border:1.5px solid '+(active?'var(--ts-navy-mid)':'var(--border-mid)')+';'+
    'background:'+(active?'var(--ts-navy-pale)':'#fff')+';'+
    'color:'+(active?'var(--ts-navy)':'var(--text-secondary)')+';transition:all .12s;';

  const tabBar =
    '<div style="display:flex;gap:8px;padding:10px 14px;border-bottom:1.5px solid var(--border-mid);background:#B8D8E8;flex-shrink:0;">'+
      '<button onclick="switchViewMode(\'map\')" style="'+tabStyle(viewMode==='map')+'"><i class="ti ti-map-2" style="font-size:13px;"></i> Map</button>'+
      '<button onclick="switchViewMode(\'skills\')" style="'+tabStyle(viewMode==='skills')+'"><i class="ti ti-books" style="font-size:13px;"></i> Skills</button>'+
    '</div>';

  const mapBody = '<div id="map-canvas-wrap" class="map-canvas-wrap"></div>';
  const bodyContent = (viewMode === 'map') ? mapBody : mainContent;

  const tnHeader =
    '<div onclick="toggleTestNotesSection()" style="padding:9px 14px;cursor:pointer;display:flex;align-items:center;justify-content:space-between;font-size:11px;font-weight:700;color:#fff;background:#1a2b4a;text-transform:uppercase;letter-spacing:.08em;">'+
      '<span><i class="ti ti-flask" style="font-size:12px;"></i> Test &middot; Notes</span>'+
      '<i class="ti ti-chevron-'+(testNotesCollapsed?'up':'down')+'" style="font-size:14px;"></i>'+
    '</div>';

  const tnFields = testNotesCollapsed ? '' :
    '<div style="padding:12px 14px;display:flex;flex-direction:column;gap:14px;max-height:240px;overflow-y:auto;">'+
      '<div style="display:flex;flex-direction:column;gap:5px;">'+
        '<label style="font-size:11px;font-weight:600;color:var(--text-secondary);">Run test</label>'+
        '<textarea id="test-input" placeholder="Paste a sample input&hellip;" style="padding:8px 10px;border:1.5px solid var(--border-mid);border-radius:8px;font-family:inherit;font-size:12px;resize:vertical;min-height:48px;background:#fff;color:var(--text-primary);"></textarea>'+
        '<button class="run-btn" id="run-btn" onclick="runTest()" style="align-self:flex-start;padding:6px 14px;background:var(--ts-navy);color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:12px;font-weight:600;"><i class="ti ti-player-play" style="font-size:12px;"></i> Run test</button>'+
      '</div>'+
      '<div style="display:flex;flex-direction:column;gap:5px;">'+
        '<label style="font-size:11px;font-weight:600;color:var(--text-secondary);">Thoughts on skill / map</label>'+
        '<textarea id="notes-input" placeholder="Jot down thoughts&hellip;" style="padding:8px 10px;border:1.5px solid var(--border-mid);border-radius:8px;font-family:inherit;font-size:12px;resize:vertical;min-height:64px;background:#fff;color:var(--text-primary);">'+esc(item.notes||'')+'</textarea>'+
        '<button class="notes-save" onclick="saveNotes()" style="align-self:flex-start;padding:6px 14px;background:var(--ts-navy);color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:12px;font-weight:600;"><i class="ti ti-device-floppy" style="font-size:12px;"></i> Save notes</button>'+
      '</div>'+
    '</div>';

  const testNotesHtml =
    '<div style="border-top:1.5px solid var(--border-mid);background:var(--bg-panel);flex-shrink:0;display:flex;flex-direction:column;">'+tnHeader+tnFields+'</div>';

  document.getElementById('content-area').innerHTML =
    '<div class="content-col" style="position:relative;">'+
      pickerHTML+tabBar+
      '<div style="flex:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column;background:var(--bg-panel);">'+bodyContent+'</div>'+
      testNotesHtml+
    '</div>';

  if(pickerOpen) setTimeout(()=>document.addEventListener('click',closePicker,{once:true}),0);
  if(viewMode === 'map') setTimeout(()=>{ if(typeof renderMapCanvas==='function') renderMapCanvas(); }, 30);
}
function openPicker(){pickerOpen=!pickerOpen;renderMain();}
function closePicker(){pickerOpen=false;renderMain();}
async function setColor(c){const item=getSelected();if(!item)return;item.color=c;item.updatedAt=Date.now();if(S.selLib==='personal')await saveP();else await saveSh();pickerOpen=true;rerender();renderMain();}
async function setIcon(ic){const item=getSelected();if(!item)return;item.icon=ic;item.updatedAt=Date.now();if(S.selLib==='personal')await saveP();else await saveSh();pickerOpen=true;rerender();renderMain();}
async function saveNotes(){
  const item=getSelected();const el=document.getElementById('notes-input');if(!item||!el)return;
  item.notes=el.value;item.updatedAt=Date.now();
  if(S.selLib==='personal')await saveP();else await saveSh();
  const btn=document.querySelector('.notes-save');
  if(btn){btn.innerHTML='<i class="ti ti-check"></i> Saved';setTimeout(()=>{btn.innerHTML='<i class="ti ti-device-floppy"></i> Save notes';},1200);}
  rerender();
}
async function disconnectSkill(agentId,skillId){
  const src=getSrc(S.selLib);const agent=src.find(i=>i.id===agentId);if(!agent)return;
  agent.connectedSkills=(agent.connectedSkills||[]).filter(id=>id!==skillId);agent.updatedAt=Date.now();
  if(S.selLib==='personal')await saveP();else await saveSh();rerender();
}
function addSkillPrompt(){alert('To connect a skill, open Claude and describe which skill you want to link to this agent.');}
async function runTest(){
  const item=getSelected();const input=document.getElementById('test-input').value.trim();
  if(!input){alert('Add a test input first');return;}
  const btn=document.getElementById('run-btn');btn.classList.add('busy');btn.innerHTML='<span class="spinner"></span> Running…';
  try{
    const res=await fetch(ANTHROPIC_API,{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({model:'claude-sonnet-4-6',max_tokens:1000,system:item.prompt,messages:[{role:'user',content:input}]})});
    const data=await res.json();
    const output=data.content?data.content.filter(b=>b.type==='text').map(b=>b.text).join('\n'):'No output';
    const t=new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
    item.runs.push({time:t,input:input.slice(0,55)+(input.length>55?'…':''),output,ok:true});
    item.updatedAt=Date.now();
    if(S.selLib==='personal')await saveP();else await saveSh();
    alert('Output:\n\n'+output);
    rerender();
  }catch(e){
    const t=new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
    item.runs.push({time:t,input:input.slice(0,55),output:e.message,ok:false});
    item.updatedAt=Date.now();
    if(S.selLib==='personal')await saveP();else await saveSh();rerender();
  }
  btn.classList.remove('busy');btn.innerHTML='<i class="ti ti-player-play"></i> Run test';
}
async function publishToTeam(){
  const item=getSelected();if(!item)return;
  const viewMode=window.currentViewMode||'map';
  const testNotesCollapsed=window.testNotesCollapsed||false;
  if(S.shared.find(i=>i.name===item.name)){alert(`"${item.name}" is already in the team library.`);return;}
  S.shared.push({...item,id:'sh_'+Date.now(),author:item.author,runs:[],updatedAt:Date.now()});
  await saveSh();alert(`"${item.name}" published to team!`);rerender();
}
function editItem(){
  const item=getSelected();if(!item)return;
  const viewMode=window.currentViewMode||'map';
  const testNotesCollapsed=window.testNotesCollapsed||false;
  const newPrompt=prompt('Edit prompt:',item.prompt);
  if(newPrompt&&newPrompt!==item.prompt){item.prompt=newPrompt;item.updatedAt=Date.now();if(S.selLib==='personal')saveP();else saveSh();rerender();}
}
function addNew(type){
  const name=prompt(`New ${type} name:`);
  if(!name)return;
  const id=type[0]+'_'+Date.now();
  const item=mkItem({id,type,name,author:'You',connectedSkills:[],color:type==='skill'?'teal':'purple',icon:type==='skill'?'ti-puzzle':'ti-robot',description:'',prompt:'',runs:[]});
  S.personal.push(item);saveP();rerender();selectItem(id,'personal');
}

// Service worker — unregister any old ones, don't cache
if('serviceWorker' in navigator){
  navigator.serviceWorker.getRegistrations().then(regs=>{
    regs.forEach(reg=>reg.unregister());
  });
  caches.keys().then(keys=>keys.forEach(k=>caches.delete(k)));
}

// Resizable sidebar
(function(){
  const handle = document.getElementById('resize-handle');
  const sidebar = document.getElementById('sidebar');
  if(!handle||!sidebar) return;
  let dragging=false, startX=0, startW=0;
  handle.addEventListener('mousedown', e=>{
    dragging=true; startX=e.clientX;
    startW=sidebar.offsetWidth;
    handle.classList.add('dragging');
    document.body.style.cursor='col-resize';
    document.body.style.userSelect='none';
    e.preventDefault();
  });
  document.addEventListener('mousemove', e=>{
    if(!dragging) return;
    const newW = Math.min(380, Math.max(180, startW+(e.clientX-startX)));
    sidebar.style.setProperty('--sidebar-w', newW+'px');
    sidebar.style.width = newW+'px';
  });
  document.addEventListener('mouseup', ()=>{
    if(!dragging) return;
    dragging=false;
    handle.classList.remove('dragging');
    document.body.style.cursor='';
    document.body.style.userSelect='';
    // persist width
    try{ localStorage.setItem('sb_sidebar_w', sidebar.offsetWidth); }catch(e){}
  });
  // restore saved width
  try{
    const saved = localStorage.getItem('sb_sidebar_w');
    if(saved){ sidebar.style.width=saved+'px'; }
  }catch(e){}
})();


// ── FOLDER & DRAG STATE ────────────────────────────────────────────────────
// folders stored as: [{id, name, itemIds[], collapsed}]
const FK = 'sb_folders_v1';
let folders = [];
let itemOrder = []; // ordered list of item ids at root level
let dragState = null; // {type:'item'|'folder', id}
let ctxMenu = null;

function loadFolders() {
  try { folders = JSON.parse(localStorage.getItem(FK) || '[]'); } catch(e) { folders = []; }
  try { itemOrder = JSON.parse(localStorage.getItem('sb_item_order_v1') || '[]'); } catch(e) { itemOrder = []; }
}
function saveFolders() {
  try {
    localStorage.setItem(FK, JSON.stringify(folders));
    localStorage.setItem('sb_item_order_v1', JSON.stringify(itemOrder));
  } catch(e) {}
}
function getFolderById(id) { return folders.find(f=>f.id===id); }
function allItems() { return [...S.personal, ...S.shared].filter(i=>!i.archived); }

// ── FOLDER OPERATIONS ──────────────────────────────────────────────────────
function addFolder() {
  const name = prompt('Folder name:');
  if(!name) return;
  const id = 'f_'+Date.now();
  folders.push({id, name, itemIds:[], collapsed:false});
  saveFolders();
  rerender();
}

function renameFolder(folderId) {
  const f = getFolderById(folderId);
  if(!f) return;
  const name = prompt('Rename folder:', f.name);
  if(name && name !== f.name) { f.name = name; saveFolders(); rerender(); }
}

function deleteFolder(folderId) {
  const f = getFolderById(folderId);
  if(!f || !confirm('Delete folder "'+f.name+'"? Items will move to root.')) return;
  folders = folders.filter(x=>x.id!==folderId);
  saveFolders();
  rerender();
}

function toggleFolder(folderId) {
  const f = getFolderById(folderId);
  if(f) { f.collapsed = !f.collapsed; saveFolders(); rerender(); }
}

function moveItemToFolder(itemId, folderId) {
  // Remove from all folders first
  folders.forEach(f => { f.itemIds = f.itemIds.filter(id=>id!==itemId); });
  // Remove from root order
  itemOrder = itemOrder.filter(id=>id!==itemId);
  if(folderId) {
    const f = getFolderById(folderId);
    if(f && !f.itemIds.includes(itemId)) f.itemIds.push(itemId);
  } else {
    itemOrder.push(itemId);
  }
  saveFolders();
  rerender();
}

function getItemFolder(itemId) {
  return folders.find(f=>f.itemIds.includes(itemId)) || null;
}

// ── CONTEXT MENU ──────────────────────────────────────────────────────────
function showCtxMenu(e, itemId) {
  e.preventDefault();
  e.stopPropagation();
  dismissCtxMenu();
  const item = allItems().find(i=>i.id===itemId);
  if(!item) return;
  const currentFolder = getItemFolder(itemId);
  const foldersAvail = folders.filter(f=>f.id!==(currentFolder&&currentFolder.id));
  
  const menu = document.createElement('div');
  menu.className = 'ctx-menu';
  menu.style.top = e.clientY+'px';
  menu.style.left = e.clientX+'px';
  menu.innerHTML = `
    <div class="ctx-item" onclick="startRename('${itemId}');dismissCtxMenu()"><i class="ti ti-cursor-text" style="font-size:13px;color:var(--text-muted)"></i> Rename</div>
    <hr class="ctx-divider">
    ${foldersAvail.length ? foldersAvail.map(f=>`<div class="ctx-item" onclick="moveItemToFolder('${itemId}','${f.id}');dismissCtxMenu()"><i class="ti ti-folder" style="font-size:13px;color:var(--text-muted)"></i> Move to "${f.name}"</div>`).join('') : ''}
    ${currentFolder ? `<div class="ctx-item" onclick="moveItemToFolder('${itemId}',null);dismissCtxMenu()"><i class="ti ti-folder-off" style="font-size:13px;color:var(--text-muted)"></i> Remove from folder</div>` : ''}
    <hr class="ctx-divider">
    <div class="ctx-item danger" onclick="archiveItem('${itemId}','${S.personal.find(x=>x.id===itemId)?'personal':'shared'}');dismissCtxMenu()"><i class="ti ti-archive" style="font-size:13px"></i> Archive</div>
  `;
  document.body.appendChild(menu);
  ctxMenu = menu;
  // Adjust if off screen
  const rect = menu.getBoundingClientRect();
  if(rect.right > window.innerWidth) menu.style.left = (window.innerWidth - rect.width - 8)+'px';
  if(rect.bottom > window.innerHeight) menu.style.top = (e.clientY - rect.height)+'px';
  setTimeout(()=>document.addEventListener('click', dismissCtxMenu, {once:true}), 0);
}

function dismissCtxMenu() {
  if(ctxMenu) { ctxMenu.remove(); ctxMenu=null; }
}

// ── DRAG & DROP ────────────────────────────────────────────────────────────
function onDragStart(e, itemId) {
  dragState = {type:'item', id:itemId};
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', itemId);
  setTimeout(()=>{
    const el = document.querySelector('.item[data-id="'+itemId+'"]');
    if(el) el.classList.add('dragging');
  }, 0);
}

function onDragEnd(e) {
  document.querySelectorAll('.dragging,.drag-over,.drag-over-folder').forEach(el=>{
    el.classList.remove('dragging','drag-over','drag-over-folder');
  });
  dragState = null;
}

function onDragOver(e, targetItemId) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  document.querySelectorAll('.drag-over').forEach(el=>el.classList.remove('drag-over'));
  const el = document.querySelector('.item[data-id="'+targetItemId+'"]');
  if(el) el.classList.add('drag-over');
}

function onDropOnItem(e, targetItemId) {
  e.preventDefault();
  if(!dragState || dragState.id===targetItemId) return;
  const srcId = dragState.id;
  const srcFolder = getItemFolder(srcId);
  const tgtFolder = getItemFolder(targetItemId);
  
  if(srcFolder && tgtFolder && srcFolder.id===tgtFolder.id) {
    // Reorder within same folder
    const arr = srcFolder.itemIds;
    const fromIdx = arr.indexOf(srcId);
    const toIdx = arr.indexOf(targetItemId);
    arr.splice(fromIdx,1);
    arr.splice(toIdx,0,srcId);
  } else if(!srcFolder && !tgtFolder) {
    // Reorder at root
    ensureItemOrder();
    const fromIdx = itemOrder.indexOf(srcId);
    const toIdx = itemOrder.indexOf(targetItemId);
    if(fromIdx>-1 && toIdx>-1) {
      itemOrder.splice(fromIdx,1);
      itemOrder.splice(toIdx,0,srcId);
    }
  } else {
    // Move to target's folder (or root)
    moveItemToFolder(srcId, tgtFolder ? tgtFolder.id : null);
    return;
  }
  saveFolders();
  rerender();
}

function onDragOverFolder(e, folderId) {
  e.preventDefault();
  document.querySelectorAll('.drag-over-folder').forEach(el=>el.classList.remove('drag-over-folder'));
  const el = document.querySelector('.folder-header[data-folder-id="'+folderId+'"]');
  if(el) el.classList.add('drag-over-folder');
}

function onDropOnFolder(e, folderId) {
  e.preventDefault();
  if(!dragState) return;
  moveItemToFolder(dragState.id, folderId);
}

function ensureItemOrder() {
  // Make sure all current items are represented in itemOrder
  const allIds = getSrc(S.lib).filter(i=>!i.archived&&!getItemFolder(i.id)).map(i=>i.id);
  allIds.forEach(id=>{ if(!itemOrder.includes(id)) itemOrder.push(id); });
  itemOrder = itemOrder.filter(id=>allIds.includes(id));
}

// ── RENDER ALL TAB WITH FOLDERS ────────────────────────────────────────────
function renderAllTab(items) {
  const list = document.getElementById('item-list');
  
  // Items in folders
  const inFolderIds = new Set(folders.flatMap(f=>f.itemIds));
  const rootItems = items.filter(i=>!inFolderIds.has(i.id));
  
  // Ensure order
  ensureItemOrder();
  const rootOrdered = [...rootItems].sort((a,b)=>{
    const ai = itemOrder.indexOf(a.id);
    const bi = itemOrder.indexOf(b.id);
    return (ai===-1?9999:ai) - (bi===-1?9999:bi);
  });

  let html = '';

  // Render folders
  folders.forEach(folder => {
    const folderItems = folder.itemIds
      .map(id=>items.find(i=>i.id===id))
      .filter(Boolean);
    
    html += `
      <div class="folder" data-folder-id="${folder.id}">
        <div class="folder-header" data-folder-id="${folder.id}"
          onclick="toggleFolder('${folder.id}')"
          ondragover="onDragOverFolder(event,'${folder.id}')"
          ondrop="onDropOnFolder(event,'${folder.id}')">
          <i class="ti ti-chevron-right folder-chevron ${folder.collapsed?'':'open'}"></i>
          <i class="ti ti-folder${folder.collapsed?'':'-open'} folder-icon" style="color:var(--ts-navy)"></i>
          <span class="folder-name">${esc(folder.name)}</span>
          <span class="folder-count">${folderItems.length}</span>
          <div class="folder-actions" onclick="event.stopPropagation()">
            <button class="ia-btn" onclick="renameFolder('${folder.id}')" title="Rename"><i class="ti ti-pencil"></i></button>
            <button class="ia-btn danger" onclick="deleteFolder('${folder.id}')" title="Delete"><i class="ti ti-trash"></i></button>
          </div>
        </div>
        <div class="folder-items ${folder.collapsed?'collapsed':''}">
          ${folderItems.length ? folderItems.map(item=>renderItem(item,true)).join('') : '<div style="padding:6px 8px;font-size:11px;color:var(--text-muted);">Drop items here</div>'}
        </div>
      </div>`;
  });

  // Render root items
  rootOrdered.forEach(item => { html += renderItem(item, false); });

  list.innerHTML = html || '<div style="padding:16px 8px;font-size:12px;color:#5A6280;text-align:center;">No items found</div>';
  
  // Re-attach rename inputs
  if(S.renaming) {
    const el = document.getElementById('rename-'+S.renaming);
    if(el) { el.focus(); el.select(); }
  }
}

function renderItem(item, inFolder) {
  const sel = S.selected===item.id ? 'selected' : '';
  const isRenaming = S.renaming===item.id;
  const lib = S.personal.find(x=>x.id===item.id) ? 'personal' : 'shared';
  return `<div class="item ${sel}" data-id="${item.id}"
    onclick="selectItem('${item.id}','${lib}')"
    oncontextmenu="showCtxMenu(event,'${item.id}')"
    draggable="true"
    ondragstart="onDragStart(event,'${item.id}')"
    ondragend="onDragEnd(event)"
    ondragover="onDragOver(event,'${item.id}')"
    ondrop="onDropOnItem(event,'${item.id}')">
    <div class="item-row">
      <i class="ti ti-grip-vertical drag-handle"></i>
      ${iconEl(item.icon,item.color,11)}
      ${isRenaming
        ?`<input class="item-name-input" id="rename-${item.id}" value="${esc(item.name)}" onclick="event.stopPropagation()" onblur="finishRename('${item.id}')" onkeydown="if(event.key==='Enter')finishRename('${item.id}');if(event.key==='Escape'){S.renaming=null;rerender();}">`
        :`<span class="item-name">${esc(item.name)}</span>`}
    </div>
    <div class="item-meta">
      <span class="badge b-${item.type}">${item.type}</span>
      ${item.updatedAt?`<span>${timeAgo(item.updatedAt)}</span>`:''}
    </div>
    <div class="item-actions" onclick="event.stopPropagation()">
      <button class="ia-btn" onclick="startRename('${item.id}')"><i class="ti ti-pencil"></i></button>
      <button class="ia-btn danger" onclick="archiveItem('${item.id}','${lib}')"><i class="ti ti-archive"></i></button>
    </div>
  </div>`;
}
function historyPanel(item) {
  const runs = item.runs || [];
  const historyId = 'history-panel-'+item.id;
  const bodyId = 'history-body-'+item.id;
  const isOpen = localStorage.getItem('sb_history_open') === '1';
  const chevronClass = isOpen ? 'open' : '';
  const bodyClass = isOpen ? '' : 'collapsed';
  const runHtml = runs.length
    ? [...runs].reverse().slice(0,10).map(r=>`
        <div class="history-item" style="padding:6px 0;border-bottom:1px solid var(--border);">
          <div class="h-row"><span class="badge b-${r.ok?'ok':'fail'}" style="font-size:9px;">${r.ok?'ok':'err'}</span><span class="h-time">${r.time}</span></div>
          <div class="h-preview">${esc(r.input)}</div>
        </div>`).join('')
    : '<div class="empty-sm" style="padding:8px 0;">No runs yet</div>';
  return `
    <div class="history-panel">
      <div class="history-panel-header" onclick="toggleHistoryPanel('${bodyId}')">
        <div class="history-panel-title"><i class="ti ti-history" style="font-size:12px"></i> Run history <span class="count-pill">${runs.length}</span></div>
        <i class="ti ti-chevron-up drawer-chevron ${chevronClass}" style="font-size:13px;color:var(--text-muted);transition:transform .2s;"></i>
      </div>
      <div id="${bodyId}" class="history-panel-body ${bodyClass}">${runHtml}</div>
    </div>`;
}

function toggleHistoryPanel(bodyId) {
  const el = document.getElementById(bodyId);
  if(!el) return;
  const isCollapsed = el.classList.toggle('collapsed');
  localStorage.setItem('sb_history_open', isCollapsed ? '0' : '1');
  // flip chevron
  const chevron = el.previousElementSibling && el.previousElementSibling.querySelector('.drawer-chevron');
  if(chevron) chevron.classList.toggle('open', !isCollapsed);
}


function openInClaude(){
  const item=getSelected();
  if(!item)return;
  const msg = 'I want to use the "'+item.name+'" '+item.type+'.\n\nHere is the full skill prompt — please use this as your instructions:\n\n'+item.prompt+'\n\n---\n\nReady when you are. Paste your input and I will process it.';
  window.open('https://claude.ai/new?q='+encodeURIComponent(msg),'_blank');
}


load();


function toggleMainSection(sectionType){
  const mapSection = document.getElementById('mapSection');
  const skillsSection = document.getElementById('skillsSection');
  const mapBtn = document.getElementById('btn-map');
  const skillsBtn = document.getElementById('btn-skills');
  
  if(sectionType === 'map'){
    mapSection.classList.add('active');
    skillsSection.classList.remove('active');
    mapBtn.classList.add('active');
    skillsBtn.classList.remove('active');
  } else if(sectionType === 'skills'){
    skillsSection.classList.add('active');
    mapSection.classList.remove('active');
    skillsBtn.classList.add('active');
    mapBtn.classList.remove('active');
  }
}

function toggleTestNotesCollapse(){
  const testSection = document.getElementById('testNotesSection');
  const testBody = document.getElementById('testNotesBody');
  const chevron = document.getElementById('testChevron');
  
  const isCollapsed = testSection.classList.contains('collapsed');
  if(isCollapsed){
    testSection.classList.remove('collapsed');
    testSection.classList.add('expanded');
    testBody.style.display = 'flex';
    chevron.classList.remove('collapsed');
  } else {
    testSection.classList.add('collapsed');
    testSection.classList.remove('expanded');
    testBody.style.display = 'none';
    chevron.classList.add('collapsed');
  }
}
