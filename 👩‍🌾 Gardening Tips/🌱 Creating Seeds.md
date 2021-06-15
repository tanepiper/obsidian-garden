---
aliases: [🌱 Creating Seeds, create seeds, create a seed, seeds, seed]
type: tutorial
---
Tags:: #tutorials #seed #triage #tags #templates #statuses

## What is a 🌱 Seed?
A seed is a document you create that goes into the 🌱 Seed Box, your inbox for new ideas.

Don't be afraid to fill it with new ideas and notes, it's designed to be an unordered place where you can choose what to grow next, and allow you to collect thoughts during the day.

When creating a document, you can either use (on OSX) the **⌘ + n** to create a new blank document, or select a template with **⌘ + ⌥ + n**.

The document will be created with a `status` of `triage` - this means that the item is currently unsorted - use the document as a way to quickly capture and idea, and later when you have time you can sort them into their correct locations - here set the `status` to `ready`. See [[👩‍🌾 Gardening Tips/⚠️ Statuses]] for more details.

Some seed templates also contain a `#tag` and a [[📇 Terms/Link|link]] allowing for queries and backlinks to be generated to make finding information easier.

## 🌱 Seed Templates

There are several seed templates available to start with - each one contains their own set of custom [[📇 Terms/Front Matter]] properties - these can be used for additional queries

```dataview
table description as "Description"
from "⏣ Templates"
sort file.name ASC
```

## Custom Seeds
To create a new template, create a document in the ⏣ Templates folder.

At the top of the document, create a frontmatter block and add a `type` property, giving your document type a name, you can also add a `status: triage` property.

At this point also add any custom properties, these can be used in [[👩‍🌾 Gardening Tips/🎯 Create Custom Dashboards]] for example adding an `author` or `source` property.

After the block add your Markdown and text content the template will be available to use, with new items going into the 🌱 Seed Box
