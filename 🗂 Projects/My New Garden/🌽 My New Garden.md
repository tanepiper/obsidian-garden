---
type: dashboard
description: A dashboard for the garden project
---
Tags:: #dashboard

## Creating your own garden

This is an example dashboard that you can create for your own project, below it shows the last 5 files edited.

You can [[ðĐâðū Gardening Tips/ðŠī Sowing Your Garden/ðŊ  Create Custom Dashboards|Create Custom Dashboards]] easily using the `dataview` plugin and SQL-like query language.

---

## Last 5 Files Edited
```dataview
table file.mtime as "Last tended to"
from "ð Projects/My New Garden"
where file.mtime < (date(today) + dur(1 day))
sort file.mtime DESC
limit 5
```

## Todo Items From Project
```dataview
task
from "ð Projects/My New Garden"
```