---
type: dashboard
description: Dashboard for the seed box
---

## Welcome to the 🌱 Seed Box

The 🌱 Seed Box is your inbox on current [[👩‍🌾 Gardening Tips/🌱 Creating Seeds|seeds]] you have created but not yet currated.

> ⚠️ Don't let your 🌱 Seed Box get too full!  Try and currate it daily so that there is room for more ideas to be planted

When you are in a creative flow, use [[📇 Terms/Link|links]] and `#tags` in all the new files you create - clicking on links will create more seeds! This will create the [[📇 Terms/Connection|connections]] across your [[📇 Terms/Knowledge Management|Knowledge Management]] system.

Using the [Templater](https://github.com/SilentVoid13/Templater) plugin you can use the command pallete to change from a [[⏣ Templates/🗒 Basic Note]] to any other type - such as [[⏣ Templates/📙 New Reading Item]]. 

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
```dataview
table type as "Type", file.ctime as "Planted at", file.mtime as "Last Manicured"
from "🌱 Seed Box"
sort file.mtime DESC
```