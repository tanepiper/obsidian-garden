---
type: dashboard
description: A dashboard for creating glossaries
---
## Glossary of Terms
```dataview
table category as "Category"
from #term 
where file.name != "🔖 New Term"
```