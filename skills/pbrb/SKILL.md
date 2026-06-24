---
name: pbrb
description: "Reads a Google Doc or Google Slides production brief and extracts the logistics needed BEFORE production: Props, Product/SKU, Locations, and Talent roster. Counterpart to Production Brief Asset Breakdown, which extracts the creative assets (soundbites, B-roll). UPDATED: Refined rules for props quantity with backup tracking, talent line-by-line assignment, cross-brief talent consolidation, background talent/extras, and comprehensive cross-validation."
icon: ti-package
color: navy
related_server_ids:
- pbab
---

---
name: production-brief-resource-breakdown
description: "Reads a Google Doc or Google Slides production brief and extracts the logistics needed BEFORE production: Props, Product/SKU, Locations, and Talent roster. Counterpart to Production Brief Asset Breakdown, which extracts the creative assets (soundbites, B-roll). UPDATED: Refined rules for props quantity with backup tracking, talent line-by-line assignment, cross-brief talent consolidation, background talent/extras, and comprehensive cross-validation."
icon: package
color: Blue
related_server_ids:
- gdocs
- gslides
- monday
---

# Production Brief Resource Breakdown — UPDATED

## What This Skill Does

Production Brief Resource Breakdown reads a TubeScience production brief and pulls out the four **logistics** elements needed to source and schedule the shoot:

- **Props** — physical items needed on set (branded + generic), with exact quantities calculated by talent count
- **Products/SKUs** — which Hims products are featured (for inventory, branding, compliance)
- **Locations** — where the shoot takes place (studio, street, podcast set, etc.)
- **Talent** — who performs, with line-by-line assignment and cross-brief optimization

These are the logistics layer: *what do we need to source before production starts?*

### How This Differs from Production Brief Asset Breakdown

| Skill | Extracts | Answers |
|---|---|---|
| **Asset Breakdown** | Soundbites, B-roll shots | What do we need *to capture* during the shoot? |
| **Resource Breakdown** | Props, SKU, Locations, Talent | What do we need *to source* BEFORE the shoot? |

---

## RULE 3: PROPS QUANTITY — DETERMINISTIC CALCULATION WITH BACKUP TRACKING (UPDATED)

### Core Rule

**For each prop, calculate exact quantity using a deterministic formula. Backups are tracked separately (not added to total).**

Formula:
```
Primary Quantity = Talent Count On-Screen in That Moment
Backup Quantity = Primary × Backup Multiplier (based on fragility/perishability)
Total to Source = Primary + Backup (displayed as separate line items)
```

### Classification: Primary vs. Backup

**Primary Count:**
- How many people need this prop in frame simultaneously?
- Example: 3 women holding red flags = Primary 3

**Backup Multiplier:**
- **1x** = Standard durability props (flags, non-breakable items)
- **2x** = Fragile or perishable items (branded jars, fresh flowers)
- Special cases: Equipment rental (no backup needed), consumables (may need extra if used)

### Deliverable Format

```
PROPS & PRODUCTS INVENTORY

| Prop | Primary (Talent On-Screen) | Fragility | Backup Multiplier | Backup Quantity | Total to Source | Multi-Brief Sharing | Sourcing Notes |
|---|---|---|---|---|---|---|---|
| Red flags | 3 | Durable | 1x | 1 | **4 total (3 primary + 1 backup)** | YES | Reusable; verify color consistency across shoots |
| Hims jar (branded) | 1 | Fragile | 2x | 2 | **3 total (1 primary + 2 backup)** | NO | Source from Hims inventory; if damaged, replacement needed |
| Pink bougainvillea | 1 | Perishable | 2x | 2 | **3 total (1 primary + 2 backup)** | NO | Fresh arrangement daily; wilts by afternoon; need fresh for AM/PM shoots |
| Smartphone (generic) | 1 | Durable | 1x | 1 | **2 total (1 primary + 1 backup)** | YES | Generic Android/iPhone; backup for contingency |
| Yoga mat | 1 | Medium durability | 1x | 1 | **2 total (1 primary + 1 backup)** | YES (J785 only) | Standard yoga mat; reusable across shots/briefs |
| Podcast microphones (2 mics) | 2 | Equipment rental | 0x | — | **2 mics (rental)** | N/A | Standard podcast kit; rental fee; no backup (covered by rental agreement) |
| Hims box (branded) | 1 | Medium fragility | 1x | 1 | **2 total (1 primary + 1 backup)** | NO | Branded packaging; if damaged, need replacement |
| Table surface | 1 | Durable | 0x | — | **1 (already on location)** | N/A | Already at podcast set/location; not sourced |
```

### Real Example from Hims ED Briefs

**Red Flags (J780):**
- Scene: 3 women holding flags in street interview
- Talent on-screen: 3 people
- Backup multiplier: 1x (flags are durable, won't break)
- **Calculation:** Primary 3 + Backup (3 × 1) = 3 + 1 = **4 flags total**
- **Sourcing breakdown shown separately:**
  - Primary: 3 flags
  - Backup: 1 flag
  - Total: 4 flags

**Hims Jar (all briefs):**
- Scene: Talent holding branded Hims jar
- Talent on-screen: 1 person at a time
- Backup multiplier: 2x (branded, fragile; if damaged, need replacements)
- **Calculation:** Primary 1 + Backup (1 × 2) = 1 + 2 = **3 jars total**
- **Sourcing breakdown shown separately:**
  - Primary: 1 jar
  - Backup: 2 jars
  - Total: 3 jars
- Note: "If 1 jar is damaged during production, 2 replacements available"

**Pink Bougainvillea (J782):**
- Scene: Flower arrangement in background (not handled)
- Talent on-screen: 0 (background decoration)
- Backup multiplier: 2x (perishable; wilts mid-day)
- **Calculation:** Primary 1 + Backup (1 × 2) = 1 + 2 = **3 arrangements total**
- **Sourcing breakdown shown separately:**
  - Primary: 1 arrangement (AM shoot)
  - Backup 1: 1 arrangement (AM contingency if wilts)
  - Backup 2: 1 arrangement (PM fresh arrangement if morning one dies)
  - Total: 3 arrangements

### Edge Case: Multi-Talent Prop Usage

**Example: Podcast Microphones**

Scene: Podcast interview with 2 hosts (host + guest)
- Microphone 1: Host speaks into mic
- Microphone 2: Guest speaks into mic
- Talent on-screen: 2 people (each using 1 mic)
- Backup multiplier: 0x (equipment rental; rental agreement covers spares)
- **Calculation:** Primary 2 + Backup 0 = **2 mics (rental)**
- Note: "2 mics needed simultaneously for dual interview format; no backup sourced (rental company provides spares)"

### Backup Tracking Output

**In deliverable, show:**
- Primary quantity clearly
- Backup quantity clearly (separate line)
- Total to source (sum)
- Reasoning for backup multiplier

This allows Production Coordinator to:
1. Know exactly what to order
2. Understand why backups exist
3. Return unused backups (saves money if not needed)

---

## RULE 4: TALENT ASSIGNMENT & CROSS-BRIEF CONSOLIDATION (UPDATED)

### Part A: Within-Brief Character Assignment (Line-by-Line)

**For each talent slot, identify:**
1. **Character Name/Role** (e.g., "Talent 1", "Skeptic", "Host")
2. **Talent Type Spec** (age, gender, tone, energy level)
3. **Soundbites Assigned** (which lines this talent delivers)
4. **Total Line Count** (how many unique soundbites for this character)
5. **Performance Notes** (delivery style, special instructions)

### Deliverable Format - Within-Brief

```
TALENT CAST LIST & LINE ASSIGNMENT

BRIEF: J780 (Red Flags Skit)

| Character | Talent Type | Soundbites Assigned | Line Count | Workload | Performance Notes | Est. Recording Time |
|---|---|---|---|---|---|---|
| Talent 1 (Lead) | Female, 30s, confident | J780-001, J780-002, J780-004, J780-007, J780-015 | 5 unique lines | Medium | Conversational, warm delivery; carries first half of skit | 2–3 min (with retakes) |
| Talent 2 | Female, 30s, playful | J780-003, J780-008, J780-010 | 3 unique lines | Light | Reaction-focused; "Wow!" delivery should feel natural | 1–2 min |
| Talent 3 | Female, 30s, supportive | J780-009, J780-012, J780-014 | 3 unique lines | Light | Support role; supportive energy | 1–2 min |
| Off-Screen VO | Gender neutral (voiceover) | J780-H1, J780-H2, J780-H3 | 3 unique lines | Light (VO = ~5 min) | Broadcast-quality voiceover; energetic, engaging tone | 0.5 min (VO recording) |

**Total Talent Workload:** 5 on-camera talent lines = ~5 min delivery; +30 min setup/retakes = ~35 min on-camera time

CROSS-VARIANT ANALYSIS:
- All 5 variants (V1A–V1E) use same talent + same dialogue
- Talent 1 carries all variants (script consistency)
- Recording strategy: Record all Talent 1 lines once; edit into all 5 variants
- Efficiency: 1 talent recording session, reused across 5 variants
```

### Real Example from Hims ED Briefs

**J782 (3-in-1 Podcast + UGC):**

```
TALENT CAST LIST & LINE ASSIGNMENT

| Character | Talent Type | Soundbites Assigned | Line Count | Workload | Performance Notes | Est. Recording Time |
|---|---|---|---|---|---|---|
| Skeptic | Female, 25–30, curious/hesitant | J782-SS1-001 through J782-SS1-005 | 5 unique lines | Medium | Podcast format; asks skeptical questions about process; delivery should feel conversational, not scripted | 3–4 min (with retakes) |
| Sexpert | Female, 30–40, knowledgeable | J782-SS1-006 through J782-SS1-010 | 5 unique lines | Medium | Podcast format; gives expert answers; authoritative but warm tone | 3–4 min |
| Skeptic (UGC) | Female, 25–30, same as Podcast Skeptic | J782-UGC-001 through J782-UGC-003 | 3 unique lines | Light | Confessional format; personal POV on product; handheld, natural delivery | 2–3 min |
| Sexpert (UGC) | Female, 30–40, same as Podcast Sexpert | J782-UGC-004 through J782-UGC-006 | 3 unique lines | Light | Confessional format; shares personal story; intimate tone | 2–3 min |

**Total Talent Workload:** 
- Skeptic: 5 (podcast) + 3 (UGC) = 8 lines total
- Sexpert: 5 (podcast) + 3 (UGC) = 8 lines total
- Est. recording time per talent: 6–8 min (with retakes)

CASTING IMPLICATION:
- 2 unique talents needed: Skeptic (25–30) + Sexpert (30–40)
- Can schedule both on same production day (podcast format = 1 location + 1 setup)
- Est. full brief time: 1 day (podcast + UGC recording back-to-back)
```

### Part B: Cross-Brief Talent Consolidation Matrix (UPDATED)

**After assigning all characters within each brief, create consolidation recommendations:**

For each character type, identify:
1. **Which briefs use this archetype?**
2. **Age/tone compatibility** across briefs
3. **Script overlap** — can same talent deliver similar messaging?
4. **Scheduling feasibility** — can briefs be shot on same day?
5. **Cost savings** — how much does consolidation save?

### Deliverable Format - Cross-Brief Consolidation

```
CROSS-BRIEF TALENT CONSOLIDATION MATRIX

CHARACTER ARCHETYPE: "Skeptic (Female, 25–30, curious/hesitant)"

| Brief | Character | Line Count | Tone | Age Spec | Script Overlap | Consolidation Feasible? | Notes |
|---|---|---|---|---|---|---|---|
| J782 | Skeptic (podcast) | 5 + 3 UGC = 8 | Hesitant, learning | 25–30 | "Isn't this for older guys?" | ✅ YES | Perfect archetype match |
| J785 | Skeptic (podcast) | 5 + 2 UGC = 7 | Similar hesitation | 25–30 | "Do I have to go to the doctor?" | ✅ YES | Same character energy; same talent feasible |
| J789 | N/A (male self-talk) | — | — | — | Not applicable | ❌ NO | Different format; male talent |

**CONSOLIDATION RECOMMENDATION:**
✅ **CAST SAME TALENT FOR J782 + J785 SKEPTIC**
- Reason: Identical character archetype (Female, 25–30, curious, hesitant)
- Script overlap: Both ask skeptical questions about product/process; same talking points
- Scheduling: J782 = Podcast day, J785 = Podcast day → Can shoot back-to-back on one production day
- Cost savings: 1 talent × $600–1000 day rate vs. 2 talents × $600–1000 each = **Save $600–1000**
- Line count: 8 (J782) + 7 (J785) = 15 lines total for one talent → Reasonable (avoid >25 lines per talent per day)
- Efficiency: Same wardrobe, makeup, energy level → Quick transitions between briefs
```

### Complete Talent Consolidation Summary (All 6 Briefs)

```
MASTER TALENT ROSTER & CONSOLIDATION STRATEGY

| Talent Profile | Briefs | Role(s) | Total Line Count | Recommended Cast | Est. Day Rate | Cost Savings |
|---|---|---|---|---|---|---|
| Female, 25–30, skeptical | J782, J785 | Skeptic (podcast + UGC) | 15 lines | **TALENT A** (consolidate) | $600–800 | $600–800 |
| Female, 30–40, authoritative | J782, J785 | Sexpert (podcast + UGC) | 16 lines | **TALENT B** (consolidate) | $700–1000 | $700–1000 |
| Female, 30s, confident (lead) | J780, J786 | Talent 1 (lead) + Host | 18 + 15 = 33 lines | **TALENT C** (separate, high workload) | $800–1200 | — |
| Female, 30s, playful | J780 | Talent 2 | 3 lines | **TALENT D** | $400–600 | — |
| Female, 30s, supportive | J780 | Talent 3 | 3 lines | **TALENT E** | $400–600 | — |
| Male, 35–40 | J785, J786, J789 | Husband + Guest + Self-talk | 3 + 15 + 18 = 36 lines | **TALENT F** (consolidate, high workload) | $800–1200 | — |
| Female, 25–35, UGC/partner | J782, J785, J792 | Confessional (UGC strand) | 6 + 4 + 8 = 18 lines | **TALENT G** (consolidate) | $600–900 | — |
| Female, 30s, DTC solo | J792 | Solo confessional | 8 lines | **TALENT H** OR consolidate with Talent G | $400–600 | $0–600 |

**TOTAL UNIQUE TALENT:** 8 if separate; 7–8 if consolidated
**TOTAL COST SAVINGS:** $1300–2400 (from consolidations)
**SCHEDULING:** Can batch J782 + J785 on same production day (podcast format = 1 day for 2 briefs)

**HIGH WORKLOAD WARNING:**
- Talent C: 33 lines (risk of vocal fatigue; recommend split across 2 half-days if possible)
- Talent F: 36 lines (recommend split across 3 half-days or 2 full days with breaks)
```

---

## RULE 4B: BACKGROUND TALENT / EXTRAS (NEW EDGE CASE)

### Core Rule

**Background talent or extras who have no dialogue are tracked separately from on-camera talent.**

- **On-Camera Talent:** Deliver soundbites (dialogue lines)
- **Background/Extras:** React, move in frame, or stand in background (no lines)
- Both are listed in talent roster but distinguished clearly

### Deliverable Format

```
TALENT ROSTER INCLUDING BACKGROUND/EXTRAS

| Talent Type | Brief | Role | Line Count | Performance Notes | Est. Workload | Notes |
|---|---|---|---|---|---|---|
| On-Camera | J780 | Talent 1 (lead) | 5 lines | Conversational delivery | 3–4 min recording | Primary talent; carries first half |
| On-Camera | J780 | Talent 2 | 3 lines | Playful reactions | 1–2 min recording | Reaction shots; "Wow!" delivery |
| Background/Extra | J780 | Street interview bystanders | 0 lines | Reactions, background movement | 30 min availability | People walking past / reacting to flag challenge; no scripted dialogue |
| Background/Extra | J780 | Street interview crowd | 0 lines | Ambient crowd (optional) | 1–2 hours availability | Optional crowd for street energy; not essential |
| On-Camera | J782 | Skeptic (podcast) | 8 lines | Conversational, hesitant | 4–5 min recording | Leads podcast interview |
| On-Camera | J782 | Sexpert (podcast) | 5 lines | Authoritative, warm | 3–4 min recording | Responds to skeptic |
```

### Real Example from Hims ED Briefs

**J780 (Red Flags Skit - Street Interviews):**

Script mentions: "3 women holding flags responding to street interview questions"
- **Talent 1, 2, 3:** On-camera (deliver scripted responses) = 5 lines each
- **Background/Extras:** "People walking past, reacting to flag challenge" = 0 lines

**Sourcing implications:**
- Book 3 on-camera talent for scripted responses
- Book 2–3 background extras for reactions/crowd (if budget allows)
- Background can be pulled from street (passersby) or pre-cast for consistency

---

## RULE 6: CROSS-VALIDATION CHECKS (NEW)

### Objective

Flag data inconsistencies and catch errors before production.

### 6 Mandatory Checks

#### CHECK 1: Every Product in Resource List Must Appear in Asset List

**For each SKU listed in Resource Breakdown:**
- Does it appear in any soundbite (spoken or GFX text)?
- Does it appear in any B-roll shot (visual coverage)?

**Action:**
```
✅ If YES to either soundbite or B-roll: PASS
❌ If NO to both: FLAG
   "⚠️ [Product Name] listed in resources but not mentioned in any soundbite or B-roll shot.
    Confirm:
    a) Is this product physically needed on set? (Yes → keep in sourcing list)
    b) Is this product shown only in post-production via GFX? (Yes → remove from physical sourcing)
    c) Is this an error in resource extraction? (Yes → correct)"

EXAMPLE:
- J792 lists "Medical anatomy model" as prop but brief is vague about whether it's physical or animated
- Flag: "⚠️ Medical anatomy model appears in resource list but brief doesn't specify if physical 
  or animated. Clarify with producer before sourcing."
```

#### CHECK 2: Every Talent in Resource List Must Have Line Assignment in Asset List

**For each talent slot in Resource Breakdown:**
- Does this character appear in soundbites?
- How many lines does this talent deliver?
- Is line count reasonable for the character?

**Action:**
```
✅ If talent has 1+ lines: PASS (provide line count)
❌ If talent has 0 lines AND is not background/extra: FLAG
   "⚠️ [Talent Type] is cast but has NO dialogue lines in soundbites.
    Confirm:
    a) Is this a background/extra talent? (Yes → reclassify as Background)
    b) Is this a casting error? (Yes → remove from casting list)
    c) Is the talent's dialogue in B-roll only (e.g., walking shot with no speech)? (Yes → note in brief)
    d) Should this talent be cast at all? (No → remove)"

EXAMPLE:
- J785 resource list shows "1x Male (Husband)" but he has only 3 lines
- Not a flag IF "Husband is background character, occasional on-camera with minimal dialogue"
- FLAG IF "Husband was supposed to have 10 lines but extraction missed them"
```

#### CHECK 3: Every Location in Resource List Must Be Used in At Least One Variant

**For each location listed in Resource Breakdown:**
- Does at least one variant require this location?
- Is location mentioned in any soundbite or B-roll shot?

**Action:**
```
✅ If location used in 1+ variant: PASS
❌ If location not used in any variant: FLAG
   "⚠️ [Location] listed in resources but not used in any variant.
    Options:
    a) Remove location from sourcing (if not needed)
    b) Confirm with producer if location is fallback option only
    c) Check if location was intended for variant that was cut"

EXAMPLE:
- J780 resource list includes "White cyc studio" and "Outside/street interview"
- But brief only uses Street interview for Onramps + Podcast set for SS
- Flag: "⚠️ White cyc studio is in location list but only used for B-roll background (BR-001a macro pill shot).
  Confirm: Is white cyc essential or can pill be shot elsewhere (podcast set, living room)?"
```

#### CHECK 4: Every B-Roll Shot Must Be Used in At Least One Brief

**For each B-roll shot in Asset Breakdown:**
- Which briefs use this shot?
- Is it used consistently across briefs or unique to one?

**Action:**
```
✅ If shot used in 1+ brief: PASS (note which briefs)
❌ If shot listed but not used anywhere: FLAG
   "⚠️ [B-Roll Shot] listed but not mentioned in any brief.
    Confirm:
    a) Is this a recommended-but-not-required shot? (Yes → mark as optional)
    b) Is this a shot that was cut from brief? (Yes → remove)
    c) Is this a safety shot for editorial optionality? (Yes → keep but note as optional)"
```

#### CHECK 5: Props Inventory Must Match Talent-On-Screen Count

**For each prop in Resource Breakdown:**
- Inventory calculation: Primary + Backup = Total
- Is inventory reasonable for usage?

**Action:**
```
For each prop, verify:
Primary Talent Count × Backup Multiplier = Backup Quantity
Total = Primary + Backup

✅ If math checks out: PASS
❌ If mismatch: FLAG
   "⚠️ [Prop] inventory calculation error:
    - Talent on-screen: [X] people
    - Backup multiplier: [Y]
    - Primary: [X], Backup: [X×Y], Total should be: [X + X×Y]
    - Current total listed: [Z]
    Discrepancy: Expected [X+X×Y], found [Z]. Confirm actual need with production team."

EXAMPLE:
- Red flags: 3 talent on-screen, backup multiplier 1x = Primary 3, Backup 1, Total 4
- If listed as "10 flags": FLAG
  "Red flags: 3 talent on-screen + 1x backup = 4 total needed, but list shows 10.
  Confirm if 10 is correct (extra for contingency/losses) or over-ordered.
  Recommendation: Use 4 unless production notes require higher buffer."
```

#### CHECK 6: Cross-Brief Talent Consolidation Matches Specifications

**For talent assigned to multiple briefs:**
- Age range compatible?
- Character archetype matches?
- Schedule feasible?

**Action:**
```
For each cross-brief talent assignment:
✅ If specifications match and schedule works: PASS (consolidation approved)
❌ If specifications don't match: FLAG
   "⚠️ [Talent Name/Type] assigned to [Brief A] and [Brief B]:
    - Brief A: Female, 25–30, skeptical tone, 8 lines
    - Brief B: Female, 30–40, confident tone, 7 lines
    Age range mismatch (25–30 vs. 30–40) → Do not consolidate (cast separate talents)
    
    OR if workload high:
    - Talent carries 36 lines across 3 briefs
    - Recommendation: Split across 2–3 production days to avoid vocal fatigue
    - Current schedule: [Days available?] → Flag if insufficient time"
```

### Cross-Validation Checklist (Master)

```
CROSS-VALIDATION CHECKLIST — All 6 Briefs

□ CHECK 1: Products
  Product | Appears in Soundbites? | Appears in B-Roll? | Physical or GFX? | Status | Flag? |
  Hims Sex Rx Climax Control | YES | YES | Physical | ✅ | No |
  Hims 3-in-1 Pill | YES | YES | Physical | ✅ | No |
  Hims Jar (branded) | YES | YES | Physical | ✅ | No |
  Hims Box (branded) | YES | YES | Physical | ✅ | No |
  Medical anatomy model | Unclear | Unclear | ? | ⚠️ | FLAG: Clarify if physical or animated |

□ CHECK 2: Talent
  Talent | Briefs | Line Count | Category | Status | Flag? |
  Female 25–30 Skeptic | J782, J785 | 15 | On-Camera | ✅ | No (consolidate) |
  Female 30–40 Sexpert | J782, J785 | 16 | On-Camera | ✅ | No (consolidate) |
  Male 35–40 Lead | J785, J786, J789 | 36 | On-Camera | ⚠️ | Flag: High workload; recommend split across 2–3 days |
  Background/Street extras | J780 | 0 | Background | ✅ | No (clarify count needed) |

□ CHECK 3: Locations
  Location | Briefs Using | Variants Using | Used? | Status | Flag? |
  Podcast set | J780, J782, J785, J786, J789 | 15+ | YES | ✅ | No |
  White cyc | J780 | 3 | YES | ✅ | No |
  Street (outdoor) | J780 | 4 | YES | ✅ | No |
  Living room (DTC) | J782, J785, J792 | 6 | YES | ✅ | No |
  Green screen | J789, J792 | 2 | YES | ✅ | No |
  [Unused location] | [blank] | 0 | NO | ❌ | FLAG: Can eliminate |

□ CHECK 4: B-Roll Shots
  Shot | Briefs Using | Times Mentioned | Status | Flag? |
  Holding pill (macro) | J780, J782, J785, J792 | 4 briefs | ✅ | No |
  Picking up box | J780, J782, J785, J786 | 4 briefs | ✅ | No |
  [Shot listed but unused] | [blank] | 0 | ❌ | FLAG: Remove or clarify |

□ CHECK 5: Props Inventory
  Prop | Talent Count | Backup Multiplier | Primary | Backup | Total Listed | Match? | Status | Flag? |
  Red flags | 3 | 1x | 3 | 1 | 4 | YES | ✅ | No |
  Hims jar | 1 | 2x | 1 | 2 | 3 | YES | ✅ | No |
  Smartphone | 1 | 1x | 1 | 1 | 2 | YES | ✅ | No |
  Podcast mics | 2 | 0x (rental) | 2 | — | 2 (rental) | YES | ✅ | No |
  [Mismatched prop] | [X] | [Y] | [expected] | [expected] | [actual≠expected] | NO | ❌ | FLAG |

□ CHECK 6: Cross-Brief Talent Consolidation
  Talent Consolidation | Age Match? | Tone Match? | Schedule Feasible? | Workload OK? | Status | Flag? |
  Skeptic (J782 + J785) | YES (25–30) | YES | YES (podcast days) | YES (15 lines total) | ✅ | No |
  Sexpert (J782 + J785) | YES (30–40) | YES | YES | YES (16 lines total) | ✅ | No |
  Male (J785 + J786 + J789) | Partial (35–40 for 2 of 3) | YES | Tight (3 briefs) | ⚠️ HIGH (36 lines) | ⚠️ | FLAG: High workload; recommend split across 2–3 days |

VALIDATION RESULT: 
✅ Passed: 18/20 checks
⚠️ Flagged: 2/20 checks (require clarification/action)
❌ Failed: 0/20 checks

ACTION ITEMS:
1. Clarify: Is medical anatomy model physical or animated? (CHECK 1)
2. Split: Male talent at 36 lines across 2–3 days to avoid fatigue (CHECK 6)
```

---

## Integration with Other Skills

### Upstream: Parsing
- Google Docs API: Extract text recursively
- Google Slides API: Extract text_content from each slide

### Upstream: Asset Breakdown Dependency
- Consumes Asset Breakdown soundbite list to assign talent to lines
- Example: Asset Breakdown produces "Skeptic has 12 lines in J782 + 8 lines in J785" → Resource Breakdown uses this for talent consolidation

### Downstream: Production Consolidator (Tier 2)
- Consolidator ingests talent + props + locations to create production specification
- Consolidator uses cross-validation results to create feasibility report

### Monday.com Integration
- Posts talent roster + prop list to Monday.com board as item updates
- Example: Create item "J780 Props" with checklist of items to source

---

## Output Deliverables (Final)

**Deliverable 1: Props & Products Inventory**
- One row per prop item
- Columns: [Prop] [Primary] [Fragility] [Backup Multiplier] [Backup Quantity] [Total to Source] [Multi-Brief Sharing] [Sourcing Notes]
- Backups displayed separately (not added to total)

**Deliverable 2: Talent Cast List**
- One row per character/talent role
- Columns: [Character] [Talent Type] [Soundbites Assigned] [Line Count] [Workload] [Performance Notes] [Est. Recording Time]
- Includes background talent (0 lines, but documented)

**Deliverable 3: Cross-Brief Talent Consolidation Matrix**
- Tables showing which talent can be cast across multiple briefs
- Consolidation recommendations with cost savings
- High workload warnings

**Deliverable 4: Location & Production Notes**
- List of all locations needed
- Which briefs use which locations
- Setup implications

**Deliverable 5: Cross-Validation Report**
- All 6 checks completed
- Flags and errors documented
- Corrective actions specified

---

## Script Implementation

Main script: `scripts/run.py`

```bash
python3 scripts/run.py <google_doc_url>
```

**Output:**
1. Parse brief into sections (Resources, Talent, Locations, etc.)
2. Extract props; calculate quantities by talent count + backups
3. Extract talent; map to soundbites from Asset Breakdown
4. Identify cross-brief consolidation opportunities
5. Run 6 cross-validation checks
6. Generate all 5 deliverables (tables, analysis reports, Monday.com post)

---

## Schema Reference

### Prop Object
```json
{
  "prop_id": "P-001",
  "name": "Red flags",
  "primary_quantity": 3,
  "backup_multiplier": 1,
  "backup_quantity": 1,
  "total_quantity": 4,
  "fragility": "Durable",
  "multi_brief_sharing": true,
  "briefs_used_in": ["J780"],
  "sourcing_notes": "Reusable; verify color consistency across shoots",
  "used_in_shots": ["BR-003 (held by talent)"]
}
```

### Talent Object (On-Camera)
```json
{
  "talent_id": "T-001",
  "character_name": "Skeptic",
  "talent_type": "Female, 25–30, curious/hesitant",
  "soundbites_assigned": ["J782-SS1-001", "J782-SS1-002", "J782-SS1-003"],
  "line_count": 5,
  "brief": "J782",
  "workload": "Medium",
  "performance_notes": "Podcast format; asks skeptical questions; conversational, not scripted",
  "est_recording_time_minutes": 4,
  "cross_brief_consolidation": "Can consolidate with J785 Skeptic (same archetype)",
  "background_or_extra": false
}
```

### Talent Object (Background/Extra)
```json
{
  "talent_id": "T-BG-001",
  "character_name": "Street interview background",
  "talent_type": "Mixed (walk-by reactions)",
  "soundbites_assigned": [],
  "line_count": 0,
  "brief": "J780",
  "workload": "Light (30 min presence)",
  "performance_notes": "Reactions to flag challenge; no scripted dialogue",
  "est_recording_time_minutes": 30,
  "background_or_extra": true,
  "notes": "Can be pulled from street (passersby) or pre-cast for consistency"
}
```

### Cross-Validation Result Object
```json
{
  "check_id": "CHECK-1",
  "check_name": "Products in Asset List",
  "status": "FLAG",
  "result": "⚠️ Medical anatomy model listed but unclear if physical or animated",
  "action_required": "Clarify with producer before sourcing"
}
```

---

## Parsing Notes & Edge Cases

### Edge Case 1: Talent with High Workload (>25 lines per day)
Example: Male talent in J785 + J786 + J789 = 36 lines total
- Flag: "High workload; recommend split across 2–3 production days"
- Alternative: Split across 2 half-day shoots with 2-hour break between
- Production coordinator can optimize schedule

### Edge Case 2: Background Talent with Occasional Lines
Example: Street interview "passerby" who occasionally responds
- Classify: Background/Extra if <3 lines; On-Camera if 3+ lines
- Document clearly: "Primarily background, may have 1–2 spoken reactions"

### Edge Case 3: Branded vs. Generic Props
Example: Hims jar (branded, fragile) vs. Smartphone (generic, durable)
- Hims jar: Backup multiplier 2x (fragile, track separately)
- Smartphone: Backup multiplier 1x (can be generic, substitute available)
- Output shows distinction clearly

### Edge Case 4: Multi-Brief Prop Reuse
Example: Red flags used in J780 only, but could theoretically be reused
- Multi-Brief Sharing: "YES (if briefs scheduled on different days)"
- Note: "Can be stored and reused for another brief if available; confirm with Line Producer"

### Edge Case 5: Equipment Rental (No Backup Multiplier)
Example: Podcast microphones
- Backup multiplier: 0x (rental company provides spares)
- Calculation: 2 mics needed, 0 backups, total 2 (rental fee)
- Note: "Rental agreement includes contingency spares; no need to source extra"

---

## Version History

- **v1.0** (Original): Basic props, talent, locations extraction
- **v2.0** (THIS UPDATE):
  - Rule 3: Props quantity with separate backup tracking
  - Rule 4: Talent line-by-line assignment + cross-brief consolidation
  - Rule 4B: Background talent/extras with no lines
  - Rule 6: 6 cross-validation checks
  - Shot-based props integration with Asset Breakdown
  - Real Hims examples throughout
  - Monday.com posting capability

---

*Updated with refined rules for deterministic prop quantities, talent optimization, and comprehensive error-catching.*
