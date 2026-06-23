---
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
- `OPENAI_API_KEY` — Get from platform.openai.com -> API Keys -> Create new secret key

## How It Works

### Stage 1 — OpenCV Cut Detection (local, no API)
Scans every frame for pixel-difference spikes that indicate a hard cut or transition.
Fast, free, handles most ad edits reliably. Tunable sensitivity via `cut_threshold`.

### Stage 2 — GPT-4o Vision Descriptions
Sends each detected shot frame to GPT-4o as a base64 image.
Returns a brief technical description (shot type, subject, action, setting, lighting).

### Stage 3 — Slides Build
Builds a branded Google Slides deck: cover + content slides with portrait thumbnails,
timecodes, descriptions, and CONFIDENTIAL footer.

## Inputs
| Parameter | Type | Description |
|---|---|---|
| `video_drive_url` | string | Google Drive URL or file ID |
| `presentation_title` | string | e.g. "Hims ED — Climax Control" |
| `brand_name` | string | e.g. "Hims" |
| `shots_per_slide` | int | Thumbnails per row (4-8, default 6) |
| `cut_threshold` | float | OpenCV sensitivity — lower = more shots (default 30.0) |
| `output_drive_folder_id` | string | Optional Drive folder for extracted frames |

## Scripts
- scripts/run_shot_list.py    — Main entry point
- scripts/openai_analyzer.py  — OpenCV cut detection + GPT-4o descriptions
- scripts/frame_extractor.py  — OpenCV frame extraction
- scripts/slides_builder.py   — Google Slides presentation builder

## Usage
```python
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
```
