import os, re, json, urllib.request, urllib.error, datetime

SB_URL = os.environ["SB_URL"]
SB_KEY = os.environ["SB_KEY"]

ID_MAP = {
    "production-brief-asset-breakdown": "pbab",
    "production-brief-resource-breakdown": "pbrb",
    "ad-grammar": "adgrammar",
    "mosaic-video-editor": "mosaic",
    "sales-components-footage": "salescomp",
    "shadow": "shadow",
    "shot-list-creator": "shotlist",
    "soundbite-checker": "soundbite",
    "substance-vs-style": "svs",
    "testimonial-messaging-groups": "tmg",
    "thumbstop-shop": "thumbstop",
    "video-shot-list": "videoshotlist",
    "visual-archetypes": "visarch",
}

skills_dir = "skills"
ok, fail, skip = 0, 0, 0

for fname in sorted(os.listdir(skills_dir)):
    if not fname.endswith(".md") or fname == "README.md":
        continue

    skill_key = fname[:-3]
    skill_id = ID_MAP.get(skill_key)
    if not skill_id:
        print(f"SKIP: {fname} (no ID mapping)")
        skip += 1
        continue

    with open(os.path.join(skills_dir, fname), "r") as f:
        content = f.read()

    # Extract description from frontmatter - simple line search
    description = ""
    for line in content.splitlines():
        if line.startswith("description:"):
            description = line[len("description:"):].strip().strip('"').strip("'")
            break

    payload = json.dumps({
        "prompt": content,
        "description": description,
        "updated_at": datetime.datetime.utcnow().isoformat() + "Z"
    }).encode()

    req = urllib.request.Request(
        f"{SB_URL}/rest/v1/skills?id=eq.{skill_id}",
        data=payload,
        method="PATCH",
        headers={
            "apikey": SB_KEY,
            "Authorization": f"Bearer {SB_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
        }
    )
    try:
        with urllib.request.urlopen(req) as resp:
            print(f"OK {skill_id} ({fname}) -> {resp.status}")
            ok += 1
    except urllib.error.HTTPError as e:
        print(f"FAIL {skill_id} -> {e.code} {e.reason}")
        fail += 1

print(f"\nDone: {ok} updated, {fail} failed, {skip} skipped")
if fail > 0:
    exit(1)
