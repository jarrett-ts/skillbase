---
name: mosaic
description: "Programmatic interface to the Mosaic AI video editing API. Use to trigger agent runs, configure tiles, manage assets, and poll run status. Pairs with the testimonial-messaging-groups skill to generate TMG-guided Rough Cut prompts."
icon: ti-video
color: blue
---

---
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
- **Webhooks** — optional `callback_url` on a run; Mosaic POSTs results when the run completes
- **Asset Management** — three-step S3 presigned-URL flow to upload source footage

**Base URL:** `https://api.mosaic.so`

**Authentication:** Every request requires:
```
Authorization: Bearer $MOSAIC_API_KEY
Content-Type: application/json
```

---

## Authentication

Store the API key in Gumloop Secrets as `MOSAIC_API_KEY`. Keys begin with `mk_`.

**Test connectivity:**
```python
import os, requests

BASE = "https://api.mosaic.so"
HEADERS = {"Authorization": f"Bearer {os.environ['MOSAIC_API_KEY']}"}

r = requests.get(f"{BASE}/whoami", headers=HEADERS)
r.raise_for_status()
print(r.json())   # {"user_id": "...", "email": "...", "org": "..."}
```

A `200` response confirms the key is valid. A `401` means the key is missing or malformed.

---

## Core Concepts

| Concept | Description |
|---|---|
| **Agent** | A named, reusable workflow. Contains an ordered tile graph. Created via `POST /agent/create`, updated via `POST /agent/update`. |
| **Agent Run** | One execution of an Agent. Triggered via `POST /agent/{agent_id}/run`. Returns a `run_id` to poll. |
| **Tile / Node Type** | A processing step (e.g., Rough Cut, Captions). Each has a fixed `node_id` UUID and a set of configurable params. |
| **Webhook / callback_url** | Optional URL included in the run request body. Mosaic sends a POST when the run reaches a terminal state. |
| **Asset Management** | Source footage must be uploaded via a three-step presigned-URL flow before referencing in a run. |

---

## Available Tiles

Known tile Node IDs (use `GET /agent-nodes` to fetch the full canonical list):

| Tile Name | Node ID | Key Parameters |
|---|---|---|
| **Rough Cut** | `e6098dd4-4a6e-470f-981e-2618c11eee21` | `prompt` (required string), `model_tier` (`fast`\|`pro`), `combine_input_renders` (boolean) |
| **Clips** | `bcc5cb04-76b7-48e9-a344-0e8a29c19be0` | `prompt` (optional string), `num_clips` (int 1–20), `target_duration` (seconds, float) |
| **Captions** | *(fetch via `GET /agent-nodes`)* | Style, font, color, position options |
| **Reframe** | *(fetch via `GET /agent-nodes`)* | Aspect ratio, focus subject, padding |
| **AI B-Roll** | *(fetch via `GET /agent-nodes`)* | Prompt, source library, duration per clip |
| **AI Music** | *(fetch via `GET /agent-nodes`)* | Genre, mood, duration, fade settings |
| **AI Voiceover** | *(fetch via `GET /agent-nodes`)* | Script, voice ID, speed |
| **Silence Removal** | *(fetch via `GET /agent-nodes`)* | Threshold (dB), padding (ms) |
| **Color Correction** | *(fetch via `GET /agent-nodes`)* | Preset, LUT path, exposure/contrast |
| **Watermark** | *(fetch via `GET /agent-nodes`)* | Image URL, position, opacity, size |
| **Montage** | *(fetch via `GET /agent-nodes`)* | Pacing, transition style, beat-sync |
| **Intro** | *(fetch via `GET /agent-nodes`)* | Template ID, duration, overlay text |
| **Outro** | *(fetch via `GET /agent-nodes`)* | Template ID, duration, CTA text |
| **Destination** | *(fetch via `GET /agent-nodes`)* | Output format, resolution, bitrate |
| **Voice** | *(fetch via `GET /agent-nodes`)* | Voice clone ID, enhancement settings |
| **Motion Graphics** | *(fetch via `GET /agent-nodes`)* | Template ID, data bindings |

> **Tip:** Run `GET /agent-nodes` once and cache the response. It returns every node type with its full parameter schema.

---

## Key API Endpoints

### Identity

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/whoami` | Verify API key; returns user/org info |

### Agents

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/agents` | List all agents in the account |
| `GET` | `/agent/{agent_id}` | Get a single agent with its full tile graph |
| `POST` | `/agent/create` | Create a new agent |
| `POST` | `/agent/update` | Update an existing agent's name, tiles, or config |

### Running Agents

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/agent/{agent_id}/run` | Trigger a run; returns `{"run_id": "..."}` |
| `GET` | `/agent_run/{run_id}` | Poll run status (`queued`, `running`, `completed`, `failed`) |
| `GET` | `/agent_run/{run_id}/nodes` | Per-tile progress and output for a run |
| `POST` | `/agent_run/{run_id}/cancel` | Cancel an in-progress run |

**Example run request body:**
```json
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
```

`update_params` keys are tile Node IDs. Values are the param overrides for that tile in this run only — the agent's saved config is not mutated.

### Node Discovery

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/agent-nodes` | List every available node type with full parameter schemas |

### Asset Upload (3-Step Flow)

1. **Get presigned URL:**
   ```
   POST /assets/get-upload-url
   Body: {"filename": "footage.mp4", "content_type": "video/mp4"}
   Response: {"upload_url": "https://s3...", "asset_id": "ast_..."}
   ```

2. **Upload to S3:**
   ```
   PUT {upload_url}
   Headers: Content-Type: video/mp4
   Body: <raw file bytes>
   ```

3. **Finalize asset:**
   ```
   POST /assets/finalize
   Body: {"asset_id": "ast_..."}
   Response: {"asset_url": "https://cdn.mosaic.so/..."}
   ```

Use `asset_url` in `video_urls` when triggering a run.

---

## Workflow Patterns

### a. TMG-Guided Rough Cut

Use this pattern to inject a Testimonial Messaging Group narrative into the Rough Cut tile prompt.

```
1. Read brief from Google Drive (gdrive / gdocs skill)
2. Extract formula type (PAS+, AIDA, 4P's) and hook/problem/solution/CTA from brief
3. Use testimonial-messaging-groups skill to select matching TMG and generate prompt string
4. POST /agent/{agent_id}/run with update_params targeting the Rough Cut node ID:
     "e6098dd4-4a6e-470f-981e-2618c11eee21": {"prompt": <generated_prompt>, "model_tier": "pro"}
5. Poll GET /agent_run/{run_id} every 15s until status == "completed"
6. Return output video URL from completed run
```

**Rough Cut prompt format (TMG-derived):**
```
Hook: {hook_statement}
Problem: {problem_statement}
Solution: {solution_statement}
Social Proof: {testimonial_quote}
CTA: {call_to_action}
Tone: {tone_descriptor}
```

---

### b. Footage Sorting & TMG Tagging

Use this pattern to classify raw clips and label them by messaging group.

```
1. Upload footage via 3-step asset flow (or pass GDrive URLs directly)
2. POST /agent/{agent_id}/run using a Clips-only agent
   update_params: {"bcc5cb04-76b7-48e9-a344-0e8a29c19be0": {"num_clips": 20}}
3. GET /agent_run/{run_id}/nodes → extract per-clip metadata (transcript, visual tags)
4. For each clip: match transcript against TMG database using testimonial-messaging-groups skill
5. Write labeled rows to Google Sheet (gsheets skill):
   Columns: clip_url | duration | tmg_name | formula_match | hook_score | notes
```

---

### c. Brief → Auto-Configure Agent

Use this pattern to create or update a Mosaic agent directly from a creative brief.

```
1. Read brief from Google Drive
2. Detect video formula: PAS+, AIDA, 4P's (look for hook/problem/agitate/solution/CTA structure)
3. Map formula to tile sequence:
   - PAS+:  Rough Cut → Clips → Captions → Color Correction → Destination
   - AIDA:  Rough Cut → AI B-Roll → Captions → Outro → Destination
   - 4P's:  Rough Cut → Montage → AI Music → Captions → Destination
4. POST /agent/create with tile graph for new agent, OR
   POST /agent/update to reconfigure existing agent
5. Inject brief-derived Rough Cut prompt via update_params at run time (Pattern a)
```

---

## Error Handling

| HTTP Status | Cause | Resolution |
|---|---|---|
| `400 Bad Request` | Malformed JSON, missing required field, invalid param value | Check request body against schema; validate `node_id` UUIDs |
| `401 Unauthorized` | Missing or invalid `Authorization` header | Confirm `MOSAIC_API_KEY` secret is set and starts with `mk_` |
| `403 Forbidden` | Key lacks permission for the requested resource | Check org-level permissions; contact Mosaic support |
| `404 Not Found` | Agent ID or Run ID does not exist | Re-fetch agent list; confirm IDs are correct |
| `429 Too Many Requests` | Rate limit exceeded | Back off with exponential retry (start at 5s) |
| `500 Internal Server Error` | Mosaic-side error | Retry once after 30s; if persistent, cancel run and re-trigger |

---

## Usage Notes

### Calling the API from sandbox_python

```python
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
```

### Environment variable setup
Add `MOSAIC_API_KEY` in Gumloop → Settings → Secrets. The sandbox injects it automatically at runtime. Never hardcode the key or print it.

### Node ID lookup helper
```python
nodes_r = requests.get(f"{BASE}/agent-nodes", headers=HEADERS)
nodes_r.raise_for_status()
for node in nodes_r.json():
    print(node["id"], node["name"])
```
Run this once to populate the tile table above with any IDs currently marked as "unknown".
