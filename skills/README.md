# Skills

This folder contains the skill prompt files for the Skillbase app.
Each `.md` file corresponds to a skill in the app.

When any file in this folder is pushed to GitHub, a GitHub Action
automatically syncs the updated prompt to the Supabase database,
which is then reflected in the Skillbase app on next load.

## Skill ID Mapping

| File | Supabase ID |
|------|-------------|
| production-brief-asset-breakdown.md | pbab |
| production-brief-resource-breakdown.md | pbrb |
| ad-grammar.md | adgrammar |
| mosaic-video-editor.md | mosaic |
| sales-components-footage.md | salescomp |
| shadow.md | shadow |
| shot-list-creator.md | shotlist |
| soundbite-checker.md | soundbite |
| substance-vs-style.md | svs |
| testimonial-messaging-groups.md | tmg |
| thumbstop-shop.md | thumbstop |
| video-shot-list.md | videoshotlist |
| visual-archetypes.md | visarch |

## Updating a skill

Edit the relevant `.md` file and push. The GitHub Action handles the rest.
