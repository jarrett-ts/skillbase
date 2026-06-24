---
name: adgrammar
description: "The main brain for video ad and brief analysis. Orchestrates four specialist skills — Testimonial Messaging Groups, Substance vs Style, Visual Archetypes, and Thumbstop Shop — into a unified analysis protocol. Use this skill as the entry point whenever analyzing, critiquing, or building a video ad or creative brief."
icon: ti-wand
color: purple
---

---
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
*Activate: `thumbstop-shop`*

Evaluate the opening 3 seconds as a standalone unit.

1. **Visual Category** — Which of the 6 Thumbstop visual categories does the hook belong to? (Complete/Incomplete Action, Talking Head Direct Address, Social Proof Reaction, Text-Dominant Hook, POV/Immersive, Pattern Interrupt)
2. **Hook Messaging** — What does the header text or opening line communicate? Is it a problem, a promise, a curiosity gap, or a social proof claim?
3. **Audience Filter** — Does the hook stop *the right* viewer, or does it cast too wide a net?
4. **Visual–Messaging Coherence** — Do the visual and messaging halves of the hook reinforce each other, or do they pull in different directions?

> **Output:** A thumbstop assessment that names the hook category, evaluates the messaging, and makes a judgment on audience relevance.

---

### Step 2 — Substance Mapping (TMG)
*Activate: `testimonial-messaging-groups`*

Map the full ad body (everything after the hook) onto the TMG framework.

1. **Beat-by-Beat Classification** — For each segment of the script or storyboard, assign the TMG category and sub-category (e.g., 🔵 Personal Context → Problems; 🟢 Service Information → CTA).
2. **Coverage Check** — Which TMG categories are present? Which are absent? Is the persuasion arc complete?
3. **Sequence Check** — Are the beats in a logical order that mirrors the viewer's persuasion journey? (Generally: Personal Context first → Service Information → Product Interaction → Results → CTA)
4. **Formula Mapping** — Does the beat sequence map to a named persuasion formula? (PAS+, AIDA, 4Ps, Problem–Proof–Promise, etc.)

> **Output:** A TMG beat map — a labeled breakdown of the ad's substance structure, a coverage verdict, and a formula identification.

---

### Step 3 — Visual Archetype Classification
*Activate: `visual-archetypes`*

Classify the ad's visual execution format.

1. **Primary Archetype** — Which of the six Visual Archetypes best describes this ad? (Talking Head, Demonstration, Lifestyle, UGC/Raw, Narrator-Led, Text-Driven)
2. **Archetype Fit** — Does the chosen archetype suit the substance? Some TMG beat combinations perform better in certain archetypes (e.g., heavy Personal Context pairs naturally with UGC/Raw or Talking Head; Demonstration works best for Product Interaction beats).
3. **Archetype Diversity Signal** — If analyzing multiple ads in an account, flag if the same archetype is overrepresented.

> **Output:** Archetype name, a fit assessment against the substance map from Step 2, and any diversity flags.

---

### Step 4 — Substance vs Style Coherence Check
*Activate: `substance-vs-style`*

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

```
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
```

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

1. `/home/user/skills/thumbstop-shop/SKILL.md`
2. `/home/user/skills/testimonial-messaging-groups/SKILL.md`
3. `/home/user/skills/visual-archetypes/SKILL.md`
4. `/home/user/skills/substance-vs-style/SKILL.md`

Do not begin analysis until all four have been read. Each skill contains the full framework definitions, sub-categories, examples, and classification rules needed to apply that lens accurately.

**When analyzing a brief (not a finished ad):** also read `/home/user/skills/production-brief-asset-breakdown/SKILL.md` and run Production Brief Asset Breakdown on the brief URL *before* beginning the TMG step. Feed the extracted soundbites — not the raw brief text — into the TMG beat-by-beat classification. Feed the B-roll shots into the Visual Archetypes step as evidence of intended visual execution. See the "Integration with Ad Grammar" section of the Production Brief Asset Breakdown skill for the full handoff protocol.

---

## When to Use This Skill

- Analyzing a finished video ad for creative quality or diagnostic purposes
- Reviewing a creative brief before production begins
- Diagnosing underperforming creative in an ad account
- Generating a structured teardown of a competitor ad
- Auditing a batch of ads for substance diversity, archetype diversity, or hook variety
- Giving structured creative feedback to a writer, director, or strategist
