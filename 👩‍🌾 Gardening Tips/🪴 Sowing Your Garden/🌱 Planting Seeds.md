---
aliases: [🌱 Planting Seeds, 🌱 Plant A Seed, plant seeds, plant a seed, seeds, seed]
type: tutorial
---
Tags:: #tutorials #seed #triage #tags #templates #statuses
Updated:: {{this.file.mday}} 

## 🌱 What is a Seed?

A 🌱 seed in the [[📇 Terms/🧠 Knowledge Systems/🌳 Digital Garden|🌳 Digital Garden]] is any kind of document you create that contains ideas, thoughts, resources and other collected things.

When you create a new document it goes into the 🌱 Seed Box folder - an inbox of unsorted items that you collect during the day. Don't be afraid to fill it up the aim is to let you just capture your stream of thoughts - but it's important that you triage regularly.

There are a list of [[#⏣ Seed Templates]] below - when a new seed is created it appears in the [[🪴 Grow Room]] (along with 🪵 Backlog items)

## 💡 Planting Seeds (Triage)

When an item is in the 🌱 Seed Box it has a `status::` property set to `#triage`.  The first thing to do is to select where it goes:

- Use the 🪵 Backlog folder as a place where you have items you want to deal with in a short amount of time, but don't yet want to categorise.
- Place the file with in a [[👩‍🌾 Gardening Tips/🪴 Sowing Your Garden/🏭  Project Stucture|🗂 Project folder]] for files related to a particular topic you are researching
- If it's a [[⏣ Templates/👤 New Person]], [[⏣ Templates/🪛 Todo List]] or [[⏣ Templates/🔖 New Term]] you can place them in the dedicated folders



A seed is a document you create that goes into the 🌱 Seed Box, your inbox for new ideas.

Don't be afraid to fill it with new ideas and notes, it's designed to be an unordered place where you can choose what to grow next, and allow you to collect thoughts during the day.

When creating a document, you can either use (on OSX) the **⌘ + n** to create a new blank document, or select a template with **⌘ + ⌥ + n**.

The document will be created with a `status` of `triage` - this means that the item is currently unsorted - use the document as a way to quickly capture and idea, and later when you have time you can sort them into their correct locations - here set the `status` to `ready`. See [[👩‍🌾 Gardening Tips/🪴 Sowing Your Garden/⚠️  Statuses]] for more details.

Some seed templates also contain a `#tag` and a [[📇 Terms/🪨 Obsidian/Link|link]] allowing for queries and backlinks to be generated to make finding information easier.


## 🌱 Seed Templates

There are several seed templates available to start with - each one contains their own set of custom [[📇 Terms/🪨 Obsidian/Front Matter]] properties - these can be used for additional queries

```dataview
table description as "Description"
from "⏣ Templates"
sort file.name ASC
```

## ⏣ Seed Templates

[[👩‍🌾 Gardening Tips/🪨  🌳  Obsidian Garden|🪨  🌳 Obsidian Garden]] comes with a set of templates designed to let you capture different idea formats, from collecting a [[⏣ Templates/📙 New Reading Item]] such as a book or blog, collecting contacts with a [[⏣ Templates/👤 New Person]] or a [[⏣ Templates/🪛 Todo List]].

```dataview
table description as "Description"
from "⏣ Templates"
sort file.name ASC
```

## Custom Seeds
To create a new template, create a document in the ⏣ Templates folder.

At the top of the document, create a frontmatter block and add a `type` property, giving your document type a name, you can also add a `status: triage` property.

At this point also add any custom properties, these can be used in [[👩‍🌾 Gardening Tips/🪴 Sowing Your Garden/🎯  Create Custom Dashboards]] for example adding an `author` or `source` property.

After the block add your Markdown and text content the template will be available to use, with new items going into the 🌱 Seed Box
