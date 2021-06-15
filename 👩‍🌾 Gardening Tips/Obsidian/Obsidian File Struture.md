---
type: tutorial
description: A guide on how to create a good file structure
---
%%
Status:: #in-progress 
%%
Tags:: #tutorial #obsidian #templates #markdown #front-matter #guide
Links:: [[👩‍🌾 Gardening Tips/🌱 Creating Seeds]], [[👩‍🌾 Gardening Tips/🎯 Create Custom Dashboards|🎯 Create Custom Dashboards]]

## Anantomy of a File

In [[📇 Terms/Obsidian|Obsidian]]] you use [[Markdown]] files to create your content - with some additional content and ways of adding things.  Each file should be made up of it's content, metadata and comments to guide the user if creating templates.

### Adding Properties

Adding properties to a file allows you to add more rich metadata to files that can be used to help build up queries using the [[Obsidian Query Language]]. Properties can be added in two ways:

- Via [[📇 Terms/Front Matter|Front Matter]] which is an extension for Markdown that allows you to add [[YAML]] properties to the top of your page between a block made up of 3 dashes (`---`). Use these properties for more permenant values like a file type
- Via variables on the page with the double colon notation (`Variable::`) - when placing these either consider putting them inside a `%%` comment block to hide them, or make their labels bold (`**Variable**::`). Use these for more volatile vaules like a status, or viewable values like a book author.

### Creating Aliases

In the [[📇 Terms/Front Matter|frontmatter]] properties, as the first one you can add the `aliases` property which is an array containing alternative names for the files - when creating links, you can use these alternative names to shorten the display of the links, including the same as the file name.

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

Tags:: #example #tutorial;
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

- Using the [[Templater]] library, 

As described above, you can create variables for your page - these can be used in creating [[Dataview]] queries - also installed is the Templater library which allows for the use of functions in creating file