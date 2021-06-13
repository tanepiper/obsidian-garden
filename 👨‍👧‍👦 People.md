---
type: dashboard
---
## Human Connections
The people dashboard allows you to see connections between yourself and others - maybe it's new contacts, or people you are interested in reading or researching.

```dataview
list from #person 
where file.name != "New Person"
```