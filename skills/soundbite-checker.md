---
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
| `drive_folder_url` | Google Drive folder URL | Contains the .MOV/.MP4 clips to check |
| `brief_source` | Google Doc URL, Slides URL, or PDF | Source of the soundbites |
| `slack_channel` | Slack channel name or ID | Where results are posted |
| `sequences` | Parsed soundbite list | See Soundbite Extraction below |

---

## Workflow

### Step 1 — Extract Soundbites from Brief

Use `gdocs__read_doc` (or `gslides__read` for Slides) to read the brief.

Parse the soundbite table:
- Look for table columns labeled "Soundbites" 
- Extract all text in the Soundbites column per Sales Sequence
- Organize as: `{sequence_name: [line1, line2, ...]}`

**If the brief is complex**, use the `strategy-brief-to-production-brief` skill first to extract a clean asset list.

### Step 2 — List Drive Folder Videos

Use `gdrive__list_contents` with `folder_url` and `recursive=false`.
Filter to `mimeType` containing `video/`.

Sort by file size ascending (process small files first for faster feedback).

### Step 3 — Run Soundbite Check Script

Execute `scripts/soundbite_checker.py` via `sandbox_python`.

**Critical implementation notes:**
- `.MOV` files MUST be re-muxed to `.MP4` via ffmpeg before uploading to Gemini (MOV container causes Gemini to report "no audio")
- Command: `ffmpeg -i input.mov -c copy -y output.mp4`
- Use `gemini-2.5-flash` model
- Wait for Gemini file state `ACTIVE` before generating
- Pass ALL sequences' soundbites to each video (let Gemini figure out which apply)
- Retry up to 3 times on transient errors

### Step 4 — Post Results to Slack

Use `slack__send_message` with a formatted message.

**Slack message format:**
```
🎬 *Soundbite Check — [Folder Name]* 
_[N] clips analyzed · [date]_

*✅ COMPLETE TAKES*
• `IMG_2176.MOV` — SS1: 8/8 ✅
• ...

*⚠️ PARTIAL TAKES*
• `IMG_2177.MOV` — SS1: 6/8 (missing: "No in-person visits", "Get a personalized plan today.")

*❌ MISSING / NO MATCH*
• `HODL9705.MOV` — no soundbites detected (0/N lines found)

_Brief: [doc title/link] · Drive: [folder link]_
```

---

## Script Reference

Main script: `scripts/soundbite_checker.py`

Key functions:
- `download_video(file_id, file_name, dest)` — Downloads from Drive export URL
- `remux_to_mp4(mov_path)` — Re-muxes .MOV to .MP4 via ffmpeg (REQUIRED for audio detection)
- `analyze_video(mp4_path, file_name, sequences, client)` — Uploads to Gemini, runs analysis
- `format_slack_message(results, folder_url, brief_url)` — Formats final Slack output

---

## Known Issues & Fixes

| Issue | Fix |
|---|---|
| Gemini reports "no audio present" on MOV files | Re-mux to MP4 with `ffmpeg -c copy` before uploading |
| Download fails for large files (>100MB) | Use Drive API via Gumloop SDK as fallback |
| Gemini file stuck in PROCESSING state | Retry upload after 60s |
| Sandbox credential error on subagent | Transient — retry the run |
