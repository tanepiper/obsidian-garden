---
type: dashboard
description: A dashboard for creating glossaries
---
## 📇 Glossary of Terms

This is a collected glossary of items with the `#term` tag.  You can use the [[⏣ Templates/🔖 New Term]] template, or add it to any existing note.

Terms can be anything from a concept to the name of something - for example in our terms folder we have [[📇 Terms/Link|Link]], [[📇 Terms/Connection|Connection]], [[📇 Terms/Knowledge Management|Knowledge Management]] and [[📇 Terms/Obsidian|Obsidian]].

They allow us to add extra richness to our searches, discover alternative meanings and expand our vocabulary.

The page will automatically build a list of alphabetically-sorted terms - you can also [[📇 Terms/Link|link]] to this page to create a graph connection.

```dataview
table category as "Category"
from #term 
where file.name != "🔖 New Term"
sort file.name ASC
```