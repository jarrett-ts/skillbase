---
name: shotlist
description: "Generates a structured scene-by-scene shot list from a TubeScience production brief. Produces a table of shots organized by location, shot type, subject, and action."
icon: ti-list
color: navy
---

---
name: shot-list-creator
description: "Generates a structured, scene-by-scene shot list from a TubeScience production brief. Reads Sales Sequences, Headers, and PRODUCTION NOTES to produce a table of shots organized by location, including shot type, subject, action, and which ad sequence each shot belongs to. Use after reading the brief with production-brief-resource-breakdown."
icon: square
color: Purple
---

# Shot List Creator

## Overview

This skill generates a concrete, scene-by-scene shot list from a TubeScience production brief. It parses Sales Sequences (SS1–SS5+), Headers (H1–H4+), and PRODUCTION NOTES to produce an ordered table of shots grouped by location, each labeled with shot type, subject, action or dialogue note, and the ad sequence it serves. Use this skill after `production-brief-resource-breakdown` has identified the brief's Props, SKU, Locations, and Talent — the shot list is the next step that turns those resources into an actionable shooting plan.

---

## Workflow

### Step 1 — Read the Brief

Open the Google Doc (or Slides) for the job using the same parsing approach as `production-brief-resource-breakdown`:

- Use `gdocs__get_document_content` (or `gdrive__get_file` for Slides) to pull the full text.
- Locate the **header table** at the top: Job Name, Job Owner, Client, SKU, Aspect Ratio, Goal Demo.
- Locate the **Job Goal/Strategy** block: note the Creative Archetype, `[Setting]:` value, and `[Casting]:` value.
- Locate the **PRODUCTION NOTES** block and extract:
  - `CONCEPT` — the overarching creative idea
  - `SETTING` — primary and secondary shoot locations
  - `TALENTS` — talent descriptions (age range, gender, role)
  - `CAMERA ANGLES` — any mandated angles or rig notes
  - `ADDITIONAL` — the b-roll list (these become B-Roll shots)
  - `AD SETS` — which platform/placement this ad runs on

### Step 2 — Extract Sales Sequences and Headers

Scan the document for all labeled sections:

- **Sales Sequences**: blocks labeled `SS1`, `SS2`, … `SS5` (or more). Each SS is a dialogue-heavy script block.
- **Headers**: blocks labeled `H1`, `H2`, `H3`, `H4` (or more). Each Header is a short opening hook — a single line of copy or a visual direction that starts the ad.

Collect them in order. Note the label (e.g. `SS2`, `H3`) for every line — this becomes the **Ad Sequence** column in the output.

### Step 3 — Parse Each Block Line by Line

For each Sales Sequence and Header block, iterate line by line and classify each line as one of:

| Line Type | How to Identify |
|---|---|
| **DIALOGUE** | Plain text spoken by talent — treat as OC or VO depending on context |
| **VISUAL NOTE** | Italicized text, text in `[brackets]`, or text in `(parentheses)` — a production direction, not spoken |
| **PRODUCT MENTION** | Any line that calls out the SKU by name or says "show product", "product shot", etc. |
| **B-ROLL CALL** | Lines in the ADDITIONAL section, or visual notes that describe non-talent footage |

Each classified line becomes one or more rows in the shot list. A single SS can produce multiple shots if it contains intercut visual notes alongside dialogue.

### Step 4 — Group Shots by Location

Using the `SETTING` field from PRODUCTION NOTES (and any inline location tags in visual notes), assign every shot to a **Scene/Location**. Common location labels:

- `INT. [Room] — [Time of Day]` (e.g. `INT. Kitchen — Day`)
- `EXT. [Place] — [Time of Day]` (e.g. `EXT. Backyard — Day`)
- `STUDIO` for clean/white-cyc product shots
- `GFX` for on-screen text, motion graphics, and animated overlays

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
| **VO (Voiceover)** | Dialogue is delivered as narration *over* other footage. Indicated by a visual note on the same line (e.g. `[show product]`, `[cut to b-roll]`) or an explicit `VO:` label in the script. |
| **B-Roll** | Supporting footage with no talent dialogue. Source: ADDITIONAL b-roll list, visual notes describing an environment or action without talent speech, or VO lines where the visual is non-product footage. |
| **Product Shot** | Close-up or hero shot of the SKU. Triggered by lines referencing the product by name with no talent in frame, or notes like "show product", "product close-up", "pack shot". |
| **Text / GFX** | On-screen text, animated pop-ups, lower thirds, motion graphic overlays, or end cards. Triggered by lines like "title card", "text pop", "GFX:", "end card", or any line in an `[GFX]` note. |
| **Hook** | The opening shot of the ad. Always assigned to H1–H4 lines. Typically OC or a high-impact visual — note the original shot type in the Subject or Action column if it differs. |

**Tiebreaker**: if a line could be OC *or* VO, check the next visual note. If there's an intercut direction immediately after the dialogue, mark it VO. If the talent speaks uninterrupted, mark it OC.

---

## Output Format

Render the shot list as a markdown table. Add a `**Scene: [Location]**` header above each location group.

```
**Scene: [Location Label]**

| # | Scene/Location | Shot Type | Subject | Action / Dialogue Note | Ad Sequence |
|---|---|---|---|---|---|
| 1 | INT. Kitchen — Day | Hook | Talent (Female, 30s) | Looks at camera, says "I was so tired..." | H1 |
| 2 | INT. Kitchen — Day | OC | Talent (Female, 30s) | "Nothing worked until I tried this." | SS1 |
```

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

### Upstream: `production-brief-resource-breakdown`
Run `production-brief-resource-breakdown` first. It extracts the brief's **Props**, **Product/SKU**, **Locations**, and **Talent** into a structured resource list. The shot list creator consumes those extracted values — particularly Locations (→ Scene groups) and Talent descriptors (→ Subject column) — so you are not re-parsing the brief from scratch.

### Downstream: Mosaic Video Editing
The completed shot list becomes the blueprint for Rough Cut prompts in the **Mosaic** video editing workflow. Each row maps to a clip selection task: the Shot Type and Subject fields tell Mosaic which footage bucket to draw from, and the Action / Dialogue Note provides the pacing context. When invoking Mosaic, pass the shot list table directly in the prompt.

### Alongside: `testimonial-messaging-groups` (TMG)
Each OC and VO shot can be tagged with its TMG category to align the shot list with the messaging architecture of the ad:

| TMG Tag | Meaning | Typical Shot Types |
|---|---|---|
| 🔵 **PC** (Pain/Concern) | Talent describes the problem | OC, Hook |
| 🟢 **SI** (Solution Introduction) | Talent introduces the product | OC, VO, Product Shot |
| 🟣 **PI** (Product Information) | Features, ingredients, how it works | OC, VO, Text/GFX |
| 🔴 **Results** | Outcomes, transformation, social proof | OC, B-Roll, Product Shot |

To apply TMG tags, run `testimonial-messaging-groups` on the Sales Sequence dialogue after the shot list is complete, then add a **TMG** column to the shot list table.
