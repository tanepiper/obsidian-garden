---
type: dashboard
description: A dashboard for creating glossaries
---
## 📇 Glossary of Terms
This is a collected glossary of items with the `#term` tag. Collecting terms allows you to build up your vocabulary of knowledge - terms can be anything from a concept to the name of something - for example in our terms folder we have [[📇 Terms/Link|Link]], [[📇 Terms/Connection|Connection]], [[📇 Terms/Knowledge Management|Knowledge Management]] and [[📇 Terms/Obsidian|Obsidian]] - by having these are terms, we can link them to other content - allowing a back-link connection across all out files.

The page will automatically build a list of alphabetically-sorted terms - you can also [[📇 Terms/Link|link]] to this page to create a graph connection.

```dataview
table category as "Category"
from #term 
where file.name != "🔖 New Term"
sort file.name ASC
```