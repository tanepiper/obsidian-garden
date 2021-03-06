---
type: dashboard
description: Dashboard for the seed box
---

## Welcome to your ๐ชด Grow Room

The ๐ชด Grow Room is your inbox on current ๐ชต Backlog items, and [[๐ฉโ๐พ Gardening Tips/๐ชด Sowing Your Garden/๐ฑ Planting Seeds|๐ฑ Seeds]] you have created but not yet curated.

โ ๏ธ Don't let your ๐ชต Backlog or ๐ฑ Seed Box get too full!  Try and curate them daily so that there is room for more ideas to be planted

When you are in a creative flow, use [[๐ Terms/๐ชจ Obsidian/Link|links]] and [[๐ฉโ๐พ Gardening Tips/๐ชด Sowing Your Garden/๐ท Using Tags]] in all the new files you create - clicking on links will create more seeds! This will create the [[๐ Terms/๐ก Concepts/Connection|connections]] across your [[๐ Terms/๐ง  Knowledge Systems/๐ Knowledge Management|Knowledge Management]] system.

Using the [Templater](https://github.com/SilentVoid13/Templater) plugin you can use the command palette to change from a [[โฃ Templates/๐ Basic Note]] to any other type - such as [[โฃ Templates/๐ New Reading Item]].

If you are not ready to place the file, or have a file that can be deleted after use (like a shopping list) you can place it in the ๐ชต Backlog - this is another inbox for files that are ready to be dealt with.

---

## ๐ชต Current Backlog
Your entire backlog is visible
```dataview
table file.ctime as "Planted at" 
from "๐ชต Backlog"
sort file.ctime DESC
```
---

## ๐ฑ Seed Box - 5 Oldest Items
๐คจ Should these still be here?
```dataview
table type as "Type", file.ctime as "Planted at", file.mtime as "Last Manicured"
from "๐ฑ Seed Box"
sort file.ctime ASC
limit 5
```

## ๐ฑ Seed Box - All Items
All Items in the Seed Box
```dataview
table type as "Type", file.ctime as "Planted at", file.mtime as "Last Manicured"
from "๐ฑ Seed Box"
sort file.mtime DESC
```