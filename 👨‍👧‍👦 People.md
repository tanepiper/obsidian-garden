---
aliases: [People, people, person]
type: dashboard
---
## Human Connections
Human connection is important - without it, we can feel lost. Connection is essential for collaboration.

By building up a list of people, we can build the connections between them too - people can be anyone from you personal and project contacts, to historical figures or celebrities.

When researching people, adding connections between them shows that sometimes we're closer than we think - we all have our Kevin Bacon factor (mine is 3) but by adding more detail we might accidentaly find we're closer.

This dashboard shows all your current people with the `#person` tag and how they are connected

```dataview
list from #person 
where file.name != "👤 New Person"
```