# 🪨🌱 The Obsidian Garden

The [[👩‍🌾 Gardening Tips/🪨🌱 Obsidian Garden]] is a set of tools to help you plant the seeds of great ideas, letting them grow in to the next great thing that you do.

Built in [Obsidian](https://obsidian.md)

The garden is great for people who want to gather and collect data to build out ideas like a book, a new software product, or just deweeding and decluttering life.

## Getting Started
To get started, clone this repository and open in [Obsidian](https://obsidian.md). To create a new template file (on OSX) use **⌘ + n** or select a template with **⌘ + ⌥ + n** - a list of [templates](#Templates) is listed below.

## How to grow the garden

### Query-Driven Dashboards
One of the features of the garden is the dashboard pages, these allow dynamic queries to be created - for example these are the 5 most recent files worked on and their last modified time:

```dataview
list file.mtime
where file.mtime < (date(today) + dur(1 day))
sort file.mtime DESC
limit 5
```

### Templates

These templates will help you get started in making notes, each one contains a basic Frontmatter configuration for each type - these properties are used to make dataview queries

```dataview
list from "⏣ Templates"
sort file.name ASC
```

### The 🌱 Seed Box and Statuses
The 🌱 Seed Box is your inbox for new notes and ideas - when you create a new file, it will go here.  The files contain properties that are used for queries - the most important is the `status` property which is set to `triage` to start with, this means the file requires some pruning.

Once you have set the file properties and added some detail, you can set the `status` to `ready`. This indicates it's ready to pick up.

When a item is in flight, set it to `in progress` and finally when complete, set to `done`.

You can create your own custom statuses too, but these 4 build the foundation of the gardens queries.

#### Current 🌰 Seeds

```dataview
list from "🌱 Seed Box"
sort file.mtime DESC
```