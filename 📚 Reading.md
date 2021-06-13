---
type: dashboard
description: A dashboard for all the reading items in the garden
---
## 📚 Curating A Reading List
Reading is one of the best ways to gather knowledge from multiple sources - reading can be books - in physical and electronic form, magazines, blog posts and articles.

Every good reading subject should be something to questions to find answers, and to seek unknown knowledge - by using the [[⏣ Templates/📙 New Reading Item]] you can create a list of items to review and extract data from.

This dashboard is designed to help curate and manage a reading list based on statuses - from a backlog of items being read, to seeing how successful you've already been.

### Triage List
This list contains items not yet processed - to remove them from this list set their status to "ready"
```dataview
table author as "Author", format as "Format"
from #reading
where file.name != "📙 New Reading Item"
and status = "triage"
```

### In Progress List
Items that are current in progress of being read and reviewed
```dataview
table author as "Author", format as "Format"
from #reading
where file.name != "📙 New Reading Item"
and status = "in progress"
```

### Done
A list of all your finished items
```dataview
table author as "Author", format as "Format", rating as "Rating"
from #reading
where file.name != "📙 New Reading Item"
and status = "done"
```