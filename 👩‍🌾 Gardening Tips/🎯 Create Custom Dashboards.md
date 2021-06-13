---
type: tutorial
---

## Custom dashboards with dataview
The [dataview](https://blacksmithgu.github.io/obsidian-dataview/) plugin allows for the creation of simple but rich dynamic queries across your Obsidian dataset.

For example, here are the last 5 edited files - click the "Preview" button to see it

```dataview
list file.mtime
where file.mtime < (date(today) + dur(1 day))
sort file.mtime DESC
limit 5
```

You can be more specific with queries, for example lets find all the pages that contain the `tutorial` type in frontmatter

```dataview
list where type = "tutorial"
```

We can also create tables, here we can select a specific folder containing our templates, and we'll sort them by name

```dataview
table description as "Description"
from "⏣ Templates"
sort file.name ASC
```

We can also query tags, here we can also filter out files like templates

```dataview
table connection as "Connection"
from #person
sort file.name ASC
where file.name != "New Person"
```