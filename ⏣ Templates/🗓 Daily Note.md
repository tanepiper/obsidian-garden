---
type: daily
description: A basic structure for a daily note that evolves over the day
---
%%
Status:: #in-progress
%%

---
**Tags**:: #daily-note
**Links**:: <!-- Add any additional links here -->

---
<% tp.user.generate_periodic_link_markdown(tp, "D") %>

![[Snippets/Good Day]]

# Today's Plan
<!-- What is the plan for today? Is there anything left over from yesterday? -->

# What Did I Learn Today?
<!-- Put any new ideas or topics to found out today, can any of them be new links? -->

# New Items Created

```dataview
table file.ctime as "Planted at",
file.mtime as "Last tended to",
length(file.inlinks) as "In Links", 
length(file.outlinks) as "Out Links"
where date(file.cday) <= (date(this.file.cday) + dur(1 day))
and date(file.cday) >= date(this.file.cday)
and this.file.name != "🗓 Daily Note"
```
---

<!-- Put links to new items created here -->

# Questions Raised
<!-- Did you have any unanswered questions from today?  Do you have anything you need to follow up? -->

# Other Notes
<!-- Put other notes here, like the weather for the day, any thoughts you had, other quick notes to expand on -->