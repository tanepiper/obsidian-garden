---
type: dashboard
description: A dashboard containing all todo lists
---
## Todo Tasks
The dreaded ToDo board! Or is it Todo? Or To do?

Never mind, it's something that many of us have, but always fail to update.  This dashboard contains all of your current todo lists where the file is tagged with `#todo-list`.

```dataview
task from #todo-list 
where file.name != "🪛 Todo List"
```