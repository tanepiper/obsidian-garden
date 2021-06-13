---
type: dashboard
---
## Curating A Reading List 📚
This dashboard is designed to help curate and manage a reading list based on statuses.

To create a new reading item use the [[⏣ Templates/New Reading Item]] template to create an item, set the format such as "Book", "E-Book", etc from the options and fill in the other details.

When you have added some details to a document, set the status from "triage" to "ready". when picking up a reading item set the status to "in progress" and when finished to "done".

When finished a book, you can add a rating.

### Triage List
This list contains items not yet processed - to remove them from this list set their status to "ready"
```dataview
table author as "Author", format as "Format"
from #reading
where file.name != "New Reading Item"
and status = "triage"
```

### In Progress List
```dataview
table author as "Author", format as "Format"
from #reading
where file.name != "New Reading Item"
and status = "in progress"
```

### Done
```dataview
table author as "Author", format as "Format", rating as "Rating"
from #reading
where file.name != "New Reading Item"
and status = "done"
```