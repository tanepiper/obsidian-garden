---
type: dashboard
description: Dashboard for the seed box
---

## Welcome to your 🪴 Grow Room

The 🪴 Grow Room is your inbox on current 🪵 Backlog items, and [[👩‍🌾 Gardening Tips/🪴 Sowing Your Garden/🌱 Planting Seeds|🌱 Seeds]] you have created but not yet curated.

⚠️ Don't let your 🪵 Backlog or 🌱 Seed Box get too full!  Try and curate them daily so that there is room for more ideas to be planted

When you are in a creative flow, use [[📇 Terms/🪨 Obsidian/Link|links]] and [[👩‍🌾 Gardening Tips/🪴 Sowing Your Garden/🏷 Using Tags]] in all the new files you create - clicking on links will create more seeds! This will create the [[📇 Terms/💡 Concepts/Connection|connections]] across your [[📇 Terms/🧠 Knowledge Systems/🗃 Knowledge Management|Knowledge Management]] system.

Using the [Templater](https://github.com/SilentVoid13/Templater) plugin you can use the command palette to change from a [[⏣ Templates/🗒 Basic Note]] to any other type - such as [[⏣ Templates/📙 New Reading Item]].

If you are not ready to place the file, or have a file that can be deleted after use (like a shopping list) you can place it in the 🪵 Backlog - this is another inbox for files that are ready to be dealt with.

---

## 🪵 Current Backlog
Your entire backlog is visible
```dataview
table file.ctime as "Planted at" 
from "🪵 Backlog"
sort file.ctime DESC
```
---

## 🌱 Seed Box - 5 Oldest Items
🤨 Should these still be here?
```dataview
table type as "Type", file.ctime as "Planted at", file.mtime as "Last Manicured"
from "🌱 Seed Box"
sort file.ctime ASC
limit 5
```

## 🌱 Seed Box - All Items
All Items in the Seed Box
```dataview
table type as "Type", file.ctime as "Planted at", file.mtime as "Last Manicured"
from "🌱 Seed Box"
sort file.mtime DESC
```