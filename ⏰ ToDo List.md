---
type: dashboard
description: The todo list dashboard
---
## Todo Tasks
This dashboard contains all of your current todo lists where the file is tagged with `#todo-list`.

```dataview
task from #todo-list 
where file.name != "🪛 Todo List"
```