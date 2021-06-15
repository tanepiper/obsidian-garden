---
aliases: [🗂 Obsidian File Struture, file structure]
type: tutorial
description: A guide on how to create a good file structure
---
%%
Status:: #in-progress 
%%
Tags:: #tutorial #obsidian #templates #markdown #front-matter #guide
Links:: [[👩‍🌾 Gardening Tips/🌱 Creating Seeds]], [[👩‍🌾 Gardening Tips/🎯 Create Custom Dashboards|🎯 Create Custom Dashboards]]

## Anantomy of a File

In [[📇 Terms/Obsidian|Obsidian]] you use [[Markdown]] files to create your content adding some additional features such as the ability to [[📇 Terms/Link|link]].  Each file should be made up of it's content, metadata and comments that guide the user on using your templates.

### Adding Properties and Variables

Properties and variables added to a file allows for richer metadata queries using the [[Obsidian Query Language]], and can be used via plugins to enable features.

- Properties and variables can be added with [[📇 Terms/Front Matter|Front Matter]]. This plugin allows[[YAML]] properties to the added top of your page between a block made up of 3 dashes (`---`).
- Via variables on the page with the double colon notation (`Variable::`) - when placing these either consider putting them inside a `%%` comment block to hide them, or make their labels bold (`**Variable**::`). Use these for more volatile vaules like a status, or viewable values like a book author.

### Creating Aliases

In the [[📇 Terms/Front Matter|frontmatter]] properties, as the first one you can add the `aliases` property which is an array containing alternative names for the files - when creating links, you can use these alternative names to shorten the display of the links, including the same as the file name.

### Good File Hygine

- Use frontmatter properties for items that you don't want the user to change very often
- Hide Metadata variables in `%%` comment blocks
- Give visible variable labels a `**` bold formatting

#### Example
```
---
aliases: [Example, example page]
type: example
description: A description for the example page
---

%%
Status:: #triage
%%

**Tags**:: #example #tutorial;
```

### Creating An Outline

The way to navigate within a file itself is by using an outline using [[Markdown]] headers tags.  The format is the hash (`#`) symbol between 1-6 times depending on the level, followed by a space and then your header - outlines can be viewed in the Outline [[Sidebar]] tab (by default on the right)

> When displaying on Obsidian Publishing the page title is already considered Level-1, so you should start your outline from Level 2 (`##`) if you intend to display a vault

#### Example

```
# Page Title
## Sub Title
### Group Title
#### Section Title
##### Level 5
###### Level 6
```

## Using Variables and Templates

[[📇 Terms/Obsidian|Obsidian]] allows for rich pages to be created - there are two main ways to do this:

- Using the [[Templater]] library, template tags can be added to files which are executed on creation. The plugin can be combined with [[📇 Terms/Front Matter|frontmatter]] properties and used to generate content on the page such as dates, answers to user prompts and custom functions.

- Using the [[Dataview]] library with both frontmatter and the variables described above allows for the creation of additional data views that can be used to drive dashboards.