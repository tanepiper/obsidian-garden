---
type: dashboard
description: A dashboard for the garden project
---
Tags:: #dashboard

## Creating your own garden

This is an example dashboard that you can create for your own project, below it shows the last 5 files edited.

You can [[👩‍🌾 Gardening Tips/🪴 Sowing Your Garden/🎯  Create Custom Dashboards|Create Custom Dashboards]] easily using the `dataview` plugin and SQL-like query language.

---

## Last 5 Files Edited
```dataview
table file.mtime as "Last tended to"
from "🗂 Projects/My New Garden"
where file.mtime < (date(today) + dur(1 day))
sort file.mtime DESC
limit 5
```

## Todo Items From Project
```dataview
task
from "🗂 Projects/My New Garden"
```