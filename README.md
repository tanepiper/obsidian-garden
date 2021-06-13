# 🪨🌱 The Obsidian Garden

The [[👩‍🌾 Gardening Tips/🪨🌱 Obsidian Garden]] is a set of tools to help you plant the seeds of great ideas, letting them grow in to the next great thing that you do.

To use the toolset you need [Obsidian](https://obsidian.md) - a [[📇 Terms/Knowledge Management]] system that lets you collect ideas and form new connections between them plus the installed [[👩‍🌾 Gardening Tips/🔌 Plugins]]

The garden is great for people who want to gather and collect data to build out ideas like a book, a new software product, or just deweeding and decluttering life.

This set of tools is released under Creative Commons Zero v1.0 Universal [[LICENSE]]

## Getting Started
To get started: Fork this repository, and then clone it - then open in Obsidian.  The first thing is to [[👩‍🌾 Gardening Tips/🌱 Creating Seeds]] which allow you to start building up your knowledge collection.

There are a set of base [templates](#Templates) that give you a set of options for collecting data - using the garden you should [[Link]] and #tag as much as possible and adding your own templates is encouraged.

Once you have your data you can start using dashboards like [[📚 Reading]] or [[👨‍👧‍👦 People]] to see what's upcoming and in progress, and how far you've come.

Work with [[👩‍🌾 Gardening Tips/⚠️ Statuses]] and [[👩‍🌾 Gardening Tips/🎯 Create Custom Dashboards]] to get the best out of your knowledge collection.

Once you're ready, feel free to change this readme and turn it into your home dashboard

## Your Dashboards
### Last 5 Files Edited
```dataview
table file.mtime as "Modified Time"
where file.mtime < (date(today) + dur(1 day))
sort file.mtime DESC
limit 5
```

### 🌱 Seed Box
```dataview
list from "🌱 Seed Box"
sort file.ctime DESC
```