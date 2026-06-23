---
name: production-brief-asset-breakdown
description: "Reads a Google Doc or Google Slides production brief and extracts the creative assets needed for production: soundbites (the dialogue lines talent will say, from SS1–SS5+) and B-roll shots (the visual moments to capture on set). Counterpart to Production Brief Resource Breakdown, which extracts logistics (Props, SKU, Locations, Talent). UPDATED: Refined rules for soundbite deduplication, B-roll variation tracking, and variant overlap analysis."
icon: mic
color: Green
related_server_ids:
- gdocs
- gslides
---

# Production Brief Asset Breakdown — UPDATED

## What This Skill Does

Production Brief Asset Breakdown reads a TubeScience production brief and pulls out the two **substance** elements of a shoot:

- **Soundbites** — the actual dialogue lines talent will say, organized by sales sequence (SS1–SS5+) and header (H1–H4+)
- **B-roll shots** — the specific visual moments that need to be captured on set

These are the substance layer of the brief in SVS terms: *what* is being said and *what* is being done — not how it's filmed.

### How This Differs from Production Brief Resource Breakdown

| Skill | Extracts | Answers |
|---|---|---|
| **Resource Breakdown** | Props, SKU, Locations, Talent | What do we need *to* shoot? |
| **Asset Breakdown** | Soundbites, B-roll shots | What do we need *to capture* during the shoot? |

---

## RULE 1: SOUNDBITE COUNTING & DEDUPLICATION (UPDATED)

### Core Rule

**ONE SOUNDBITE = One unique line of dialogue, regardless of how many times it appears.**

- Extract every distinct spoken line from the brief (SS blocks, Onramps, Headers)
- If identical or near-identical lines appear multiple times (>95% text match), **count as 1 soundbite**
- In the deliverable, list it ONCE but annotate with metadata

### Deliverable Format

```
SOUNDBITE MASTER TABLE

| SB ID | Text | Talent Role | SS/H/Onramp | Instances | Appears In | Cross-Brief | Delivery Notes |
|---|---|---|---|---|---|---|---|
| J780-001 | "It combines tadalafil and PE treatment" | On-Camera | Onramp1, Onramp2, SS1 | 3 | Onramp1 (line 8), Onramp2 (line 9), SS1 (line 3) | Also in J786 (same product) | Repeated talking point; same talent each time; record once, edit into all 3 spots |
| J780-002 | "Wow!" | On-Camera | SS1 | 1 | SS1 (line 1) | Not in other briefs | Reaction shot; used in all 5 variants (V1A–V1E) |
| J782-001 | "[SKEPTIC]: Okay but — isn't it kind of a big deal for a guy to admit he needs help?" | On-Camera | SS1 | 1 | SS1 (line 2) | Not in other briefs | Podcast setting; conversational |
| J792-GFX-001 | "Sex Rx + Climax Control" | Voiceover/GFX | Header, SS1 | 2 | Header (text overlay), SS1 (voiceover) | Also in J780, J786 (same SKU) | Appears as text + spoken; universal CTA candidate |
```

### Implications for Production

**Single Instance (Instances = 1):**
- Record 1 take
- Use same take for all occurrences in brief

**Multiple Instances (Instances = 2+):**
- Record 1 master take
- Reuse across instances UNLESS context significantly differs
- Flag: "Can be recorded once and edited into [Onramp1], [Onramp2], and [SS1], OR record separately if performance needs to vary by context"

**Cross-Brief Instances:**
- Flag: "This soundbite appears in J780 + J786 + J789 (all use same product SKU) — can share footage if same talent cast for these briefs"
- Decision point: Enables cost savings (one VO recording used across 3 briefs)

### Real Example from Hims ED Briefs

J780 has "It combines tadalafil and PE treatment" appearing 3 times:
- **Onramp 1:** Talent 1 says it (street interview context)
- **Onramp 2:** Talent 1 says it (podcast context)
- **SS1:** Talent 1 says it (mixed context)

**Extraction:**
- Count: 1 soundbite (not 3)
- Annotate: `[Instances: 3] [Appears In: Onramp1, Onramp2, SS1]`
- Cross-brief: `[Also in J786 as same product talking point]`
- Production note: "Can record once with Talent 1, edit into all 3 moments, OR record separately if street/podcast delivery needs to differ"

---

## RULE 2: B-ROLL VARIATIONS — EACH VARIATION IS SEPARATE SHOT (UPDATED)

### Core Rule

**Each unique framing/angle/context = SEPARATE SHOT to capture.**

- Do NOT tier variations (no "Tier 1 must-have" vs. "Tier 2 optional")
- Do NOT consolidate "macro pill shot" + "wide pill shot" into one shot type
- List each variation as its own line item with unique ID
- Cross-reference which briefs use which variations

### Classification Framework

For each B-roll shot, specify:
- **Action**: What's happening (e.g., "holding pill to camera")
- **Framing**: Camera angle/distance (macro, close-up, medium, wide, POV, over-shoulder)
- **Context**: Where/when (e.g., "white cyc background", "in talent's palm", "on table")
- **Duration**: How long the shot (e.g., 2–3 sec, 5–10 sec continuous)
- **Shot-Based Props**: What props are visible/integral to this shot

### Deliverable Format

```
B-ROLL MASTER LIBRARY

| Shot ID | Action | Framing | Context | Duration | Shot-Based Props | Used In Briefs | Notes |
|---|---|---|---|---|---|---|---|
| BR-001a | Holding pill to camera | Macro close-up | White cyc background, direct to lens | 3 sec | Pill (Hims branded) | J780, J782, J785, J792 | Hero shot; pill occupies 80%+ of frame; label visible |
| BR-001b | Holding pill to camera | Close-up | Pill centered, talent's face blurred in background | 3 sec | Pill + hand + face | J780, J782 | Depth-of-field variation; product + human context |
| BR-001c | Holding pill to camera | Medium shot | Talent's hand/arm visible, full context | 3–5 sec | Pill + hand + arm + body | J785, J792 | Shows product in hand without close extreme |
| BR-001d | Holding pill to camera | POV (overhead) | Pill in talent's palm, looking down at camera | 3 sec | Pill + hands visible | J789 (self-talk) | Different framing strategy; intimate POV |
| BR-002a | Picking up pill bottle | Close-up | Hand grasping bottle label, Hims jar label visible | 2–3 sec | Hims jar (branded) | J782, J785, J786 | Emphasis on Hims jar label; unboxing moment |
| BR-002b | Picking up pill bottle | Medium | Bottle pulled from box, packaging visible | 3–5 sec | Hims jar + box | J782, J785 | Shows unboxing context; motion shot |
| BR-003a | Pulling delivery box | Close-up | Hand gripping box edge, Hims box label visible | 2 sec | Hims box (branded) | J786 | Quick reveal; label-forward |
| BR-003b | Pulling delivery box | Wide | Talent pulling box from under table, full body visible | 5 sec | Hims box + table + talent | J782 | Continuous motion; establishes location |
| BR-004a | Talent scrolling on phone | Over-shoulder | Screen visible showing form, talent visible in frame | 5–10 sec | Smartphone (generic), possibly table/surface | J780, J789, J792 | Focus: form/quiz visible on screen; over-shoulder angle shows both talent + screen |
| BR-004b | Talent scrolling on phone | POV hand-held | Close on screen showing intake form, hand scrolling | 5–10 sec | Smartphone (generic) | J782, J785 | Extreme close-up of UI only; immersive perspective |
| BR-005a | Talent walking through house | Wide shot | Continuous movement through living room/multiple rooms | 10–15 sec | Microphone (if podcast set) or ambient props | J782 UGC, J785 UGC | DTC handheld feel; natural movement |
| BR-005b | Talent walking through house | Medium tracking | Following talent through doorway, medium distance | 5 sec | Ambient props (flowers, furniture) | J785 UGC | Transition shot; maintains momentum |
| BR-006a | Podcast interview setup | Wide | Two-shot of talent at table with microphones | 10 sec | Microphone (2x, mounted or on boom), desk, chairs | J780, J782, J785, J786, J789 | Establishes podcast environment; mics visible and integral |
| BR-006b | Podcast interview setup | Close-up on mics | Microphone detail shot, showing Hims-branded or generic mics | 3 sec | Microphone (2x) | J780, J782, J785, J786 | Product integration opportunity; shows professional setup |
```

### Shot-Based Props Tracking

Props that are visible/integral to B-roll shots are noted in the **[Shot-Based Props]** column:
- **Microphones** (podcast interviews): Appear in every podcast shot; integral to setting
- **Phone** (scrolling): Essential to shot; must have UI visible
- **Branded packaging** (Hims box, jar): Essential to shot; label must be visible
- **Ambient props** (flowers, furniture, table): May be visible but not the focus

**Production Implication:** Line Producer can see at a glance which props are needed for which shots and ensure they're available during that shot's setup.

### Real Example from Hims ED Briefs

"Holding pill to camera" appears across 4 briefs but in 4 different ways:

**Old approach (consolidation):** "Holding pill to camera (4 briefs) = 1 shot type"
**New approach (variations):**
- BR-001a: Macro (J780, J782, J785, J792) - Hero shot, extreme close
- BR-001b: Close-up with face (J780, J782) - Product + human
- BR-001c: Medium with arm (J785, J792) - Context shot
- BR-001d: POV overhead (J789) - Self-talk perspective

**Production consequence:** 
- DP knows: "Plan 4 camera positions for 'holding pill' action"
- Setup time: 30 min (4 angles + retakes)
- DP can schedule: "Holding pill session: 30 min. Picking up box session: 20 min. etc."

---

## RULE 5: VARIANT OVERLAP ANALYSIS (UPDATED - NEW)

### Core Rule

**For each component (Header, Onramp, Sales Sequence), identify which variants use it, what's different, and whether footage can be reused or must be shot separately.**

### Deliverable Format

```
VARIANT OVERLAP ANALYSIS

BRIEF: J780 (5 variants: V1A, V1B, V1C, V1D, V1E)

| Component | Variants Using | Script | Location(s) | Talent | Context Change? | Reuse Strategy | Notes |
|---|---|---|---|---|---|---|---|
| H1 | V1A, V1E | Identical ("Most men don't know...") | B-roll overlay | Off-screen VO | NO | **Shoot once, use in both** | VO recorded once; edit into V1A and V1E without change |
| H2 | V1B | Unique ("Most men don't know THIS erection secret") | B-roll overlay | Off-screen VO | N/A | Shoot separately | Different hook; can't reuse |
| H3 | V1C, V1D | Identical ("Have sex again") | B-roll overlay | Off-screen VO | NO | **Shoot once, use in both** | Same VO; same header; edit into V1C and V1D |
| Onramp 1 | V1A | Unique (street interview format) | Street location | 3 talent (flags) | N/A | Shoot once | Onramps aren't repeated; each is unique |
| Onramp 2 | V1B | Unique (street interview format) | Street location | 3 talent (flags) | N/A | Shoot once | Different questions from Onramp 1 |
| Onramp 3 | V1C | Unique (street interview format) | Street location | 3 talent (flags) | N/A | Shoot once | Different questions from Onramps 1 & 2 |
| SS1 | V1A, V1B, V1C | Identical (same talent, same lines) | 3 contexts: White cyc + Podcast + Street | 3 talent | YES (3 locations) | **Shoot in all 3 contexts separately** | Same dialogue, different backgrounds; must film separately for variant optionality (V1A gets white cyc, V1B gets podcast, V1C gets street) |
| SS2 | V1D | Unique | White cyc | 2 talent | N/A | Shoot once | Different script from SS1 |
| SS3 | V1E | Unique (same talent, different props) | Podcast set (no flags) | 3 talent | YES (props removed) | Shoot separately | Same talent as SS1, but without red flags; different framing |

OPTIMIZATION SUMMARY:
- ✅ H1 VO → Record once (30 sec), use in V1A + V1E (saves 1 VO session)
- ✅ H3 VO → Record once (30 sec), use in V1C + V1D (saves 1 VO session)
- ✅ SS1 → Record in all 3 contexts (white cyc, street, podcast) for variant editorial optionality (can't consolidate due to location change, but same talent + script)
- ❌ Onramps 1–3 → All unique; must film all 3
- ✅ SS3 → Record separately from SS1 (no flags; different framing)

PRODUCTION IMPLICATION:
Baseline shooting: 9 shoot setups (H1, H2, H3, Onramp1, Onramp2, Onramp3, SS1, SS2, SS3)
Optimized shooting: 8 actual setups (H1 + H3 VOs recorded once and reused = save 1 setup)
Days saved: 0.5 day (assumes 1 setup = 1 hour)
```

### Cross-Brief Overlap Analysis

```
SOUNDBITE OVERLAP ACROSS ALL 6 BRIEFS

| Soundbite | Briefs | Identical? | Can Share Footage? | Context Difference | Production Strategy |
|---|---|---|---|---|---|
| "It combines tadalafil and PE treatment" | J780, J786, J789 | YES (exact match) | YES IF same talent cast | Same product, different talent/context | Record with each talent per brief; OR if same talent appears in multiple briefs, can share |
| "100% online process" | ALL 6 briefs | YES (universal CTA) | YES IF same VO talent | Universal; no context change | Record 1 master VO; use across all 6 briefs (saves 5 VO sessions) |
| "No doctor visits" | ALL 6 briefs | YES (universal CTA) | YES IF same VO talent | Universal; no context change | Record 1 master VO; use across all 6 briefs |
| "Free shipping if prescribed" | ALL 6 briefs | YES (universal CTA) | YES IF same VO talent | Universal; no context change | Record 1 master VO; use across all 6 briefs |
| "Take the free quiz/assessment" | ALL 6 briefs | YES (universal CTA) | YES IF same VO talent | Universal; no context change | Record 1 master VO; use across all 6 briefs |

CROSS-BRIEF EFFICIENCY:
✅ CONSOLIDATE UNIVERSAL VOs (CTAs):
- "100% online", "No doctor visits", "Free shipping", "Take the quiz"
- Record 4 master VO takes from 1 professional VO talent
- Use same audio across all 6 briefs
- Savings: 5 VO recording sessions (30 min each) = 2.5 hours production time

✅ CONSOLIDATE PRODUCT-SPECIFIC VOs:
- "Combines tadalafil + PE treatment" (J780, J786, J789 — same product)
- Record 1 master take
- Use across these 3 briefs
- Savings: 2 VO recording sessions
```

---

## Integration with Other Skills

### Upstream: Parsing
- Google Docs API: Extract text recursively from nested JSON
- Google Slides API: Extract text_content from each slide

### Downstream: Resource Breakdown
- Resource Breakdown consumes this skill's soundbite list to assign talent to lines
- Example: Asset Breakdown produces "Skeptic has 12 lines" → Resource Breakdown uses this to calculate casting

### Downstream: Production Consolidator (Tier 2)
- Consolidator ingests soundbites + B-roll to create variant mapping
- Consolidator uses cross-brief overlap data to recommend VO consolidation

---

## Output Deliverables (Final)

**Deliverable 1: Soundbite Master Table**
- One row per unique soundbite
- Columns: [SB ID] [Text] [Talent Role] [SS/H/Onramp] [Instances] [Appears In] [Cross-Brief] [Delivery Notes]

**Deliverable 2: B-Roll Master Library**
- One row per variation
- Columns: [Shot ID] [Action] [Framing] [Context] [Duration] [Shot-Based Props] [Used In Briefs] [Notes]

**Deliverable 3: Variant Overlap Report**
- Tables showing which components appear in multiple variants
- Reuse strategy for each component
- Efficiency gains calculated

**Deliverable 4: Cross-Brief Overlap Analysis**
- Tables showing soundbites that appear across multiple briefs
- VO consolidation opportunities flagged
- Efficiency gains (time/cost savings) calculated

---

## Script Implementation

Main script: `scripts/run.py`

```bash
python3 scripts/run.py <google_doc_url>
```

**Output:**
1. Parse brief into SS/H/Onramp blocks
2. Extract all soundbites; deduplicate; annotate instances
3. Extract all B-roll shots; classify framings; note shot-based props
4. Identify variants and overlaps
5. Generate all 4 deliverables (tables, analysis reports)
6. Return structured JSON or formatted markdown

---

## Schema Reference

### Soundbite Object
```json
{
  "sb_id": "J780-001",
  "text": "It combines tadalafil and PE treatment",
  "talent_role": "On-Camera",
  "character": "Talent 1",
  "ss_h_onramp": ["Onramp1", "Onramp2", "SS1"],
  "instances": 3,
  "appears_in": [
    {"location": "Onramp1", "line_number": 8},
    {"location": "Onramp2", "line_number": 9},
    {"location": "SS1", "line_number": 3}
  ],
  "cross_brief": ["J786", "J789"],
  "delivery_notes": "Repeated talking point; same talent each time; record once, edit into all 3 spots"
}
```

### B-Roll Shot Object
```json
{
  "shot_id": "BR-001a",
  "action": "Holding pill to camera",
  "framing": "Macro close-up",
  "context": "White cyc background, direct to lens",
  "duration_sec": 3,
  "shot_based_props": ["Pill (Hims branded)"],
  "used_in_briefs": ["J780", "J782", "J785", "J792"],
  "notes": "Hero shot; pill occupies 80%+ of frame; label visible"
}
```

### Variant Overlap Object
```json
{
  "brief": "J780",
  "component": "SS1",
  "variants_using": ["V1A", "V1B", "V1C"],
  "script_identical": true,
  "locations": ["White cyc", "Street interview", "Podcast set"],
  "talent_identical": true,
  "context_change": "YES (3 locations)",
  "reuse_strategy": "Shoot in all 3 contexts separately",
  "notes": "Same dialogue, different backgrounds; must film separately for variant optionality"
}
```

---

## Parsing Notes & Edge Cases

### Edge Case 1: Soundbite That Appears 5+ Times
Example: Universal CTA "100% online process" appears in all 6 briefs, multiple times each
- Count: 1 soundbite
- Instances: 15+ across all briefs
- Cross-brief: [All 6 briefs]
- Flag: "Candidate for master VO consolidation — record once, use across all briefs"

### Edge Case 2: Performance Variant of Same Line
Example: Whispered delivery of line vs. energetic delivery
- Same text, different performance
- Count: 1 soundbite with delivery note annotation
- Delivery notes: "Appears as [energetic] in Onramp1 and [whispered] in SS2 → Record 2 takes"

### Edge Case 3: B-Roll Variation Used in Only 1 Brief
Example: BR-001d (POV overhead) only used in J789 (self-talk)
- Include as separate shot
- Note: "Used in 1 brief only; specific to self-talk format"
- Flag for DP: "Low priority if time/budget constraints; can substitute BR-001a (macro) if needed"

### Edge Case 4: Multi-Talent Same Dialogue
Example: J789 has same self-talk lines delivered by both male and female talent
- Count: 1 soundbite for the text
- Annotate: "Character Variant: Male + Female"
- Delivery notes: "Record with both talents for gender-neutral optionality"

---

## Version History

- **v1.0** (Original): Basic soundbite + B-roll extraction
- **v2.0** (THIS UPDATE): 
  - Rule 1: Soundbite deduplication with instance tracking
  - Rule 2: B-roll variations as separate shots (no tiering)
  - Rule 5: Variant overlap analysis + cross-brief consolidation
  - Shot-based props tracking
  - Real Hims examples throughout
  - Integration with Resource Breakdown + Consolidator

---

*Updated with refined rules for production clarity, cost optimization, and elimination of ambiguity.*
