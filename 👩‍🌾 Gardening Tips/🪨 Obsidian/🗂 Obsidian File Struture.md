---
aliases: [🗂 Obsidian File Structure, file structure]
type: tutorial
description: A guide on how to create a good file structure
---
%%
Status:: #in-progress 
%%

---
Tags:: #tutorial #obsidian #templates #markdown #front-matter #guide
Links:: [[👩‍🌾 Gardening Tips/🪴 Sowing Your Garden/🌱 Planting Seeds]], [[👩‍🌾 Gardening Tips/🪴 Sowing Your Garden/🎯  Create Custom Dashboards|🎯 Create Custom Dashboards]]

---

#  Tips on structuring your files

In [[📇 Terms/🪨 Obsidian/🪨 Obsidian|Obsidian]] you use basic [[Markdown]] to create your content. Obsidian  adds  additional features such as the ability to [[📇 Terms/🪨 Obsidian/Link|link]], as well as a [[Obsidian Query Language]] and template tags.

For your garden to grow, it's good to make sure you have good file hygiene - these are some tips and tricks to help you get the most out of your knowledge.

## Example File Structure

The description of this example file structure is below, but shows what a basic file can look like

```
---
aliases: [Example, example page]
type: example
description: A description for the example page
---
%%
Status:: #triage
%%

---
**Tags**:: #example #tutorial 
**Links**:: [[👩‍🌾 Gardening Tips/🪨 Obsidian/🗂 Obsidian File Struture|🗂 Obsidian File Struture]]

---

# Title

Put some text and [[Links]] in your intro

## Subtitle

Add some **extra** info that is *useful*
```

## Front Matter

The first thing in any [[Markdown]] file is it's [[📇 Terms/🪨 Obsidian/Front Matter|Front Matter]] properties.  The most basic property required is `type` - this defines what type of content is it, and should come from the template.  You can also add an optional `description`.

The `aliases` property is used by [[📇 Terms/🪨 Obsidian/🪨 Obsidian|Obsidian]] to generate [[📇 Terms/🪨 Obsidian/Link|link]] aliases, this means you can use different words on [[📇 Terms/🪨 Obsidian/Link|links]] but create the same connections.

Front Matter properties are best use for ones where you don't want the user to change them, or they are pre-calculated such as a fixed date.  If you want more dynamic or user editable properties, it's better to use variables

## Inline Variables

Properties and variables added to a file allows for richer metadata queries using the [[Obsidian Query Language]], and can be used via plugins to enable features.

While you can add variables to [[📇 Terms/🪨 Obsidian/Front Matter|Front Matter]], you can also provide more dynamic ones as inline variables in documents.

The format is `Variable::` - Any text after this on the same line will be used as the value and can be used in table displays like the [[📇 Glossary]]

- Properties and variables can be added with [[📇 Terms/🪨 Obsidian/Front Matter|Front Matter]]. This plugin allows[[YAML]] properties to the added top of your page between a block made up of 3 dashes (`---`).
- Via variables on the page with the double colon notation (`Variable::`) - when placing these either consider putting them inside a `%%` comment block to hide them, or make their labels bold (`**Variable**::`). Use these for more volatile values like a status, or viewable values like a book author.

## Creating Aliases

In the [[📇 Terms/🪨 Obsidian/Front Matter|frontmatter]] properties, as the first one you can add the `aliases` property which is an array containing alternative names for the files - when creating links, you can use these alternative names to shorten the display of the links, including the same as the file name.

## Good File Hygiene

- Use [[📇 Terms/🪨 Obsidian/Front Matter|Front Matter]] properties for items that you don't want the user to change very often, such as the file type
- Hide Metadata variables in `%%` comment blocks, these can then still be used in queries but won't display in preview mode
- Give inline variable labels a bold (`**`) formatting to stand out
- Use a line break (`---` block in [[Markdown]]]] to show your metadata in an enclosed area

### Example


## Creating An Outline

The way to navigate within a file itself is by using an outline using [[Markdown]] headers tags.  The format is the hash (`#`) symbol between 1-6 times depending on the level, followed by a space and then your header - outlines can be viewed in the Outline [[Sidebar]] tab (by default on the right)

> When displaying on Obsidian Publishing the page title is already considered Level-1, so you should start your outline from Level 2 (`##`) if you intend to display a vault

### Example

```
# Page Title
## Sub Title
### Group Title
#### Section Title
##### Level 5
###### Level 6
```

## Using Variables and Templates

[[📇 Terms/🪨 Obsidian/🪨 Obsidian|Obsidian]] allows for rich pages to be created - there are two main ways to do this:

- Using the [[Templater]] library, template tags can be added to files which are executed on creation. The plugin can be combined with [[📇 Terms/🪨 Obsidian/Front Matter|frontmatter]] properties and used to generate content on the page such as dates, answers to user prompts and custom functions.

- Using the [[Dataview]] library with both frontmatter and the variables described above allows for the creation of additional data views that can be used to drive dashboards.