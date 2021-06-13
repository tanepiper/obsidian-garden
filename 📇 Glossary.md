---
type: dashboard
description: A dashboard for creating glossaries
---
## 📇 Glossary of Terms
This is a collected glossary of items with the `#term` tag

The page will automatically build a list of alphabetically-sorted terms - you can also [[📇 Terms/Link|link]] to this page to create a graph connection.

```dataview
table category as "Category"
from #term 
where file.name != "🔖 New Term"
sort file.name ASC
```