---
aliases: [🎯 Create Custom Dashboards, dashboards]
type: tutorial
---

## Custom dashboards with dataview
The [Dataview](https://blacksmithgu.github.io/obsidian-dataview/) plugin for [[📇 Terms/🪨 Obsidian/🪨 Obsidian]] allows for the creation of 3 basic types of view using a SQL-like language, as well as JavaScript functions too.

Full documentation is available on the site, but to help you along here are some basic examples - if you see the `dataview` code, switch to preview mode.

### Last 5 edited files
Using the `file` object you can query properties and use functions to do things like date comparsion:
```dataview
list file.mtime
where file.mtime < (date(today) + dur(1 day))
sort file.mtime DESC
limit 5
```

### Show all tutorials
You can be more specific with queries, for example lets find all the pages that contain the `tutorial` type in [[📇 Terms/🪨 Obsidian/Front Matter|Front Matter]]:
```dataview
list where type = "tutorial"
```

### Show all 🌱 Seed templates
As well as lists, you can also render tables - when doing this, you can use file and [[📇 Terms/🪨 Obsidian/Front Matter]] properties and provide them a label.

Querying can be done in a specific folder
```dataview
table description as "Description"
from "⏣ Templates"
sort file.name ASC
```

### People table
As well as folders we can also query `#tags` - when doing this it's good to exclude template files from the query
```dataview
table connection as "Connection"
from #person
sort file.name ASC
where file.name != "👤 New Person"
```