'use strict';

var obsidian = require('obsidian');
var fs = require('fs');
var path = require('path');
var child_process = require('child_process');
var util = require('util');

function _interopNamespace(e) {
    if (e && e.__esModule) return e;
    var n = Object.create(null);
    if (e) {
        Object.keys(e).forEach(function (k) {
            if (k !== 'default') {
                var d = Object.getOwnPropertyDescriptor(e, k);
                Object.defineProperty(n, k, d.get ? d : {
                    enumerable: true,
                    get: function () {
                        return e[k];
                    }
                });
            }
        });
    }
    n['default'] = e;
    return Object.freeze(n);
}

var path__namespace = /*#__PURE__*/_interopNamespace(path);

/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

class TemplaterError extends Error {
    constructor(msg, console_msg) {
        super(msg);
        this.console_msg = console_msg;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

const DEFAULT_SETTINGS = {
    command_timeout: 5,
    template_folder: "",
    templates_pairs: [["", ""]],
    trigger_on_file_creation: false,
    enable_system_commands: false,
    shell_path: "",
    script_folder: undefined,
    empty_file_template: undefined,
    syntax_highlighting: true,
};
class TemplaterSettingTab extends obsidian.PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.app = app;
        this.plugin = plugin;
    }
    display() {
        const { containerEl } = this;
        let desc;
        containerEl.empty();
        new obsidian.Setting(containerEl)
            .setName("Template folder location")
            .setDesc("Files in this folder will be available as templates.")
            .addText(text => {
            text.setPlaceholder("Example: folder 1/folder 2")
                .setValue(this.plugin.settings.template_folder)
                .onChange((new_folder) => {
                this.plugin.settings.template_folder = new_folder;
                this.plugin.saveSettings();
            });
        });
        new obsidian.Setting(containerEl)
            .setName("Timeout")
            .setDesc("Maximum timeout in seconds for a system command.")
            .addText(text => {
            text.setPlaceholder("Timeout")
                .setValue(this.plugin.settings.command_timeout.toString())
                .onChange((new_value) => {
                const new_timeout = Number(new_value);
                if (isNaN(new_timeout)) {
                    this.plugin.log_error(new TemplaterError("Timeout must be a number"));
                    return;
                }
                this.plugin.settings.command_timeout = new_timeout;
                this.plugin.saveSettings();
            });
        });
        desc = document.createDocumentFragment();
        desc.append("Templater provides multiples predefined variables / functions that you can use.", desc.createEl("br"), "Check the ", desc.createEl("a", {
            href: "https://silentvoid13.github.io/Templater/",
            text: "documentation"
        }), " to get a list of all the available internal variables / functions.");
        new obsidian.Setting(containerEl)
            .setName("Internal Variables and Functions")
            .setDesc(desc);
        desc = document.createDocumentFragment();
        desc.append("Adds syntax highlighting for Templater commands in edit mode.");
        new obsidian.Setting(containerEl)
            .setName("Syntax Highlighting")
            .setDesc(desc)
            .addToggle(toggle => {
            toggle
                .setValue(this.plugin.settings.syntax_highlighting)
                .onChange(syntax_highlighting => {
                this.plugin.settings.syntax_highlighting = syntax_highlighting;
                this.plugin.saveSettings();
                this.plugin.update_syntax_highlighting();
            });
        });
        desc = document.createDocumentFragment();
        desc.append("Templater will listen for the new file creation event, and replace every command it finds in the new file's content.", desc.createEl("br"), "This makes Templater compatible with other plugins like the Daily note core plugin, Calendar plugin, Review plugin, Note refactor plugin, ...", desc.createEl("br"), desc.createEl("b", {
            text: "Warning: ",
        }), "This can be dangerous if you create new files with unknown / unsafe content on creation. Make sure that every new file's content is safe on creation.");
        new obsidian.Setting(containerEl)
            .setName("Trigger Templater on new file creation")
            .setDesc(desc)
            .addToggle(toggle => {
            toggle
                .setValue(this.plugin.settings.trigger_on_file_creation)
                .onChange(trigger_on_file_creation => {
                this.plugin.settings.trigger_on_file_creation = trigger_on_file_creation;
                this.plugin.saveSettings();
                this.plugin.update_trigger_file_on_creation();
                // Force refresh
                this.display();
            });
        });
        if (this.plugin.settings.trigger_on_file_creation) {
            desc = document.createDocumentFragment();
            desc.append("Templater will automatically apply this template to new empty files when they are created.", desc.createEl("br"), "The .md extension for the file shouldn't be specified.");
            new obsidian.Setting(containerEl)
                .setName("Empty file template")
                .setDesc(desc)
                .addText(text => {
                text.setPlaceholder("folder 1/template_file")
                    .setValue(this.plugin.settings.empty_file_template)
                    .onChange((empty_file_template) => {
                    this.plugin.settings.empty_file_template = empty_file_template;
                    this.plugin.saveSettings();
                });
            });
        }
        desc = document.createDocumentFragment();
        desc.append("All JavaScript files in this folder will be loaded as CommonJS modules, to import custom user functions.", desc.createEl("br"), "The folder needs to be accessible from the vault.", desc.createEl("br"), "Check the ", desc.createEl("a", {
            href: "https://silentvoid13.github.io/Templater/",
            text: "documentation",
        }), " for more informations.");
        new obsidian.Setting(containerEl)
            .setName("Script files folder location")
            .setDesc(desc)
            .addText(text => {
            text.setPlaceholder("Example: folder 1/folder 2")
                .setValue(this.plugin.settings.script_folder)
                .onChange((new_folder) => {
                this.plugin.settings.script_folder = new_folder;
                this.plugin.saveSettings();
            });
        });
        desc = document.createDocumentFragment();
        desc.append("Allows you to create user functions linked to system commands.", desc.createEl("br"), desc.createEl("b", {
            text: "Warning: "
        }), "It can be dangerous to execute arbitrary system commands from untrusted sources. Only run system commands that you understand, from trusted sources.");
        new obsidian.Setting(containerEl)
            .setName("Enable System Commands")
            .setDesc(desc)
            .addToggle(toggle => {
            toggle
                .setValue(this.plugin.settings.enable_system_commands)
                .onChange(enable_system_commands => {
                this.plugin.settings.enable_system_commands = enable_system_commands;
                this.plugin.saveSettings();
                // Force refresh
                this.display();
            });
        });
        if (this.plugin.settings.enable_system_commands) {
            desc = document.createDocumentFragment();
            desc.append("Full path to the shell binary to execute the command with.", desc.createEl("br"), "This setting is optional and will default to the system's default shell if not specified.", desc.createEl("br"), "You can use forward slashes ('/') as path separators on all platforms if in doubt.");
            new obsidian.Setting(containerEl)
                .setName("Shell binary location")
                .setDesc(desc)
                .addText(text => {
                text.setPlaceholder("Example: /bin/bash, ...")
                    .setValue(this.plugin.settings.shell_path)
                    .onChange((shell_path) => {
                    this.plugin.settings.shell_path = shell_path;
                    this.plugin.saveSettings();
                });
            });
            let i = 1;
            this.plugin.settings.templates_pairs.forEach((template_pair) => {
                const div = containerEl.createEl('div');
                div.addClass("templater_div");
                const title = containerEl.createEl('h4', {
                    text: 'User Function n°' + i,
                });
                title.addClass("templater_title");
                const setting = new obsidian.Setting(containerEl)
                    .addExtraButton(extra => {
                    extra.setIcon("cross")
                        .setTooltip("Delete")
                        .onClick(() => {
                        const index = this.plugin.settings.templates_pairs.indexOf(template_pair);
                        if (index > -1) {
                            this.plugin.settings.templates_pairs.splice(index, 1);
                            // Force refresh
                            this.plugin.saveSettings();
                            this.display();
                        }
                    });
                })
                    .addText(text => {
                    const t = text.setPlaceholder('Function name')
                        .setValue(template_pair[0])
                        .onChange((new_value) => {
                        const index = this.plugin.settings.templates_pairs.indexOf(template_pair);
                        if (index > -1) {
                            this.plugin.settings.templates_pairs[index][0] = new_value;
                            this.plugin.saveSettings();
                        }
                    });
                    t.inputEl.addClass("templater_template");
                    return t;
                })
                    .addTextArea(text => {
                    const t = text.setPlaceholder('System Command')
                        .setValue(template_pair[1])
                        .onChange((new_cmd) => {
                        const index = this.plugin.settings.templates_pairs.indexOf(template_pair);
                        if (index > -1) {
                            this.plugin.settings.templates_pairs[index][1] = new_cmd;
                            this.plugin.saveSettings();
                        }
                    });
                    t.inputEl.setAttr("rows", 4);
                    t.inputEl.addClass("templater_cmd");
                    return t;
                });
                setting.infoEl.remove();
                div.appendChild(title);
                div.appendChild(containerEl.lastChild);
                i += 1;
            });
            const div = containerEl.createEl('div');
            div.addClass("templater_div2");
            const setting = new obsidian.Setting(containerEl)
                .addButton(button => {
                const b = button.setButtonText("Add New User Function").onClick(() => {
                    this.plugin.settings.templates_pairs.push(["", ""]);
                    // Force refresh
                    this.display();
                });
                b.buttonEl.addClass("templater_button");
                return b;
            });
            setting.infoEl.remove();
            div.appendChild(containerEl.lastChild);
        }
    }
}

const obsidian_module = require("obsidian");
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function escapeRegExp$1(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}
function resolveTFile(app, file_str) {
    file_str = obsidian.normalizePath(file_str);
    const file = app.vault.getAbstractFileByPath(file_str);
    if (!file) {
        throw new TemplaterError(`File "${file_str}" doesn't exist`);
    }
    if (!(file instanceof obsidian.TFile)) {
        throw new TemplaterError(`${file_str} is a folder, not a file`);
    }
    return file;
}
function getTFilesFromFolder(app, folder_str) {
    folder_str = obsidian.normalizePath(folder_str);
    const folder = app.vault.getAbstractFileByPath(folder_str);
    if (!folder) {
        throw new TemplaterError(`Folder "${folder_str}" doesn't exist`);
    }
    if (!(folder instanceof obsidian.TFolder)) {
        throw new TemplaterError(`${folder_str} is a file, not a folder`);
    }
    let files = [];
    obsidian.Vault.recurseChildren(folder, (file) => {
        if (file instanceof obsidian.TFile) {
            files.push(file);
        }
    });
    files.sort((a, b) => {
        return a.basename.localeCompare(b.basename);
    });
    return files;
}

var OpenMode;
(function (OpenMode) {
    OpenMode[OpenMode["InsertTemplate"] = 0] = "InsertTemplate";
    OpenMode[OpenMode["CreateNoteTemplate"] = 1] = "CreateNoteTemplate";
})(OpenMode || (OpenMode = {}));
class TemplaterFuzzySuggestModal extends obsidian.FuzzySuggestModal {
    constructor(app, plugin) {
        super(app);
        this.app = app;
        this.plugin = plugin;
    }
    getItems() {
        if (this.plugin.settings.template_folder === "") {
            return this.app.vault.getMarkdownFiles();
        }
        return getTFilesFromFolder(this.app, this.plugin.settings.template_folder);
    }
    getItemText(item) {
        return item.basename;
    }
    onChooseItem(item, _evt) {
        switch (this.open_mode) {
            case OpenMode.InsertTemplate:
                this.plugin.templater.append_template(item);
                break;
            case OpenMode.CreateNoteTemplate:
                this.plugin.templater.create_new_note_from_template(item, this.creation_folder);
                break;
        }
    }
    start() {
        try {
            this.open();
        }
        catch (e) {
            this.plugin.log_error(e);
        }
    }
    insert_template() {
        this.open_mode = OpenMode.InsertTemplate;
        this.start();
    }
    create_new_note_from_template(folder) {
        this.creation_folder = folder;
        this.open_mode = OpenMode.CreateNoteTemplate;
        this.start();
    }
}

const UNSUPPORTED_MOBILE_TEMPLATE = "Error_MobileUnsupportedTemplate";
const ICON_DATA = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 51.1328 28.7"><path d="M0 15.14 0 10.15 18.67 1.51 18.67 6.03 4.72 12.33 4.72 12.76 18.67 19.22 18.67 23.74 0 15.14ZM33.6928 1.84C33.6928 1.84 33.9761 2.1467 34.5428 2.76C35.1094 3.38 35.3928 4.56 35.3928 6.3C35.3928 8.0466 34.8195 9.54 33.6728 10.78C32.5261 12.02 31.0995 12.64 29.3928 12.64C27.6862 12.64 26.2661 12.0267 25.1328 10.8C23.9928 9.5733 23.4228 8.0867 23.4228 6.34C23.4228 4.6 23.9995 3.1066 25.1528 1.86C26.2994.62 27.7261 0 29.4328 0C31.1395 0 32.5594.6133 33.6928 1.84M49.8228.67 29.5328 28.38 24.4128 28.38 44.7128.67 49.8228.67M31.0328 8.38C31.0328 8.38 31.1395 8.2467 31.3528 7.98C31.5662 7.7067 31.6728 7.1733 31.6728 6.38C31.6728 5.5867 31.4461 4.92 30.9928 4.38C30.5461 3.84 29.9995 3.57 29.3528 3.57C28.7061 3.57 28.1695 3.84 27.7428 4.38C27.3228 4.92 27.1128 5.5867 27.1128 6.38C27.1128 7.1733 27.3361 7.84 27.7828 8.38C28.2361 8.9267 28.7861 9.2 29.4328 9.2C30.0795 9.2 30.6128 8.9267 31.0328 8.38M49.4328 17.9C49.4328 17.9 49.7161 18.2067 50.2828 18.82C50.8495 19.4333 51.1328 20.6133 51.1328 22.36C51.1328 24.1 50.5594 25.59 49.4128 26.83C48.2595 28.0766 46.8295 28.7 45.1228 28.7C43.4228 28.7 42.0028 28.0833 40.8628 26.85C39.7295 25.6233 39.1628 24.1366 39.1628 22.39C39.1628 20.65 39.7361 19.16 40.8828 17.92C42.0361 16.6733 43.4628 16.05 45.1628 16.05C46.8694 16.05 48.2928 16.6667 49.4328 17.9M46.8528 24.52C46.8528 24.52 46.9595 24.3833 47.1728 24.11C47.3795 23.8367 47.4828 23.3033 47.4828 22.51C47.4828 21.7167 47.2595 21.05 46.8128 20.51C46.3661 19.97 45.8162 19.7 45.1628 19.7C44.5161 19.7 43.9828 19.97 43.5628 20.51C43.1428 21.05 42.9328 21.7167 42.9328 22.51C42.9328 23.3033 43.1561 23.9733 43.6028 24.52C44.0494 25.06 44.5961 25.33 45.2428 25.33C45.8895 25.33 46.4261 25.06 46.8528 24.52Z" fill="currentColor"/></svg>`;

class CursorJumper {
    constructor(app) {
        this.app = app;
        this.cursor_regex = new RegExp("<%\\s*tp.file.cursor\\((?<order>[0-9]{0,2})\\)\\s*%>", "g");
    }
    jump_to_next_cursor_location() {
        return __awaiter(this, void 0, void 0, function* () {
            const active_view = this.app.workspace.getActiveViewOfType(obsidian.MarkdownView);
            if (!active_view) {
                return;
            }
            const active_file = active_view.file;
            yield active_view.save();
            const content = yield this.app.vault.read(active_file);
            const { new_content, positions } = this.replace_and_get_cursor_positions(content);
            if (positions) {
                yield this.app.vault.modify(active_file, new_content);
                this.set_cursor_location(positions);
            }
        });
    }
    get_editor_position_from_index(content, index) {
        const substr = content.substr(0, index);
        let l = 0;
        let offset = -1;
        let r = -1;
        for (; (r = substr.indexOf("\n", r + 1)) !== -1; l++, offset = r)
            ;
        offset += 1;
        const ch = content.substr(offset, index - offset).length;
        return { line: l, ch: ch };
    }
    replace_and_get_cursor_positions(content) {
        let cursor_matches = [];
        let match;
        while ((match = this.cursor_regex.exec(content)) != null) {
            cursor_matches.push(match);
        }
        if (cursor_matches.length === 0) {
            return {};
        }
        cursor_matches.sort((m1, m2) => {
            return Number(m1.groups["order"]) - Number(m2.groups["order"]);
        });
        const match_str = cursor_matches[0][0];
        cursor_matches = cursor_matches.filter(m => {
            return m[0] === match_str;
        });
        const positions = [];
        let index_offset = 0;
        for (let match of cursor_matches) {
            const index = match.index - index_offset;
            positions.push(this.get_editor_position_from_index(content, index));
            content = content.replace(new RegExp(escapeRegExp$1(match[0])), "");
            index_offset += match[0].length;
            // For tp.file.cursor(), we keep the default top to bottom
            if (match[1] === "") {
                break;
            }
        }
        return { new_content: content, positions: positions };
    }
    set_cursor_location(positions) {
        const active_view = this.app.workspace.getActiveViewOfType(obsidian.MarkdownView);
        if (!active_view) {
            return;
        }
        const editor = active_view.editor;
        editor.focus();
        let selections = [];
        for (let pos of positions) {
            selections.push({ from: pos });
        }
        let transaction = {
            selections: selections
        };
        editor.transaction(transaction);
    }
}

function setPrototypeOf(obj, proto) {
    // eslint-disable-line @typescript-eslint/no-explicit-any
    if (Object.setPrototypeOf) {
        Object.setPrototypeOf(obj, proto);
    }
    else {
        obj.__proto__ = proto;
    }
}
// This is pretty much the only way to get nice, extended Errors
// without using ES6
/**
 * This returns a new Error with a custom prototype. Note that it's _not_ a constructor
 *
 * @param message Error message
 *
 * **Example**
 *
 * ```js
 * throw EtaErr("template not found")
 * ```
 */
function EtaErr(message) {
    var err = new Error(message);
    setPrototypeOf(err, EtaErr.prototype);
    return err;
}
EtaErr.prototype = Object.create(Error.prototype, {
    name: { value: 'Eta Error', enumerable: false }
});
/**
 * Throws an EtaErr with a nicely formatted error and message showing where in the template the error occurred.
 */
function ParseErr(message, str, indx) {
    var whitespace = str.slice(0, indx).split(/\n/);
    var lineNo = whitespace.length;
    var colNo = whitespace[lineNo - 1].length + 1;
    message +=
        ' at line ' +
            lineNo +
            ' col ' +
            colNo +
            ':\n\n' +
            '  ' +
            str.split(/\n/)[lineNo - 1] +
            '\n' +
            '  ' +
            Array(colNo).join(' ') +
            '^';
    throw EtaErr(message);
}

/**
 * @returns The global Promise function
 */
var promiseImpl = new Function('return this')().Promise;
/**
 * @returns A new AsyncFunction constuctor
 */
function getAsyncFunctionConstructor() {
    try {
        return new Function('return (async function(){}).constructor')();
    }
    catch (e) {
        if (e instanceof SyntaxError) {
            throw EtaErr("This environment doesn't support async/await");
        }
        else {
            throw e;
        }
    }
}
/**
 * str.trimLeft polyfill
 *
 * @param str - Input string
 * @returns The string with left whitespace removed
 *
 */
function trimLeft(str) {
    // eslint-disable-next-line no-extra-boolean-cast
    if (!!String.prototype.trimLeft) {
        return str.trimLeft();
    }
    else {
        return str.replace(/^\s+/, '');
    }
}
/**
 * str.trimRight polyfill
 *
 * @param str - Input string
 * @returns The string with right whitespace removed
 *
 */
function trimRight(str) {
    // eslint-disable-next-line no-extra-boolean-cast
    if (!!String.prototype.trimRight) {
        return str.trimRight();
    }
    else {
        return str.replace(/\s+$/, ''); // TODO: do we really need to replace BOM's?
    }
}

// TODO: allow '-' to trim up until newline. Use [^\S\n\r] instead of \s
/* END TYPES */
function hasOwnProp(obj, prop) {
    return Object.prototype.hasOwnProperty.call(obj, prop);
}
function copyProps(toObj, fromObj) {
    for (var key in fromObj) {
        if (hasOwnProp(fromObj, key)) {
            toObj[key] = fromObj[key];
        }
    }
    return toObj;
}
/**
 * Takes a string within a template and trims it, based on the preceding tag's whitespace control and `config.autoTrim`
 */
function trimWS(str, config, wsLeft, wsRight) {
    var leftTrim;
    var rightTrim;
    if (Array.isArray(config.autoTrim)) {
        // kinda confusing
        // but _}} will trim the left side of the following string
        leftTrim = config.autoTrim[1];
        rightTrim = config.autoTrim[0];
    }
    else {
        leftTrim = rightTrim = config.autoTrim;
    }
    if (wsLeft || wsLeft === false) {
        leftTrim = wsLeft;
    }
    if (wsRight || wsRight === false) {
        rightTrim = wsRight;
    }
    if (!rightTrim && !leftTrim) {
        return str;
    }
    if (leftTrim === 'slurp' && rightTrim === 'slurp') {
        return str.trim();
    }
    if (leftTrim === '_' || leftTrim === 'slurp') {
        // console.log('trimming left' + leftTrim)
        // full slurp
        str = trimLeft(str);
    }
    else if (leftTrim === '-' || leftTrim === 'nl') {
        // nl trim
        str = str.replace(/^(?:\r\n|\n|\r)/, '');
    }
    if (rightTrim === '_' || rightTrim === 'slurp') {
        // full slurp
        str = trimRight(str);
    }
    else if (rightTrim === '-' || rightTrim === 'nl') {
        // nl trim
        str = str.replace(/(?:\r\n|\n|\r)$/, ''); // TODO: make sure this gets \r\n
    }
    return str;
}
/**
 * A map of special HTML characters to their XML-escaped equivalents
 */
var escMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
};
function replaceChar(s) {
    return escMap[s];
}
/**
 * XML-escapes an input value after converting it to a string
 *
 * @param str - Input value (usually a string)
 * @returns XML-escaped string
 */
function XMLEscape(str) {
    // eslint-disable-line @typescript-eslint/no-explicit-any
    // To deal with XSS. Based on Escape implementations of Mustache.JS and Marko, then customized.
    var newStr = String(str);
    if (/[&<>"']/.test(newStr)) {
        return newStr.replace(/[&<>"']/g, replaceChar);
    }
    else {
        return newStr;
    }
}

/* END TYPES */
var templateLitReg = /`(?:\\[\s\S]|\${(?:[^{}]|{(?:[^{}]|{[^}]*})*})*}|(?!\${)[^\\`])*`/g;
var singleQuoteReg = /'(?:\\[\s\w"'\\`]|[^\n\r'\\])*?'/g;
var doubleQuoteReg = /"(?:\\[\s\w"'\\`]|[^\n\r"\\])*?"/g;
/** Escape special regular expression characters inside a string */
function escapeRegExp(string) {
    // From MDN
    return string.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}
function parse(str, config) {
    var buffer = [];
    var trimLeftOfNextStr = false;
    var lastIndex = 0;
    var parseOptions = config.parse;
    if (config.plugins) {
        for (var i = 0; i < config.plugins.length; i++) {
            var plugin = config.plugins[i];
            if (plugin.processTemplate) {
                str = plugin.processTemplate(str, config);
            }
        }
    }
    /* Adding for EJS compatibility */
    if (config.rmWhitespace) {
        // Code taken directly from EJS
        // Have to use two separate replaces here as `^` and `$` operators don't
        // work well with `\r` and empty lines don't work well with the `m` flag.
        // Essentially, this replaces the whitespace at the beginning and end of
        // each line and removes multiple newlines.
        str = str.replace(/[\r\n]+/g, '\n').replace(/^\s+|\s+$/gm, '');
    }
    /* End rmWhitespace option */
    templateLitReg.lastIndex = 0;
    singleQuoteReg.lastIndex = 0;
    doubleQuoteReg.lastIndex = 0;
    function pushString(strng, shouldTrimRightOfString) {
        if (strng) {
            // if string is truthy it must be of type 'string'
            strng = trimWS(strng, config, trimLeftOfNextStr, // this will only be false on the first str, the next ones will be null or undefined
            shouldTrimRightOfString);
            if (strng) {
                // replace \ with \\, ' with \'
                // we're going to convert all CRLF to LF so it doesn't take more than one replace
                strng = strng.replace(/\\|'/g, '\\$&').replace(/\r\n|\n|\r/g, '\\n');
                buffer.push(strng);
            }
        }
    }
    var prefixes = [parseOptions.exec, parseOptions.interpolate, parseOptions.raw].reduce(function (accumulator, prefix) {
        if (accumulator && prefix) {
            return accumulator + '|' + escapeRegExp(prefix);
        }
        else if (prefix) {
            // accumulator is falsy
            return escapeRegExp(prefix);
        }
        else {
            // prefix and accumulator are both falsy
            return accumulator;
        }
    }, '');
    var parseOpenReg = new RegExp('([^]*?)' + escapeRegExp(config.tags[0]) + '(-|_)?\\s*(' + prefixes + ')?\\s*(?![\\s+\\-_' + prefixes + '])', 'g');
    var parseCloseReg = new RegExp('\'|"|`|\\/\\*|(\\s*(-|_)?' + escapeRegExp(config.tags[1]) + ')', 'g');
    // TODO: benchmark having the \s* on either side vs using str.trim()
    var m;
    while ((m = parseOpenReg.exec(str))) {
        lastIndex = m[0].length + m.index;
        var precedingString = m[1];
        var wsLeft = m[2];
        var prefix = m[3] || ''; // by default either ~, =, or empty
        pushString(precedingString, wsLeft);
        parseCloseReg.lastIndex = lastIndex;
        var closeTag = void 0;
        var currentObj = false;
        while ((closeTag = parseCloseReg.exec(str))) {
            if (closeTag[1]) {
                var content = str.slice(lastIndex, closeTag.index);
                parseOpenReg.lastIndex = lastIndex = parseCloseReg.lastIndex;
                trimLeftOfNextStr = closeTag[2];
                var currentType = prefix === parseOptions.exec
                    ? 'e'
                    : prefix === parseOptions.raw
                        ? 'r'
                        : prefix === parseOptions.interpolate
                            ? 'i'
                            : '';
                currentObj = { t: currentType, val: content };
                break;
            }
            else {
                var char = closeTag[0];
                if (char === '/*') {
                    var commentCloseInd = str.indexOf('*/', parseCloseReg.lastIndex);
                    if (commentCloseInd === -1) {
                        ParseErr('unclosed comment', str, closeTag.index);
                    }
                    parseCloseReg.lastIndex = commentCloseInd;
                }
                else if (char === "'") {
                    singleQuoteReg.lastIndex = closeTag.index;
                    var singleQuoteMatch = singleQuoteReg.exec(str);
                    if (singleQuoteMatch) {
                        parseCloseReg.lastIndex = singleQuoteReg.lastIndex;
                    }
                    else {
                        ParseErr('unclosed string', str, closeTag.index);
                    }
                }
                else if (char === '"') {
                    doubleQuoteReg.lastIndex = closeTag.index;
                    var doubleQuoteMatch = doubleQuoteReg.exec(str);
                    if (doubleQuoteMatch) {
                        parseCloseReg.lastIndex = doubleQuoteReg.lastIndex;
                    }
                    else {
                        ParseErr('unclosed string', str, closeTag.index);
                    }
                }
                else if (char === '`') {
                    templateLitReg.lastIndex = closeTag.index;
                    var templateLitMatch = templateLitReg.exec(str);
                    if (templateLitMatch) {
                        parseCloseReg.lastIndex = templateLitReg.lastIndex;
                    }
                    else {
                        ParseErr('unclosed string', str, closeTag.index);
                    }
                }
            }
        }
        if (currentObj) {
            buffer.push(currentObj);
        }
        else {
            ParseErr('unclosed tag', str, m.index + precedingString.length);
        }
    }
    pushString(str.slice(lastIndex, str.length), false);
    if (config.plugins) {
        for (var i = 0; i < config.plugins.length; i++) {
            var plugin = config.plugins[i];
            if (plugin.processAST) {
                buffer = plugin.processAST(buffer, config);
            }
        }
    }
    return buffer;
}

/* END TYPES */
/**
 * Compiles a template string to a function string. Most often users just use `compile()`, which calls `compileToString` and creates a new function using the result
 *
 * **Example**
 *
 * ```js
 * compileToString("Hi <%= it.user %>", eta.config)
 * // "var tR='',include=E.include.bind(E),includeFile=E.includeFile.bind(E);tR+='Hi ';tR+=E.e(it.user);if(cb){cb(null,tR)} return tR"
 * ```
 */
function compileToString(str, config) {
    var buffer = parse(str, config);
    var res = "var tR='',__l,__lP" +
        (config.include ? ',include=E.include.bind(E)' : '') +
        (config.includeFile ? ',includeFile=E.includeFile.bind(E)' : '') +
        '\nfunction layout(p,d){__l=p;__lP=d}\n' +
        (config.globalAwait ? 'const _prs = [];\n' : '') +
        (config.useWith ? 'with(' + config.varName + '||{}){' : '') +
        compileScope(buffer, config) +
        (config.includeFile
            ? 'if(__l)tR=' +
                (config.async ? 'await ' : '') +
                ("includeFile(__l,Object.assign(" + config.varName + ",{body:tR},__lP))\n")
            : config.include
                ? 'if(__l)tR=' +
                    (config.async ? 'await ' : '') +
                    ("include(__l,Object.assign(" + config.varName + ",{body:tR},__lP))\n")
                : '') +
        'if(cb){cb(null,tR)} return tR' +
        (config.useWith ? '}' : '');
    if (config.plugins) {
        for (var i = 0; i < config.plugins.length; i++) {
            var plugin = config.plugins[i];
            if (plugin.processFnString) {
                res = plugin.processFnString(res, config);
            }
        }
    }
    return res;
}
/**
 * Loops through the AST generated by `parse` and transform each item into JS calls
 *
 * **Example**
 *
 * ```js
 * // AST version of 'Hi <%= it.user %>'
 * let templateAST = ['Hi ', { val: 'it.user', t: 'i' }]
 * compileScope(templateAST, eta.config)
 * // "tR+='Hi ';tR+=E.e(it.user);"
 * ```
 */
function compileScope(buff, config) {
    var i;
    var buffLength = buff.length;
    var returnStr = '';
    var REPLACEMENT_STR = "rJ2KqXzxQg";
    for (i = 0; i < buffLength; i++) {
        var currentBlock = buff[i];
        if (typeof currentBlock === 'string') {
            var str = currentBlock;
            // we know string exists
            returnStr += "tR+='" + str + "'\n";
        }
        else {
            var type = currentBlock.t; // ~, s, !, ?, r
            var content = currentBlock.val || '';
            if (type === 'r') {
                // raw
                if (config.globalAwait) {
                    returnStr += "_prs.push(" + content + ");\n";
                    returnStr += "tR+='" + REPLACEMENT_STR + "'\n";
                }
                else {
                    if (config.filter) {
                        content = 'E.filter(' + content + ')';
                    }
                    returnStr += 'tR+=' + content + '\n';
                }
            }
            else if (type === 'i') {
                // interpolate
                if (config.globalAwait) {
                    returnStr += "_prs.push(" + content + ");\n";
                    returnStr += "tR+='" + REPLACEMENT_STR + "'\n";
                }
                else {
                    if (config.filter) {
                        content = 'E.filter(' + content + ')';
                    }
                    returnStr += 'tR+=' + content + '\n';
                    if (config.autoEscape) {
                        content = 'E.e(' + content + ')';
                    }
                    returnStr += 'tR+=' + content + '\n';
                }
            }
            else if (type === 'e') {
                // execute
                returnStr += content + '\n'; // you need a \n in case you have <% } %>
            }
        }
    }
    if (config.globalAwait) {
        returnStr += "const _rst = await Promise.all(_prs);\ntR = tR.replace(/" + REPLACEMENT_STR + "/g, () => _rst.shift());\n";
    }
    return returnStr;
}

/**
 * Handles storage and accessing of values
 *
 * In this case, we use it to store compiled template functions
 * Indexed by their `name` or `filename`
 */
var Cacher = /** @class */ (function () {
    function Cacher(cache) {
        this.cache = cache;
    }
    Cacher.prototype.define = function (key, val) {
        this.cache[key] = val;
    };
    Cacher.prototype.get = function (key) {
        // string | array.
        // TODO: allow array of keys to look down
        // TODO: create plugin to allow referencing helpers, filters with dot notation
        return this.cache[key];
    };
    Cacher.prototype.remove = function (key) {
        delete this.cache[key];
    };
    Cacher.prototype.reset = function () {
        this.cache = {};
    };
    Cacher.prototype.load = function (cacheObj) {
        copyProps(this.cache, cacheObj);
    };
    return Cacher;
}());

/* END TYPES */
/**
 * Eta's template storage
 *
 * Stores partials and cached templates
 */
var templates = new Cacher({});

/* END TYPES */
/**
 * Include a template based on its name (or filepath, if it's already been cached).
 *
 * Called like `include(templateNameOrPath, data)`
 */
function includeHelper(templateNameOrPath, data) {
    var template = this.templates.get(templateNameOrPath);
    if (!template) {
        throw EtaErr('Could not fetch template "' + templateNameOrPath + '"');
    }
    return template(data, this);
}
/** Eta's base (global) configuration */
var config = {
    async: false,
    autoEscape: true,
    autoTrim: [false, 'nl'],
    cache: false,
    e: XMLEscape,
    include: includeHelper,
    parse: {
        exec: '',
        interpolate: '=',
        raw: '~'
    },
    plugins: [],
    rmWhitespace: false,
    tags: ['<%', '%>'],
    templates: templates,
    useWith: false,
    varName: 'it'
};
/**
 * Takes one or two partial (not necessarily complete) configuration objects, merges them 1 layer deep into eta.config, and returns the result
 *
 * @param override Partial configuration object
 * @param baseConfig Partial configuration object to merge before `override`
 *
 * **Example**
 *
 * ```js
 * let customConfig = getConfig({tags: ['!#', '#!']})
 * ```
 */
function getConfig(override, baseConfig) {
    // TODO: run more tests on this
    var res = {}; // Linked
    copyProps(res, config); // Creates deep clone of eta.config, 1 layer deep
    if (baseConfig) {
        copyProps(res, baseConfig);
    }
    if (override) {
        copyProps(res, override);
    }
    return res;
}

/* END TYPES */
/**
 * Takes a template string and returns a template function that can be called with (data, config, [cb])
 *
 * @param str - The template string
 * @param config - A custom configuration object (optional)
 *
 * **Example**
 *
 * ```js
 * let compiledFn = eta.compile("Hi <%= it.user %>")
 * // function anonymous()
 * let compiledFnStr = compiledFn.toString()
 * // "function anonymous(it,E,cb\n) {\nvar tR='',include=E.include.bind(E),includeFile=E.includeFile.bind(E);tR+='Hi ';tR+=E.e(it.user);if(cb){cb(null,tR)} return tR\n}"
 * ```
 */
function compile(str, config) {
    var options = getConfig(config || {});
    /* ASYNC HANDLING */
    // The below code is modified from mde/ejs. All credit should go to them.
    var ctor = options.async ? getAsyncFunctionConstructor() : Function;
    /* END ASYNC HANDLING */
    try {
        return new ctor(options.varName, 'E', // EtaConfig
        'cb', // optional callback
        compileToString(str, options)); // eslint-disable-line no-new-func
    }
    catch (e) {
        if (e instanceof SyntaxError) {
            throw EtaErr('Bad template syntax\n\n' +
                e.message +
                '\n' +
                Array(e.message.length + 1).join('=') +
                '\n' +
                compileToString(str, options) +
                '\n' // This will put an extra newline before the callstack for extra readability
            );
        }
        else {
            throw e;
        }
    }
}

var _BOM = /^\uFEFF/;
/* END TYPES */
/**
 * Get the path to the included file from the parent file path and the
 * specified path.
 *
 * If `name` does not have an extension, it will default to `.eta`
 *
 * @param name specified path
 * @param parentfile parent file path
 * @param isDirectory whether parentfile is a directory
 * @return absolute path to template
 */
function getWholeFilePath(name, parentfile, isDirectory) {
    var includePath = path__namespace.resolve(isDirectory ? parentfile : path__namespace.dirname(parentfile), // returns directory the parent file is in
    name // file
    ) + (path__namespace.extname(name) ? '' : '.eta');
    return includePath;
}
/**
 * Get the absolute path to an included template
 *
 * If this is called with an absolute path (for example, starting with '/' or 'C:\')
 * then Eta will attempt to resolve the absolute path within options.views. If it cannot,
 * Eta will fallback to options.root or '/'
 *
 * If this is called with a relative path, Eta will:
 * - Look relative to the current template (if the current template has the `filename` property)
 * - Look inside each directory in options.views
 *
 * Note: if Eta is unable to find a template using path and options, it will throw an error.
 *
 * @param path    specified path
 * @param options compilation options
 * @return absolute path to template
 */
function getPath(path, options) {
    var includePath = false;
    var views = options.views;
    var searchedPaths = [];
    // If these four values are the same,
    // getPath() will return the same result every time.
    // We can cache the result to avoid expensive
    // file operations.
    var pathOptions = JSON.stringify({
        filename: options.filename,
        path: path,
        root: options.root,
        views: options.views
    });
    if (options.cache && options.filepathCache && options.filepathCache[pathOptions]) {
        // Use the cached filepath
        return options.filepathCache[pathOptions];
    }
    /** Add a filepath to the list of paths we've checked for a template */
    function addPathToSearched(pathSearched) {
        if (!searchedPaths.includes(pathSearched)) {
            searchedPaths.push(pathSearched);
        }
    }
    /**
     * Take a filepath (like 'partials/mypartial.eta'). Attempt to find the template file inside `views`;
     * return the resulting template file path, or `false` to indicate that the template was not found.
     *
     * @param views the filepath that holds templates, or an array of filepaths that hold templates
     * @param path the path to the template
     */
    function searchViews(views, path) {
        var filePath;
        // If views is an array, then loop through each directory
        // And attempt to find the template
        if (Array.isArray(views) &&
            views.some(function (v) {
                filePath = getWholeFilePath(path, v, true);
                addPathToSearched(filePath);
                return fs.existsSync(filePath);
            })) {
            // If the above returned true, we know that the filePath was just set to a path
            // That exists (Array.some() returns as soon as it finds a valid element)
            return filePath;
        }
        else if (typeof views === 'string') {
            // Search for the file if views is a single directory
            filePath = getWholeFilePath(path, views, true);
            addPathToSearched(filePath);
            if (fs.existsSync(filePath)) {
                return filePath;
            }
        }
        // Unable to find a file
        return false;
    }
    // Path starts with '/', 'C:\', etc.
    var match = /^[A-Za-z]+:\\|^\//.exec(path);
    // Absolute path, like /partials/partial.eta
    if (match && match.length) {
        // We have to trim the beginning '/' off the path, or else
        // path.resolve(dir, path) will always resolve to just path
        var formattedPath = path.replace(/^\/*/, '');
        // First, try to resolve the path within options.views
        includePath = searchViews(views, formattedPath);
        if (!includePath) {
            // If that fails, searchViews will return false. Try to find the path
            // inside options.root (by default '/', the base of the filesystem)
            var pathFromRoot = getWholeFilePath(formattedPath, options.root || '/', true);
            addPathToSearched(pathFromRoot);
            includePath = pathFromRoot;
        }
    }
    else {
        // Relative paths
        // Look relative to a passed filename first
        if (options.filename) {
            var filePath = getWholeFilePath(path, options.filename);
            addPathToSearched(filePath);
            if (fs.existsSync(filePath)) {
                includePath = filePath;
            }
        }
        // Then look for the template in options.views
        if (!includePath) {
            includePath = searchViews(views, path);
        }
        if (!includePath) {
            throw EtaErr('Could not find the template "' + path + '". Paths tried: ' + searchedPaths);
        }
    }
    // If caching and filepathCache are enabled,
    // cache the input & output of this function.
    if (options.cache && options.filepathCache) {
        options.filepathCache[pathOptions] = includePath;
    }
    return includePath;
}
/**
 * Reads a file synchronously
 */
function readFile(filePath) {
    try {
        return fs.readFileSync(filePath).toString().replace(_BOM, ''); // TODO: is replacing BOM's necessary?
    }
    catch (_a) {
        throw EtaErr("Failed to read template at '" + filePath + "'");
    }
}

// express is set like: app.engine('html', require('eta').renderFile)
/* END TYPES */
/**
 * Reads a template, compiles it into a function, caches it if caching isn't disabled, returns the function
 *
 * @param filePath Absolute path to template file
 * @param options Eta configuration overrides
 * @param noCache Optionally, make Eta not cache the template
 */
function loadFile(filePath, options, noCache) {
    var config = getConfig(options);
    var template = readFile(filePath);
    try {
        var compiledTemplate = compile(template, config);
        if (!noCache) {
            config.templates.define(config.filename, compiledTemplate);
        }
        return compiledTemplate;
    }
    catch (e) {
        throw EtaErr('Loading file: ' + filePath + ' failed:\n\n' + e.message);
    }
}
/**
 * Get the template from a string or a file, either compiled on-the-fly or
 * read from cache (if enabled), and cache the template if needed.
 *
 * If `options.cache` is true, this function reads the file from
 * `options.filename` so it must be set prior to calling this function.
 *
 * @param options   compilation options
 * @return Eta template function
 */
function handleCache$1(options) {
    var filename = options.filename;
    if (options.cache) {
        var func = options.templates.get(filename);
        if (func) {
            return func;
        }
        return loadFile(filename, options);
    }
    // Caching is disabled, so pass noCache = true
    return loadFile(filename, options, true);
}
/**
 * Get the template function.
 *
 * If `options.cache` is `true`, then the template is cached.
 *
 * This returns a template function and the config object with which that template function should be called.
 *
 * @remarks
 *
 * It's important that this returns a config object with `filename` set.
 * Otherwise, the included file would not be able to use relative paths
 *
 * @param path path for the specified file (if relative, specify `views` on `options`)
 * @param options compilation options
 * @return [Eta template function, new config object]
 */
function includeFile(path, options) {
    // the below creates a new options object, using the parent filepath of the old options object and the path
    var newFileOptions = getConfig({ filename: getPath(path, options) }, options);
    // TODO: make sure properties are currectly copied over
    return [handleCache$1(newFileOptions), newFileOptions];
}

/* END TYPES */
/**
 * Called with `includeFile(path, data)`
 */
function includeFileHelper(path, data) {
    var templateAndConfig = includeFile(path, this);
    return templateAndConfig[0](data, templateAndConfig[1]);
}

/* END TYPES */
function handleCache(template, options) {
    if (options.cache && options.name && options.templates.get(options.name)) {
        return options.templates.get(options.name);
    }
    var templateFunc = typeof template === 'function' ? template : compile(template, options);
    // Note that we don't have to check if it already exists in the cache;
    // it would have returned earlier if it had
    if (options.cache && options.name) {
        options.templates.define(options.name, templateFunc);
    }
    return templateFunc;
}
/**
 * Render a template
 *
 * If `template` is a string, Eta will compile it to a function and then call it with the provided data.
 * If `template` is a template function, Eta will call it with the provided data.
 *
 * If `config.async` is `false`, Eta will return the rendered template.
 *
 * If `config.async` is `true` and there's a callback function, Eta will call the callback with `(err, renderedTemplate)`.
 * If `config.async` is `true` and there's not a callback function, Eta will return a Promise that resolves to the rendered template.
 *
 * If `config.cache` is `true` and `config` has a `name` or `filename` property, Eta will cache the template on the first render and use the cached template for all subsequent renders.
 *
 * @param template Template string or template function
 * @param data Data to render the template with
 * @param config Optional config options
 * @param cb Callback function
 */
function render(template, data, config, cb) {
    var options = getConfig(config || {});
    if (options.async) {
        if (cb) {
            // If user passes callback
            try {
                // Note: if there is an error while rendering the template,
                // It will bubble up and be caught here
                var templateFn = handleCache(template, options);
                templateFn(data, options, cb);
            }
            catch (err) {
                return cb(err);
            }
        }
        else {
            // No callback, try returning a promise
            if (typeof promiseImpl === 'function') {
                return new promiseImpl(function (resolve, reject) {
                    try {
                        resolve(handleCache(template, options)(data, options));
                    }
                    catch (err) {
                        reject(err);
                    }
                });
            }
            else {
                throw EtaErr("Please provide a callback function, this env doesn't support Promises");
            }
        }
    }
    else {
        return handleCache(template, options)(data, options);
    }
}
/**
 * Render a template asynchronously
 *
 * If `template` is a string, Eta will compile it to a function and call it with the provided data.
 * If `template` is a function, Eta will call it with the provided data.
 *
 * If there is a callback function, Eta will call it with `(err, renderedTemplate)`.
 * If there is not a callback function, Eta will return a Promise that resolves to the rendered template
 *
 * @param template Template string or template function
 * @param data Data to render the template with
 * @param config Optional config options
 * @param cb Callback function
 */
function renderAsync(template, data, config, cb) {
    // Using Object.assign to lower bundle size, using spread operator makes it larger because of typescript injected polyfills
    return render(template, data, Object.assign({}, config, { async: true }), cb);
}

// @denoify-ignore
config.includeFile = includeFileHelper;
config.filepathCache = {};

class InternalModule {
    constructor(app, plugin) {
        this.app = app;
        this.plugin = plugin;
        this.static_templates = new Map();
        this.dynamic_templates = new Map();
    }
    getName() {
        return this.name;
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.createStaticTemplates();
            this.static_context = Object.fromEntries(this.static_templates);
        });
    }
    generateContext(config) {
        return __awaiter(this, void 0, void 0, function* () {
            this.config = config;
            yield this.updateTemplates();
            return Object.assign(Object.assign({}, this.static_context), Object.fromEntries(this.dynamic_templates));
        });
    }
}

class InternalModuleDate extends InternalModule {
    constructor() {
        super(...arguments);
        this.name = "date";
    }
    createStaticTemplates() {
        return __awaiter(this, void 0, void 0, function* () {
            this.static_templates.set("now", this.generate_now());
            this.static_templates.set("tomorrow", this.generate_tomorrow());
            this.static_templates.set("weekday", this.generate_weekday());
            this.static_templates.set("yesterday", this.generate_yesterday());
        });
    }
    updateTemplates() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    generate_now() {
        return (format = "YYYY-MM-DD", offset, reference, reference_format) => {
            if (reference && !window.moment(reference, reference_format).isValid()) {
                throw new TemplaterError("Invalid reference date format, try specifying one with the argument 'reference_format'");
            }
            let duration;
            if (typeof offset === "string") {
                duration = window.moment.duration(offset);
            }
            else if (typeof offset === "number") {
                duration = window.moment.duration(offset, "days");
            }
            return window.moment(reference, reference_format).add(duration).format(format);
        };
    }
    generate_tomorrow() {
        return (format = "YYYY-MM-DD") => {
            return window.moment().add(1, 'days').format(format);
        };
    }
    generate_weekday() {
        return (format = "YYYY-MM-DD", weekday, reference, reference_format) => {
            if (reference && !window.moment(reference, reference_format).isValid()) {
                throw new TemplaterError("Invalid reference date format, try specifying one with the argument 'reference_format'");
            }
            return window.moment(reference, reference_format).weekday(weekday).format(format);
        };
    }
    generate_yesterday() {
        return (format = "YYYY-MM-DD") => {
            return window.moment().add(-1, 'days').format(format);
        };
    }
}

const DEPTH_LIMIT = 10;
class InternalModuleFile extends InternalModule {
    constructor() {
        super(...arguments);
        this.name = "file";
        this.include_depth = 0;
        this.create_new_depth = 0;
        this.linkpath_regex = new RegExp("^\\[\\[(.*)\\]\\]$");
    }
    createStaticTemplates() {
        return __awaiter(this, void 0, void 0, function* () {
            this.static_templates.set("creation_date", this.generate_creation_date());
            this.static_templates.set("create_new", this.generate_create_new());
            this.static_templates.set("cursor", this.generate_cursor());
            this.static_templates.set("cursor_append", this.generate_cursor_append());
            this.static_templates.set("exists", this.generate_exists());
            this.static_templates.set("find_tfile", this.generate_find_tfile());
            this.static_templates.set("folder", this.generate_folder());
            this.static_templates.set("include", this.generate_include());
            this.static_templates.set("last_modified_date", this.generate_last_modified_date());
            this.static_templates.set("move", this.generate_move());
            this.static_templates.set("path", this.generate_path());
            this.static_templates.set("rename", this.generate_rename());
            this.static_templates.set("selection", this.generate_selection());
        });
    }
    updateTemplates() {
        return __awaiter(this, void 0, void 0, function* () {
            this.dynamic_templates.set("content", yield this.generate_content());
            this.dynamic_templates.set("tags", this.generate_tags());
            this.dynamic_templates.set("title", this.generate_title());
        });
    }
    generate_content() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.app.vault.read(this.config.target_file);
        });
    }
    generate_create_new() {
        return (template, filename, open_new = false, folder) => __awaiter(this, void 0, void 0, function* () {
            this.create_new_depth += 1;
            if (this.create_new_depth > DEPTH_LIMIT) {
                this.create_new_depth = 0;
                throw new TemplaterError("Reached create_new depth limit (max = 10)");
            }
            const new_file = yield this.plugin.templater.create_new_note_from_template(template, folder, filename, open_new);
            this.create_new_depth -= 1;
            return new_file;
        });
    }
    generate_creation_date() {
        return (format = "YYYY-MM-DD HH:mm") => {
            return window.moment(this.config.target_file.stat.ctime).format(format);
        };
    }
    generate_cursor() {
        return (order) => {
            // Hack to prevent empty output
            return `<% tp.file.cursor(${order !== null && order !== void 0 ? order : ''}) %>`;
        };
    }
    generate_cursor_append() {
        return (content) => {
            const active_view = this.app.workspace.getActiveViewOfType(obsidian.MarkdownView);
            if (active_view === null) {
                this.plugin.log_error(new TemplaterError("No active view, can't append to cursor."));
                return;
            }
            const editor = active_view.editor;
            const doc = editor.getDoc();
            doc.replaceSelection(content);
            return "";
        };
    }
    generate_exists() {
        return (filename) => {
            // TODO: Remove this, only here to support the old way
            let match;
            if ((match = this.linkpath_regex.exec(filename)) !== null) {
                filename = match[1];
            }
            const file = this.app.metadataCache.getFirstLinkpathDest(filename, "");
            return file != null;
        };
    }
    generate_find_tfile() {
        return (filename) => {
            const path = obsidian.normalizePath(filename);
            return this.app.metadataCache.getFirstLinkpathDest(path, "");
        };
    }
    generate_folder() {
        return (relative = false) => {
            let parent = this.config.target_file.parent;
            let folder;
            if (relative) {
                folder = parent.path;
            }
            else {
                folder = parent.name;
            }
            return folder;
        };
    }
    generate_include() {
        return (include_link) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            // TODO: Add mutex for this, this may currently lead to a race condition. 
            // While not very impactful, that could still be annoying.
            this.include_depth += 1;
            if (this.include_depth > DEPTH_LIMIT) {
                this.include_depth = 0;
                throw new TemplaterError("Reached inclusion depth limit (max = 10)");
            }
            let inc_file_content;
            if (include_link instanceof obsidian.TFile) {
                inc_file_content = yield this.app.vault.read(include_link);
            }
            else {
                let match;
                if ((match = this.linkpath_regex.exec(include_link)) === null) {
                    throw new TemplaterError("Invalid file format, provide an obsidian link between quotes.");
                }
                const { path, subpath } = obsidian.parseLinktext(match[1]);
                const inc_file = this.app.metadataCache.getFirstLinkpathDest(path, "");
                if (!inc_file) {
                    throw new TemplaterError(`File ${include_link} doesn't exist`);
                }
                inc_file_content = yield this.app.vault.read(inc_file);
                if (subpath) {
                    const cache = this.app.metadataCache.getFileCache(inc_file);
                    if (cache) {
                        const result = obsidian.resolveSubpath(cache, subpath);
                        if (result) {
                            inc_file_content = inc_file_content.slice(result.start.offset, (_a = result.end) === null || _a === void 0 ? void 0 : _a.offset);
                        }
                    }
                }
            }
            const parsed_content = yield this.plugin.templater.parser.parseTemplates(inc_file_content);
            this.include_depth -= 1;
            return parsed_content;
        });
    }
    generate_last_modified_date() {
        return (format = "YYYY-MM-DD HH:mm") => {
            return window.moment(this.config.target_file.stat.mtime).format(format);
        };
    }
    generate_move() {
        return (path) => __awaiter(this, void 0, void 0, function* () {
            const new_path = obsidian.normalizePath(`${path}.${this.config.target_file.extension}`);
            yield this.app.fileManager.renameFile(this.config.target_file, new_path);
            return "";
        });
    }
    generate_path() {
        return (relative = false) => {
            // TODO: Add mobile support
            if (obsidian.Platform.isMobileApp) {
                return UNSUPPORTED_MOBILE_TEMPLATE;
            }
            if (!(this.app.vault.adapter instanceof obsidian.FileSystemAdapter)) {
                throw new TemplaterError("app.vault is not a FileSystemAdapter instance");
            }
            const vault_path = this.app.vault.adapter.getBasePath();
            if (relative) {
                return this.config.target_file.path;
            }
            else {
                return `${vault_path}/${this.config.target_file.path}`;
            }
        };
    }
    generate_rename() {
        return (new_title) => __awaiter(this, void 0, void 0, function* () {
            if (new_title.match(/[\\\/:]+/g)) {
                throw new TemplaterError("File name cannot contain any of these characters: \\ / :");
            }
            const new_path = obsidian.normalizePath(`${this.config.target_file.parent.path}/${new_title}.${this.config.target_file.extension}`);
            yield this.app.fileManager.renameFile(this.config.target_file, new_path);
            return "";
        });
    }
    generate_selection() {
        return () => {
            const active_view = this.app.workspace.getActiveViewOfType(obsidian.MarkdownView);
            if (active_view == null) {
                throw new TemplaterError("Active view is null, can't read selection.");
            }
            const editor = active_view.editor;
            return editor.getSelection();
        };
    }
    // TODO: Turn this into a function
    generate_tags() {
        const cache = this.app.metadataCache.getFileCache(this.config.target_file);
        return obsidian.getAllTags(cache);
    }
    // TODO: Turn this into a function
    generate_title() {
        return this.config.target_file.basename;
    }
}

class InternalModuleWeb extends InternalModule {
    constructor() {
        super(...arguments);
        this.name = "web";
    }
    createStaticTemplates() {
        return __awaiter(this, void 0, void 0, function* () {
            this.static_templates.set("daily_quote", this.generate_daily_quote());
            this.static_templates.set("random_picture", this.generate_random_picture());
            //this.static_templates.set("get_request", this.generate_get_request());
        });
    }
    updateTemplates() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    getRequest(url) {
        return __awaiter(this, void 0, void 0, function* () {
            let response = yield fetch(url);
            if (!response.ok) {
                throw new TemplaterError("Error performing GET request");
            }
            return response;
        });
    }
    generate_daily_quote() {
        return () => __awaiter(this, void 0, void 0, function* () {
            let response = yield this.getRequest("https://quotes.rest/qod");
            let json = yield response.json();
            let author = json.contents.quotes[0].author;
            let quote = json.contents.quotes[0].quote;
            let new_content = `> ${quote}\n> &mdash; <cite>${author}</cite>`;
            return new_content;
        });
    }
    generate_random_picture() {
        return (size, query) => __awaiter(this, void 0, void 0, function* () {
            let response = yield this.getRequest(`https://source.unsplash.com/random/${size !== null && size !== void 0 ? size : ''}?${query !== null && query !== void 0 ? query : ''}`);
            let url = response.url;
            return `![tp.web.random_picture](${url})`;
        });
    }
    generate_get_request() {
        return (url) => __awaiter(this, void 0, void 0, function* () {
            let response = yield this.getRequest(url);
            let json = yield response.json();
            return json;
        });
    }
}

class InternalModuleFrontmatter extends InternalModule {
    constructor() {
        super(...arguments);
        this.name = "frontmatter";
    }
    createStaticTemplates() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    updateTemplates() {
        return __awaiter(this, void 0, void 0, function* () {
            const cache = this.app.metadataCache.getFileCache(this.config.target_file);
            this.dynamic_templates = new Map(Object.entries((cache === null || cache === void 0 ? void 0 : cache.frontmatter) || {}));
        });
    }
}

class PromptModal extends obsidian.Modal {
    constructor(app, prompt_text, default_value) {
        super(app);
        this.prompt_text = prompt_text;
        this.default_value = default_value;
        this.submitted = false;
    }
    onOpen() {
        this.titleEl.setText(this.prompt_text);
        this.createForm();
    }
    onClose() {
        this.contentEl.empty();
        if (!this.submitted) {
            this.reject(new TemplaterError("Cancelled prompt"));
        }
    }
    createForm() {
        var _a;
        const div = this.contentEl.createDiv();
        div.addClass("templater-prompt-div");
        const form = div.createEl("form");
        form.addClass("templater-prompt-form");
        form.type = "submit";
        form.onsubmit = (e) => {
            this.submitted = true;
            e.preventDefault();
            this.resolve(this.promptEl.value);
            this.close();
        };
        this.promptEl = form.createEl("input");
        this.promptEl.type = "text";
        this.promptEl.placeholder = "Type text here...";
        this.promptEl.value = (_a = this.default_value) !== null && _a !== void 0 ? _a : "";
        this.promptEl.addClass("templater-prompt-input");
        this.promptEl.select();
    }
    openAndGetValue(resolve, reject) {
        return __awaiter(this, void 0, void 0, function* () {
            this.resolve = resolve;
            this.reject = reject;
            this.open();
        });
    }
}

class SuggesterModal extends obsidian.FuzzySuggestModal {
    constructor(app, text_items, items, placeholder) {
        super(app);
        this.text_items = text_items;
        this.items = items;
        this.submitted = false;
        this.setPlaceholder(placeholder);
    }
    getItems() {
        return this.items;
    }
    onClose() {
        if (!this.submitted) {
            this.reject(new TemplaterError("Cancelled prompt"));
        }
    }
    selectSuggestion(value, evt) {
        this.submitted = true;
        this.close();
        this.onChooseSuggestion(value, evt);
    }
    getItemText(item) {
        if (this.text_items instanceof Function) {
            return this.text_items(item);
        }
        return this.text_items[this.items.indexOf(item)] || "Undefined Text Item";
    }
    onChooseItem(item, _evt) {
        this.resolve(item);
    }
    openAndGetValue(resolve, reject) {
        return __awaiter(this, void 0, void 0, function* () {
            this.resolve = resolve;
            this.reject = reject;
            this.open();
        });
    }
}

class InternalModuleSystem extends InternalModule {
    constructor() {
        super(...arguments);
        this.name = "system";
    }
    createStaticTemplates() {
        return __awaiter(this, void 0, void 0, function* () {
            this.static_templates.set("clipboard", this.generate_clipboard());
            this.static_templates.set("prompt", this.generate_prompt());
            this.static_templates.set("suggester", this.generate_suggester());
        });
    }
    updateTemplates() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    generate_clipboard() {
        return () => __awaiter(this, void 0, void 0, function* () {
            // TODO: Add mobile support
            if (obsidian.Platform.isMobileApp) {
                return UNSUPPORTED_MOBILE_TEMPLATE;
            }
            return yield navigator.clipboard.readText();
        });
    }
    generate_prompt() {
        return (prompt_text, default_value, throw_on_cancel = false) => __awaiter(this, void 0, void 0, function* () {
            const prompt = new PromptModal(this.app, prompt_text, default_value);
            const promise = new Promise((resolve, reject) => prompt.openAndGetValue(resolve, reject));
            try {
                return yield promise;
            }
            catch (error) {
                if (throw_on_cancel) {
                    throw error;
                }
                return null;
            }
        });
    }
    generate_suggester() {
        return (text_items, items, throw_on_cancel = false, placeholder = "") => __awaiter(this, void 0, void 0, function* () {
            const suggester = new SuggesterModal(this.app, text_items, items, placeholder);
            const promise = new Promise((resolve, reject) => suggester.openAndGetValue(resolve, reject));
            try {
                return yield promise;
            }
            catch (error) {
                if (throw_on_cancel) {
                    throw error;
                }
                return null;
            }
        });
    }
}

class InternalModuleConfig extends InternalModule {
    constructor() {
        super(...arguments);
        this.name = "config";
    }
    createStaticTemplates() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    updateTemplates() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    generateContext(config) {
        return __awaiter(this, void 0, void 0, function* () {
            return config;
        });
    }
}

class InternalTemplateParser {
    constructor(app, plugin) {
        this.app = app;
        this.plugin = plugin;
        this.modules_array = new Array();
        this.modules_array.push(new InternalModuleDate(this.app, this.plugin));
        this.modules_array.push(new InternalModuleFile(this.app, this.plugin));
        this.modules_array.push(new InternalModuleWeb(this.app, this.plugin));
        this.modules_array.push(new InternalModuleFrontmatter(this.app, this.plugin));
        this.modules_array.push(new InternalModuleSystem(this.app, this.plugin));
        this.modules_array.push(new InternalModuleConfig(this.app, this.plugin));
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            for (const mod of this.modules_array) {
                yield mod.init();
            }
        });
    }
    generateContext(config) {
        return __awaiter(this, void 0, void 0, function* () {
            const modules_context = {};
            for (const mod of this.modules_array) {
                modules_context[mod.getName()] = yield mod.generateContext(config);
            }
            return modules_context;
        });
    }
}

class UserTemplateParser {
    constructor(app, plugin) {
        this.app = app;
        this.plugin = plugin;
        this.user_system_command_functions = new Map();
        this.user_script_functions = new Map();
        this.setup();
    }
    setup() {
        if (obsidian.Platform.isMobileApp || !(this.app.vault.adapter instanceof obsidian.FileSystemAdapter)) {
            this.cwd = "";
        }
        else {
            this.cwd = this.app.vault.adapter.getBasePath();
            this.exec_promise = util.promisify(child_process.exec);
        }
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    generate_user_script_functions(config) {
        return __awaiter(this, void 0, void 0, function* () {
            let files = getTFilesFromFolder(this.app, this.plugin.settings.script_folder);
            for (let file of files) {
                if (file.extension.toLowerCase() === "js") {
                    yield this.load_user_script_function(config, file);
                }
            }
        });
    }
    load_user_script_function(config, file) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(this.app.vault.adapter instanceof obsidian.FileSystemAdapter)) {
                throw new TemplaterError("app.vault is not a FileSystemAdapter instance");
            }
            let vault_path = this.app.vault.adapter.getBasePath();
            let file_path = `${vault_path}/${file.path}`;
            // https://stackoverflow.com/questions/26633901/reload-module-at-runtime
            // https://stackoverflow.com/questions/1972242/how-to-auto-reload-files-in-node-js
            if (Object.keys(window.require.cache).contains(file_path)) {
                delete window.require.cache[window.require.resolve(file_path)];
            }
            const user_function = yield Promise.resolve().then(function () { return /*#__PURE__*/_interopNamespace(require(file_path)); });
            if (!user_function.default) {
                throw new TemplaterError(`Failed to load user script ${file_path}. No exports detected.`);
            }
            if (!(user_function.default instanceof Function)) {
                throw new TemplaterError(`Failed to load user script ${file_path}. Default export is not a function.`);
            }
            this.user_script_functions.set(`${file.basename}`, user_function.default);
        });
    }
    // TODO: Add mobile support
    generate_system_command_user_functions(config) {
        return __awaiter(this, void 0, void 0, function* () {
            const context = yield this.plugin.templater.parser.generateContext(config, ContextMode.INTERNAL);
            for (let [template, cmd] of this.plugin.settings.templates_pairs) {
                if (template === "" || cmd === "") {
                    continue;
                }
                if (obsidian.Platform.isMobileApp) {
                    this.user_system_command_functions.set(template, (user_args) => {
                        return UNSUPPORTED_MOBILE_TEMPLATE;
                    });
                }
                else {
                    cmd = yield this.plugin.templater.parser.parseTemplates(cmd, context);
                    this.user_system_command_functions.set(template, (user_args) => __awaiter(this, void 0, void 0, function* () {
                        const process_env = Object.assign(Object.assign({}, process.env), user_args);
                        const cmd_options = Object.assign({ timeout: this.plugin.settings.command_timeout * 1000, cwd: this.cwd, env: process_env }, (this.plugin.settings.shell_path !== "" && { shell: this.plugin.settings.shell_path }));
                        try {
                            const { stdout } = yield this.exec_promise(cmd, cmd_options);
                            return stdout.trimRight();
                        }
                        catch (error) {
                            throw new TemplaterError(`Error with User Template ${template}`, error);
                        }
                    }));
                }
            }
        });
    }
    generateContext(config) {
        return __awaiter(this, void 0, void 0, function* () {
            this.user_system_command_functions.clear();
            this.user_script_functions.clear();
            if (this.plugin.settings.enable_system_commands) {
                yield this.generate_system_command_user_functions(config);
            }
            // TODO: Add mobile support
            if (obsidian.Platform.isDesktopApp && this.plugin.settings.script_folder) {
                yield this.generate_user_script_functions(config);
            }
            return Object.assign(Object.assign({}, Object.fromEntries(this.user_system_command_functions)), Object.fromEntries(this.user_script_functions));
        });
    }
}

var ContextMode;
(function (ContextMode) {
    ContextMode[ContextMode["INTERNAL"] = 0] = "INTERNAL";
    ContextMode[ContextMode["USER_INTERNAL"] = 1] = "USER_INTERNAL";
})(ContextMode || (ContextMode = {}));
class TemplateParser {
    constructor(app, plugin) {
        this.app = app;
        this.plugin = plugin;
        this.internalTemplateParser = new InternalTemplateParser(this.app, this.plugin);
        this.userTemplateParser = new UserTemplateParser(this.app, this.plugin);
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.internalTemplateParser.init();
            yield this.userTemplateParser.init();
        });
    }
    setCurrentContext(config, context_mode) {
        return __awaiter(this, void 0, void 0, function* () {
            this.current_context = yield this.generateContext(config, context_mode);
        });
    }
    additionalContext() {
        return {
            obsidian: obsidian_module,
        };
    }
    generateContext(config, context_mode = ContextMode.USER_INTERNAL) {
        return __awaiter(this, void 0, void 0, function* () {
            const context = {};
            const additional_context = this.additionalContext();
            const internal_context = yield this.internalTemplateParser.generateContext(config);
            let user_context = {};
            if (!this.current_context) {
                // If a user system command is using tp.file.include, we need the context to be set.
                this.current_context = internal_context;
            }
            Object.assign(context, additional_context);
            switch (context_mode) {
                case ContextMode.INTERNAL:
                    Object.assign(context, internal_context);
                    break;
                case ContextMode.USER_INTERNAL:
                    user_context = yield this.userTemplateParser.generateContext(config);
                    Object.assign(context, Object.assign(Object.assign({}, internal_context), { user: user_context }));
                    break;
            }
            return context;
        });
    }
    parseTemplates(content, context) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!context) {
                context = this.current_context;
            }
            content = (yield renderAsync(content, context, {
                varName: "tp",
                parse: {
                    exec: "*",
                    interpolate: "~",
                    raw: "",
                },
                autoTrim: false,
                globalAwait: true,
            }));
            return content;
        });
    }
}

var RunMode;
(function (RunMode) {
    RunMode[RunMode["CreateNewFromTemplate"] = 0] = "CreateNewFromTemplate";
    RunMode[RunMode["AppendActiveFile"] = 1] = "AppendActiveFile";
    RunMode[RunMode["OverwriteFile"] = 2] = "OverwriteFile";
    RunMode[RunMode["OverwriteActiveFile"] = 3] = "OverwriteActiveFile";
    RunMode[RunMode["DynamicProcessor"] = 4] = "DynamicProcessor";
})(RunMode || (RunMode = {}));
class Templater {
    constructor(app, plugin) {
        this.app = app;
        this.plugin = plugin;
        this.cursor_jumper = new CursorJumper(this.app);
        this.parser = new TemplateParser(this.app, this.plugin);
    }
    setup() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.parser.init();
        });
    }
    create_running_config(template_file, target_file, run_mode) {
        return {
            template_file: template_file,
            target_file: target_file,
            run_mode: run_mode,
        };
    }
    read_and_parse_template(config) {
        return __awaiter(this, void 0, void 0, function* () {
            const template_content = yield this.app.vault.read(config.template_file);
            return this.parse_template(config, template_content);
        });
    }
    parse_template(config, template_content) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.parser.setCurrentContext(config, ContextMode.USER_INTERNAL);
            const content = yield this.parser.parseTemplates(template_content);
            return content;
        });
    }
    create_new_note_from_template(template, folder, filename, open_new_note = true) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!folder) {
                folder = this.app.fileManager.getNewFileParent("");
            }
            // TODO: Change that, not stable atm
            // @ts-ignore
            const created_note = yield this.app.fileManager.createNewMarkdownFile(folder, filename !== null && filename !== void 0 ? filename : "Untitled");
            let running_config;
            let output_content;
            if (template instanceof obsidian.TFile) {
                running_config = this.create_running_config(template, created_note, RunMode.CreateNewFromTemplate);
                output_content = yield this.plugin.errorWrapper(() => __awaiter(this, void 0, void 0, function* () { return this.read_and_parse_template(running_config); }));
            }
            else {
                running_config = this.create_running_config(undefined, created_note, RunMode.CreateNewFromTemplate);
                output_content = yield this.plugin.errorWrapper(() => __awaiter(this, void 0, void 0, function* () { return this.parse_template(running_config, template); }));
            }
            if (output_content == null) {
                yield this.app.vault.delete(created_note);
                return;
            }
            yield this.app.vault.modify(created_note, output_content);
            if (open_new_note) {
                const active_leaf = this.app.workspace.activeLeaf;
                if (!active_leaf) {
                    this.plugin.log_error(new TemplaterError("No active leaf"));
                    return;
                }
                yield active_leaf.openFile(created_note, { state: { mode: 'source' }, eState: { rename: 'all' } });
                yield this.cursor_jumper.jump_to_next_cursor_location();
            }
            return created_note;
        });
    }
    append_template(template_file) {
        return __awaiter(this, void 0, void 0, function* () {
            const active_view = this.app.workspace.getActiveViewOfType(obsidian.MarkdownView);
            if (active_view === null) {
                this.plugin.log_error(new TemplaterError("No active view, can't append templates."));
                return;
            }
            const running_config = this.create_running_config(template_file, active_view.file, RunMode.AppendActiveFile);
            const output_content = yield this.plugin.errorWrapper(() => __awaiter(this, void 0, void 0, function* () { return this.read_and_parse_template(running_config); }));
            if (output_content == null) {
                return;
            }
            const editor = active_view.editor;
            const doc = editor.getDoc();
            doc.replaceSelection(output_content);
            yield this.cursor_jumper.jump_to_next_cursor_location();
        });
    }
    overwrite_active_file_templates() {
        const active_view = this.app.workspace.getActiveViewOfType(obsidian.MarkdownView);
        if (active_view === null) {
            this.plugin.log_error(new TemplaterError("Active view is null, can't overwrite content"));
            return;
        }
        this.overwrite_file_templates(active_view.file, true);
    }
    overwrite_file_templates(file, active_file = false) {
        return __awaiter(this, void 0, void 0, function* () {
            const running_config = this.create_running_config(file, file, active_file ? RunMode.OverwriteActiveFile : RunMode.OverwriteFile);
            const output_content = yield this.plugin.errorWrapper(() => __awaiter(this, void 0, void 0, function* () { return this.read_and_parse_template(running_config); }));
            if (output_content == null) {
                return;
            }
            yield this.app.vault.modify(file, output_content);
            if (this.app.workspace.getActiveFile() === file) {
                yield this.cursor_jumper.jump_to_next_cursor_location();
            }
        });
    }
    process_dynamic_templates(el, ctx) {
        return __awaiter(this, void 0, void 0, function* () {
            const dynamic_command_regex = /(<%(?:-|_)?\s*[*~]{0,1})\+((?:.|\s)*?%>)/g;
            const walker = document.createNodeIterator(el, NodeFilter.SHOW_TEXT);
            let node;
            let pass = false;
            while ((node = walker.nextNode())) {
                let content = node.nodeValue;
                let match;
                if ((match = dynamic_command_regex.exec(content)) != null) {
                    const file = this.app.metadataCache.getFirstLinkpathDest("", ctx.sourcePath);
                    if (!file || !(file instanceof obsidian.TFile)) {
                        return;
                    }
                    if (!pass) {
                        pass = true;
                        const running_config = this.create_running_config(file, file, RunMode.DynamicProcessor);
                        yield this.parser.setCurrentContext(running_config, ContextMode.USER_INTERNAL);
                    }
                    while (match != null) {
                        // Not the most efficient way to exclude the '+' from the command but I couldn't find something better
                        const complete_command = match[1] + match[2];
                        const command_output = yield this.plugin.errorWrapper(() => __awaiter(this, void 0, void 0, function* () {
                            return yield this.parser.parseTemplates(complete_command);
                        }));
                        if (command_output == null) {
                            return;
                        }
                        let start = dynamic_command_regex.lastIndex - match[0].length;
                        let end = dynamic_command_regex.lastIndex;
                        content = content.substring(0, start) + command_output + content.substring(end);
                        dynamic_command_regex.lastIndex += (command_output.length - match[0].length);
                        match = dynamic_command_regex.exec(content);
                    }
                    node.nodeValue = content;
                }
            }
        });
    }
}

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
  mod(window.CodeMirror);
})(function(CodeMirror) {

CodeMirror.defineMode("javascript", function(config, parserConfig) {
  var indentUnit = config.indentUnit;
  var statementIndent = parserConfig.statementIndent;
  var jsonldMode = parserConfig.jsonld;
  var jsonMode = parserConfig.json || jsonldMode;
  var trackScope = parserConfig.trackScope !== false;
  var isTS = parserConfig.typescript;
  var wordRE = parserConfig.wordCharacters || /[\w$\xa1-\uffff]/;

  // Tokenizer

  var keywords = function(){
    function kw(type) {return {type: type, style: "keyword"};}
    var A = kw("keyword a"), B = kw("keyword b"), C = kw("keyword c"), D = kw("keyword d");
    var operator = kw("operator"), atom = {type: "atom", style: "atom"};

    return {
      "if": kw("if"), "while": A, "with": A, "else": B, "do": B, "try": B, "finally": B,
      "return": D, "break": D, "continue": D, "new": kw("new"), "delete": C, "void": C, "throw": C,
      "debugger": kw("debugger"), "var": kw("var"), "const": kw("var"), "let": kw("var"),
      "function": kw("function"), "catch": kw("catch"),
      "for": kw("for"), "switch": kw("switch"), "case": kw("case"), "default": kw("default"),
      "in": operator, "typeof": operator, "instanceof": operator,
      "true": atom, "false": atom, "null": atom, "undefined": atom, "NaN": atom, "Infinity": atom,
      "this": kw("this"), "class": kw("class"), "super": kw("atom"),
      "yield": C, "export": kw("export"), "import": kw("import"), "extends": C,
      "await": C
    };
  }();

  var isOperatorChar = /[+\-*&%=<>!?|~^@]/;
  var isJsonldKeyword = /^@(context|id|value|language|type|container|list|set|reverse|index|base|vocab|graph)"/;

  function readRegexp(stream) {
    var escaped = false, next, inSet = false;
    while ((next = stream.next()) != null) {
      if (!escaped) {
        if (next == "/" && !inSet) return;
        if (next == "[") inSet = true;
        else if (inSet && next == "]") inSet = false;
      }
      escaped = !escaped && next == "\\";
    }
  }

  // Used as scratch variables to communicate multiple values without
  // consing up tons of objects.
  var type, content;
  function ret(tp, style, cont) {
    type = tp; content = cont;
    return style;
  }
  function tokenBase(stream, state) {
    var ch = stream.next();
    if (ch == '"' || ch == "'") {
      state.tokenize = tokenString(ch);
      return state.tokenize(stream, state);
    } else if (ch == "." && stream.match(/^\d[\d_]*(?:[eE][+\-]?[\d_]+)?/)) {
      return ret("number", "number");
    } else if (ch == "." && stream.match("..")) {
      return ret("spread", "meta");
    } else if (/[\[\]{}\(\),;\:\.]/.test(ch)) {
      return ret(ch);
    } else if (ch == "=" && stream.eat(">")) {
      return ret("=>", "operator");
    } else if (ch == "0" && stream.match(/^(?:x[\dA-Fa-f_]+|o[0-7_]+|b[01_]+)n?/)) {
      return ret("number", "number");
    } else if (/\d/.test(ch)) {
      stream.match(/^[\d_]*(?:n|(?:\.[\d_]*)?(?:[eE][+\-]?[\d_]+)?)?/);
      return ret("number", "number");
    } else if (ch == "/") {
      if (stream.eat("*")) {
        state.tokenize = tokenComment;
        return tokenComment(stream, state);
      } else if (stream.eat("/")) {
        stream.skipToEnd();
        return ret("comment", "comment");
      } else if (expressionAllowed(stream, state, 1)) {
        readRegexp(stream);
        stream.match(/^\b(([gimyus])(?![gimyus]*\2))+\b/);
        return ret("regexp", "string-2");
      } else {
        stream.eat("=");
        return ret("operator", "operator", stream.current());
      }
    } else if (ch == "`") {
      state.tokenize = tokenQuasi;
      return tokenQuasi(stream, state);
    } else if (ch == "#" && stream.peek() == "!") {
      stream.skipToEnd();
      return ret("meta", "meta");
    } else if (ch == "#" && stream.eatWhile(wordRE)) {
      return ret("variable", "property")
    } else if (ch == "<" && stream.match("!--") ||
               (ch == "-" && stream.match("->") && !/\S/.test(stream.string.slice(0, stream.start)))) {
      stream.skipToEnd();
      return ret("comment", "comment")
    } else if (isOperatorChar.test(ch)) {
      if (ch != ">" || !state.lexical || state.lexical.type != ">") {
        if (stream.eat("=")) {
          if (ch == "!" || ch == "=") stream.eat("=");
        } else if (/[<>*+\-|&?]/.test(ch)) {
          stream.eat(ch);
          if (ch == ">") stream.eat(ch);
        }
      }
      if (ch == "?" && stream.eat(".")) return ret(".")
      return ret("operator", "operator", stream.current());
    } else if (wordRE.test(ch)) {
      stream.eatWhile(wordRE);
      var word = stream.current();
      if (state.lastType != ".") {
        if (keywords.propertyIsEnumerable(word)) {
          var kw = keywords[word];
          return ret(kw.type, kw.style, word)
        }
        if (word == "async" && stream.match(/^(\s|\/\*([^*]|\*(?!\/))*?\*\/)*[\[\(\w]/, false))
          return ret("async", "keyword", word)
      }
      return ret("variable", "variable", word)
    }
  }

  function tokenString(quote) {
    return function(stream, state) {
      var escaped = false, next;
      if (jsonldMode && stream.peek() == "@" && stream.match(isJsonldKeyword)){
        state.tokenize = tokenBase;
        return ret("jsonld-keyword", "meta");
      }
      while ((next = stream.next()) != null) {
        if (next == quote && !escaped) break;
        escaped = !escaped && next == "\\";
      }
      if (!escaped) state.tokenize = tokenBase;
      return ret("string", "string");
    };
  }

  function tokenComment(stream, state) {
    var maybeEnd = false, ch;
    while (ch = stream.next()) {
      if (ch == "/" && maybeEnd) {
        state.tokenize = tokenBase;
        break;
      }
      maybeEnd = (ch == "*");
    }
    return ret("comment", "comment");
  }

  function tokenQuasi(stream, state) {
    var escaped = false, next;
    while ((next = stream.next()) != null) {
      if (!escaped && (next == "`" || next == "$" && stream.eat("{"))) {
        state.tokenize = tokenBase;
        break;
      }
      escaped = !escaped && next == "\\";
    }
    return ret("quasi", "string-2", stream.current());
  }

  var brackets = "([{}])";
  // This is a crude lookahead trick to try and notice that we're
  // parsing the argument patterns for a fat-arrow function before we
  // actually hit the arrow token. It only works if the arrow is on
  // the same line as the arguments and there's no strange noise
  // (comments) in between. Fallback is to only notice when we hit the
  // arrow, and not declare the arguments as locals for the arrow
  // body.
  function findFatArrow(stream, state) {
    if (state.fatArrowAt) state.fatArrowAt = null;
    var arrow = stream.string.indexOf("=>", stream.start);
    if (arrow < 0) return;

    if (isTS) { // Try to skip TypeScript return type declarations after the arguments
      var m = /:\s*(?:\w+(?:<[^>]*>|\[\])?|\{[^}]*\})\s*$/.exec(stream.string.slice(stream.start, arrow));
      if (m) arrow = m.index;
    }

    var depth = 0, sawSomething = false;
    for (var pos = arrow - 1; pos >= 0; --pos) {
      var ch = stream.string.charAt(pos);
      var bracket = brackets.indexOf(ch);
      if (bracket >= 0 && bracket < 3) {
        if (!depth) { ++pos; break; }
        if (--depth == 0) { if (ch == "(") sawSomething = true; break; }
      } else if (bracket >= 3 && bracket < 6) {
        ++depth;
      } else if (wordRE.test(ch)) {
        sawSomething = true;
      } else if (/["'\/`]/.test(ch)) {
        for (;; --pos) {
          if (pos == 0) return
          var next = stream.string.charAt(pos - 1);
          if (next == ch && stream.string.charAt(pos - 2) != "\\") { pos--; break }
        }
      } else if (sawSomething && !depth) {
        ++pos;
        break;
      }
    }
    if (sawSomething && !depth) state.fatArrowAt = pos;
  }

  // Parser

  var atomicTypes = {"atom": true, "number": true, "variable": true, "string": true,
                     "regexp": true, "this": true, "import": true, "jsonld-keyword": true};

  function JSLexical(indented, column, type, align, prev, info) {
    this.indented = indented;
    this.column = column;
    this.type = type;
    this.prev = prev;
    this.info = info;
    if (align != null) this.align = align;
  }

  function inScope(state, varname) {
    if (!trackScope) return false
    for (var v = state.localVars; v; v = v.next)
      if (v.name == varname) return true;
    for (var cx = state.context; cx; cx = cx.prev) {
      for (var v = cx.vars; v; v = v.next)
        if (v.name == varname) return true;
    }
  }

  function parseJS(state, style, type, content, stream) {
    var cc = state.cc;
    // Communicate our context to the combinators.
    // (Less wasteful than consing up a hundred closures on every call.)
    cx.state = state; cx.stream = stream; cx.marked = null, cx.cc = cc; cx.style = style;

    if (!state.lexical.hasOwnProperty("align"))
      state.lexical.align = true;

    while(true) {
      var combinator = cc.length ? cc.pop() : jsonMode ? expression : statement;
      if (combinator(type, content)) {
        while(cc.length && cc[cc.length - 1].lex)
          cc.pop()();
        if (cx.marked) return cx.marked;
        if (type == "variable" && inScope(state, content)) return "variable-2";
        return style;
      }
    }
  }

  // Combinator utils

  var cx = {state: null, column: null, marked: null, cc: null};
  function pass() {
    for (var i = arguments.length - 1; i >= 0; i--) cx.cc.push(arguments[i]);
  }
  function cont() {
    pass.apply(null, arguments);
    return true;
  }
  function inList(name, list) {
    for (var v = list; v; v = v.next) if (v.name == name) return true
    return false;
  }
  function register(varname) {
    var state = cx.state;
    cx.marked = "def";
    if (!trackScope) return
    if (state.context) {
      if (state.lexical.info == "var" && state.context && state.context.block) {
        // FIXME function decls are also not block scoped
        var newContext = registerVarScoped(varname, state.context);
        if (newContext != null) {
          state.context = newContext;
          return
        }
      } else if (!inList(varname, state.localVars)) {
        state.localVars = new Var(varname, state.localVars);
        return
      }
    }
    // Fall through means this is global
    if (parserConfig.globalVars && !inList(varname, state.globalVars))
      state.globalVars = new Var(varname, state.globalVars);
  }
  function registerVarScoped(varname, context) {
    if (!context) {
      return null
    } else if (context.block) {
      var inner = registerVarScoped(varname, context.prev);
      if (!inner) return null
      if (inner == context.prev) return context
      return new Context(inner, context.vars, true)
    } else if (inList(varname, context.vars)) {
      return context
    } else {
      return new Context(context.prev, new Var(varname, context.vars), false)
    }
  }

  function isModifier(name) {
    return name == "public" || name == "private" || name == "protected" || name == "abstract" || name == "readonly"
  }

  // Combinators

  function Context(prev, vars, block) { this.prev = prev; this.vars = vars; this.block = block; }
  function Var(name, next) { this.name = name; this.next = next; }

  var defaultVars = new Var("this", new Var("arguments", null));
  function pushcontext() {
    cx.state.context = new Context(cx.state.context, cx.state.localVars, false);
    cx.state.localVars = defaultVars;
  }
  function pushblockcontext() {
    cx.state.context = new Context(cx.state.context, cx.state.localVars, true);
    cx.state.localVars = null;
  }
  function popcontext() {
    cx.state.localVars = cx.state.context.vars;
    cx.state.context = cx.state.context.prev;
  }
  popcontext.lex = true;
  function pushlex(type, info) {
    var result = function() {
      var state = cx.state, indent = state.indented;
      if (state.lexical.type == "stat") indent = state.lexical.indented;
      else for (var outer = state.lexical; outer && outer.type == ")" && outer.align; outer = outer.prev)
        indent = outer.indented;
      state.lexical = new JSLexical(indent, cx.stream.column(), type, null, state.lexical, info);
    };
    result.lex = true;
    return result;
  }
  function poplex() {
    var state = cx.state;
    if (state.lexical.prev) {
      if (state.lexical.type == ")")
        state.indented = state.lexical.indented;
      state.lexical = state.lexical.prev;
    }
  }
  poplex.lex = true;

  function expect(wanted) {
    function exp(type) {
      if (type == wanted) return cont();
      else if (wanted == ";" || type == "}" || type == ")" || type == "]") return pass();
      else return cont(exp);
    }    return exp;
  }

  function statement(type, value) {
    if (type == "var") return cont(pushlex("vardef", value), vardef, expect(";"), poplex);
    if (type == "keyword a") return cont(pushlex("form"), parenExpr, statement, poplex);
    if (type == "keyword b") return cont(pushlex("form"), statement, poplex);
    if (type == "keyword d") return cx.stream.match(/^\s*$/, false) ? cont() : cont(pushlex("stat"), maybeexpression, expect(";"), poplex);
    if (type == "debugger") return cont(expect(";"));
    if (type == "{") return cont(pushlex("}"), pushblockcontext, block, poplex, popcontext);
    if (type == ";") return cont();
    if (type == "if") {
      if (cx.state.lexical.info == "else" && cx.state.cc[cx.state.cc.length - 1] == poplex)
        cx.state.cc.pop()();
      return cont(pushlex("form"), parenExpr, statement, poplex, maybeelse);
    }
    if (type == "function") return cont(functiondef);
    if (type == "for") return cont(pushlex("form"), pushblockcontext, forspec, statement, popcontext, poplex);
    if (type == "class" || (isTS && value == "interface")) {
      cx.marked = "keyword";
      return cont(pushlex("form", type == "class" ? type : value), className, poplex)
    }
    if (type == "variable") {
      if (isTS && value == "declare") {
        cx.marked = "keyword";
        return cont(statement)
      } else if (isTS && (value == "module" || value == "enum" || value == "type") && cx.stream.match(/^\s*\w/, false)) {
        cx.marked = "keyword";
        if (value == "enum") return cont(enumdef);
        else if (value == "type") return cont(typename, expect("operator"), typeexpr, expect(";"));
        else return cont(pushlex("form"), pattern, expect("{"), pushlex("}"), block, poplex, poplex)
      } else if (isTS && value == "namespace") {
        cx.marked = "keyword";
        return cont(pushlex("form"), expression, statement, poplex)
      } else if (isTS && value == "abstract") {
        cx.marked = "keyword";
        return cont(statement)
      } else {
        return cont(pushlex("stat"), maybelabel);
      }
    }
    if (type == "switch") return cont(pushlex("form"), parenExpr, expect("{"), pushlex("}", "switch"), pushblockcontext,
                                      block, poplex, poplex, popcontext);
    if (type == "case") return cont(expression, expect(":"));
    if (type == "default") return cont(expect(":"));
    if (type == "catch") return cont(pushlex("form"), pushcontext, maybeCatchBinding, statement, poplex, popcontext);
    if (type == "export") return cont(pushlex("stat"), afterExport, poplex);
    if (type == "import") return cont(pushlex("stat"), afterImport, poplex);
    if (type == "async") return cont(statement)
    if (value == "@") return cont(expression, statement)
    return pass(pushlex("stat"), expression, expect(";"), poplex);
  }
  function maybeCatchBinding(type) {
    if (type == "(") return cont(funarg, expect(")"))
  }
  function expression(type, value) {
    return expressionInner(type, value, false);
  }
  function expressionNoComma(type, value) {
    return expressionInner(type, value, true);
  }
  function parenExpr(type) {
    if (type != "(") return pass()
    return cont(pushlex(")"), maybeexpression, expect(")"), poplex)
  }
  function expressionInner(type, value, noComma) {
    if (cx.state.fatArrowAt == cx.stream.start) {
      var body = noComma ? arrowBodyNoComma : arrowBody;
      if (type == "(") return cont(pushcontext, pushlex(")"), commasep(funarg, ")"), poplex, expect("=>"), body, popcontext);
      else if (type == "variable") return pass(pushcontext, pattern, expect("=>"), body, popcontext);
    }

    var maybeop = noComma ? maybeoperatorNoComma : maybeoperatorComma;
    if (atomicTypes.hasOwnProperty(type)) return cont(maybeop);
    if (type == "function") return cont(functiondef, maybeop);
    if (type == "class" || (isTS && value == "interface")) { cx.marked = "keyword"; return cont(pushlex("form"), classExpression, poplex); }
    if (type == "keyword c" || type == "async") return cont(noComma ? expressionNoComma : expression);
    if (type == "(") return cont(pushlex(")"), maybeexpression, expect(")"), poplex, maybeop);
    if (type == "operator" || type == "spread") return cont(noComma ? expressionNoComma : expression);
    if (type == "[") return cont(pushlex("]"), arrayLiteral, poplex, maybeop);
    if (type == "{") return contCommasep(objprop, "}", null, maybeop);
    if (type == "quasi") return pass(quasi, maybeop);
    if (type == "new") return cont(maybeTarget(noComma));
    return cont();
  }
  function maybeexpression(type) {
    if (type.match(/[;\}\)\],]/)) return pass();
    return pass(expression);
  }

  function maybeoperatorComma(type, value) {
    if (type == ",") return cont(maybeexpression);
    return maybeoperatorNoComma(type, value, false);
  }
  function maybeoperatorNoComma(type, value, noComma) {
    var me = noComma == false ? maybeoperatorComma : maybeoperatorNoComma;
    var expr = noComma == false ? expression : expressionNoComma;
    if (type == "=>") return cont(pushcontext, noComma ? arrowBodyNoComma : arrowBody, popcontext);
    if (type == "operator") {
      if (/\+\+|--/.test(value) || isTS && value == "!") return cont(me);
      if (isTS && value == "<" && cx.stream.match(/^([^<>]|<[^<>]*>)*>\s*\(/, false))
        return cont(pushlex(">"), commasep(typeexpr, ">"), poplex, me);
      if (value == "?") return cont(expression, expect(":"), expr);
      return cont(expr);
    }
    if (type == "quasi") { return pass(quasi, me); }
    if (type == ";") return;
    if (type == "(") return contCommasep(expressionNoComma, ")", "call", me);
    if (type == ".") return cont(property, me);
    if (type == "[") return cont(pushlex("]"), maybeexpression, expect("]"), poplex, me);
    if (isTS && value == "as") { cx.marked = "keyword"; return cont(typeexpr, me) }
    if (type == "regexp") {
      cx.state.lastType = cx.marked = "operator";
      cx.stream.backUp(cx.stream.pos - cx.stream.start - 1);
      return cont(expr)
    }
  }
  function quasi(type, value) {
    if (type != "quasi") return pass();
    if (value.slice(value.length - 2) != "${") return cont(quasi);
    return cont(maybeexpression, continueQuasi);
  }
  function continueQuasi(type) {
    if (type == "}") {
      cx.marked = "string-2";
      cx.state.tokenize = tokenQuasi;
      return cont(quasi);
    }
  }
  function arrowBody(type) {
    findFatArrow(cx.stream, cx.state);
    return pass(type == "{" ? statement : expression);
  }
  function arrowBodyNoComma(type) {
    findFatArrow(cx.stream, cx.state);
    return pass(type == "{" ? statement : expressionNoComma);
  }
  function maybeTarget(noComma) {
    return function(type) {
      if (type == ".") return cont(noComma ? targetNoComma : target);
      else if (type == "variable" && isTS) return cont(maybeTypeArgs, noComma ? maybeoperatorNoComma : maybeoperatorComma)
      else return pass(noComma ? expressionNoComma : expression);
    };
  }
  function target(_, value) {
    if (value == "target") { cx.marked = "keyword"; return cont(maybeoperatorComma); }
  }
  function targetNoComma(_, value) {
    if (value == "target") { cx.marked = "keyword"; return cont(maybeoperatorNoComma); }
  }
  function maybelabel(type) {
    if (type == ":") return cont(poplex, statement);
    return pass(maybeoperatorComma, expect(";"), poplex);
  }
  function property(type) {
    if (type == "variable") {cx.marked = "property"; return cont();}
  }
  function objprop(type, value) {
    if (type == "async") {
      cx.marked = "property";
      return cont(objprop);
    } else if (type == "variable" || cx.style == "keyword") {
      cx.marked = "property";
      if (value == "get" || value == "set") return cont(getterSetter);
      var m; // Work around fat-arrow-detection complication for detecting typescript typed arrow params
      if (isTS && cx.state.fatArrowAt == cx.stream.start && (m = cx.stream.match(/^\s*:\s*/, false)))
        cx.state.fatArrowAt = cx.stream.pos + m[0].length;
      return cont(afterprop);
    } else if (type == "number" || type == "string") {
      cx.marked = jsonldMode ? "property" : (cx.style + " property");
      return cont(afterprop);
    } else if (type == "jsonld-keyword") {
      return cont(afterprop);
    } else if (isTS && isModifier(value)) {
      cx.marked = "keyword";
      return cont(objprop)
    } else if (type == "[") {
      return cont(expression, maybetype, expect("]"), afterprop);
    } else if (type == "spread") {
      return cont(expressionNoComma, afterprop);
    } else if (value == "*") {
      cx.marked = "keyword";
      return cont(objprop);
    } else if (type == ":") {
      return pass(afterprop)
    }
  }
  function getterSetter(type) {
    if (type != "variable") return pass(afterprop);
    cx.marked = "property";
    return cont(functiondef);
  }
  function afterprop(type) {
    if (type == ":") return cont(expressionNoComma);
    if (type == "(") return pass(functiondef);
  }
  function commasep(what, end, sep) {
    function proceed(type, value) {
      if (sep ? sep.indexOf(type) > -1 : type == ",") {
        var lex = cx.state.lexical;
        if (lex.info == "call") lex.pos = (lex.pos || 0) + 1;
        return cont(function(type, value) {
          if (type == end || value == end) return pass()
          return pass(what)
        }, proceed);
      }
      if (type == end || value == end) return cont();
      if (sep && sep.indexOf(";") > -1) return pass(what)
      return cont(expect(end));
    }
    return function(type, value) {
      if (type == end || value == end) return cont();
      return pass(what, proceed);
    };
  }
  function contCommasep(what, end, info) {
    for (var i = 3; i < arguments.length; i++)
      cx.cc.push(arguments[i]);
    return cont(pushlex(end, info), commasep(what, end), poplex);
  }
  function block(type) {
    if (type == "}") return cont();
    return pass(statement, block);
  }
  function maybetype(type, value) {
    if (isTS) {
      if (type == ":") return cont(typeexpr);
      if (value == "?") return cont(maybetype);
    }
  }
  function maybetypeOrIn(type, value) {
    if (isTS && (type == ":" || value == "in")) return cont(typeexpr)
  }
  function mayberettype(type) {
    if (isTS && type == ":") {
      if (cx.stream.match(/^\s*\w+\s+is\b/, false)) return cont(expression, isKW, typeexpr)
      else return cont(typeexpr)
    }
  }
  function isKW(_, value) {
    if (value == "is") {
      cx.marked = "keyword";
      return cont()
    }
  }
  function typeexpr(type, value) {
    if (value == "keyof" || value == "typeof" || value == "infer" || value == "readonly") {
      cx.marked = "keyword";
      return cont(value == "typeof" ? expressionNoComma : typeexpr)
    }
    if (type == "variable" || value == "void") {
      cx.marked = "type";
      return cont(afterType)
    }
    if (value == "|" || value == "&") return cont(typeexpr)
    if (type == "string" || type == "number" || type == "atom") return cont(afterType);
    if (type == "[") return cont(pushlex("]"), commasep(typeexpr, "]", ","), poplex, afterType)
    if (type == "{") return cont(pushlex("}"), typeprops, poplex, afterType)
    if (type == "(") return cont(commasep(typearg, ")"), maybeReturnType, afterType)
    if (type == "<") return cont(commasep(typeexpr, ">"), typeexpr)
    if (type == "quasi") { return pass(quasiType, afterType); }
  }
  function maybeReturnType(type) {
    if (type == "=>") return cont(typeexpr)
  }
  function typeprops(type) {
    if (type.match(/[\}\)\]]/)) return cont()
    if (type == "," || type == ";") return cont(typeprops)
    return pass(typeprop, typeprops)
  }
  function typeprop(type, value) {
    if (type == "variable" || cx.style == "keyword") {
      cx.marked = "property";
      return cont(typeprop)
    } else if (value == "?" || type == "number" || type == "string") {
      return cont(typeprop)
    } else if (type == ":") {
      return cont(typeexpr)
    } else if (type == "[") {
      return cont(expect("variable"), maybetypeOrIn, expect("]"), typeprop)
    } else if (type == "(") {
      return pass(functiondecl, typeprop)
    } else if (!type.match(/[;\}\)\],]/)) {
      return cont()
    }
  }
  function quasiType(type, value) {
    if (type != "quasi") return pass();
    if (value.slice(value.length - 2) != "${") return cont(quasiType);
    return cont(typeexpr, continueQuasiType);
  }
  function continueQuasiType(type) {
    if (type == "}") {
      cx.marked = "string-2";
      cx.state.tokenize = tokenQuasi;
      return cont(quasiType);
    }
  }
  function typearg(type, value) {
    if (type == "variable" && cx.stream.match(/^\s*[?:]/, false) || value == "?") return cont(typearg)
    if (type == ":") return cont(typeexpr)
    if (type == "spread") return cont(typearg)
    return pass(typeexpr)
  }
  function afterType(type, value) {
    if (value == "<") return cont(pushlex(">"), commasep(typeexpr, ">"), poplex, afterType)
    if (value == "|" || type == "." || value == "&") return cont(typeexpr)
    if (type == "[") return cont(typeexpr, expect("]"), afterType)
    if (value == "extends" || value == "implements") { cx.marked = "keyword"; return cont(typeexpr) }
    if (value == "?") return cont(typeexpr, expect(":"), typeexpr)
  }
  function maybeTypeArgs(_, value) {
    if (value == "<") return cont(pushlex(">"), commasep(typeexpr, ">"), poplex, afterType)
  }
  function typeparam() {
    return pass(typeexpr, maybeTypeDefault)
  }
  function maybeTypeDefault(_, value) {
    if (value == "=") return cont(typeexpr)
  }
  function vardef(_, value) {
    if (value == "enum") {cx.marked = "keyword"; return cont(enumdef)}
    return pass(pattern, maybetype, maybeAssign, vardefCont);
  }
  function pattern(type, value) {
    if (isTS && isModifier(value)) { cx.marked = "keyword"; return cont(pattern) }
    if (type == "variable") { register(value); return cont(); }
    if (type == "spread") return cont(pattern);
    if (type == "[") return contCommasep(eltpattern, "]");
    if (type == "{") return contCommasep(proppattern, "}");
  }
  function proppattern(type, value) {
    if (type == "variable" && !cx.stream.match(/^\s*:/, false)) {
      register(value);
      return cont(maybeAssign);
    }
    if (type == "variable") cx.marked = "property";
    if (type == "spread") return cont(pattern);
    if (type == "}") return pass();
    if (type == "[") return cont(expression, expect(']'), expect(':'), proppattern);
    return cont(expect(":"), pattern, maybeAssign);
  }
  function eltpattern() {
    return pass(pattern, maybeAssign)
  }
  function maybeAssign(_type, value) {
    if (value == "=") return cont(expressionNoComma);
  }
  function vardefCont(type) {
    if (type == ",") return cont(vardef);
  }
  function maybeelse(type, value) {
    if (type == "keyword b" && value == "else") return cont(pushlex("form", "else"), statement, poplex);
  }
  function forspec(type, value) {
    if (value == "await") return cont(forspec);
    if (type == "(") return cont(pushlex(")"), forspec1, poplex);
  }
  function forspec1(type) {
    if (type == "var") return cont(vardef, forspec2);
    if (type == "variable") return cont(forspec2);
    return pass(forspec2)
  }
  function forspec2(type, value) {
    if (type == ")") return cont()
    if (type == ";") return cont(forspec2)
    if (value == "in" || value == "of") { cx.marked = "keyword"; return cont(expression, forspec2) }
    return pass(expression, forspec2)
  }
  function functiondef(type, value) {
    if (value == "*") {cx.marked = "keyword"; return cont(functiondef);}
    if (type == "variable") {register(value); return cont(functiondef);}
    if (type == "(") return cont(pushcontext, pushlex(")"), commasep(funarg, ")"), poplex, mayberettype, statement, popcontext);
    if (isTS && value == "<") return cont(pushlex(">"), commasep(typeparam, ">"), poplex, functiondef)
  }
  function functiondecl(type, value) {
    if (value == "*") {cx.marked = "keyword"; return cont(functiondecl);}
    if (type == "variable") {register(value); return cont(functiondecl);}
    if (type == "(") return cont(pushcontext, pushlex(")"), commasep(funarg, ")"), poplex, mayberettype, popcontext);
    if (isTS && value == "<") return cont(pushlex(">"), commasep(typeparam, ">"), poplex, functiondecl)
  }
  function typename(type, value) {
    if (type == "keyword" || type == "variable") {
      cx.marked = "type";
      return cont(typename)
    } else if (value == "<") {
      return cont(pushlex(">"), commasep(typeparam, ">"), poplex)
    }
  }
  function funarg(type, value) {
    if (value == "@") cont(expression, funarg);
    if (type == "spread") return cont(funarg);
    if (isTS && isModifier(value)) { cx.marked = "keyword"; return cont(funarg); }
    if (isTS && type == "this") return cont(maybetype, maybeAssign)
    return pass(pattern, maybetype, maybeAssign);
  }
  function classExpression(type, value) {
    // Class expressions may have an optional name.
    if (type == "variable") return className(type, value);
    return classNameAfter(type, value);
  }
  function className(type, value) {
    if (type == "variable") {register(value); return cont(classNameAfter);}
  }
  function classNameAfter(type, value) {
    if (value == "<") return cont(pushlex(">"), commasep(typeparam, ">"), poplex, classNameAfter)
    if (value == "extends" || value == "implements" || (isTS && type == ",")) {
      if (value == "implements") cx.marked = "keyword";
      return cont(isTS ? typeexpr : expression, classNameAfter);
    }
    if (type == "{") return cont(pushlex("}"), classBody, poplex);
  }
  function classBody(type, value) {
    if (type == "async" ||
        (type == "variable" &&
         (value == "static" || value == "get" || value == "set" || (isTS && isModifier(value))) &&
         cx.stream.match(/^\s+[\w$\xa1-\uffff]/, false))) {
      cx.marked = "keyword";
      return cont(classBody);
    }
    if (type == "variable" || cx.style == "keyword") {
      cx.marked = "property";
      return cont(classfield, classBody);
    }
    if (type == "number" || type == "string") return cont(classfield, classBody);
    if (type == "[")
      return cont(expression, maybetype, expect("]"), classfield, classBody)
    if (value == "*") {
      cx.marked = "keyword";
      return cont(classBody);
    }
    if (isTS && type == "(") return pass(functiondecl, classBody)
    if (type == ";" || type == ",") return cont(classBody);
    if (type == "}") return cont();
    if (value == "@") return cont(expression, classBody)
  }
  function classfield(type, value) {
    if (value == "!") return cont(classfield)
    if (value == "?") return cont(classfield)
    if (type == ":") return cont(typeexpr, maybeAssign)
    if (value == "=") return cont(expressionNoComma)
    var context = cx.state.lexical.prev, isInterface = context && context.info == "interface";
    return pass(isInterface ? functiondecl : functiondef)
  }
  function afterExport(type, value) {
    if (value == "*") { cx.marked = "keyword"; return cont(maybeFrom, expect(";")); }
    if (value == "default") { cx.marked = "keyword"; return cont(expression, expect(";")); }
    if (type == "{") return cont(commasep(exportField, "}"), maybeFrom, expect(";"));
    return pass(statement);
  }
  function exportField(type, value) {
    if (value == "as") { cx.marked = "keyword"; return cont(expect("variable")); }
    if (type == "variable") return pass(expressionNoComma, exportField);
  }
  function afterImport(type) {
    if (type == "string") return cont();
    if (type == "(") return pass(expression);
    if (type == ".") return pass(maybeoperatorComma);
    return pass(importSpec, maybeMoreImports, maybeFrom);
  }
  function importSpec(type, value) {
    if (type == "{") return contCommasep(importSpec, "}");
    if (type == "variable") register(value);
    if (value == "*") cx.marked = "keyword";
    return cont(maybeAs);
  }
  function maybeMoreImports(type) {
    if (type == ",") return cont(importSpec, maybeMoreImports)
  }
  function maybeAs(_type, value) {
    if (value == "as") { cx.marked = "keyword"; return cont(importSpec); }
  }
  function maybeFrom(_type, value) {
    if (value == "from") { cx.marked = "keyword"; return cont(expression); }
  }
  function arrayLiteral(type) {
    if (type == "]") return cont();
    return pass(commasep(expressionNoComma, "]"));
  }
  function enumdef() {
    return pass(pushlex("form"), pattern, expect("{"), pushlex("}"), commasep(enummember, "}"), poplex, poplex)
  }
  function enummember() {
    return pass(pattern, maybeAssign);
  }

  function isContinuedStatement(state, textAfter) {
    return state.lastType == "operator" || state.lastType == "," ||
      isOperatorChar.test(textAfter.charAt(0)) ||
      /[,.]/.test(textAfter.charAt(0));
  }

  function expressionAllowed(stream, state, backUp) {
    return state.tokenize == tokenBase &&
      /^(?:operator|sof|keyword [bcd]|case|new|export|default|spread|[\[{}\(,;:]|=>)$/.test(state.lastType) ||
      (state.lastType == "quasi" && /\{\s*$/.test(stream.string.slice(0, stream.pos - (backUp || 0))))
  }

  // Interface

  return {
    startState: function(basecolumn) {
      var state = {
        tokenize: tokenBase,
        lastType: "sof",
        cc: [],
        lexical: new JSLexical((basecolumn || 0) - indentUnit, 0, "block", false),
        localVars: parserConfig.localVars,
        context: parserConfig.localVars && new Context(null, null, false),
        indented: basecolumn || 0
      };
      if (parserConfig.globalVars && typeof parserConfig.globalVars == "object")
        state.globalVars = parserConfig.globalVars;
      return state;
    },

    token: function(stream, state) {
      if (stream.sol()) {
        if (!state.lexical.hasOwnProperty("align"))
          state.lexical.align = false;
        state.indented = stream.indentation();
        findFatArrow(stream, state);
      }
      if (state.tokenize != tokenComment && stream.eatSpace()) return null;
      var style = state.tokenize(stream, state);
      if (type == "comment") return style;
      state.lastType = type == "operator" && (content == "++" || content == "--") ? "incdec" : type;
      return parseJS(state, style, type, content, stream);
    },

    indent: function(state, textAfter) {
      if (state.tokenize == tokenComment || state.tokenize == tokenQuasi) return CodeMirror.Pass;
      if (state.tokenize != tokenBase) return 0;
      var firstChar = textAfter && textAfter.charAt(0), lexical = state.lexical, top;
      // Kludge to prevent 'maybelse' from blocking lexical scope pops
      if (!/^\s*else\b/.test(textAfter)) for (var i = state.cc.length - 1; i >= 0; --i) {
        var c = state.cc[i];
        if (c == poplex) lexical = lexical.prev;
        else if (c != maybeelse && c != popcontext) break;
      }
      while ((lexical.type == "stat" || lexical.type == "form") &&
             (firstChar == "}" || ((top = state.cc[state.cc.length - 1]) &&
                                   (top == maybeoperatorComma || top == maybeoperatorNoComma) &&
                                   !/^[,\.=+\-*:?[\(]/.test(textAfter))))
        lexical = lexical.prev;
      if (statementIndent && lexical.type == ")" && lexical.prev.type == "stat")
        lexical = lexical.prev;
      var type = lexical.type, closing = firstChar == type;

      if (type == "vardef") return lexical.indented + (state.lastType == "operator" || state.lastType == "," ? lexical.info.length + 1 : 0);
      else if (type == "form" && firstChar == "{") return lexical.indented;
      else if (type == "form") return lexical.indented + indentUnit;
      else if (type == "stat")
        return lexical.indented + (isContinuedStatement(state, textAfter) ? statementIndent || indentUnit : 0);
      else if (lexical.info == "switch" && !closing && parserConfig.doubleIndentSwitch != false)
        return lexical.indented + (/^(?:case|default)\b/.test(textAfter) ? indentUnit : 2 * indentUnit);
      else if (lexical.align) return lexical.column + (closing ? 0 : 1);
      else return lexical.indented + (closing ? 0 : indentUnit);
    },

    electricInput: /^\s*(?:case .*?:|default:|\{|\})$/,
    blockCommentStart: jsonMode ? null : "/*",
    blockCommentEnd: jsonMode ? null : "*/",
    blockCommentContinue: jsonMode ? null : " * ",
    lineComment: jsonMode ? null : "//",
    fold: "brace",
    closeBrackets: "()[]{}''\"\"``",

    helperType: jsonMode ? "json" : "javascript",
    jsonldMode: jsonldMode,
    jsonMode: jsonMode,

    expressionAllowed: expressionAllowed,

    skipExpression: function(state) {
      parseJS(state, "atom", "atom", "true", new CodeMirror.StringStream("", 2, null));
    }
  };
});

CodeMirror.registerHelper("wordChars", "javascript", /[\w$]/);

CodeMirror.defineMIME("text/javascript", "javascript");
CodeMirror.defineMIME("text/ecmascript", "javascript");
CodeMirror.defineMIME("application/javascript", "javascript");
CodeMirror.defineMIME("application/x-javascript", "javascript");
CodeMirror.defineMIME("application/ecmascript", "javascript");
CodeMirror.defineMIME("application/json", { name: "javascript", json: true });
CodeMirror.defineMIME("application/x-json", { name: "javascript", json: true });
CodeMirror.defineMIME("application/manifest+json", { name: "javascript", json: true });
CodeMirror.defineMIME("application/ld+json", { name: "javascript", jsonld: true });
CodeMirror.defineMIME("text/typescript", { name: "javascript", typescript: true });
CodeMirror.defineMIME("application/typescript", { name: "javascript", typescript: true });

});

const TP_CMD_TOKEN_CLASS = "templater-command";
const TP_INLINE_CLASS = "templater-inline";
const TP_OPENING_TAG_TOKEN_CLASS = "templater-opening-tag";
const TP_CLOSING_TAG_TOKEN_CLASS = "templater-closing-tag";
const TP_INTERPOLATION_TAG_TOKEN_CLASS = "templater-interpolation-tag";
const TP_RAW_TAG_TOKEN_CLASS = "templater-raw-tag";
const TP_EXEC_TAG_TOKEN_CLASS = "templater-execution-tag";
class TemplaterEditor {
    constructor(app, plugin) {
        this.app = app;
        this.plugin = plugin;
    }
    setup() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.registerCodeMirrorMode();
        });
    }
    registerCodeMirrorMode() {
        return __awaiter(this, void 0, void 0, function* () {
            // cm-editor-syntax-highlight-obsidian plugin
            // https://codemirror.net/doc/manual.html#modeapi
            // https://codemirror.net/mode/diff/diff.js
            // https://codemirror.net/demo/mustache.html
            // https://marijnhaverbeke.nl/blog/codemirror-mode-system.html
            if (!this.plugin.settings.syntax_highlighting) {
                return;
            }
            // TODO: Add mobile support
            if (obsidian.Platform.isMobileApp) {
                return;
            }
            let js_mode = window.CodeMirror.getMode({}, "javascript");
            if (js_mode.name === "null") {
                this.plugin.log_error(new TemplaterError("Javascript syntax mode couldn't be found, can't enable syntax highlighting."));
                return;
            }
            window.CodeMirror.defineMode("templater", function (config, parserConfig) {
                const templaterOverlay = {
                    startState: function () {
                        const js_state = window.CodeMirror.startState(js_mode);
                        return Object.assign(Object.assign({}, js_state), { inCommand: false, tag_class: "", freeLine: false });
                    },
                    copyState: function (state) {
                        const js_state = window.CodeMirror.startState(js_mode);
                        const new_state = Object.assign(Object.assign({}, js_state), { inCommand: state.inCommand, tag_class: state.tag_class, freeLine: state.freeLine });
                        return new_state;
                    },
                    blankLine: function (state) {
                        if (state.inCommand) {
                            return `line-background-templater-command-bg`;
                        }
                        return null;
                    },
                    token: function (stream, state) {
                        if (stream.sol() && state.inCommand) {
                            state.freeLine = true;
                        }
                        if (state.inCommand) {
                            let keywords = "";
                            if (stream.match(/[\-_]{0,1}%>/, true)) {
                                state.inCommand = false;
                                state.freeLine = false;
                                const tag_class = state.tag_class;
                                state.tag_class = "";
                                return `line-${TP_INLINE_CLASS} ${TP_CMD_TOKEN_CLASS} ${TP_CLOSING_TAG_TOKEN_CLASS} ${tag_class}`;
                            }
                            const js_result = js_mode.token(stream, state);
                            if (stream.peek() == null && state.freeLine) {
                                keywords += ` line-background-templater-command-bg`;
                            }
                            if (!state.freeLine) {
                                keywords += ` line-${TP_INLINE_CLASS}`;
                            }
                            return `${keywords} ${TP_CMD_TOKEN_CLASS} line-${TP_CMD_TOKEN_CLASS} ${js_result}`;
                        }
                        const match = stream.match(/<%[\-_]{0,1}\s*([*~+]{0,1})/, true);
                        if (match != null) {
                            switch (match[1]) {
                                case '*':
                                    state.tag_class = TP_EXEC_TAG_TOKEN_CLASS;
                                    break;
                                case '~':
                                    state.tag_class = TP_RAW_TAG_TOKEN_CLASS;
                                    break;
                                default:
                                    state.tag_class = TP_INTERPOLATION_TAG_TOKEN_CLASS;
                                    break;
                            }
                            state.inCommand = true;
                            return `line-${TP_INLINE_CLASS} ${TP_CMD_TOKEN_CLASS} ${TP_OPENING_TAG_TOKEN_CLASS} ${state.tag_class}`;
                        }
                        while (stream.next() != null && !stream.match(/<%/, false))
                            ;
                        return null;
                    }
                };
                return window.CodeMirror.overlayMode(window.CodeMirror.getMode(config, "hypermd"), templaterOverlay);
            });
        });
    }
}

class TemplaterPlugin extends obsidian.Plugin {
    onload() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.loadSettings();
            this.templater = new Templater(this.app, this);
            yield this.templater.setup();
            this.editor = new TemplaterEditor(this.app, this);
            yield this.editor.setup();
            this.update_syntax_highlighting();
            this.fuzzySuggest = new TemplaterFuzzySuggestModal(this.app, this);
            this.registerMarkdownPostProcessor((el, ctx) => this.templater.process_dynamic_templates(el, ctx));
            obsidian.addIcon("templater-icon", ICON_DATA);
            this.addRibbonIcon('templater-icon', 'Templater', () => __awaiter(this, void 0, void 0, function* () {
                this.fuzzySuggest.insert_template();
            }));
            this.addCommand({
                id: "insert-templater",
                name: "Insert Template",
                hotkeys: [
                    {
                        modifiers: ["Alt"],
                        key: 'e',
                    },
                ],
                callback: () => {
                    this.fuzzySuggest.insert_template();
                },
            });
            this.addCommand({
                id: "replace-in-file-templater",
                name: "Replace templates in the active file",
                hotkeys: [
                    {
                        modifiers: ["Alt"],
                        key: 'r',
                    },
                ],
                callback: () => {
                    this.templater.overwrite_active_file_templates();
                },
            });
            this.addCommand({
                id: "jump-to-next-cursor-location",
                name: "Jump to next cursor location",
                hotkeys: [
                    {
                        modifiers: ["Alt"],
                        key: "Tab",
                    },
                ],
                callback: () => {
                    this.templater.cursor_jumper.jump_to_next_cursor_location();
                }
            });
            this.addCommand({
                id: "create-new-note-from-template",
                name: "Create new note from template",
                hotkeys: [
                    {
                        modifiers: ["Alt"],
                        key: "n",
                    },
                ],
                callback: () => {
                    this.fuzzySuggest.create_new_note_from_template();
                }
            });
            this.app.workspace.onLayoutReady(() => {
                this.update_trigger_file_on_creation();
            });
            this.registerEvent(this.app.workspace.on("file-menu", (menu, file) => {
                if (file instanceof obsidian.TFolder) {
                    menu.addItem((item) => {
                        item.setTitle("Create new note from template")
                            .setIcon("templater-icon")
                            .onClick(evt => {
                            this.fuzzySuggest.create_new_note_from_template(file);
                        });
                    });
                }
            }));
            this.addSettingTab(new TemplaterSettingTab(this.app, this));
        });
    }
    saveSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.saveData(this.settings);
        });
    }
    loadSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            this.settings = Object.assign({}, DEFAULT_SETTINGS, yield this.loadData());
        });
    }
    update_trigger_file_on_creation() {
        if (this.settings.trigger_on_file_creation) {
            this.trigger_on_file_creation_event = this.app.vault.on("create", (file) => __awaiter(this, void 0, void 0, function* () {
                if (!(file instanceof obsidian.TFile) || file.extension !== "md") {
                    return;
                }
                /* Avoids template replacement when syncing files */
                const template_folder = obsidian.normalizePath(this.settings.template_folder);
                if (template_folder !== "/") {
                    let parent = file.parent;
                    while (parent != null) {
                        if (parent.path === template_folder) {
                            return;
                        }
                        parent = parent.parent;
                    }
                }
                // TODO: find a better way to do this
                // Currently, I have to wait for the daily note plugin to add the file content before replacing
                // Not a problem with Calendar however since it creates the file with the existing content
                yield delay(300);
                if (file.stat.size == 0 && this.settings.empty_file_template) {
                    const template_file = yield this.errorWrapper(() => __awaiter(this, void 0, void 0, function* () {
                        return resolveTFile(this.app, this.settings.empty_file_template + ".md");
                    }));
                    if (!template_file) {
                        return;
                    }
                    const content = yield this.app.vault.read(template_file);
                    yield this.app.vault.modify(file, content);
                }
                this.templater.overwrite_file_templates(file);
            }));
            this.registerEvent(this.trigger_on_file_creation_event);
        }
        else {
            if (this.trigger_on_file_creation_event) {
                this.app.vault.offref(this.trigger_on_file_creation_event);
                this.trigger_on_file_creation_event = undefined;
            }
        }
    }
    update_syntax_highlighting() {
        if (this.settings.syntax_highlighting) {
            this.syntax_highlighting_event = this.app.workspace.on("codemirror", cm => {
                cm.setOption("mode", "templater");
            });
            this.app.workspace.iterateCodeMirrors(cm => {
                cm.setOption("mode", "templater");
            });
            this.registerEvent(this.syntax_highlighting_event);
        }
        else {
            if (this.syntax_highlighting_event) {
                this.app.vault.offref(this.syntax_highlighting_event);
            }
            this.app.workspace.iterateCodeMirrors(cm => {
                cm.setOption("mode", "hypermd");
            });
        }
    }
    errorWrapper(fn) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield fn();
            }
            catch (e) {
                if (!(e instanceof TemplaterError)) {
                    this.log_error(new TemplaterError(`Template parsing error, aborting.`, e.message));
                }
                else {
                    this.log_error(e);
                }
                return null;
            }
        });
    }
    log_update(msg) {
        const notice = new obsidian.Notice("", 15000);
        // TODO: Find better way for this
        // @ts-ignore
        notice.noticeEl.innerHTML = `<b>Templater update</b>:<br/>${msg}`;
    }
    log_error(e) {
        const notice = new obsidian.Notice("", 8000);
        if (e instanceof TemplaterError && e.console_msg) {
            // TODO: Find a better way for this
            // @ts-ignore
            notice.noticeEl.innerHTML = `<b>Templater Error</b>:<br/>${e.message}<br/>Check console for more informations`;
            console.error(e.message, e.console_msg);
        }
        else {
            // @ts-ignore
            notice.noticeEl.innerHTML = `<b>Templater Error</b>:<br/>${e.message}`;
        }
    }
}

module.exports = TemplaterPlugin;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXMiOlsibm9kZV9tb2R1bGVzL3RzbGliL3RzbGliLmVzNi5qcyIsInNyYy9FcnJvci50cyIsInNyYy9TZXR0aW5ncy50cyIsInNyYy9VdGlscy50cyIsInNyYy9UZW1wbGF0ZXJGdXp6eVN1Z2dlc3QudHMiLCJzcmMvQ29uc3RhbnRzLnRzIiwic3JjL0N1cnNvckp1bXBlci50cyIsIm5vZGVfbW9kdWxlcy9ldGEvZGlzdC9ldGEuZXMuanMiLCJzcmMvSW50ZXJuYWxUZW1wbGF0ZXMvSW50ZXJuYWxNb2R1bGUudHMiLCJzcmMvSW50ZXJuYWxUZW1wbGF0ZXMvZGF0ZS9JbnRlcm5hbE1vZHVsZURhdGUudHMiLCJzcmMvSW50ZXJuYWxUZW1wbGF0ZXMvZmlsZS9JbnRlcm5hbE1vZHVsZUZpbGUudHMiLCJzcmMvSW50ZXJuYWxUZW1wbGF0ZXMvd2ViL0ludGVybmFsTW9kdWxlV2ViLnRzIiwic3JjL0ludGVybmFsVGVtcGxhdGVzL2Zyb250bWF0dGVyL0ludGVybmFsTW9kdWxlRnJvbnRtYXR0ZXIudHMiLCJzcmMvSW50ZXJuYWxUZW1wbGF0ZXMvc3lzdGVtL1Byb21wdE1vZGFsLnRzIiwic3JjL0ludGVybmFsVGVtcGxhdGVzL3N5c3RlbS9TdWdnZXN0ZXJNb2RhbC50cyIsInNyYy9JbnRlcm5hbFRlbXBsYXRlcy9zeXN0ZW0vSW50ZXJuYWxNb2R1bGVTeXN0ZW0udHMiLCJzcmMvSW50ZXJuYWxUZW1wbGF0ZXMvY29uZmlnL0ludGVybmFsTW9kdWxlQ29uZmlnLnRzIiwic3JjL0ludGVybmFsVGVtcGxhdGVzL0ludGVybmFsVGVtcGxhdGVQYXJzZXIudHMiLCJzcmMvVXNlclRlbXBsYXRlcy9Vc2VyVGVtcGxhdGVQYXJzZXIudHMiLCJzcmMvVGVtcGxhdGVQYXJzZXIudHMiLCJzcmMvVGVtcGxhdGVyLnRzIiwic3JjL21vZGUvamF2YXNjcmlwdC5qcyIsInNyYy9UZW1wbGF0ZXJFZGl0b3IudHMiLCJzcmMvbWFpbi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKiEgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcclxuQ29weXJpZ2h0IChjKSBNaWNyb3NvZnQgQ29ycG9yYXRpb24uXHJcblxyXG5QZXJtaXNzaW9uIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBhbmQvb3IgZGlzdHJpYnV0ZSB0aGlzIHNvZnR3YXJlIGZvciBhbnlcclxucHVycG9zZSB3aXRoIG9yIHdpdGhvdXQgZmVlIGlzIGhlcmVieSBncmFudGVkLlxyXG5cclxuVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiBBTkQgVEhFIEFVVEhPUiBESVNDTEFJTVMgQUxMIFdBUlJBTlRJRVMgV0lUSFxyXG5SRUdBUkQgVE8gVEhJUyBTT0ZUV0FSRSBJTkNMVURJTkcgQUxMIElNUExJRUQgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFlcclxuQU5EIEZJVE5FU1MuIElOIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1IgQkUgTElBQkxFIEZPUiBBTlkgU1BFQ0lBTCwgRElSRUNULFxyXG5JTkRJUkVDVCwgT1IgQ09OU0VRVUVOVElBTCBEQU1BR0VTIE9SIEFOWSBEQU1BR0VTIFdIQVRTT0VWRVIgUkVTVUxUSU5HIEZST01cclxuTE9TUyBPRiBVU0UsIERBVEEgT1IgUFJPRklUUywgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIE5FR0xJR0VOQ0UgT1JcclxuT1RIRVIgVE9SVElPVVMgQUNUSU9OLCBBUklTSU5HIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFVTRSBPUlxyXG5QRVJGT1JNQU5DRSBPRiBUSElTIFNPRlRXQVJFLlxyXG4qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiAqL1xyXG4vKiBnbG9iYWwgUmVmbGVjdCwgUHJvbWlzZSAqL1xyXG5cclxudmFyIGV4dGVuZFN0YXRpY3MgPSBmdW5jdGlvbihkLCBiKSB7XHJcbiAgICBleHRlbmRTdGF0aWNzID0gT2JqZWN0LnNldFByb3RvdHlwZU9mIHx8XHJcbiAgICAgICAgKHsgX19wcm90b19fOiBbXSB9IGluc3RhbmNlb2YgQXJyYXkgJiYgZnVuY3Rpb24gKGQsIGIpIHsgZC5fX3Byb3RvX18gPSBiOyB9KSB8fFxyXG4gICAgICAgIGZ1bmN0aW9uIChkLCBiKSB7IGZvciAodmFyIHAgaW4gYikgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChiLCBwKSkgZFtwXSA9IGJbcF07IH07XHJcbiAgICByZXR1cm4gZXh0ZW5kU3RhdGljcyhkLCBiKTtcclxufTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2V4dGVuZHMoZCwgYikge1xyXG4gICAgaWYgKHR5cGVvZiBiICE9PSBcImZ1bmN0aW9uXCIgJiYgYiAhPT0gbnVsbClcclxuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2xhc3MgZXh0ZW5kcyB2YWx1ZSBcIiArIFN0cmluZyhiKSArIFwiIGlzIG5vdCBhIGNvbnN0cnVjdG9yIG9yIG51bGxcIik7XHJcbiAgICBleHRlbmRTdGF0aWNzKGQsIGIpO1xyXG4gICAgZnVuY3Rpb24gX18oKSB7IHRoaXMuY29uc3RydWN0b3IgPSBkOyB9XHJcbiAgICBkLnByb3RvdHlwZSA9IGIgPT09IG51bGwgPyBPYmplY3QuY3JlYXRlKGIpIDogKF9fLnByb3RvdHlwZSA9IGIucHJvdG90eXBlLCBuZXcgX18oKSk7XHJcbn1cclxuXHJcbmV4cG9ydCB2YXIgX19hc3NpZ24gPSBmdW5jdGlvbigpIHtcclxuICAgIF9fYXNzaWduID0gT2JqZWN0LmFzc2lnbiB8fCBmdW5jdGlvbiBfX2Fzc2lnbih0KSB7XHJcbiAgICAgICAgZm9yICh2YXIgcywgaSA9IDEsIG4gPSBhcmd1bWVudHMubGVuZ3RoOyBpIDwgbjsgaSsrKSB7XHJcbiAgICAgICAgICAgIHMgPSBhcmd1bWVudHNbaV07XHJcbiAgICAgICAgICAgIGZvciAodmFyIHAgaW4gcykgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzLCBwKSkgdFtwXSA9IHNbcF07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0O1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIF9fYXNzaWduLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX3Jlc3QocywgZSkge1xyXG4gICAgdmFyIHQgPSB7fTtcclxuICAgIGZvciAodmFyIHAgaW4gcykgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzLCBwKSAmJiBlLmluZGV4T2YocCkgPCAwKVxyXG4gICAgICAgIHRbcF0gPSBzW3BdO1xyXG4gICAgaWYgKHMgIT0gbnVsbCAmJiB0eXBlb2YgT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyA9PT0gXCJmdW5jdGlvblwiKVxyXG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBwID0gT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyhzKTsgaSA8IHAubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKGUuaW5kZXhPZihwW2ldKSA8IDAgJiYgT2JqZWN0LnByb3RvdHlwZS5wcm9wZXJ0eUlzRW51bWVyYWJsZS5jYWxsKHMsIHBbaV0pKVxyXG4gICAgICAgICAgICAgICAgdFtwW2ldXSA9IHNbcFtpXV07XHJcbiAgICAgICAgfVxyXG4gICAgcmV0dXJuIHQ7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2RlY29yYXRlKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKSB7XHJcbiAgICB2YXIgYyA9IGFyZ3VtZW50cy5sZW5ndGgsIHIgPSBjIDwgMyA/IHRhcmdldCA6IGRlc2MgPT09IG51bGwgPyBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih0YXJnZXQsIGtleSkgOiBkZXNjLCBkO1xyXG4gICAgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBSZWZsZWN0LmRlY29yYXRlID09PSBcImZ1bmN0aW9uXCIpIHIgPSBSZWZsZWN0LmRlY29yYXRlKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKTtcclxuICAgIGVsc2UgZm9yICh2YXIgaSA9IGRlY29yYXRvcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIGlmIChkID0gZGVjb3JhdG9yc1tpXSkgciA9IChjIDwgMyA/IGQocikgOiBjID4gMyA/IGQodGFyZ2V0LCBrZXksIHIpIDogZCh0YXJnZXQsIGtleSkpIHx8IHI7XHJcbiAgICByZXR1cm4gYyA+IDMgJiYgciAmJiBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBrZXksIHIpLCByO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19wYXJhbShwYXJhbUluZGV4LCBkZWNvcmF0b3IpIHtcclxuICAgIHJldHVybiBmdW5jdGlvbiAodGFyZ2V0LCBrZXkpIHsgZGVjb3JhdG9yKHRhcmdldCwga2V5LCBwYXJhbUluZGV4KTsgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19tZXRhZGF0YShtZXRhZGF0YUtleSwgbWV0YWRhdGFWYWx1ZSkge1xyXG4gICAgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBSZWZsZWN0Lm1ldGFkYXRhID09PSBcImZ1bmN0aW9uXCIpIHJldHVybiBSZWZsZWN0Lm1ldGFkYXRhKG1ldGFkYXRhS2V5LCBtZXRhZGF0YVZhbHVlKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fYXdhaXRlcih0aGlzQXJnLCBfYXJndW1lbnRzLCBQLCBnZW5lcmF0b3IpIHtcclxuICAgIGZ1bmN0aW9uIGFkb3B0KHZhbHVlKSB7IHJldHVybiB2YWx1ZSBpbnN0YW5jZW9mIFAgPyB2YWx1ZSA6IG5ldyBQKGZ1bmN0aW9uIChyZXNvbHZlKSB7IHJlc29sdmUodmFsdWUpOyB9KTsgfVxyXG4gICAgcmV0dXJuIG5ldyAoUCB8fCAoUCA9IFByb21pc2UpKShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XHJcbiAgICAgICAgZnVuY3Rpb24gZnVsZmlsbGVkKHZhbHVlKSB7IHRyeSB7IHN0ZXAoZ2VuZXJhdG9yLm5leHQodmFsdWUpKTsgfSBjYXRjaCAoZSkgeyByZWplY3QoZSk7IH0gfVxyXG4gICAgICAgIGZ1bmN0aW9uIHJlamVjdGVkKHZhbHVlKSB7IHRyeSB7IHN0ZXAoZ2VuZXJhdG9yW1widGhyb3dcIl0odmFsdWUpKTsgfSBjYXRjaCAoZSkgeyByZWplY3QoZSk7IH0gfVxyXG4gICAgICAgIGZ1bmN0aW9uIHN0ZXAocmVzdWx0KSB7IHJlc3VsdC5kb25lID8gcmVzb2x2ZShyZXN1bHQudmFsdWUpIDogYWRvcHQocmVzdWx0LnZhbHVlKS50aGVuKGZ1bGZpbGxlZCwgcmVqZWN0ZWQpOyB9XHJcbiAgICAgICAgc3RlcCgoZ2VuZXJhdG9yID0gZ2VuZXJhdG9yLmFwcGx5KHRoaXNBcmcsIF9hcmd1bWVudHMgfHwgW10pKS5uZXh0KCkpO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2dlbmVyYXRvcih0aGlzQXJnLCBib2R5KSB7XHJcbiAgICB2YXIgXyA9IHsgbGFiZWw6IDAsIHNlbnQ6IGZ1bmN0aW9uKCkgeyBpZiAodFswXSAmIDEpIHRocm93IHRbMV07IHJldHVybiB0WzFdOyB9LCB0cnlzOiBbXSwgb3BzOiBbXSB9LCBmLCB5LCB0LCBnO1xyXG4gICAgcmV0dXJuIGcgPSB7IG5leHQ6IHZlcmIoMCksIFwidGhyb3dcIjogdmVyYigxKSwgXCJyZXR1cm5cIjogdmVyYigyKSB9LCB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgKGdbU3ltYm9sLml0ZXJhdG9yXSA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpczsgfSksIGc7XHJcbiAgICBmdW5jdGlvbiB2ZXJiKG4pIHsgcmV0dXJuIGZ1bmN0aW9uICh2KSB7IHJldHVybiBzdGVwKFtuLCB2XSk7IH07IH1cclxuICAgIGZ1bmN0aW9uIHN0ZXAob3ApIHtcclxuICAgICAgICBpZiAoZikgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkdlbmVyYXRvciBpcyBhbHJlYWR5IGV4ZWN1dGluZy5cIik7XHJcbiAgICAgICAgd2hpbGUgKF8pIHRyeSB7XHJcbiAgICAgICAgICAgIGlmIChmID0gMSwgeSAmJiAodCA9IG9wWzBdICYgMiA/IHlbXCJyZXR1cm5cIl0gOiBvcFswXSA/IHlbXCJ0aHJvd1wiXSB8fCAoKHQgPSB5W1wicmV0dXJuXCJdKSAmJiB0LmNhbGwoeSksIDApIDogeS5uZXh0KSAmJiAhKHQgPSB0LmNhbGwoeSwgb3BbMV0pKS5kb25lKSByZXR1cm4gdDtcclxuICAgICAgICAgICAgaWYgKHkgPSAwLCB0KSBvcCA9IFtvcFswXSAmIDIsIHQudmFsdWVdO1xyXG4gICAgICAgICAgICBzd2l0Y2ggKG9wWzBdKSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlIDA6IGNhc2UgMTogdCA9IG9wOyBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgNDogXy5sYWJlbCsrOyByZXR1cm4geyB2YWx1ZTogb3BbMV0sIGRvbmU6IGZhbHNlIH07XHJcbiAgICAgICAgICAgICAgICBjYXNlIDU6IF8ubGFiZWwrKzsgeSA9IG9wWzFdOyBvcCA9IFswXTsgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICBjYXNlIDc6IG9wID0gXy5vcHMucG9wKCk7IF8udHJ5cy5wb3AoKTsgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgICAgIGlmICghKHQgPSBfLnRyeXMsIHQgPSB0Lmxlbmd0aCA+IDAgJiYgdFt0Lmxlbmd0aCAtIDFdKSAmJiAob3BbMF0gPT09IDYgfHwgb3BbMF0gPT09IDIpKSB7IF8gPSAwOyBjb250aW51ZTsgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChvcFswXSA9PT0gMyAmJiAoIXQgfHwgKG9wWzFdID4gdFswXSAmJiBvcFsxXSA8IHRbM10pKSkgeyBfLmxhYmVsID0gb3BbMV07IGJyZWFrOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wWzBdID09PSA2ICYmIF8ubGFiZWwgPCB0WzFdKSB7IF8ubGFiZWwgPSB0WzFdOyB0ID0gb3A7IGJyZWFrOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHQgJiYgXy5sYWJlbCA8IHRbMl0pIHsgXy5sYWJlbCA9IHRbMl07IF8ub3BzLnB1c2gob3ApOyBicmVhazsgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0WzJdKSBfLm9wcy5wb3AoKTtcclxuICAgICAgICAgICAgICAgICAgICBfLnRyeXMucG9wKCk7IGNvbnRpbnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIG9wID0gYm9keS5jYWxsKHRoaXNBcmcsIF8pO1xyXG4gICAgICAgIH0gY2F0Y2ggKGUpIHsgb3AgPSBbNiwgZV07IHkgPSAwOyB9IGZpbmFsbHkgeyBmID0gdCA9IDA7IH1cclxuICAgICAgICBpZiAob3BbMF0gJiA1KSB0aHJvdyBvcFsxXTsgcmV0dXJuIHsgdmFsdWU6IG9wWzBdID8gb3BbMV0gOiB2b2lkIDAsIGRvbmU6IHRydWUgfTtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IHZhciBfX2NyZWF0ZUJpbmRpbmcgPSBPYmplY3QuY3JlYXRlID8gKGZ1bmN0aW9uKG8sIG0sIGssIGsyKSB7XHJcbiAgICBpZiAoazIgPT09IHVuZGVmaW5lZCkgazIgPSBrO1xyXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG8sIGsyLCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZnVuY3Rpb24oKSB7IHJldHVybiBtW2tdOyB9IH0pO1xyXG59KSA6IChmdW5jdGlvbihvLCBtLCBrLCBrMikge1xyXG4gICAgaWYgKGsyID09PSB1bmRlZmluZWQpIGsyID0gaztcclxuICAgIG9bazJdID0gbVtrXTtcclxufSk7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19leHBvcnRTdGFyKG0sIG8pIHtcclxuICAgIGZvciAodmFyIHAgaW4gbSkgaWYgKHAgIT09IFwiZGVmYXVsdFwiICYmICFPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwobywgcCkpIF9fY3JlYXRlQmluZGluZyhvLCBtLCBwKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fdmFsdWVzKG8pIHtcclxuICAgIHZhciBzID0gdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIFN5bWJvbC5pdGVyYXRvciwgbSA9IHMgJiYgb1tzXSwgaSA9IDA7XHJcbiAgICBpZiAobSkgcmV0dXJuIG0uY2FsbChvKTtcclxuICAgIGlmIChvICYmIHR5cGVvZiBvLmxlbmd0aCA9PT0gXCJudW1iZXJcIikgcmV0dXJuIHtcclxuICAgICAgICBuZXh0OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGlmIChvICYmIGkgPj0gby5sZW5ndGgpIG8gPSB2b2lkIDA7XHJcbiAgICAgICAgICAgIHJldHVybiB7IHZhbHVlOiBvICYmIG9baSsrXSwgZG9uZTogIW8gfTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihzID8gXCJPYmplY3QgaXMgbm90IGl0ZXJhYmxlLlwiIDogXCJTeW1ib2wuaXRlcmF0b3IgaXMgbm90IGRlZmluZWQuXCIpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19yZWFkKG8sIG4pIHtcclxuICAgIHZhciBtID0gdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIG9bU3ltYm9sLml0ZXJhdG9yXTtcclxuICAgIGlmICghbSkgcmV0dXJuIG87XHJcbiAgICB2YXIgaSA9IG0uY2FsbChvKSwgciwgYXIgPSBbXSwgZTtcclxuICAgIHRyeSB7XHJcbiAgICAgICAgd2hpbGUgKChuID09PSB2b2lkIDAgfHwgbi0tID4gMCkgJiYgIShyID0gaS5uZXh0KCkpLmRvbmUpIGFyLnB1c2goci52YWx1ZSk7XHJcbiAgICB9XHJcbiAgICBjYXRjaCAoZXJyb3IpIHsgZSA9IHsgZXJyb3I6IGVycm9yIH07IH1cclxuICAgIGZpbmFsbHkge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGlmIChyICYmICFyLmRvbmUgJiYgKG0gPSBpW1wicmV0dXJuXCJdKSkgbS5jYWxsKGkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmaW5hbGx5IHsgaWYgKGUpIHRocm93IGUuZXJyb3I7IH1cclxuICAgIH1cclxuICAgIHJldHVybiBhcjtcclxufVxyXG5cclxuLyoqIEBkZXByZWNhdGVkICovXHJcbmV4cG9ydCBmdW5jdGlvbiBfX3NwcmVhZCgpIHtcclxuICAgIGZvciAodmFyIGFyID0gW10sIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKVxyXG4gICAgICAgIGFyID0gYXIuY29uY2F0KF9fcmVhZChhcmd1bWVudHNbaV0pKTtcclxuICAgIHJldHVybiBhcjtcclxufVxyXG5cclxuLyoqIEBkZXByZWNhdGVkICovXHJcbmV4cG9ydCBmdW5jdGlvbiBfX3NwcmVhZEFycmF5cygpIHtcclxuICAgIGZvciAodmFyIHMgPSAwLCBpID0gMCwgaWwgPSBhcmd1bWVudHMubGVuZ3RoOyBpIDwgaWw7IGkrKykgcyArPSBhcmd1bWVudHNbaV0ubGVuZ3RoO1xyXG4gICAgZm9yICh2YXIgciA9IEFycmF5KHMpLCBrID0gMCwgaSA9IDA7IGkgPCBpbDsgaSsrKVxyXG4gICAgICAgIGZvciAodmFyIGEgPSBhcmd1bWVudHNbaV0sIGogPSAwLCBqbCA9IGEubGVuZ3RoOyBqIDwgamw7IGorKywgaysrKVxyXG4gICAgICAgICAgICByW2tdID0gYVtqXTtcclxuICAgIHJldHVybiByO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19zcHJlYWRBcnJheSh0bywgZnJvbSwgcGFjaykge1xyXG4gICAgaWYgKHBhY2sgfHwgYXJndW1lbnRzLmxlbmd0aCA9PT0gMikgZm9yICh2YXIgaSA9IDAsIGwgPSBmcm9tLmxlbmd0aCwgYXI7IGkgPCBsOyBpKyspIHtcclxuICAgICAgICBpZiAoYXIgfHwgIShpIGluIGZyb20pKSB7XHJcbiAgICAgICAgICAgIGlmICghYXIpIGFyID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoZnJvbSwgMCwgaSk7XHJcbiAgICAgICAgICAgIGFyW2ldID0gZnJvbVtpXTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdG8uY29uY2F0KGFyIHx8IGZyb20pO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19hd2FpdCh2KSB7XHJcbiAgICByZXR1cm4gdGhpcyBpbnN0YW5jZW9mIF9fYXdhaXQgPyAodGhpcy52ID0gdiwgdGhpcykgOiBuZXcgX19hd2FpdCh2KTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fYXN5bmNHZW5lcmF0b3IodGhpc0FyZywgX2FyZ3VtZW50cywgZ2VuZXJhdG9yKSB7XHJcbiAgICBpZiAoIVN5bWJvbC5hc3luY0l0ZXJhdG9yKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiU3ltYm9sLmFzeW5jSXRlcmF0b3IgaXMgbm90IGRlZmluZWQuXCIpO1xyXG4gICAgdmFyIGcgPSBnZW5lcmF0b3IuYXBwbHkodGhpc0FyZywgX2FyZ3VtZW50cyB8fCBbXSksIGksIHEgPSBbXTtcclxuICAgIHJldHVybiBpID0ge30sIHZlcmIoXCJuZXh0XCIpLCB2ZXJiKFwidGhyb3dcIiksIHZlcmIoXCJyZXR1cm5cIiksIGlbU3ltYm9sLmFzeW5jSXRlcmF0b3JdID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpczsgfSwgaTtcclxuICAgIGZ1bmN0aW9uIHZlcmIobikgeyBpZiAoZ1tuXSkgaVtuXSA9IGZ1bmN0aW9uICh2KSB7IHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAoYSwgYikgeyBxLnB1c2goW24sIHYsIGEsIGJdKSA+IDEgfHwgcmVzdW1lKG4sIHYpOyB9KTsgfTsgfVxyXG4gICAgZnVuY3Rpb24gcmVzdW1lKG4sIHYpIHsgdHJ5IHsgc3RlcChnW25dKHYpKTsgfSBjYXRjaCAoZSkgeyBzZXR0bGUocVswXVszXSwgZSk7IH0gfVxyXG4gICAgZnVuY3Rpb24gc3RlcChyKSB7IHIudmFsdWUgaW5zdGFuY2VvZiBfX2F3YWl0ID8gUHJvbWlzZS5yZXNvbHZlKHIudmFsdWUudikudGhlbihmdWxmaWxsLCByZWplY3QpIDogc2V0dGxlKHFbMF1bMl0sIHIpOyB9XHJcbiAgICBmdW5jdGlvbiBmdWxmaWxsKHZhbHVlKSB7IHJlc3VtZShcIm5leHRcIiwgdmFsdWUpOyB9XHJcbiAgICBmdW5jdGlvbiByZWplY3QodmFsdWUpIHsgcmVzdW1lKFwidGhyb3dcIiwgdmFsdWUpOyB9XHJcbiAgICBmdW5jdGlvbiBzZXR0bGUoZiwgdikgeyBpZiAoZih2KSwgcS5zaGlmdCgpLCBxLmxlbmd0aCkgcmVzdW1lKHFbMF1bMF0sIHFbMF1bMV0pOyB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2FzeW5jRGVsZWdhdG9yKG8pIHtcclxuICAgIHZhciBpLCBwO1xyXG4gICAgcmV0dXJuIGkgPSB7fSwgdmVyYihcIm5leHRcIiksIHZlcmIoXCJ0aHJvd1wiLCBmdW5jdGlvbiAoZSkgeyB0aHJvdyBlOyB9KSwgdmVyYihcInJldHVyblwiKSwgaVtTeW1ib2wuaXRlcmF0b3JdID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpczsgfSwgaTtcclxuICAgIGZ1bmN0aW9uIHZlcmIobiwgZikgeyBpW25dID0gb1tuXSA/IGZ1bmN0aW9uICh2KSB7IHJldHVybiAocCA9ICFwKSA/IHsgdmFsdWU6IF9fYXdhaXQob1tuXSh2KSksIGRvbmU6IG4gPT09IFwicmV0dXJuXCIgfSA6IGYgPyBmKHYpIDogdjsgfSA6IGY7IH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fYXN5bmNWYWx1ZXMobykge1xyXG4gICAgaWYgKCFTeW1ib2wuYXN5bmNJdGVyYXRvcikgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlN5bWJvbC5hc3luY0l0ZXJhdG9yIGlzIG5vdCBkZWZpbmVkLlwiKTtcclxuICAgIHZhciBtID0gb1tTeW1ib2wuYXN5bmNJdGVyYXRvcl0sIGk7XHJcbiAgICByZXR1cm4gbSA/IG0uY2FsbChvKSA6IChvID0gdHlwZW9mIF9fdmFsdWVzID09PSBcImZ1bmN0aW9uXCIgPyBfX3ZhbHVlcyhvKSA6IG9bU3ltYm9sLml0ZXJhdG9yXSgpLCBpID0ge30sIHZlcmIoXCJuZXh0XCIpLCB2ZXJiKFwidGhyb3dcIiksIHZlcmIoXCJyZXR1cm5cIiksIGlbU3ltYm9sLmFzeW5jSXRlcmF0b3JdID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpczsgfSwgaSk7XHJcbiAgICBmdW5jdGlvbiB2ZXJiKG4pIHsgaVtuXSA9IG9bbl0gJiYgZnVuY3Rpb24gKHYpIHsgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHsgdiA9IG9bbl0odiksIHNldHRsZShyZXNvbHZlLCByZWplY3QsIHYuZG9uZSwgdi52YWx1ZSk7IH0pOyB9OyB9XHJcbiAgICBmdW5jdGlvbiBzZXR0bGUocmVzb2x2ZSwgcmVqZWN0LCBkLCB2KSB7IFByb21pc2UucmVzb2x2ZSh2KS50aGVuKGZ1bmN0aW9uKHYpIHsgcmVzb2x2ZSh7IHZhbHVlOiB2LCBkb25lOiBkIH0pOyB9LCByZWplY3QpOyB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX21ha2VUZW1wbGF0ZU9iamVjdChjb29rZWQsIHJhdykge1xyXG4gICAgaWYgKE9iamVjdC5kZWZpbmVQcm9wZXJ0eSkgeyBPYmplY3QuZGVmaW5lUHJvcGVydHkoY29va2VkLCBcInJhd1wiLCB7IHZhbHVlOiByYXcgfSk7IH0gZWxzZSB7IGNvb2tlZC5yYXcgPSByYXc7IH1cclxuICAgIHJldHVybiBjb29rZWQ7XHJcbn07XHJcblxyXG52YXIgX19zZXRNb2R1bGVEZWZhdWx0ID0gT2JqZWN0LmNyZWF0ZSA/IChmdW5jdGlvbihvLCB2KSB7XHJcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkobywgXCJkZWZhdWx0XCIsIHsgZW51bWVyYWJsZTogdHJ1ZSwgdmFsdWU6IHYgfSk7XHJcbn0pIDogZnVuY3Rpb24obywgdikge1xyXG4gICAgb1tcImRlZmF1bHRcIl0gPSB2O1xyXG59O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9faW1wb3J0U3Rhcihtb2QpIHtcclxuICAgIGlmIChtb2QgJiYgbW9kLl9fZXNNb2R1bGUpIHJldHVybiBtb2Q7XHJcbiAgICB2YXIgcmVzdWx0ID0ge307XHJcbiAgICBpZiAobW9kICE9IG51bGwpIGZvciAodmFyIGsgaW4gbW9kKSBpZiAoayAhPT0gXCJkZWZhdWx0XCIgJiYgT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG1vZCwgaykpIF9fY3JlYXRlQmluZGluZyhyZXN1bHQsIG1vZCwgayk7XHJcbiAgICBfX3NldE1vZHVsZURlZmF1bHQocmVzdWx0LCBtb2QpO1xyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9faW1wb3J0RGVmYXVsdChtb2QpIHtcclxuICAgIHJldHVybiAobW9kICYmIG1vZC5fX2VzTW9kdWxlKSA/IG1vZCA6IHsgZGVmYXVsdDogbW9kIH07XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2NsYXNzUHJpdmF0ZUZpZWxkR2V0KHJlY2VpdmVyLCBzdGF0ZSwga2luZCwgZikge1xyXG4gICAgaWYgKGtpbmQgPT09IFwiYVwiICYmICFmKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiUHJpdmF0ZSBhY2Nlc3NvciB3YXMgZGVmaW5lZCB3aXRob3V0IGEgZ2V0dGVyXCIpO1xyXG4gICAgaWYgKHR5cGVvZiBzdGF0ZSA9PT0gXCJmdW5jdGlvblwiID8gcmVjZWl2ZXIgIT09IHN0YXRlIHx8ICFmIDogIXN0YXRlLmhhcyhyZWNlaXZlcikpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgcmVhZCBwcml2YXRlIG1lbWJlciBmcm9tIGFuIG9iamVjdCB3aG9zZSBjbGFzcyBkaWQgbm90IGRlY2xhcmUgaXRcIik7XHJcbiAgICByZXR1cm4ga2luZCA9PT0gXCJtXCIgPyBmIDoga2luZCA9PT0gXCJhXCIgPyBmLmNhbGwocmVjZWl2ZXIpIDogZiA/IGYudmFsdWUgOiBzdGF0ZS5nZXQocmVjZWl2ZXIpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19jbGFzc1ByaXZhdGVGaWVsZFNldChyZWNlaXZlciwgc3RhdGUsIHZhbHVlLCBraW5kLCBmKSB7XHJcbiAgICBpZiAoa2luZCA9PT0gXCJtXCIpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJQcml2YXRlIG1ldGhvZCBpcyBub3Qgd3JpdGFibGVcIik7XHJcbiAgICBpZiAoa2luZCA9PT0gXCJhXCIgJiYgIWYpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJQcml2YXRlIGFjY2Vzc29yIHdhcyBkZWZpbmVkIHdpdGhvdXQgYSBzZXR0ZXJcIik7XHJcbiAgICBpZiAodHlwZW9mIHN0YXRlID09PSBcImZ1bmN0aW9uXCIgPyByZWNlaXZlciAhPT0gc3RhdGUgfHwgIWYgOiAhc3RhdGUuaGFzKHJlY2VpdmVyKSkgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCB3cml0ZSBwcml2YXRlIG1lbWJlciB0byBhbiBvYmplY3Qgd2hvc2UgY2xhc3MgZGlkIG5vdCBkZWNsYXJlIGl0XCIpO1xyXG4gICAgcmV0dXJuIChraW5kID09PSBcImFcIiA/IGYuY2FsbChyZWNlaXZlciwgdmFsdWUpIDogZiA/IGYudmFsdWUgPSB2YWx1ZSA6IHN0YXRlLnNldChyZWNlaXZlciwgdmFsdWUpKSwgdmFsdWU7XHJcbn1cclxuIiwiZXhwb3J0IGNsYXNzIFRlbXBsYXRlckVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICAgIGNvbnN0cnVjdG9yKG1zZzogc3RyaW5nLCBwdWJsaWMgY29uc29sZV9tc2c/OiBzdHJpbmcpIHtcbiAgICAgICAgc3VwZXIobXNnKTtcbiAgICAgICAgdGhpcy5uYW1lID0gdGhpcy5jb25zdHJ1Y3Rvci5uYW1lO1xuICAgICAgICBFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSh0aGlzLCB0aGlzLmNvbnN0cnVjdG9yKTtcbiAgICB9XG59IiwiaW1wb3J0IHsgVGVtcGxhdGVyRXJyb3IgfSBmcm9tIFwiRXJyb3JcIjtcbmltcG9ydCB7IEFwcCwgUGx1Z2luU2V0dGluZ1RhYiwgU2V0dGluZyB9IGZyb20gXCJvYnNpZGlhblwiO1xuXG5pbXBvcnQgVGVtcGxhdGVyUGx1Z2luIGZyb20gJy4vbWFpbic7XG5cbmV4cG9ydCBjb25zdCBERUZBVUxUX1NFVFRJTkdTOiBUZW1wbGF0ZXJTZXR0aW5ncyA9IHtcblx0Y29tbWFuZF90aW1lb3V0OiA1LFxuXHR0ZW1wbGF0ZV9mb2xkZXI6IFwiXCIsXG5cdHRlbXBsYXRlc19wYWlyczogW1tcIlwiLCBcIlwiXV0sXG5cdHRyaWdnZXJfb25fZmlsZV9jcmVhdGlvbjogZmFsc2UsXG5cdGVuYWJsZV9zeXN0ZW1fY29tbWFuZHM6IGZhbHNlLFxuXHRzaGVsbF9wYXRoOiBcIlwiLFxuXHRzY3JpcHRfZm9sZGVyOiB1bmRlZmluZWQsXG5cdGVtcHR5X2ZpbGVfdGVtcGxhdGU6IHVuZGVmaW5lZCxcblx0c3ludGF4X2hpZ2hsaWdodGluZzogdHJ1ZSxcbn07XG5cbmV4cG9ydCBpbnRlcmZhY2UgVGVtcGxhdGVyU2V0dGluZ3Mge1xuXHRjb21tYW5kX3RpbWVvdXQ6IG51bWJlcjtcblx0dGVtcGxhdGVfZm9sZGVyOiBzdHJpbmc7XG5cdHRlbXBsYXRlc19wYWlyczogQXJyYXk8W3N0cmluZywgc3RyaW5nXT47XG5cdHRyaWdnZXJfb25fZmlsZV9jcmVhdGlvbjogYm9vbGVhbjtcblx0ZW5hYmxlX3N5c3RlbV9jb21tYW5kczogYm9vbGVhbjtcblx0c2hlbGxfcGF0aDogc3RyaW5nLFxuXHRzY3JpcHRfZm9sZGVyOiBzdHJpbmcsXG5cdGVtcHR5X2ZpbGVfdGVtcGxhdGU6IHN0cmluZyxcblx0c3ludGF4X2hpZ2hsaWdodGluZzogYm9vbGVhbixcbn07XG5cbmV4cG9ydCBjbGFzcyBUZW1wbGF0ZXJTZXR0aW5nVGFiIGV4dGVuZHMgUGx1Z2luU2V0dGluZ1RhYiB7XG5cdGNvbnN0cnVjdG9yKHB1YmxpYyBhcHA6IEFwcCwgcHJpdmF0ZSBwbHVnaW46IFRlbXBsYXRlclBsdWdpbikge1xuXHRcdHN1cGVyKGFwcCwgcGx1Z2luKTtcblx0fVxuXG5cdGRpc3BsYXkoKTogdm9pZCB7XG5cdFx0Y29uc3Qge2NvbnRhaW5lckVsfSA9IHRoaXM7XG5cdFx0bGV0IGRlc2M6IERvY3VtZW50RnJhZ21lbnQ7XG5cdFx0Y29udGFpbmVyRWwuZW1wdHkoKTtcblxuXHRcdG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuXHRcdFx0LnNldE5hbWUoXCJUZW1wbGF0ZSBmb2xkZXIgbG9jYXRpb25cIilcblx0XHRcdC5zZXREZXNjKFwiRmlsZXMgaW4gdGhpcyBmb2xkZXIgd2lsbCBiZSBhdmFpbGFibGUgYXMgdGVtcGxhdGVzLlwiKVxuXHRcdFx0LmFkZFRleHQodGV4dCA9PiB7XG5cdFx0XHRcdHRleHQuc2V0UGxhY2Vob2xkZXIoXCJFeGFtcGxlOiBmb2xkZXIgMS9mb2xkZXIgMlwiKVxuXHRcdFx0XHRcdC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy50ZW1wbGF0ZV9mb2xkZXIpXG5cdFx0XHRcdFx0Lm9uQ2hhbmdlKChuZXdfZm9sZGVyKSA9PiB7XG5cdFx0XHRcdFx0XHR0aGlzLnBsdWdpbi5zZXR0aW5ncy50ZW1wbGF0ZV9mb2xkZXIgPSBuZXdfZm9sZGVyO1xuXHRcdFx0XHRcdFx0dGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG5cdFx0XHRcdFx0fSlcblx0XHRcdH0pO1xuXG5cdFx0bmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG5cdFx0XHQuc2V0TmFtZShcIlRpbWVvdXRcIilcblx0XHRcdC5zZXREZXNjKFwiTWF4aW11bSB0aW1lb3V0IGluIHNlY29uZHMgZm9yIGEgc3lzdGVtIGNvbW1hbmQuXCIpXG5cdFx0XHQuYWRkVGV4dCh0ZXh0ID0+IHtcblx0XHRcdFx0dGV4dC5zZXRQbGFjZWhvbGRlcihcIlRpbWVvdXRcIilcblx0XHRcdFx0XHQuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuY29tbWFuZF90aW1lb3V0LnRvU3RyaW5nKCkpXG5cdFx0XHRcdFx0Lm9uQ2hhbmdlKChuZXdfdmFsdWUpID0+IHtcblx0XHRcdFx0XHRcdGNvbnN0IG5ld190aW1lb3V0ID0gTnVtYmVyKG5ld192YWx1ZSk7XG5cdFx0XHRcdFx0XHRpZiAoaXNOYU4obmV3X3RpbWVvdXQpKSB7XG5cdFx0XHRcdFx0XHRcdHRoaXMucGx1Z2luLmxvZ19lcnJvcihuZXcgVGVtcGxhdGVyRXJyb3IoXCJUaW1lb3V0IG11c3QgYmUgYSBudW1iZXJcIikpO1xuXHRcdFx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR0aGlzLnBsdWdpbi5zZXR0aW5ncy5jb21tYW5kX3RpbWVvdXQgPSBuZXdfdGltZW91dDtcblx0XHRcdFx0XHRcdHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuXHRcdFx0XHRcdH0pXG5cdFx0XHR9KTtcblxuXHRcdGRlc2MgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG5cdFx0ZGVzYy5hcHBlbmQoXG5cdFx0XHRcIlRlbXBsYXRlciBwcm92aWRlcyBtdWx0aXBsZXMgcHJlZGVmaW5lZCB2YXJpYWJsZXMgLyBmdW5jdGlvbnMgdGhhdCB5b3UgY2FuIHVzZS5cIixcblx0XHRcdGRlc2MuY3JlYXRlRWwoXCJiclwiKSxcblx0XHRcdFwiQ2hlY2sgdGhlIFwiLFxuXHRcdFx0ZGVzYy5jcmVhdGVFbChcImFcIiwge1xuXHRcdFx0XHRocmVmOiBcImh0dHBzOi8vc2lsZW50dm9pZDEzLmdpdGh1Yi5pby9UZW1wbGF0ZXIvXCIsXG5cdFx0XHRcdHRleHQ6IFwiZG9jdW1lbnRhdGlvblwiXG5cdFx0XHR9KSxcblx0XHRcdFwiIHRvIGdldCBhIGxpc3Qgb2YgYWxsIHRoZSBhdmFpbGFibGUgaW50ZXJuYWwgdmFyaWFibGVzIC8gZnVuY3Rpb25zLlwiLFxuXHRcdCk7XG5cblx0XHRuZXcgU2V0dGluZyhjb250YWluZXJFbClcblx0XHRcdC5zZXROYW1lKFwiSW50ZXJuYWwgVmFyaWFibGVzIGFuZCBGdW5jdGlvbnNcIilcblx0XHRcdC5zZXREZXNjKGRlc2MpO1xuXG5cdFx0ZGVzYyA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcblx0XHRkZXNjLmFwcGVuZChcblx0XHRcdFwiQWRkcyBzeW50YXggaGlnaGxpZ2h0aW5nIGZvciBUZW1wbGF0ZXIgY29tbWFuZHMgaW4gZWRpdCBtb2RlLlwiLFxuXHRcdCk7XHRcblxuXHRcdG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuXHRcdFx0LnNldE5hbWUoXCJTeW50YXggSGlnaGxpZ2h0aW5nXCIpXG5cdFx0XHQuc2V0RGVzYyhkZXNjKVxuXHRcdFx0LmFkZFRvZ2dsZSh0b2dnbGUgPT4ge1xuXHRcdFx0XHR0b2dnbGVcblx0XHRcdFx0XHQuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3Muc3ludGF4X2hpZ2hsaWdodGluZylcblx0XHRcdFx0XHQub25DaGFuZ2Uoc3ludGF4X2hpZ2hsaWdodGluZyA9PiB7XG5cdFx0XHRcdFx0XHR0aGlzLnBsdWdpbi5zZXR0aW5ncy5zeW50YXhfaGlnaGxpZ2h0aW5nID0gc3ludGF4X2hpZ2hsaWdodGluZztcblx0XHRcdFx0XHRcdHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuXHRcdFx0XHRcdFx0dGhpcy5wbHVnaW4udXBkYXRlX3N5bnRheF9oaWdobGlnaHRpbmcoKTtcblx0XHRcdFx0XHR9KVxuXHRcdFx0fSk7XG5cblx0XHRkZXNjID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xuXHRcdGRlc2MuYXBwZW5kKFxuXHRcdFx0XCJUZW1wbGF0ZXIgd2lsbCBsaXN0ZW4gZm9yIHRoZSBuZXcgZmlsZSBjcmVhdGlvbiBldmVudCwgYW5kIHJlcGxhY2UgZXZlcnkgY29tbWFuZCBpdCBmaW5kcyBpbiB0aGUgbmV3IGZpbGUncyBjb250ZW50LlwiLFxuXHRcdFx0ZGVzYy5jcmVhdGVFbChcImJyXCIpLFxuXHRcdFx0XCJUaGlzIG1ha2VzIFRlbXBsYXRlciBjb21wYXRpYmxlIHdpdGggb3RoZXIgcGx1Z2lucyBsaWtlIHRoZSBEYWlseSBub3RlIGNvcmUgcGx1Z2luLCBDYWxlbmRhciBwbHVnaW4sIFJldmlldyBwbHVnaW4sIE5vdGUgcmVmYWN0b3IgcGx1Z2luLCAuLi5cIixcblx0XHRcdGRlc2MuY3JlYXRlRWwoXCJiclwiKSxcblx0XHRcdGRlc2MuY3JlYXRlRWwoXCJiXCIsIHtcblx0XHRcdFx0dGV4dDogXCJXYXJuaW5nOiBcIixcblx0XHRcdH0pLFxuXHRcdFx0XCJUaGlzIGNhbiBiZSBkYW5nZXJvdXMgaWYgeW91IGNyZWF0ZSBuZXcgZmlsZXMgd2l0aCB1bmtub3duIC8gdW5zYWZlIGNvbnRlbnQgb24gY3JlYXRpb24uIE1ha2Ugc3VyZSB0aGF0IGV2ZXJ5IG5ldyBmaWxlJ3MgY29udGVudCBpcyBzYWZlIG9uIGNyZWF0aW9uLlwiXG5cdFx0KTtcdFxuXG5cdFx0bmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG5cdFx0XHQuc2V0TmFtZShcIlRyaWdnZXIgVGVtcGxhdGVyIG9uIG5ldyBmaWxlIGNyZWF0aW9uXCIpXG5cdFx0XHQuc2V0RGVzYyhkZXNjKVxuXHRcdFx0LmFkZFRvZ2dsZSh0b2dnbGUgPT4ge1xuXHRcdFx0XHR0b2dnbGVcblx0XHRcdFx0XHQuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MudHJpZ2dlcl9vbl9maWxlX2NyZWF0aW9uKVxuXHRcdFx0XHRcdC5vbkNoYW5nZSh0cmlnZ2VyX29uX2ZpbGVfY3JlYXRpb24gPT4ge1xuXHRcdFx0XHRcdFx0dGhpcy5wbHVnaW4uc2V0dGluZ3MudHJpZ2dlcl9vbl9maWxlX2NyZWF0aW9uID0gdHJpZ2dlcl9vbl9maWxlX2NyZWF0aW9uO1xuXHRcdFx0XHRcdFx0dGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG5cdFx0XHRcdFx0XHR0aGlzLnBsdWdpbi51cGRhdGVfdHJpZ2dlcl9maWxlX29uX2NyZWF0aW9uKCk7XG5cdFx0XHRcdFx0XHQvLyBGb3JjZSByZWZyZXNoXG5cdFx0XHRcdFx0XHR0aGlzLmRpc3BsYXkoKTtcblx0XHRcdFx0XHR9KTtcblx0XHRcdH0pO1xuXG5cdFx0aWYgKHRoaXMucGx1Z2luLnNldHRpbmdzLnRyaWdnZXJfb25fZmlsZV9jcmVhdGlvbikge1xuXHRcdFx0ZGVzYyA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcblx0XHRcdGRlc2MuYXBwZW5kKFxuXHRcdFx0XHRcIlRlbXBsYXRlciB3aWxsIGF1dG9tYXRpY2FsbHkgYXBwbHkgdGhpcyB0ZW1wbGF0ZSB0byBuZXcgZW1wdHkgZmlsZXMgd2hlbiB0aGV5IGFyZSBjcmVhdGVkLlwiLFxuXHRcdFx0XHRkZXNjLmNyZWF0ZUVsKFwiYnJcIiksXG5cdFx0XHRcdFwiVGhlIC5tZCBleHRlbnNpb24gZm9yIHRoZSBmaWxlIHNob3VsZG4ndCBiZSBzcGVjaWZpZWQuXCJcblx0XHRcdCk7XG5cdFx0XHRcblx0XHRcdG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuXHRcdFx0XHQuc2V0TmFtZShcIkVtcHR5IGZpbGUgdGVtcGxhdGVcIilcblx0XHRcdFx0LnNldERlc2MoZGVzYylcblx0XHRcdFx0LmFkZFRleHQodGV4dCA9PiB7XG5cdFx0XHRcdFx0dGV4dC5zZXRQbGFjZWhvbGRlcihcImZvbGRlciAxL3RlbXBsYXRlX2ZpbGVcIilcblx0XHRcdFx0XHRcdC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5lbXB0eV9maWxlX3RlbXBsYXRlKVxuXHRcdFx0XHRcdFx0Lm9uQ2hhbmdlKChlbXB0eV9maWxlX3RlbXBsYXRlKSA9PiB7XG5cdFx0XHRcdFx0XHRcdHRoaXMucGx1Z2luLnNldHRpbmdzLmVtcHR5X2ZpbGVfdGVtcGxhdGUgPSBlbXB0eV9maWxlX3RlbXBsYXRlO1xuXHRcdFx0XHRcdFx0XHR0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcblx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9KTtcblx0XHR9XG5cblx0XHRkZXNjID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xuXHRcdGRlc2MuYXBwZW5kKFxuXHRcdFx0XCJBbGwgSmF2YVNjcmlwdCBmaWxlcyBpbiB0aGlzIGZvbGRlciB3aWxsIGJlIGxvYWRlZCBhcyBDb21tb25KUyBtb2R1bGVzLCB0byBpbXBvcnQgY3VzdG9tIHVzZXIgZnVuY3Rpb25zLlwiLCBcblx0XHRcdGRlc2MuY3JlYXRlRWwoXCJiclwiKSxcblx0XHRcdFwiVGhlIGZvbGRlciBuZWVkcyB0byBiZSBhY2Nlc3NpYmxlIGZyb20gdGhlIHZhdWx0LlwiLFxuXHRcdFx0ZGVzYy5jcmVhdGVFbChcImJyXCIpLFxuXHRcdFx0XCJDaGVjayB0aGUgXCIsXG5cdFx0XHRkZXNjLmNyZWF0ZUVsKFwiYVwiLCB7XG5cdFx0XHRcdGhyZWY6IFwiaHR0cHM6Ly9zaWxlbnR2b2lkMTMuZ2l0aHViLmlvL1RlbXBsYXRlci9cIixcblx0XHRcdFx0dGV4dDogXCJkb2N1bWVudGF0aW9uXCIsXG5cdFx0XHR9KSxcblx0XHRcdFwiIGZvciBtb3JlIGluZm9ybWF0aW9ucy5cIixcblx0XHQpO1xuXG5cdFx0bmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG5cdFx0XHQuc2V0TmFtZShcIlNjcmlwdCBmaWxlcyBmb2xkZXIgbG9jYXRpb25cIilcblx0XHRcdC5zZXREZXNjKGRlc2MpXG5cdFx0XHQuYWRkVGV4dCh0ZXh0ID0+IHtcblx0XHRcdFx0dGV4dC5zZXRQbGFjZWhvbGRlcihcIkV4YW1wbGU6IGZvbGRlciAxL2ZvbGRlciAyXCIpXG5cdFx0XHRcdFx0LnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLnNjcmlwdF9mb2xkZXIpXG5cdFx0XHRcdFx0Lm9uQ2hhbmdlKChuZXdfZm9sZGVyKSA9PiB7XG5cdFx0XHRcdFx0XHR0aGlzLnBsdWdpbi5zZXR0aW5ncy5zY3JpcHRfZm9sZGVyID0gbmV3X2ZvbGRlcjtcblx0XHRcdFx0XHRcdHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuXHRcdFx0XHRcdH0pXG5cdFx0XHR9KTtcblxuXHRcdGRlc2MgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG5cdFx0ZGVzYy5hcHBlbmQoXG5cdFx0XHRcIkFsbG93cyB5b3UgdG8gY3JlYXRlIHVzZXIgZnVuY3Rpb25zIGxpbmtlZCB0byBzeXN0ZW0gY29tbWFuZHMuXCIsXG5cdFx0XHRkZXNjLmNyZWF0ZUVsKFwiYnJcIiksXG5cdFx0XHRkZXNjLmNyZWF0ZUVsKFwiYlwiLCB7XG5cdFx0XHRcdHRleHQ6IFwiV2FybmluZzogXCJcblx0XHRcdH0pLFxuXHRcdFx0XCJJdCBjYW4gYmUgZGFuZ2Vyb3VzIHRvIGV4ZWN1dGUgYXJiaXRyYXJ5IHN5c3RlbSBjb21tYW5kcyBmcm9tIHVudHJ1c3RlZCBzb3VyY2VzLiBPbmx5IHJ1biBzeXN0ZW0gY29tbWFuZHMgdGhhdCB5b3UgdW5kZXJzdGFuZCwgZnJvbSB0cnVzdGVkIHNvdXJjZXMuXCIsXG5cdFx0KTtcblxuXHRcdG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuXHRcdFx0LnNldE5hbWUoXCJFbmFibGUgU3lzdGVtIENvbW1hbmRzXCIpXG5cdFx0XHQuc2V0RGVzYyhkZXNjKVxuXHRcdFx0LmFkZFRvZ2dsZSh0b2dnbGUgPT4ge1xuXHRcdFx0XHR0b2dnbGVcblx0XHRcdFx0XHQuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuZW5hYmxlX3N5c3RlbV9jb21tYW5kcylcblx0XHRcdFx0XHQub25DaGFuZ2UoZW5hYmxlX3N5c3RlbV9jb21tYW5kcyA9PiB7XG5cdFx0XHRcdFx0XHR0aGlzLnBsdWdpbi5zZXR0aW5ncy5lbmFibGVfc3lzdGVtX2NvbW1hbmRzID0gZW5hYmxlX3N5c3RlbV9jb21tYW5kcztcblx0XHRcdFx0XHRcdHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuXHRcdFx0XHRcdFx0Ly8gRm9yY2UgcmVmcmVzaFxuXHRcdFx0XHRcdFx0dGhpcy5kaXNwbGF5KCk7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHR9KTtcblxuXHRcdGlmICh0aGlzLnBsdWdpbi5zZXR0aW5ncy5lbmFibGVfc3lzdGVtX2NvbW1hbmRzKSB7XG5cdFx0XHRkZXNjID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xuXHRcdFx0ZGVzYy5hcHBlbmQoXG5cdFx0XHRcdFwiRnVsbCBwYXRoIHRvIHRoZSBzaGVsbCBiaW5hcnkgdG8gZXhlY3V0ZSB0aGUgY29tbWFuZCB3aXRoLlwiLFxuXHRcdFx0XHRkZXNjLmNyZWF0ZUVsKFwiYnJcIiksXG5cdFx0XHRcdFwiVGhpcyBzZXR0aW5nIGlzIG9wdGlvbmFsIGFuZCB3aWxsIGRlZmF1bHQgdG8gdGhlIHN5c3RlbSdzIGRlZmF1bHQgc2hlbGwgaWYgbm90IHNwZWNpZmllZC5cIixcblx0XHRcdFx0ZGVzYy5jcmVhdGVFbChcImJyXCIpLFxuXHRcdFx0XHRcIllvdSBjYW4gdXNlIGZvcndhcmQgc2xhc2hlcyAoJy8nKSBhcyBwYXRoIHNlcGFyYXRvcnMgb24gYWxsIHBsYXRmb3JtcyBpZiBpbiBkb3VidC5cIlxuXHRcdFx0KTtcblx0XHRcdG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuXHRcdFx0XHQuc2V0TmFtZShcIlNoZWxsIGJpbmFyeSBsb2NhdGlvblwiKVxuXHRcdFx0XHQuc2V0RGVzYyhkZXNjKVxuXHRcdFx0XHQuYWRkVGV4dCh0ZXh0ID0+IHtcblx0XHRcdFx0XHR0ZXh0LnNldFBsYWNlaG9sZGVyKFwiRXhhbXBsZTogL2Jpbi9iYXNoLCAuLi5cIilcblx0XHRcdFx0XHRcdC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5zaGVsbF9wYXRoKVxuXHRcdFx0XHRcdFx0Lm9uQ2hhbmdlKChzaGVsbF9wYXRoKSA9PiB7XG5cdFx0XHRcdFx0XHRcdHRoaXMucGx1Z2luLnNldHRpbmdzLnNoZWxsX3BhdGggPSBzaGVsbF9wYXRoO1xuXHRcdFx0XHRcdFx0XHR0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcblx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRsZXQgaSA9IDE7XG5cdFx0XHR0aGlzLnBsdWdpbi5zZXR0aW5ncy50ZW1wbGF0ZXNfcGFpcnMuZm9yRWFjaCgodGVtcGxhdGVfcGFpcikgPT4ge1xuXHRcdFx0XHRjb25zdCBkaXYgPSBjb250YWluZXJFbC5jcmVhdGVFbCgnZGl2Jyk7XG5cdFx0XHRcdGRpdi5hZGRDbGFzcyhcInRlbXBsYXRlcl9kaXZcIik7XG5cblx0XHRcdFx0Y29uc3QgdGl0bGUgPSBjb250YWluZXJFbC5jcmVhdGVFbCgnaDQnLCB7XG5cdFx0XHRcdFx0dGV4dDogJ1VzZXIgRnVuY3Rpb24gbsKwJyArIGksXG5cdFx0XHRcdH0pO1xuXHRcdFx0XHR0aXRsZS5hZGRDbGFzcyhcInRlbXBsYXRlcl90aXRsZVwiKTtcblxuXHRcdFx0XHRjb25zdCBzZXR0aW5nID0gbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG5cdFx0XHRcdFx0LmFkZEV4dHJhQnV0dG9uKGV4dHJhID0+IHtcblx0XHRcdFx0XHRcdGV4dHJhLnNldEljb24oXCJjcm9zc1wiKVxuXHRcdFx0XHRcdFx0XHQuc2V0VG9vbHRpcChcIkRlbGV0ZVwiKVxuXHRcdFx0XHRcdFx0XHQub25DbGljaygoKSA9PiB7XG5cdFx0XHRcdFx0XHRcdFx0Y29uc3QgaW5kZXggPSB0aGlzLnBsdWdpbi5zZXR0aW5ncy50ZW1wbGF0ZXNfcGFpcnMuaW5kZXhPZih0ZW1wbGF0ZV9wYWlyKTtcblx0XHRcdFx0XHRcdFx0XHRpZiAoaW5kZXggPiAtMSkge1xuXHRcdFx0XHRcdFx0XHRcdFx0dGhpcy5wbHVnaW4uc2V0dGluZ3MudGVtcGxhdGVzX3BhaXJzLnNwbGljZShpbmRleCwgMSk7XG5cdFx0XHRcdFx0XHRcdFx0XHQvLyBGb3JjZSByZWZyZXNoXG5cdFx0XHRcdFx0XHRcdFx0XHR0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcblx0XHRcdFx0XHRcdFx0XHRcdHRoaXMuZGlzcGxheSgpO1xuXHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdC5hZGRUZXh0KHRleHQgPT4ge1xuXHRcdFx0XHRcdFx0XHRjb25zdCB0ID0gdGV4dC5zZXRQbGFjZWhvbGRlcignRnVuY3Rpb24gbmFtZScpXG5cdFx0XHRcdFx0XHRcdC5zZXRWYWx1ZSh0ZW1wbGF0ZV9wYWlyWzBdKVxuXHRcdFx0XHRcdFx0XHQub25DaGFuZ2UoKG5ld192YWx1ZSkgPT4ge1xuXHRcdFx0XHRcdFx0XHRcdGNvbnN0IGluZGV4ID0gdGhpcy5wbHVnaW4uc2V0dGluZ3MudGVtcGxhdGVzX3BhaXJzLmluZGV4T2YodGVtcGxhdGVfcGFpcik7XG5cdFx0XHRcdFx0XHRcdFx0aWYgKGluZGV4ID4gLTEpIHtcblx0XHRcdFx0XHRcdFx0XHRcdHRoaXMucGx1Z2luLnNldHRpbmdzLnRlbXBsYXRlc19wYWlyc1tpbmRleF1bMF0gPSBuZXdfdmFsdWU7XG5cdFx0XHRcdFx0XHRcdFx0XHR0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcblx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0XHR0LmlucHV0RWwuYWRkQ2xhc3MoXCJ0ZW1wbGF0ZXJfdGVtcGxhdGVcIik7XG5cblx0XHRcdFx0XHRcdFx0cmV0dXJuIHQ7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0KVxuXHRcdFx0XHRcdC5hZGRUZXh0QXJlYSh0ZXh0ID0+IHtcblx0XHRcdFx0XHRcdGNvbnN0IHQgPSB0ZXh0LnNldFBsYWNlaG9sZGVyKCdTeXN0ZW0gQ29tbWFuZCcpXG5cdFx0XHRcdFx0XHQuc2V0VmFsdWUodGVtcGxhdGVfcGFpclsxXSlcblx0XHRcdFx0XHRcdC5vbkNoYW5nZSgobmV3X2NtZCkgPT4ge1xuXHRcdFx0XHRcdFx0XHRjb25zdCBpbmRleCA9IHRoaXMucGx1Z2luLnNldHRpbmdzLnRlbXBsYXRlc19wYWlycy5pbmRleE9mKHRlbXBsYXRlX3BhaXIpO1xuXHRcdFx0XHRcdFx0XHRpZiAoaW5kZXggPiAtMSkge1xuXHRcdFx0XHRcdFx0XHRcdHRoaXMucGx1Z2luLnNldHRpbmdzLnRlbXBsYXRlc19wYWlyc1tpbmRleF1bMV0gPSBuZXdfY21kO1xuXHRcdFx0XHRcdFx0XHRcdHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9KTtcblxuXHRcdFx0XHRcdFx0dC5pbnB1dEVsLnNldEF0dHIoXCJyb3dzXCIsIDQpO1xuXHRcdFx0XHRcdFx0dC5pbnB1dEVsLmFkZENsYXNzKFwidGVtcGxhdGVyX2NtZFwiKTtcblxuXHRcdFx0XHRcdFx0cmV0dXJuIHQ7XG5cdFx0XHRcdFx0fSk7XG5cblx0XHRcdFx0c2V0dGluZy5pbmZvRWwucmVtb3ZlKCk7XG5cblx0XHRcdFx0ZGl2LmFwcGVuZENoaWxkKHRpdGxlKTtcblx0XHRcdFx0ZGl2LmFwcGVuZENoaWxkKGNvbnRhaW5lckVsLmxhc3RDaGlsZCk7XG5cblx0XHRcdFx0aSs9MTtcblx0XHRcdH0pO1xuXG5cdFx0XHRjb25zdCBkaXYgPSBjb250YWluZXJFbC5jcmVhdGVFbCgnZGl2Jyk7XG5cdFx0XHRkaXYuYWRkQ2xhc3MoXCJ0ZW1wbGF0ZXJfZGl2MlwiKTtcblxuXHRcdFx0Y29uc3Qgc2V0dGluZyA9IG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuXHRcdFx0XHQuYWRkQnV0dG9uKGJ1dHRvbiA9PiB7XG5cdFx0XHRcdFx0Y29uc3QgYiA9IGJ1dHRvbi5zZXRCdXR0b25UZXh0KFwiQWRkIE5ldyBVc2VyIEZ1bmN0aW9uXCIpLm9uQ2xpY2soKCkgPT4ge1xuXHRcdFx0XHRcdFx0dGhpcy5wbHVnaW4uc2V0dGluZ3MudGVtcGxhdGVzX3BhaXJzLnB1c2goW1wiXCIsIFwiXCJdKTtcblx0XHRcdFx0XHRcdC8vIEZvcmNlIHJlZnJlc2hcblx0XHRcdFx0XHRcdHRoaXMuZGlzcGxheSgpO1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdGIuYnV0dG9uRWwuYWRkQ2xhc3MoXCJ0ZW1wbGF0ZXJfYnV0dG9uXCIpO1xuXG5cdFx0XHRcdFx0cmV0dXJuIGI7XG5cdFx0XHRcdH0pO1xuXHRcdFx0c2V0dGluZy5pbmZvRWwucmVtb3ZlKCk7XG5cblx0XHRcdGRpdi5hcHBlbmRDaGlsZChjb250YWluZXJFbC5sYXN0Q2hpbGQpO1xuXHRcdH1cdFxuXHR9XG59IiwiaW1wb3J0IHsgVGVtcGxhdGVyRXJyb3IgfSBmcm9tIFwiRXJyb3JcIjtcbmltcG9ydCB7IEFwcCwgbm9ybWFsaXplUGF0aCwgVEFic3RyYWN0RmlsZSwgVEZpbGUsIFRGb2xkZXIsIFZhdWx0IH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5cbmV4cG9ydCBjb25zdCBvYnNpZGlhbl9tb2R1bGUgPSByZXF1aXJlKFwib2JzaWRpYW5cIik7XG5cbmV4cG9ydCBmdW5jdGlvbiBkZWxheShtczogbnVtYmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKCByZXNvbHZlID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgbXMpICk7XG59O1xuXG5leHBvcnQgZnVuY3Rpb24gZXNjYXBlUmVnRXhwKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgICByZXR1cm4gc3RyLnJlcGxhY2UoL1suKis/XiR7fSgpfFtcXF1cXFxcXS9nLCAnXFxcXCQmJyk7IC8vICQmIG1lYW5zIHRoZSB3aG9sZSBtYXRjaGVkIHN0cmluZ1xufSBcblxuZXhwb3J0IGZ1bmN0aW9uIHJlc29sdmVURmlsZShhcHA6IEFwcCwgZmlsZV9zdHI6IHN0cmluZyk6IFRGaWxlIHtcbiAgICBmaWxlX3N0ciA9IG5vcm1hbGl6ZVBhdGgoZmlsZV9zdHIpO1xuXG4gICAgY29uc3QgZmlsZSA9IGFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgoZmlsZV9zdHIpO1xuICAgIGlmICghZmlsZSkge1xuICAgICAgICB0aHJvdyBuZXcgVGVtcGxhdGVyRXJyb3IoYEZpbGUgXCIke2ZpbGVfc3RyfVwiIGRvZXNuJ3QgZXhpc3RgKTtcbiAgICB9XG4gICAgaWYgKCEoZmlsZSBpbnN0YW5jZW9mIFRGaWxlKSkge1xuICAgICAgICB0aHJvdyBuZXcgVGVtcGxhdGVyRXJyb3IoYCR7ZmlsZV9zdHJ9IGlzIGEgZm9sZGVyLCBub3QgYSBmaWxlYCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZpbGU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRURmlsZXNGcm9tRm9sZGVyKGFwcDogQXBwLCBmb2xkZXJfc3RyOiBzdHJpbmcpOiBBcnJheTxURmlsZT4ge1xuICAgIGZvbGRlcl9zdHIgPSBub3JtYWxpemVQYXRoKGZvbGRlcl9zdHIpO1xuXG4gICAgY29uc3QgZm9sZGVyID0gYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChmb2xkZXJfc3RyKTtcbiAgICBpZiAoIWZvbGRlcikge1xuICAgICAgICB0aHJvdyBuZXcgVGVtcGxhdGVyRXJyb3IoYEZvbGRlciBcIiR7Zm9sZGVyX3N0cn1cIiBkb2Vzbid0IGV4aXN0YCk7XG4gICAgfVxuICAgIGlmICghKGZvbGRlciBpbnN0YW5jZW9mIFRGb2xkZXIpKSB7XG4gICAgICAgIHRocm93IG5ldyBUZW1wbGF0ZXJFcnJvcihgJHtmb2xkZXJfc3RyfSBpcyBhIGZpbGUsIG5vdCBhIGZvbGRlcmApO1xuICAgIH1cblxuICAgIGxldCBmaWxlczogQXJyYXk8VEZpbGU+ID0gW107XG4gICAgVmF1bHQucmVjdXJzZUNoaWxkcmVuKGZvbGRlciwgKGZpbGU6IFRBYnN0cmFjdEZpbGUpID0+IHtcbiAgICAgICAgaWYgKGZpbGUgaW5zdGFuY2VvZiBURmlsZSkge1xuICAgICAgICAgICAgZmlsZXMucHVzaChmaWxlKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgZmlsZXMuc29ydCgoYSwgYikgPT4ge1xuICAgICAgICByZXR1cm4gYS5iYXNlbmFtZS5sb2NhbGVDb21wYXJlKGIuYmFzZW5hbWUpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGZpbGVzO1xufSIsImltcG9ydCB7IEFwcCwgRnV6enlTdWdnZXN0TW9kYWwsIFRGaWxlLCBURm9sZGVyLCBub3JtYWxpemVQYXRoLCBWYXVsdCwgVEFic3RyYWN0RmlsZSB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgZ2V0VEZpbGVzRnJvbUZvbGRlciB9IGZyb20gXCJVdGlsc1wiO1xuaW1wb3J0IFRlbXBsYXRlclBsdWdpbiBmcm9tICcuL21haW4nO1xuXG5leHBvcnQgZW51bSBPcGVuTW9kZSB7XG4gICAgSW5zZXJ0VGVtcGxhdGUsXG4gICAgQ3JlYXRlTm90ZVRlbXBsYXRlLFxufTtcblxuZXhwb3J0IGNsYXNzIFRlbXBsYXRlckZ1enp5U3VnZ2VzdE1vZGFsIGV4dGVuZHMgRnV6enlTdWdnZXN0TW9kYWw8VEZpbGU+IHtcbiAgICBwdWJsaWMgYXBwOiBBcHA7XG4gICAgcHJpdmF0ZSBwbHVnaW46IFRlbXBsYXRlclBsdWdpbjtcbiAgICBwcml2YXRlIG9wZW5fbW9kZTogT3Blbk1vZGU7XG4gICAgcHJpdmF0ZSBjcmVhdGlvbl9mb2xkZXI6IFRGb2xkZXI7XG5cbiAgICBjb25zdHJ1Y3RvcihhcHA6IEFwcCwgcGx1Z2luOiBUZW1wbGF0ZXJQbHVnaW4pIHtcbiAgICAgICAgc3VwZXIoYXBwKTtcbiAgICAgICAgdGhpcy5hcHAgPSBhcHA7XG4gICAgICAgIHRoaXMucGx1Z2luID0gcGx1Z2luO1xuICAgIH1cblxuICAgIGdldEl0ZW1zKCk6IFRGaWxlW10ge1xuICAgICAgICBpZiAodGhpcy5wbHVnaW4uc2V0dGluZ3MudGVtcGxhdGVfZm9sZGVyID09PSBcIlwiKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5hcHAudmF1bHQuZ2V0TWFya2Rvd25GaWxlcygpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBnZXRURmlsZXNGcm9tRm9sZGVyKHRoaXMuYXBwLCB0aGlzLnBsdWdpbi5zZXR0aW5ncy50ZW1wbGF0ZV9mb2xkZXIpO1xuICAgIH1cblxuICAgIGdldEl0ZW1UZXh0KGl0ZW06IFRGaWxlKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIGl0ZW0uYmFzZW5hbWU7XG4gICAgfVxuXG4gICAgb25DaG9vc2VJdGVtKGl0ZW06IFRGaWxlLCBfZXZ0OiBNb3VzZUV2ZW50IHwgS2V5Ym9hcmRFdmVudCk6IHZvaWQge1xuICAgICAgICBzd2l0Y2godGhpcy5vcGVuX21vZGUpIHtcbiAgICAgICAgICAgIGNhc2UgT3Blbk1vZGUuSW5zZXJ0VGVtcGxhdGU6XG4gICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4udGVtcGxhdGVyLmFwcGVuZF90ZW1wbGF0ZShpdGVtKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgT3Blbk1vZGUuQ3JlYXRlTm90ZVRlbXBsYXRlOlxuICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnRlbXBsYXRlci5jcmVhdGVfbmV3X25vdGVfZnJvbV90ZW1wbGF0ZShpdGVtLCB0aGlzLmNyZWF0aW9uX2ZvbGRlcik7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzdGFydCgpOiB2b2lkIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHRoaXMub3BlbigpO1xuICAgICAgICB9IGNhdGNoKGUpIHtcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLmxvZ19lcnJvcihlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGluc2VydF90ZW1wbGF0ZSgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5vcGVuX21vZGUgPSBPcGVuTW9kZS5JbnNlcnRUZW1wbGF0ZTtcbiAgICAgICAgdGhpcy5zdGFydCgpO1xuICAgIH1cblxuICAgIGNyZWF0ZV9uZXdfbm90ZV9mcm9tX3RlbXBsYXRlKGZvbGRlcj86IFRGb2xkZXIpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5jcmVhdGlvbl9mb2xkZXIgPSBmb2xkZXI7XG4gICAgICAgIHRoaXMub3Blbl9tb2RlID0gT3Blbk1vZGUuQ3JlYXRlTm90ZVRlbXBsYXRlO1xuICAgICAgICB0aGlzLnN0YXJ0KCk7XG4gICAgfVxufVxuIiwiZXhwb3J0IGNvbnN0IFVOU1VQUE9SVEVEX01PQklMRV9URU1QTEFURTogc3RyaW5nID0gXCJFcnJvcl9Nb2JpbGVVbnN1cHBvcnRlZFRlbXBsYXRlXCI7XG5leHBvcnQgY29uc3QgSUNPTl9EQVRBOiBzdHJpbmcgPSBgPHN2ZyB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgdmlld0JveD1cIjAgMCA1MS4xMzI4IDI4LjdcIj48cGF0aCBkPVwiTTAgMTUuMTQgMCAxMC4xNSAxOC42NyAxLjUxIDE4LjY3IDYuMDMgNC43MiAxMi4zMyA0LjcyIDEyLjc2IDE4LjY3IDE5LjIyIDE4LjY3IDIzLjc0IDAgMTUuMTRaTTMzLjY5MjggMS44NEMzMy42OTI4IDEuODQgMzMuOTc2MSAyLjE0NjcgMzQuNTQyOCAyLjc2QzM1LjEwOTQgMy4zOCAzNS4zOTI4IDQuNTYgMzUuMzkyOCA2LjNDMzUuMzkyOCA4LjA0NjYgMzQuODE5NSA5LjU0IDMzLjY3MjggMTAuNzhDMzIuNTI2MSAxMi4wMiAzMS4wOTk1IDEyLjY0IDI5LjM5MjggMTIuNjRDMjcuNjg2MiAxMi42NCAyNi4yNjYxIDEyLjAyNjcgMjUuMTMyOCAxMC44QzIzLjk5MjggOS41NzMzIDIzLjQyMjggOC4wODY3IDIzLjQyMjggNi4zNEMyMy40MjI4IDQuNiAyMy45OTk1IDMuMTA2NiAyNS4xNTI4IDEuODZDMjYuMjk5NC42MiAyNy43MjYxIDAgMjkuNDMyOCAwQzMxLjEzOTUgMCAzMi41NTk0LjYxMzMgMzMuNjkyOCAxLjg0TTQ5LjgyMjguNjcgMjkuNTMyOCAyOC4zOCAyNC40MTI4IDI4LjM4IDQ0LjcxMjguNjcgNDkuODIyOC42N00zMS4wMzI4IDguMzhDMzEuMDMyOCA4LjM4IDMxLjEzOTUgOC4yNDY3IDMxLjM1MjggNy45OEMzMS41NjYyIDcuNzA2NyAzMS42NzI4IDcuMTczMyAzMS42NzI4IDYuMzhDMzEuNjcyOCA1LjU4NjcgMzEuNDQ2MSA0LjkyIDMwLjk5MjggNC4zOEMzMC41NDYxIDMuODQgMjkuOTk5NSAzLjU3IDI5LjM1MjggMy41N0MyOC43MDYxIDMuNTcgMjguMTY5NSAzLjg0IDI3Ljc0MjggNC4zOEMyNy4zMjI4IDQuOTIgMjcuMTEyOCA1LjU4NjcgMjcuMTEyOCA2LjM4QzI3LjExMjggNy4xNzMzIDI3LjMzNjEgNy44NCAyNy43ODI4IDguMzhDMjguMjM2MSA4LjkyNjcgMjguNzg2MSA5LjIgMjkuNDMyOCA5LjJDMzAuMDc5NSA5LjIgMzAuNjEyOCA4LjkyNjcgMzEuMDMyOCA4LjM4TTQ5LjQzMjggMTcuOUM0OS40MzI4IDE3LjkgNDkuNzE2MSAxOC4yMDY3IDUwLjI4MjggMTguODJDNTAuODQ5NSAxOS40MzMzIDUxLjEzMjggMjAuNjEzMyA1MS4xMzI4IDIyLjM2QzUxLjEzMjggMjQuMSA1MC41NTk0IDI1LjU5IDQ5LjQxMjggMjYuODNDNDguMjU5NSAyOC4wNzY2IDQ2LjgyOTUgMjguNyA0NS4xMjI4IDI4LjdDNDMuNDIyOCAyOC43IDQyLjAwMjggMjguMDgzMyA0MC44NjI4IDI2Ljg1QzM5LjcyOTUgMjUuNjIzMyAzOS4xNjI4IDI0LjEzNjYgMzkuMTYyOCAyMi4zOUMzOS4xNjI4IDIwLjY1IDM5LjczNjEgMTkuMTYgNDAuODgyOCAxNy45MkM0Mi4wMzYxIDE2LjY3MzMgNDMuNDYyOCAxNi4wNSA0NS4xNjI4IDE2LjA1QzQ2Ljg2OTQgMTYuMDUgNDguMjkyOCAxNi42NjY3IDQ5LjQzMjggMTcuOU00Ni44NTI4IDI0LjUyQzQ2Ljg1MjggMjQuNTIgNDYuOTU5NSAyNC4zODMzIDQ3LjE3MjggMjQuMTFDNDcuMzc5NSAyMy44MzY3IDQ3LjQ4MjggMjMuMzAzMyA0Ny40ODI4IDIyLjUxQzQ3LjQ4MjggMjEuNzE2NyA0Ny4yNTk1IDIxLjA1IDQ2LjgxMjggMjAuNTFDNDYuMzY2MSAxOS45NyA0NS44MTYyIDE5LjcgNDUuMTYyOCAxOS43QzQ0LjUxNjEgMTkuNyA0My45ODI4IDE5Ljk3IDQzLjU2MjggMjAuNTFDNDMuMTQyOCAyMS4wNSA0Mi45MzI4IDIxLjcxNjcgNDIuOTMyOCAyMi41MUM0Mi45MzI4IDIzLjMwMzMgNDMuMTU2MSAyMy45NzMzIDQzLjYwMjggMjQuNTJDNDQuMDQ5NCAyNS4wNiA0NC41OTYxIDI1LjMzIDQ1LjI0MjggMjUuMzNDNDUuODg5NSAyNS4zMyA0Ni40MjYxIDI1LjA2IDQ2Ljg1MjggMjQuNTJaXCIgZmlsbD1cImN1cnJlbnRDb2xvclwiLz48L3N2Zz5gOyIsImltcG9ydCB7IEFwcCwgRWRpdG9yUG9zaXRpb24sIEVkaXRvclJhbmdlT3JDYXJldCwgRWRpdG9yVHJhbnNhY3Rpb24sIE1hcmtkb3duVmlldyB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgZXNjYXBlUmVnRXhwIH0gZnJvbSBcIlV0aWxzXCI7XG5cbmV4cG9ydCBjbGFzcyBDdXJzb3JKdW1wZXIge1xuICAgIHByaXZhdGUgY3Vyc29yX3JlZ2V4OiBSZWdFeHAgPSBuZXcgUmVnRXhwKFwiPCVcXFxccyp0cC5maWxlLmN1cnNvclxcXFwoKD88b3JkZXI+WzAtOV17MCwyfSlcXFxcKVxcXFxzKiU+XCIsIFwiZ1wiKTtcdFxuXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBhcHA6IEFwcCkge31cblxuICAgIGFzeW5jIGp1bXBfdG9fbmV4dF9jdXJzb3JfbG9jYXRpb24oKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGNvbnN0IGFjdGl2ZV92aWV3ID0gdGhpcy5hcHAud29ya3NwYWNlLmdldEFjdGl2ZVZpZXdPZlR5cGUoTWFya2Rvd25WaWV3KTtcbiAgICAgICAgaWYgKCFhY3RpdmVfdmlldykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGFjdGl2ZV9maWxlID0gYWN0aXZlX3ZpZXcuZmlsZTtcbiAgICAgICAgYXdhaXQgYWN0aXZlX3ZpZXcuc2F2ZSgpO1xuXG4gICAgICAgIGNvbnN0IGNvbnRlbnQgPSBhd2FpdCB0aGlzLmFwcC52YXVsdC5yZWFkKGFjdGl2ZV9maWxlKTtcblxuICAgICAgICBjb25zdCB7bmV3X2NvbnRlbnQsIHBvc2l0aW9uc30gPSB0aGlzLnJlcGxhY2VfYW5kX2dldF9jdXJzb3JfcG9zaXRpb25zKGNvbnRlbnQpO1xuICAgICAgICBpZiAocG9zaXRpb25zKSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLmFwcC52YXVsdC5tb2RpZnkoYWN0aXZlX2ZpbGUsIG5ld19jb250ZW50KTtcbiAgICAgICAgICAgIHRoaXMuc2V0X2N1cnNvcl9sb2NhdGlvbihwb3NpdGlvbnMpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZ2V0X2VkaXRvcl9wb3NpdGlvbl9mcm9tX2luZGV4KGNvbnRlbnQ6IHN0cmluZywgaW5kZXg6IG51bWJlcik6IEVkaXRvclBvc2l0aW9uIHtcbiAgICAgICAgY29uc3Qgc3Vic3RyID0gY29udGVudC5zdWJzdHIoMCwgaW5kZXgpO1xuXG4gICAgICAgIGxldCBsID0gMDtcbiAgICAgICAgbGV0IG9mZnNldCA9IC0xO1xuICAgICAgICBsZXQgciA9IC0xO1xuICAgICAgICBmb3IgKDsgKHIgPSBzdWJzdHIuaW5kZXhPZihcIlxcblwiLCByKzEpKSAhPT0gLTEgOyBsKyssIG9mZnNldD1yKTtcbiAgICAgICAgb2Zmc2V0ICs9IDE7XG5cbiAgICAgICAgY29uc3QgY2ggPSBjb250ZW50LnN1YnN0cihvZmZzZXQsIGluZGV4LW9mZnNldCkubGVuZ3RoO1xuXG4gICAgICAgIHJldHVybiB7bGluZTogbCwgY2g6IGNofTtcbiAgICB9XG5cbiAgICByZXBsYWNlX2FuZF9nZXRfY3Vyc29yX3Bvc2l0aW9ucyhjb250ZW50OiBzdHJpbmcpOiB7bmV3X2NvbnRlbnQ/OiBzdHJpbmcsIHBvc2l0aW9ucz86IEVkaXRvclBvc2l0aW9uW119IHtcbiAgICAgICAgbGV0IGN1cnNvcl9tYXRjaGVzID0gW107XG4gICAgICAgIGxldCBtYXRjaDtcbiAgICAgICAgd2hpbGUoKG1hdGNoID0gdGhpcy5jdXJzb3JfcmVnZXguZXhlYyhjb250ZW50KSkgIT0gbnVsbCkge1xuICAgICAgICAgICAgY3Vyc29yX21hdGNoZXMucHVzaChtYXRjaCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGN1cnNvcl9tYXRjaGVzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIHt9O1xuICAgICAgICB9XG5cbiAgICAgICAgY3Vyc29yX21hdGNoZXMuc29ydCgobTEsIG0yKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gTnVtYmVyKG0xLmdyb3Vwc1tcIm9yZGVyXCJdKSAtIE51bWJlcihtMi5ncm91cHNbXCJvcmRlclwiXSk7XG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCBtYXRjaF9zdHIgPSBjdXJzb3JfbWF0Y2hlc1swXVswXTtcblxuICAgICAgICBjdXJzb3JfbWF0Y2hlcyA9IGN1cnNvcl9tYXRjaGVzLmZpbHRlcihtID0+IHtcbiAgICAgICAgICAgIHJldHVybiBtWzBdID09PSBtYXRjaF9zdHI7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IHBvc2l0aW9ucyA9IFtdO1xuICAgICAgICBsZXQgaW5kZXhfb2Zmc2V0ID0gMDtcbiAgICAgICAgZm9yIChsZXQgbWF0Y2ggb2YgY3Vyc29yX21hdGNoZXMpIHtcbiAgICAgICAgICAgIGNvbnN0IGluZGV4ID0gbWF0Y2guaW5kZXggLSBpbmRleF9vZmZzZXQ7XG4gICAgICAgICAgICBwb3NpdGlvbnMucHVzaCh0aGlzLmdldF9lZGl0b3JfcG9zaXRpb25fZnJvbV9pbmRleChjb250ZW50LCBpbmRleCkpO1xuXG4gICAgICAgICAgICBjb250ZW50ID0gY29udGVudC5yZXBsYWNlKG5ldyBSZWdFeHAoZXNjYXBlUmVnRXhwKG1hdGNoWzBdKSksIFwiXCIpO1xuICAgICAgICAgICAgaW5kZXhfb2Zmc2V0ICs9IG1hdGNoWzBdLmxlbmd0aDtcblxuICAgICAgICAgICAgLy8gRm9yIHRwLmZpbGUuY3Vyc29yKCksIHdlIGtlZXAgdGhlIGRlZmF1bHQgdG9wIHRvIGJvdHRvbVxuICAgICAgICAgICAgaWYgKG1hdGNoWzFdID09PSBcIlwiKSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4ge25ld19jb250ZW50OiBjb250ZW50LCBwb3NpdGlvbnM6IHBvc2l0aW9uc307XG4gICAgfVxuXG4gICAgc2V0X2N1cnNvcl9sb2NhdGlvbihwb3NpdGlvbnM6IEVkaXRvclBvc2l0aW9uW10pOiB2b2lkIHtcbiAgICAgICAgY29uc3QgYWN0aXZlX3ZpZXcgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlVmlld09mVHlwZShNYXJrZG93blZpZXcpO1xuICAgICAgICBpZiAoIWFjdGl2ZV92aWV3KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBlZGl0b3IgPSBhY3RpdmVfdmlldy5lZGl0b3I7XG4gICAgICAgIGVkaXRvci5mb2N1cygpO1xuXG4gICAgICAgIGxldCBzZWxlY3Rpb25zOiBBcnJheTxFZGl0b3JSYW5nZU9yQ2FyZXQ+ID0gW107XG4gICAgICAgIGZvciAobGV0IHBvcyBvZiBwb3NpdGlvbnMpIHtcbiAgICAgICAgICAgIHNlbGVjdGlvbnMucHVzaCh7ZnJvbTogcG9zfSk7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgdHJhbnNhY3Rpb246IEVkaXRvclRyYW5zYWN0aW9uID0ge1xuICAgICAgICAgICAgc2VsZWN0aW9uczogc2VsZWN0aW9uc1xuICAgICAgICB9O1xuICAgICAgICBlZGl0b3IudHJhbnNhY3Rpb24odHJhbnNhY3Rpb24pO1xuICAgIH1cbn0iLCJpbXBvcnQgeyBleGlzdHNTeW5jLCByZWFkRmlsZVN5bmMgfSBmcm9tICdmcyc7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuXG4vKiEgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcclxuQ29weXJpZ2h0IChjKSBNaWNyb3NvZnQgQ29ycG9yYXRpb24uXHJcblxyXG5QZXJtaXNzaW9uIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBhbmQvb3IgZGlzdHJpYnV0ZSB0aGlzIHNvZnR3YXJlIGZvciBhbnlcclxucHVycG9zZSB3aXRoIG9yIHdpdGhvdXQgZmVlIGlzIGhlcmVieSBncmFudGVkLlxyXG5cclxuVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiBBTkQgVEhFIEFVVEhPUiBESVNDTEFJTVMgQUxMIFdBUlJBTlRJRVMgV0lUSFxyXG5SRUdBUkQgVE8gVEhJUyBTT0ZUV0FSRSBJTkNMVURJTkcgQUxMIElNUExJRUQgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFlcclxuQU5EIEZJVE5FU1MuIElOIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1IgQkUgTElBQkxFIEZPUiBBTlkgU1BFQ0lBTCwgRElSRUNULFxyXG5JTkRJUkVDVCwgT1IgQ09OU0VRVUVOVElBTCBEQU1BR0VTIE9SIEFOWSBEQU1BR0VTIFdIQVRTT0VWRVIgUkVTVUxUSU5HIEZST01cclxuTE9TUyBPRiBVU0UsIERBVEEgT1IgUFJPRklUUywgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIE5FR0xJR0VOQ0UgT1JcclxuT1RIRVIgVE9SVElPVVMgQUNUSU9OLCBBUklTSU5HIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFVTRSBPUlxyXG5QRVJGT1JNQU5DRSBPRiBUSElTIFNPRlRXQVJFLlxyXG4qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiAqL1xyXG5cclxudmFyIF9fYXNzaWduID0gZnVuY3Rpb24oKSB7XHJcbiAgICBfX2Fzc2lnbiA9IE9iamVjdC5hc3NpZ24gfHwgZnVuY3Rpb24gX19hc3NpZ24odCkge1xyXG4gICAgICAgIGZvciAodmFyIHMsIGkgPSAxLCBuID0gYXJndW1lbnRzLmxlbmd0aDsgaSA8IG47IGkrKykge1xyXG4gICAgICAgICAgICBzID0gYXJndW1lbnRzW2ldO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBwIGluIHMpIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwocywgcCkpIHRbcF0gPSBzW3BdO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdDtcclxuICAgIH07XHJcbiAgICByZXR1cm4gX19hc3NpZ24uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxufTtcblxuZnVuY3Rpb24gc2V0UHJvdG90eXBlT2Yob2JqLCBwcm90bykge1xyXG4gICAgLy8gZXNsaW50LWRpc2FibGUtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XHJcbiAgICBpZiAoT2JqZWN0LnNldFByb3RvdHlwZU9mKSB7XHJcbiAgICAgICAgT2JqZWN0LnNldFByb3RvdHlwZU9mKG9iaiwgcHJvdG8pO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgICAgb2JqLl9fcHJvdG9fXyA9IHByb3RvO1xyXG4gICAgfVxyXG59XHJcbi8vIFRoaXMgaXMgcHJldHR5IG11Y2ggdGhlIG9ubHkgd2F5IHRvIGdldCBuaWNlLCBleHRlbmRlZCBFcnJvcnNcclxuLy8gd2l0aG91dCB1c2luZyBFUzZcclxuLyoqXHJcbiAqIFRoaXMgcmV0dXJucyBhIG5ldyBFcnJvciB3aXRoIGEgY3VzdG9tIHByb3RvdHlwZS4gTm90ZSB0aGF0IGl0J3MgX25vdF8gYSBjb25zdHJ1Y3RvclxyXG4gKlxyXG4gKiBAcGFyYW0gbWVzc2FnZSBFcnJvciBtZXNzYWdlXHJcbiAqXHJcbiAqICoqRXhhbXBsZSoqXHJcbiAqXHJcbiAqIGBgYGpzXHJcbiAqIHRocm93IEV0YUVycihcInRlbXBsYXRlIG5vdCBmb3VuZFwiKVxyXG4gKiBgYGBcclxuICovXHJcbmZ1bmN0aW9uIEV0YUVycihtZXNzYWdlKSB7XHJcbiAgICB2YXIgZXJyID0gbmV3IEVycm9yKG1lc3NhZ2UpO1xyXG4gICAgc2V0UHJvdG90eXBlT2YoZXJyLCBFdGFFcnIucHJvdG90eXBlKTtcclxuICAgIHJldHVybiBlcnI7XHJcbn1cclxuRXRhRXJyLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoRXJyb3IucHJvdG90eXBlLCB7XHJcbiAgICBuYW1lOiB7IHZhbHVlOiAnRXRhIEVycm9yJywgZW51bWVyYWJsZTogZmFsc2UgfVxyXG59KTtcclxuLyoqXHJcbiAqIFRocm93cyBhbiBFdGFFcnIgd2l0aCBhIG5pY2VseSBmb3JtYXR0ZWQgZXJyb3IgYW5kIG1lc3NhZ2Ugc2hvd2luZyB3aGVyZSBpbiB0aGUgdGVtcGxhdGUgdGhlIGVycm9yIG9jY3VycmVkLlxyXG4gKi9cclxuZnVuY3Rpb24gUGFyc2VFcnIobWVzc2FnZSwgc3RyLCBpbmR4KSB7XHJcbiAgICB2YXIgd2hpdGVzcGFjZSA9IHN0ci5zbGljZSgwLCBpbmR4KS5zcGxpdCgvXFxuLyk7XHJcbiAgICB2YXIgbGluZU5vID0gd2hpdGVzcGFjZS5sZW5ndGg7XHJcbiAgICB2YXIgY29sTm8gPSB3aGl0ZXNwYWNlW2xpbmVObyAtIDFdLmxlbmd0aCArIDE7XHJcbiAgICBtZXNzYWdlICs9XHJcbiAgICAgICAgJyBhdCBsaW5lICcgK1xyXG4gICAgICAgICAgICBsaW5lTm8gK1xyXG4gICAgICAgICAgICAnIGNvbCAnICtcclxuICAgICAgICAgICAgY29sTm8gK1xyXG4gICAgICAgICAgICAnOlxcblxcbicgK1xyXG4gICAgICAgICAgICAnICAnICtcclxuICAgICAgICAgICAgc3RyLnNwbGl0KC9cXG4vKVtsaW5lTm8gLSAxXSArXHJcbiAgICAgICAgICAgICdcXG4nICtcclxuICAgICAgICAgICAgJyAgJyArXHJcbiAgICAgICAgICAgIEFycmF5KGNvbE5vKS5qb2luKCcgJykgK1xyXG4gICAgICAgICAgICAnXic7XHJcbiAgICB0aHJvdyBFdGFFcnIobWVzc2FnZSk7XHJcbn1cblxuLyoqXHJcbiAqIEByZXR1cm5zIFRoZSBnbG9iYWwgUHJvbWlzZSBmdW5jdGlvblxyXG4gKi9cclxudmFyIHByb21pc2VJbXBsID0gbmV3IEZ1bmN0aW9uKCdyZXR1cm4gdGhpcycpKCkuUHJvbWlzZTtcclxuLyoqXHJcbiAqIEByZXR1cm5zIEEgbmV3IEFzeW5jRnVuY3Rpb24gY29uc3R1Y3RvclxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0QXN5bmNGdW5jdGlvbkNvbnN0cnVjdG9yKCkge1xyXG4gICAgdHJ5IHtcclxuICAgICAgICByZXR1cm4gbmV3IEZ1bmN0aW9uKCdyZXR1cm4gKGFzeW5jIGZ1bmN0aW9uKCl7fSkuY29uc3RydWN0b3InKSgpO1xyXG4gICAgfVxyXG4gICAgY2F0Y2ggKGUpIHtcclxuICAgICAgICBpZiAoZSBpbnN0YW5jZW9mIFN5bnRheEVycm9yKSB7XHJcbiAgICAgICAgICAgIHRocm93IEV0YUVycihcIlRoaXMgZW52aXJvbm1lbnQgZG9lc24ndCBzdXBwb3J0IGFzeW5jL2F3YWl0XCIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgdGhyb3cgZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuLyoqXHJcbiAqIHN0ci50cmltTGVmdCBwb2x5ZmlsbFxyXG4gKlxyXG4gKiBAcGFyYW0gc3RyIC0gSW5wdXQgc3RyaW5nXHJcbiAqIEByZXR1cm5zIFRoZSBzdHJpbmcgd2l0aCBsZWZ0IHdoaXRlc3BhY2UgcmVtb3ZlZFxyXG4gKlxyXG4gKi9cclxuZnVuY3Rpb24gdHJpbUxlZnQoc3RyKSB7XHJcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tZXh0cmEtYm9vbGVhbi1jYXN0XHJcbiAgICBpZiAoISFTdHJpbmcucHJvdG90eXBlLnRyaW1MZWZ0KSB7XHJcbiAgICAgICAgcmV0dXJuIHN0ci50cmltTGVmdCgpO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIHN0ci5yZXBsYWNlKC9eXFxzKy8sICcnKTtcclxuICAgIH1cclxufVxyXG4vKipcclxuICogc3RyLnRyaW1SaWdodCBwb2x5ZmlsbFxyXG4gKlxyXG4gKiBAcGFyYW0gc3RyIC0gSW5wdXQgc3RyaW5nXHJcbiAqIEByZXR1cm5zIFRoZSBzdHJpbmcgd2l0aCByaWdodCB3aGl0ZXNwYWNlIHJlbW92ZWRcclxuICpcclxuICovXHJcbmZ1bmN0aW9uIHRyaW1SaWdodChzdHIpIHtcclxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1leHRyYS1ib29sZWFuLWNhc3RcclxuICAgIGlmICghIVN0cmluZy5wcm90b3R5cGUudHJpbVJpZ2h0KSB7XHJcbiAgICAgICAgcmV0dXJuIHN0ci50cmltUmlnaHQoKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICAgIHJldHVybiBzdHIucmVwbGFjZSgvXFxzKyQvLCAnJyk7IC8vIFRPRE86IGRvIHdlIHJlYWxseSBuZWVkIHRvIHJlcGxhY2UgQk9NJ3M/XHJcbiAgICB9XHJcbn1cblxuLy8gVE9ETzogYWxsb3cgJy0nIHRvIHRyaW0gdXAgdW50aWwgbmV3bGluZS4gVXNlIFteXFxTXFxuXFxyXSBpbnN0ZWFkIG9mIFxcc1xyXG4vKiBFTkQgVFlQRVMgKi9cclxuZnVuY3Rpb24gaGFzT3duUHJvcChvYmosIHByb3ApIHtcclxuICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKTtcclxufVxyXG5mdW5jdGlvbiBjb3B5UHJvcHModG9PYmosIGZyb21PYmopIHtcclxuICAgIGZvciAodmFyIGtleSBpbiBmcm9tT2JqKSB7XHJcbiAgICAgICAgaWYgKGhhc093blByb3AoZnJvbU9iaiwga2V5KSkge1xyXG4gICAgICAgICAgICB0b09ialtrZXldID0gZnJvbU9ialtrZXldO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiB0b09iajtcclxufVxyXG4vKipcclxuICogVGFrZXMgYSBzdHJpbmcgd2l0aGluIGEgdGVtcGxhdGUgYW5kIHRyaW1zIGl0LCBiYXNlZCBvbiB0aGUgcHJlY2VkaW5nIHRhZydzIHdoaXRlc3BhY2UgY29udHJvbCBhbmQgYGNvbmZpZy5hdXRvVHJpbWBcclxuICovXHJcbmZ1bmN0aW9uIHRyaW1XUyhzdHIsIGNvbmZpZywgd3NMZWZ0LCB3c1JpZ2h0KSB7XHJcbiAgICB2YXIgbGVmdFRyaW07XHJcbiAgICB2YXIgcmlnaHRUcmltO1xyXG4gICAgaWYgKEFycmF5LmlzQXJyYXkoY29uZmlnLmF1dG9UcmltKSkge1xyXG4gICAgICAgIC8vIGtpbmRhIGNvbmZ1c2luZ1xyXG4gICAgICAgIC8vIGJ1dCBffX0gd2lsbCB0cmltIHRoZSBsZWZ0IHNpZGUgb2YgdGhlIGZvbGxvd2luZyBzdHJpbmdcclxuICAgICAgICBsZWZ0VHJpbSA9IGNvbmZpZy5hdXRvVHJpbVsxXTtcclxuICAgICAgICByaWdodFRyaW0gPSBjb25maWcuYXV0b1RyaW1bMF07XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgICBsZWZ0VHJpbSA9IHJpZ2h0VHJpbSA9IGNvbmZpZy5hdXRvVHJpbTtcclxuICAgIH1cclxuICAgIGlmICh3c0xlZnQgfHwgd3NMZWZ0ID09PSBmYWxzZSkge1xyXG4gICAgICAgIGxlZnRUcmltID0gd3NMZWZ0O1xyXG4gICAgfVxyXG4gICAgaWYgKHdzUmlnaHQgfHwgd3NSaWdodCA9PT0gZmFsc2UpIHtcclxuICAgICAgICByaWdodFRyaW0gPSB3c1JpZ2h0O1xyXG4gICAgfVxyXG4gICAgaWYgKCFyaWdodFRyaW0gJiYgIWxlZnRUcmltKSB7XHJcbiAgICAgICAgcmV0dXJuIHN0cjtcclxuICAgIH1cclxuICAgIGlmIChsZWZ0VHJpbSA9PT0gJ3NsdXJwJyAmJiByaWdodFRyaW0gPT09ICdzbHVycCcpIHtcclxuICAgICAgICByZXR1cm4gc3RyLnRyaW0oKTtcclxuICAgIH1cclxuICAgIGlmIChsZWZ0VHJpbSA9PT0gJ18nIHx8IGxlZnRUcmltID09PSAnc2x1cnAnKSB7XHJcbiAgICAgICAgLy8gY29uc29sZS5sb2coJ3RyaW1taW5nIGxlZnQnICsgbGVmdFRyaW0pXHJcbiAgICAgICAgLy8gZnVsbCBzbHVycFxyXG4gICAgICAgIHN0ciA9IHRyaW1MZWZ0KHN0cik7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmIChsZWZ0VHJpbSA9PT0gJy0nIHx8IGxlZnRUcmltID09PSAnbmwnKSB7XHJcbiAgICAgICAgLy8gbmwgdHJpbVxyXG4gICAgICAgIHN0ciA9IHN0ci5yZXBsYWNlKC9eKD86XFxyXFxufFxcbnxcXHIpLywgJycpO1xyXG4gICAgfVxyXG4gICAgaWYgKHJpZ2h0VHJpbSA9PT0gJ18nIHx8IHJpZ2h0VHJpbSA9PT0gJ3NsdXJwJykge1xyXG4gICAgICAgIC8vIGZ1bGwgc2x1cnBcclxuICAgICAgICBzdHIgPSB0cmltUmlnaHQoc3RyKTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKHJpZ2h0VHJpbSA9PT0gJy0nIHx8IHJpZ2h0VHJpbSA9PT0gJ25sJykge1xyXG4gICAgICAgIC8vIG5sIHRyaW1cclxuICAgICAgICBzdHIgPSBzdHIucmVwbGFjZSgvKD86XFxyXFxufFxcbnxcXHIpJC8sICcnKTsgLy8gVE9ETzogbWFrZSBzdXJlIHRoaXMgZ2V0cyBcXHJcXG5cclxuICAgIH1cclxuICAgIHJldHVybiBzdHI7XHJcbn1cclxuLyoqXHJcbiAqIEEgbWFwIG9mIHNwZWNpYWwgSFRNTCBjaGFyYWN0ZXJzIHRvIHRoZWlyIFhNTC1lc2NhcGVkIGVxdWl2YWxlbnRzXHJcbiAqL1xyXG52YXIgZXNjTWFwID0ge1xyXG4gICAgJyYnOiAnJmFtcDsnLFxyXG4gICAgJzwnOiAnJmx0OycsXHJcbiAgICAnPic6ICcmZ3Q7JyxcclxuICAgICdcIic6ICcmcXVvdDsnLFxyXG4gICAgXCInXCI6ICcmIzM5OydcclxufTtcclxuZnVuY3Rpb24gcmVwbGFjZUNoYXIocykge1xyXG4gICAgcmV0dXJuIGVzY01hcFtzXTtcclxufVxyXG4vKipcclxuICogWE1MLWVzY2FwZXMgYW4gaW5wdXQgdmFsdWUgYWZ0ZXIgY29udmVydGluZyBpdCB0byBhIHN0cmluZ1xyXG4gKlxyXG4gKiBAcGFyYW0gc3RyIC0gSW5wdXQgdmFsdWUgKHVzdWFsbHkgYSBzdHJpbmcpXHJcbiAqIEByZXR1cm5zIFhNTC1lc2NhcGVkIHN0cmluZ1xyXG4gKi9cclxuZnVuY3Rpb24gWE1MRXNjYXBlKHN0cikge1xyXG4gICAgLy8gZXNsaW50LWRpc2FibGUtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XHJcbiAgICAvLyBUbyBkZWFsIHdpdGggWFNTLiBCYXNlZCBvbiBFc2NhcGUgaW1wbGVtZW50YXRpb25zIG9mIE11c3RhY2hlLkpTIGFuZCBNYXJrbywgdGhlbiBjdXN0b21pemVkLlxyXG4gICAgdmFyIG5ld1N0ciA9IFN0cmluZyhzdHIpO1xyXG4gICAgaWYgKC9bJjw+XCInXS8udGVzdChuZXdTdHIpKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ld1N0ci5yZXBsYWNlKC9bJjw+XCInXS9nLCByZXBsYWNlQ2hhcik7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgICByZXR1cm4gbmV3U3RyO1xyXG4gICAgfVxyXG59XG5cbi8qIEVORCBUWVBFUyAqL1xyXG52YXIgdGVtcGxhdGVMaXRSZWcgPSAvYCg/OlxcXFxbXFxzXFxTXXxcXCR7KD86W157fV18eyg/Oltee31dfHtbXn1dKn0pKn0pKn18KD8hXFwkeylbXlxcXFxgXSkqYC9nO1xyXG52YXIgc2luZ2xlUXVvdGVSZWcgPSAvJyg/OlxcXFxbXFxzXFx3XCInXFxcXGBdfFteXFxuXFxyJ1xcXFxdKSo/Jy9nO1xyXG52YXIgZG91YmxlUXVvdGVSZWcgPSAvXCIoPzpcXFxcW1xcc1xcd1wiJ1xcXFxgXXxbXlxcblxcclwiXFxcXF0pKj9cIi9nO1xyXG4vKiogRXNjYXBlIHNwZWNpYWwgcmVndWxhciBleHByZXNzaW9uIGNoYXJhY3RlcnMgaW5zaWRlIGEgc3RyaW5nICovXHJcbmZ1bmN0aW9uIGVzY2FwZVJlZ0V4cChzdHJpbmcpIHtcclxuICAgIC8vIEZyb20gTUROXHJcbiAgICByZXR1cm4gc3RyaW5nLnJlcGxhY2UoL1suKitcXC0/XiR7fSgpfFtcXF1cXFxcXS9nLCAnXFxcXCQmJyk7IC8vICQmIG1lYW5zIHRoZSB3aG9sZSBtYXRjaGVkIHN0cmluZ1xyXG59XHJcbmZ1bmN0aW9uIHBhcnNlKHN0ciwgY29uZmlnKSB7XHJcbiAgICB2YXIgYnVmZmVyID0gW107XHJcbiAgICB2YXIgdHJpbUxlZnRPZk5leHRTdHIgPSBmYWxzZTtcclxuICAgIHZhciBsYXN0SW5kZXggPSAwO1xyXG4gICAgdmFyIHBhcnNlT3B0aW9ucyA9IGNvbmZpZy5wYXJzZTtcclxuICAgIGlmIChjb25maWcucGx1Z2lucykge1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY29uZmlnLnBsdWdpbnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgdmFyIHBsdWdpbiA9IGNvbmZpZy5wbHVnaW5zW2ldO1xyXG4gICAgICAgICAgICBpZiAocGx1Z2luLnByb2Nlc3NUZW1wbGF0ZSkge1xyXG4gICAgICAgICAgICAgICAgc3RyID0gcGx1Z2luLnByb2Nlc3NUZW1wbGF0ZShzdHIsIGNvbmZpZyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICAvKiBBZGRpbmcgZm9yIEVKUyBjb21wYXRpYmlsaXR5ICovXHJcbiAgICBpZiAoY29uZmlnLnJtV2hpdGVzcGFjZSkge1xyXG4gICAgICAgIC8vIENvZGUgdGFrZW4gZGlyZWN0bHkgZnJvbSBFSlNcclxuICAgICAgICAvLyBIYXZlIHRvIHVzZSB0d28gc2VwYXJhdGUgcmVwbGFjZXMgaGVyZSBhcyBgXmAgYW5kIGAkYCBvcGVyYXRvcnMgZG9uJ3RcclxuICAgICAgICAvLyB3b3JrIHdlbGwgd2l0aCBgXFxyYCBhbmQgZW1wdHkgbGluZXMgZG9uJ3Qgd29yayB3ZWxsIHdpdGggdGhlIGBtYCBmbGFnLlxyXG4gICAgICAgIC8vIEVzc2VudGlhbGx5LCB0aGlzIHJlcGxhY2VzIHRoZSB3aGl0ZXNwYWNlIGF0IHRoZSBiZWdpbm5pbmcgYW5kIGVuZCBvZlxyXG4gICAgICAgIC8vIGVhY2ggbGluZSBhbmQgcmVtb3ZlcyBtdWx0aXBsZSBuZXdsaW5lcy5cclxuICAgICAgICBzdHIgPSBzdHIucmVwbGFjZSgvW1xcclxcbl0rL2csICdcXG4nKS5yZXBsYWNlKC9eXFxzK3xcXHMrJC9nbSwgJycpO1xyXG4gICAgfVxyXG4gICAgLyogRW5kIHJtV2hpdGVzcGFjZSBvcHRpb24gKi9cclxuICAgIHRlbXBsYXRlTGl0UmVnLmxhc3RJbmRleCA9IDA7XHJcbiAgICBzaW5nbGVRdW90ZVJlZy5sYXN0SW5kZXggPSAwO1xyXG4gICAgZG91YmxlUXVvdGVSZWcubGFzdEluZGV4ID0gMDtcclxuICAgIGZ1bmN0aW9uIHB1c2hTdHJpbmcoc3RybmcsIHNob3VsZFRyaW1SaWdodE9mU3RyaW5nKSB7XHJcbiAgICAgICAgaWYgKHN0cm5nKSB7XHJcbiAgICAgICAgICAgIC8vIGlmIHN0cmluZyBpcyB0cnV0aHkgaXQgbXVzdCBiZSBvZiB0eXBlICdzdHJpbmcnXHJcbiAgICAgICAgICAgIHN0cm5nID0gdHJpbVdTKHN0cm5nLCBjb25maWcsIHRyaW1MZWZ0T2ZOZXh0U3RyLCAvLyB0aGlzIHdpbGwgb25seSBiZSBmYWxzZSBvbiB0aGUgZmlyc3Qgc3RyLCB0aGUgbmV4dCBvbmVzIHdpbGwgYmUgbnVsbCBvciB1bmRlZmluZWRcclxuICAgICAgICAgICAgc2hvdWxkVHJpbVJpZ2h0T2ZTdHJpbmcpO1xyXG4gICAgICAgICAgICBpZiAoc3RybmcpIHtcclxuICAgICAgICAgICAgICAgIC8vIHJlcGxhY2UgXFwgd2l0aCBcXFxcLCAnIHdpdGggXFwnXHJcbiAgICAgICAgICAgICAgICAvLyB3ZSdyZSBnb2luZyB0byBjb252ZXJ0IGFsbCBDUkxGIHRvIExGIHNvIGl0IGRvZXNuJ3QgdGFrZSBtb3JlIHRoYW4gb25lIHJlcGxhY2VcclxuICAgICAgICAgICAgICAgIHN0cm5nID0gc3RybmcucmVwbGFjZSgvXFxcXHwnL2csICdcXFxcJCYnKS5yZXBsYWNlKC9cXHJcXG58XFxufFxcci9nLCAnXFxcXG4nKTtcclxuICAgICAgICAgICAgICAgIGJ1ZmZlci5wdXNoKHN0cm5nKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHZhciBwcmVmaXhlcyA9IFtwYXJzZU9wdGlvbnMuZXhlYywgcGFyc2VPcHRpb25zLmludGVycG9sYXRlLCBwYXJzZU9wdGlvbnMucmF3XS5yZWR1Y2UoZnVuY3Rpb24gKGFjY3VtdWxhdG9yLCBwcmVmaXgpIHtcclxuICAgICAgICBpZiAoYWNjdW11bGF0b3IgJiYgcHJlZml4KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBhY2N1bXVsYXRvciArICd8JyArIGVzY2FwZVJlZ0V4cChwcmVmaXgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmIChwcmVmaXgpIHtcclxuICAgICAgICAgICAgLy8gYWNjdW11bGF0b3IgaXMgZmFsc3lcclxuICAgICAgICAgICAgcmV0dXJuIGVzY2FwZVJlZ0V4cChwcmVmaXgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgLy8gcHJlZml4IGFuZCBhY2N1bXVsYXRvciBhcmUgYm90aCBmYWxzeVxyXG4gICAgICAgICAgICByZXR1cm4gYWNjdW11bGF0b3I7XHJcbiAgICAgICAgfVxyXG4gICAgfSwgJycpO1xyXG4gICAgdmFyIHBhcnNlT3BlblJlZyA9IG5ldyBSZWdFeHAoJyhbXl0qPyknICsgZXNjYXBlUmVnRXhwKGNvbmZpZy50YWdzWzBdKSArICcoLXxfKT9cXFxccyooJyArIHByZWZpeGVzICsgJyk/XFxcXHMqKD8hW1xcXFxzK1xcXFwtXycgKyBwcmVmaXhlcyArICddKScsICdnJyk7XHJcbiAgICB2YXIgcGFyc2VDbG9zZVJlZyA9IG5ldyBSZWdFeHAoJ1xcJ3xcInxgfFxcXFwvXFxcXCp8KFxcXFxzKigtfF8pPycgKyBlc2NhcGVSZWdFeHAoY29uZmlnLnRhZ3NbMV0pICsgJyknLCAnZycpO1xyXG4gICAgLy8gVE9ETzogYmVuY2htYXJrIGhhdmluZyB0aGUgXFxzKiBvbiBlaXRoZXIgc2lkZSB2cyB1c2luZyBzdHIudHJpbSgpXHJcbiAgICB2YXIgbTtcclxuICAgIHdoaWxlICgobSA9IHBhcnNlT3BlblJlZy5leGVjKHN0cikpKSB7XHJcbiAgICAgICAgbGFzdEluZGV4ID0gbVswXS5sZW5ndGggKyBtLmluZGV4O1xyXG4gICAgICAgIHZhciBwcmVjZWRpbmdTdHJpbmcgPSBtWzFdO1xyXG4gICAgICAgIHZhciB3c0xlZnQgPSBtWzJdO1xyXG4gICAgICAgIHZhciBwcmVmaXggPSBtWzNdIHx8ICcnOyAvLyBieSBkZWZhdWx0IGVpdGhlciB+LCA9LCBvciBlbXB0eVxyXG4gICAgICAgIHB1c2hTdHJpbmcocHJlY2VkaW5nU3RyaW5nLCB3c0xlZnQpO1xyXG4gICAgICAgIHBhcnNlQ2xvc2VSZWcubGFzdEluZGV4ID0gbGFzdEluZGV4O1xyXG4gICAgICAgIHZhciBjbG9zZVRhZyA9IHZvaWQgMDtcclxuICAgICAgICB2YXIgY3VycmVudE9iaiA9IGZhbHNlO1xyXG4gICAgICAgIHdoaWxlICgoY2xvc2VUYWcgPSBwYXJzZUNsb3NlUmVnLmV4ZWMoc3RyKSkpIHtcclxuICAgICAgICAgICAgaWYgKGNsb3NlVGFnWzFdKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgY29udGVudCA9IHN0ci5zbGljZShsYXN0SW5kZXgsIGNsb3NlVGFnLmluZGV4KTtcclxuICAgICAgICAgICAgICAgIHBhcnNlT3BlblJlZy5sYXN0SW5kZXggPSBsYXN0SW5kZXggPSBwYXJzZUNsb3NlUmVnLmxhc3RJbmRleDtcclxuICAgICAgICAgICAgICAgIHRyaW1MZWZ0T2ZOZXh0U3RyID0gY2xvc2VUYWdbMl07XHJcbiAgICAgICAgICAgICAgICB2YXIgY3VycmVudFR5cGUgPSBwcmVmaXggPT09IHBhcnNlT3B0aW9ucy5leGVjXHJcbiAgICAgICAgICAgICAgICAgICAgPyAnZSdcclxuICAgICAgICAgICAgICAgICAgICA6IHByZWZpeCA9PT0gcGFyc2VPcHRpb25zLnJhd1xyXG4gICAgICAgICAgICAgICAgICAgICAgICA/ICdyJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICA6IHByZWZpeCA9PT0gcGFyc2VPcHRpb25zLmludGVycG9sYXRlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA/ICdpJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgOiAnJztcclxuICAgICAgICAgICAgICAgIGN1cnJlbnRPYmogPSB7IHQ6IGN1cnJlbnRUeXBlLCB2YWw6IGNvbnRlbnQgfTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdmFyIGNoYXIgPSBjbG9zZVRhZ1swXTtcclxuICAgICAgICAgICAgICAgIGlmIChjaGFyID09PSAnLyonKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNvbW1lbnRDbG9zZUluZCA9IHN0ci5pbmRleE9mKCcqLycsIHBhcnNlQ2xvc2VSZWcubGFzdEluZGV4KTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoY29tbWVudENsb3NlSW5kID09PSAtMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBQYXJzZUVycigndW5jbG9zZWQgY29tbWVudCcsIHN0ciwgY2xvc2VUYWcuaW5kZXgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBwYXJzZUNsb3NlUmVnLmxhc3RJbmRleCA9IGNvbW1lbnRDbG9zZUluZDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGNoYXIgPT09IFwiJ1wiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2luZ2xlUXVvdGVSZWcubGFzdEluZGV4ID0gY2xvc2VUYWcuaW5kZXg7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNpbmdsZVF1b3RlTWF0Y2ggPSBzaW5nbGVRdW90ZVJlZy5leGVjKHN0cik7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNpbmdsZVF1b3RlTWF0Y2gpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGFyc2VDbG9zZVJlZy5sYXN0SW5kZXggPSBzaW5nbGVRdW90ZVJlZy5sYXN0SW5kZXg7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBQYXJzZUVycigndW5jbG9zZWQgc3RyaW5nJywgc3RyLCBjbG9zZVRhZy5pbmRleCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoY2hhciA9PT0gJ1wiJykge1xyXG4gICAgICAgICAgICAgICAgICAgIGRvdWJsZVF1b3RlUmVnLmxhc3RJbmRleCA9IGNsb3NlVGFnLmluZGV4O1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBkb3VibGVRdW90ZU1hdGNoID0gZG91YmxlUXVvdGVSZWcuZXhlYyhzdHIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChkb3VibGVRdW90ZU1hdGNoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcnNlQ2xvc2VSZWcubGFzdEluZGV4ID0gZG91YmxlUXVvdGVSZWcubGFzdEluZGV4O1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgUGFyc2VFcnIoJ3VuY2xvc2VkIHN0cmluZycsIHN0ciwgY2xvc2VUYWcuaW5kZXgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGNoYXIgPT09ICdgJykge1xyXG4gICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlTGl0UmVnLmxhc3RJbmRleCA9IGNsb3NlVGFnLmluZGV4O1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciB0ZW1wbGF0ZUxpdE1hdGNoID0gdGVtcGxhdGVMaXRSZWcuZXhlYyhzdHIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0ZW1wbGF0ZUxpdE1hdGNoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcnNlQ2xvc2VSZWcubGFzdEluZGV4ID0gdGVtcGxhdGVMaXRSZWcubGFzdEluZGV4O1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgUGFyc2VFcnIoJ3VuY2xvc2VkIHN0cmluZycsIHN0ciwgY2xvc2VUYWcuaW5kZXgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoY3VycmVudE9iaikge1xyXG4gICAgICAgICAgICBidWZmZXIucHVzaChjdXJyZW50T2JqKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIFBhcnNlRXJyKCd1bmNsb3NlZCB0YWcnLCBzdHIsIG0uaW5kZXggKyBwcmVjZWRpbmdTdHJpbmcubGVuZ3RoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBwdXNoU3RyaW5nKHN0ci5zbGljZShsYXN0SW5kZXgsIHN0ci5sZW5ndGgpLCBmYWxzZSk7XHJcbiAgICBpZiAoY29uZmlnLnBsdWdpbnMpIHtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvbmZpZy5wbHVnaW5zLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHZhciBwbHVnaW4gPSBjb25maWcucGx1Z2luc1tpXTtcclxuICAgICAgICAgICAgaWYgKHBsdWdpbi5wcm9jZXNzQVNUKSB7XHJcbiAgICAgICAgICAgICAgICBidWZmZXIgPSBwbHVnaW4ucHJvY2Vzc0FTVChidWZmZXIsIGNvbmZpZyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gYnVmZmVyO1xyXG59XG5cbi8qIEVORCBUWVBFUyAqL1xyXG4vKipcclxuICogQ29tcGlsZXMgYSB0ZW1wbGF0ZSBzdHJpbmcgdG8gYSBmdW5jdGlvbiBzdHJpbmcuIE1vc3Qgb2Z0ZW4gdXNlcnMganVzdCB1c2UgYGNvbXBpbGUoKWAsIHdoaWNoIGNhbGxzIGBjb21waWxlVG9TdHJpbmdgIGFuZCBjcmVhdGVzIGEgbmV3IGZ1bmN0aW9uIHVzaW5nIHRoZSByZXN1bHRcclxuICpcclxuICogKipFeGFtcGxlKipcclxuICpcclxuICogYGBganNcclxuICogY29tcGlsZVRvU3RyaW5nKFwiSGkgPCU9IGl0LnVzZXIgJT5cIiwgZXRhLmNvbmZpZylcclxuICogLy8gXCJ2YXIgdFI9JycsaW5jbHVkZT1FLmluY2x1ZGUuYmluZChFKSxpbmNsdWRlRmlsZT1FLmluY2x1ZGVGaWxlLmJpbmQoRSk7dFIrPSdIaSAnO3RSKz1FLmUoaXQudXNlcik7aWYoY2Ipe2NiKG51bGwsdFIpfSByZXR1cm4gdFJcIlxyXG4gKiBgYGBcclxuICovXHJcbmZ1bmN0aW9uIGNvbXBpbGVUb1N0cmluZyhzdHIsIGNvbmZpZykge1xyXG4gICAgdmFyIGJ1ZmZlciA9IHBhcnNlKHN0ciwgY29uZmlnKTtcclxuICAgIHZhciByZXMgPSBcInZhciB0Uj0nJyxfX2wsX19sUFwiICtcclxuICAgICAgICAoY29uZmlnLmluY2x1ZGUgPyAnLGluY2x1ZGU9RS5pbmNsdWRlLmJpbmQoRSknIDogJycpICtcclxuICAgICAgICAoY29uZmlnLmluY2x1ZGVGaWxlID8gJyxpbmNsdWRlRmlsZT1FLmluY2x1ZGVGaWxlLmJpbmQoRSknIDogJycpICtcclxuICAgICAgICAnXFxuZnVuY3Rpb24gbGF5b3V0KHAsZCl7X19sPXA7X19sUD1kfVxcbicgK1xyXG4gICAgICAgIChjb25maWcuZ2xvYmFsQXdhaXQgPyAnY29uc3QgX3BycyA9IFtdO1xcbicgOiAnJykgK1xyXG4gICAgICAgIChjb25maWcudXNlV2l0aCA/ICd3aXRoKCcgKyBjb25maWcudmFyTmFtZSArICd8fHt9KXsnIDogJycpICtcclxuICAgICAgICBjb21waWxlU2NvcGUoYnVmZmVyLCBjb25maWcpICtcclxuICAgICAgICAoY29uZmlnLmluY2x1ZGVGaWxlXHJcbiAgICAgICAgICAgID8gJ2lmKF9fbCl0Uj0nICtcclxuICAgICAgICAgICAgICAgIChjb25maWcuYXN5bmMgPyAnYXdhaXQgJyA6ICcnKSArXHJcbiAgICAgICAgICAgICAgICAoXCJpbmNsdWRlRmlsZShfX2wsT2JqZWN0LmFzc2lnbihcIiArIGNvbmZpZy52YXJOYW1lICsgXCIse2JvZHk6dFJ9LF9fbFApKVxcblwiKVxyXG4gICAgICAgICAgICA6IGNvbmZpZy5pbmNsdWRlXHJcbiAgICAgICAgICAgICAgICA/ICdpZihfX2wpdFI9JyArXHJcbiAgICAgICAgICAgICAgICAgICAgKGNvbmZpZy5hc3luYyA/ICdhd2FpdCAnIDogJycpICtcclxuICAgICAgICAgICAgICAgICAgICAoXCJpbmNsdWRlKF9fbCxPYmplY3QuYXNzaWduKFwiICsgY29uZmlnLnZhck5hbWUgKyBcIix7Ym9keTp0Un0sX19sUCkpXFxuXCIpXHJcbiAgICAgICAgICAgICAgICA6ICcnKSArXHJcbiAgICAgICAgJ2lmKGNiKXtjYihudWxsLHRSKX0gcmV0dXJuIHRSJyArXHJcbiAgICAgICAgKGNvbmZpZy51c2VXaXRoID8gJ30nIDogJycpO1xyXG4gICAgaWYgKGNvbmZpZy5wbHVnaW5zKSB7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb25maWcucGx1Z2lucy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB2YXIgcGx1Z2luID0gY29uZmlnLnBsdWdpbnNbaV07XHJcbiAgICAgICAgICAgIGlmIChwbHVnaW4ucHJvY2Vzc0ZuU3RyaW5nKSB7XHJcbiAgICAgICAgICAgICAgICByZXMgPSBwbHVnaW4ucHJvY2Vzc0ZuU3RyaW5nKHJlcywgY29uZmlnKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiByZXM7XHJcbn1cclxuLyoqXHJcbiAqIExvb3BzIHRocm91Z2ggdGhlIEFTVCBnZW5lcmF0ZWQgYnkgYHBhcnNlYCBhbmQgdHJhbnNmb3JtIGVhY2ggaXRlbSBpbnRvIEpTIGNhbGxzXHJcbiAqXHJcbiAqICoqRXhhbXBsZSoqXHJcbiAqXHJcbiAqIGBgYGpzXHJcbiAqIC8vIEFTVCB2ZXJzaW9uIG9mICdIaSA8JT0gaXQudXNlciAlPidcclxuICogbGV0IHRlbXBsYXRlQVNUID0gWydIaSAnLCB7IHZhbDogJ2l0LnVzZXInLCB0OiAnaScgfV1cclxuICogY29tcGlsZVNjb3BlKHRlbXBsYXRlQVNULCBldGEuY29uZmlnKVxyXG4gKiAvLyBcInRSKz0nSGkgJzt0Uis9RS5lKGl0LnVzZXIpO1wiXHJcbiAqIGBgYFxyXG4gKi9cclxuZnVuY3Rpb24gY29tcGlsZVNjb3BlKGJ1ZmYsIGNvbmZpZykge1xyXG4gICAgdmFyIGk7XHJcbiAgICB2YXIgYnVmZkxlbmd0aCA9IGJ1ZmYubGVuZ3RoO1xyXG4gICAgdmFyIHJldHVyblN0ciA9ICcnO1xyXG4gICAgdmFyIFJFUExBQ0VNRU5UX1NUUiA9IFwickoyS3FYenhRZ1wiO1xyXG4gICAgZm9yIChpID0gMDsgaSA8IGJ1ZmZMZW5ndGg7IGkrKykge1xyXG4gICAgICAgIHZhciBjdXJyZW50QmxvY2sgPSBidWZmW2ldO1xyXG4gICAgICAgIGlmICh0eXBlb2YgY3VycmVudEJsb2NrID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgICB2YXIgc3RyID0gY3VycmVudEJsb2NrO1xyXG4gICAgICAgICAgICAvLyB3ZSBrbm93IHN0cmluZyBleGlzdHNcclxuICAgICAgICAgICAgcmV0dXJuU3RyICs9IFwidFIrPSdcIiArIHN0ciArIFwiJ1xcblwiO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgdmFyIHR5cGUgPSBjdXJyZW50QmxvY2sudDsgLy8gfiwgcywgISwgPywgclxyXG4gICAgICAgICAgICB2YXIgY29udGVudCA9IGN1cnJlbnRCbG9jay52YWwgfHwgJyc7XHJcbiAgICAgICAgICAgIGlmICh0eXBlID09PSAncicpIHtcclxuICAgICAgICAgICAgICAgIC8vIHJhd1xyXG4gICAgICAgICAgICAgICAgaWYgKGNvbmZpZy5nbG9iYWxBd2FpdCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVyblN0ciArPSBcIl9wcnMucHVzaChcIiArIGNvbnRlbnQgKyBcIik7XFxuXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuU3RyICs9IFwidFIrPSdcIiArIFJFUExBQ0VNRU5UX1NUUiArIFwiJ1xcblwiO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNvbmZpZy5maWx0ZXIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudCA9ICdFLmZpbHRlcignICsgY29udGVudCArICcpJztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuU3RyICs9ICd0Uis9JyArIGNvbnRlbnQgKyAnXFxuJztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIGlmICh0eXBlID09PSAnaScpIHtcclxuICAgICAgICAgICAgICAgIC8vIGludGVycG9sYXRlXHJcbiAgICAgICAgICAgICAgICBpZiAoY29uZmlnLmdsb2JhbEF3YWl0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuU3RyICs9IFwiX3Bycy5wdXNoKFwiICsgY29udGVudCArIFwiKTtcXG5cIjtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm5TdHIgKz0gXCJ0Uis9J1wiICsgUkVQTEFDRU1FTlRfU1RSICsgXCInXFxuXCI7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoY29uZmlnLmZpbHRlcikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50ID0gJ0UuZmlsdGVyKCcgKyBjb250ZW50ICsgJyknO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICByZXR1cm5TdHIgKz0gJ3RSKz0nICsgY29udGVudCArICdcXG4nO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChjb25maWcuYXV0b0VzY2FwZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50ID0gJ0UuZSgnICsgY29udGVudCArICcpJztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuU3RyICs9ICd0Uis9JyArIGNvbnRlbnQgKyAnXFxuJztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIGlmICh0eXBlID09PSAnZScpIHtcclxuICAgICAgICAgICAgICAgIC8vIGV4ZWN1dGVcclxuICAgICAgICAgICAgICAgIHJldHVyblN0ciArPSBjb250ZW50ICsgJ1xcbic7IC8vIHlvdSBuZWVkIGEgXFxuIGluIGNhc2UgeW91IGhhdmUgPCUgfSAlPlxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgaWYgKGNvbmZpZy5nbG9iYWxBd2FpdCkge1xyXG4gICAgICAgIHJldHVyblN0ciArPSBcImNvbnN0IF9yc3QgPSBhd2FpdCBQcm9taXNlLmFsbChfcHJzKTtcXG50UiA9IHRSLnJlcGxhY2UoL1wiICsgUkVQTEFDRU1FTlRfU1RSICsgXCIvZywgKCkgPT4gX3JzdC5zaGlmdCgpKTtcXG5cIjtcclxuICAgIH1cclxuICAgIHJldHVybiByZXR1cm5TdHI7XHJcbn1cblxuLyoqXHJcbiAqIEhhbmRsZXMgc3RvcmFnZSBhbmQgYWNjZXNzaW5nIG9mIHZhbHVlc1xyXG4gKlxyXG4gKiBJbiB0aGlzIGNhc2UsIHdlIHVzZSBpdCB0byBzdG9yZSBjb21waWxlZCB0ZW1wbGF0ZSBmdW5jdGlvbnNcclxuICogSW5kZXhlZCBieSB0aGVpciBgbmFtZWAgb3IgYGZpbGVuYW1lYFxyXG4gKi9cclxudmFyIENhY2hlciA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcclxuICAgIGZ1bmN0aW9uIENhY2hlcihjYWNoZSkge1xyXG4gICAgICAgIHRoaXMuY2FjaGUgPSBjYWNoZTtcclxuICAgIH1cclxuICAgIENhY2hlci5wcm90b3R5cGUuZGVmaW5lID0gZnVuY3Rpb24gKGtleSwgdmFsKSB7XHJcbiAgICAgICAgdGhpcy5jYWNoZVtrZXldID0gdmFsO1xyXG4gICAgfTtcclxuICAgIENhY2hlci5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24gKGtleSkge1xyXG4gICAgICAgIC8vIHN0cmluZyB8IGFycmF5LlxyXG4gICAgICAgIC8vIFRPRE86IGFsbG93IGFycmF5IG9mIGtleXMgdG8gbG9vayBkb3duXHJcbiAgICAgICAgLy8gVE9ETzogY3JlYXRlIHBsdWdpbiB0byBhbGxvdyByZWZlcmVuY2luZyBoZWxwZXJzLCBmaWx0ZXJzIHdpdGggZG90IG5vdGF0aW9uXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY2FjaGVba2V5XTtcclxuICAgIH07XHJcbiAgICBDYWNoZXIucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uIChrZXkpIHtcclxuICAgICAgICBkZWxldGUgdGhpcy5jYWNoZVtrZXldO1xyXG4gICAgfTtcclxuICAgIENhY2hlci5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdGhpcy5jYWNoZSA9IHt9O1xyXG4gICAgfTtcclxuICAgIENhY2hlci5wcm90b3R5cGUubG9hZCA9IGZ1bmN0aW9uIChjYWNoZU9iaikge1xyXG4gICAgICAgIGNvcHlQcm9wcyh0aGlzLmNhY2hlLCBjYWNoZU9iaik7XHJcbiAgICB9O1xyXG4gICAgcmV0dXJuIENhY2hlcjtcclxufSgpKTtcblxuLyogRU5EIFRZUEVTICovXHJcbi8qKlxyXG4gKiBFdGEncyB0ZW1wbGF0ZSBzdG9yYWdlXHJcbiAqXHJcbiAqIFN0b3JlcyBwYXJ0aWFscyBhbmQgY2FjaGVkIHRlbXBsYXRlc1xyXG4gKi9cclxudmFyIHRlbXBsYXRlcyA9IG5ldyBDYWNoZXIoe30pO1xuXG4vKiBFTkQgVFlQRVMgKi9cclxuLyoqXHJcbiAqIEluY2x1ZGUgYSB0ZW1wbGF0ZSBiYXNlZCBvbiBpdHMgbmFtZSAob3IgZmlsZXBhdGgsIGlmIGl0J3MgYWxyZWFkeSBiZWVuIGNhY2hlZCkuXHJcbiAqXHJcbiAqIENhbGxlZCBsaWtlIGBpbmNsdWRlKHRlbXBsYXRlTmFtZU9yUGF0aCwgZGF0YSlgXHJcbiAqL1xyXG5mdW5jdGlvbiBpbmNsdWRlSGVscGVyKHRlbXBsYXRlTmFtZU9yUGF0aCwgZGF0YSkge1xyXG4gICAgdmFyIHRlbXBsYXRlID0gdGhpcy50ZW1wbGF0ZXMuZ2V0KHRlbXBsYXRlTmFtZU9yUGF0aCk7XHJcbiAgICBpZiAoIXRlbXBsYXRlKSB7XHJcbiAgICAgICAgdGhyb3cgRXRhRXJyKCdDb3VsZCBub3QgZmV0Y2ggdGVtcGxhdGUgXCInICsgdGVtcGxhdGVOYW1lT3JQYXRoICsgJ1wiJyk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGVtcGxhdGUoZGF0YSwgdGhpcyk7XHJcbn1cclxuLyoqIEV0YSdzIGJhc2UgKGdsb2JhbCkgY29uZmlndXJhdGlvbiAqL1xyXG52YXIgY29uZmlnID0ge1xyXG4gICAgYXN5bmM6IGZhbHNlLFxyXG4gICAgYXV0b0VzY2FwZTogdHJ1ZSxcclxuICAgIGF1dG9UcmltOiBbZmFsc2UsICdubCddLFxyXG4gICAgY2FjaGU6IGZhbHNlLFxyXG4gICAgZTogWE1MRXNjYXBlLFxyXG4gICAgaW5jbHVkZTogaW5jbHVkZUhlbHBlcixcclxuICAgIHBhcnNlOiB7XHJcbiAgICAgICAgZXhlYzogJycsXHJcbiAgICAgICAgaW50ZXJwb2xhdGU6ICc9JyxcclxuICAgICAgICByYXc6ICd+J1xyXG4gICAgfSxcclxuICAgIHBsdWdpbnM6IFtdLFxyXG4gICAgcm1XaGl0ZXNwYWNlOiBmYWxzZSxcclxuICAgIHRhZ3M6IFsnPCUnLCAnJT4nXSxcclxuICAgIHRlbXBsYXRlczogdGVtcGxhdGVzLFxyXG4gICAgdXNlV2l0aDogZmFsc2UsXHJcbiAgICB2YXJOYW1lOiAnaXQnXHJcbn07XHJcbi8qKlxyXG4gKiBUYWtlcyBvbmUgb3IgdHdvIHBhcnRpYWwgKG5vdCBuZWNlc3NhcmlseSBjb21wbGV0ZSkgY29uZmlndXJhdGlvbiBvYmplY3RzLCBtZXJnZXMgdGhlbSAxIGxheWVyIGRlZXAgaW50byBldGEuY29uZmlnLCBhbmQgcmV0dXJucyB0aGUgcmVzdWx0XHJcbiAqXHJcbiAqIEBwYXJhbSBvdmVycmlkZSBQYXJ0aWFsIGNvbmZpZ3VyYXRpb24gb2JqZWN0XHJcbiAqIEBwYXJhbSBiYXNlQ29uZmlnIFBhcnRpYWwgY29uZmlndXJhdGlvbiBvYmplY3QgdG8gbWVyZ2UgYmVmb3JlIGBvdmVycmlkZWBcclxuICpcclxuICogKipFeGFtcGxlKipcclxuICpcclxuICogYGBganNcclxuICogbGV0IGN1c3RvbUNvbmZpZyA9IGdldENvbmZpZyh7dGFnczogWychIycsICcjISddfSlcclxuICogYGBgXHJcbiAqL1xyXG5mdW5jdGlvbiBnZXRDb25maWcob3ZlcnJpZGUsIGJhc2VDb25maWcpIHtcclxuICAgIC8vIFRPRE86IHJ1biBtb3JlIHRlc3RzIG9uIHRoaXNcclxuICAgIHZhciByZXMgPSB7fTsgLy8gTGlua2VkXHJcbiAgICBjb3B5UHJvcHMocmVzLCBjb25maWcpOyAvLyBDcmVhdGVzIGRlZXAgY2xvbmUgb2YgZXRhLmNvbmZpZywgMSBsYXllciBkZWVwXHJcbiAgICBpZiAoYmFzZUNvbmZpZykge1xyXG4gICAgICAgIGNvcHlQcm9wcyhyZXMsIGJhc2VDb25maWcpO1xyXG4gICAgfVxyXG4gICAgaWYgKG92ZXJyaWRlKSB7XHJcbiAgICAgICAgY29weVByb3BzKHJlcywgb3ZlcnJpZGUpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHJlcztcclxufVxyXG4vKiogVXBkYXRlIEV0YSdzIGJhc2UgY29uZmlnICovXHJcbmZ1bmN0aW9uIGNvbmZpZ3VyZShvcHRpb25zKSB7XHJcbiAgICByZXR1cm4gY29weVByb3BzKGNvbmZpZywgb3B0aW9ucyk7XHJcbn1cblxuLyogRU5EIFRZUEVTICovXHJcbi8qKlxyXG4gKiBUYWtlcyBhIHRlbXBsYXRlIHN0cmluZyBhbmQgcmV0dXJucyBhIHRlbXBsYXRlIGZ1bmN0aW9uIHRoYXQgY2FuIGJlIGNhbGxlZCB3aXRoIChkYXRhLCBjb25maWcsIFtjYl0pXHJcbiAqXHJcbiAqIEBwYXJhbSBzdHIgLSBUaGUgdGVtcGxhdGUgc3RyaW5nXHJcbiAqIEBwYXJhbSBjb25maWcgLSBBIGN1c3RvbSBjb25maWd1cmF0aW9uIG9iamVjdCAob3B0aW9uYWwpXHJcbiAqXHJcbiAqICoqRXhhbXBsZSoqXHJcbiAqXHJcbiAqIGBgYGpzXHJcbiAqIGxldCBjb21waWxlZEZuID0gZXRhLmNvbXBpbGUoXCJIaSA8JT0gaXQudXNlciAlPlwiKVxyXG4gKiAvLyBmdW5jdGlvbiBhbm9ueW1vdXMoKVxyXG4gKiBsZXQgY29tcGlsZWRGblN0ciA9IGNvbXBpbGVkRm4udG9TdHJpbmcoKVxyXG4gKiAvLyBcImZ1bmN0aW9uIGFub255bW91cyhpdCxFLGNiXFxuKSB7XFxudmFyIHRSPScnLGluY2x1ZGU9RS5pbmNsdWRlLmJpbmQoRSksaW5jbHVkZUZpbGU9RS5pbmNsdWRlRmlsZS5iaW5kKEUpO3RSKz0nSGkgJzt0Uis9RS5lKGl0LnVzZXIpO2lmKGNiKXtjYihudWxsLHRSKX0gcmV0dXJuIHRSXFxufVwiXHJcbiAqIGBgYFxyXG4gKi9cclxuZnVuY3Rpb24gY29tcGlsZShzdHIsIGNvbmZpZykge1xyXG4gICAgdmFyIG9wdGlvbnMgPSBnZXRDb25maWcoY29uZmlnIHx8IHt9KTtcclxuICAgIC8qIEFTWU5DIEhBTkRMSU5HICovXHJcbiAgICAvLyBUaGUgYmVsb3cgY29kZSBpcyBtb2RpZmllZCBmcm9tIG1kZS9lanMuIEFsbCBjcmVkaXQgc2hvdWxkIGdvIHRvIHRoZW0uXHJcbiAgICB2YXIgY3RvciA9IG9wdGlvbnMuYXN5bmMgPyBnZXRBc3luY0Z1bmN0aW9uQ29uc3RydWN0b3IoKSA6IEZ1bmN0aW9uO1xyXG4gICAgLyogRU5EIEFTWU5DIEhBTkRMSU5HICovXHJcbiAgICB0cnkge1xyXG4gICAgICAgIHJldHVybiBuZXcgY3RvcihvcHRpb25zLnZhck5hbWUsICdFJywgLy8gRXRhQ29uZmlnXHJcbiAgICAgICAgJ2NiJywgLy8gb3B0aW9uYWwgY2FsbGJhY2tcclxuICAgICAgICBjb21waWxlVG9TdHJpbmcoc3RyLCBvcHRpb25zKSk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tbmV3LWZ1bmNcclxuICAgIH1cclxuICAgIGNhdGNoIChlKSB7XHJcbiAgICAgICAgaWYgKGUgaW5zdGFuY2VvZiBTeW50YXhFcnJvcikge1xyXG4gICAgICAgICAgICB0aHJvdyBFdGFFcnIoJ0JhZCB0ZW1wbGF0ZSBzeW50YXhcXG5cXG4nICtcclxuICAgICAgICAgICAgICAgIGUubWVzc2FnZSArXHJcbiAgICAgICAgICAgICAgICAnXFxuJyArXHJcbiAgICAgICAgICAgICAgICBBcnJheShlLm1lc3NhZ2UubGVuZ3RoICsgMSkuam9pbignPScpICtcclxuICAgICAgICAgICAgICAgICdcXG4nICtcclxuICAgICAgICAgICAgICAgIGNvbXBpbGVUb1N0cmluZyhzdHIsIG9wdGlvbnMpICtcclxuICAgICAgICAgICAgICAgICdcXG4nIC8vIFRoaXMgd2lsbCBwdXQgYW4gZXh0cmEgbmV3bGluZSBiZWZvcmUgdGhlIGNhbGxzdGFjayBmb3IgZXh0cmEgcmVhZGFiaWxpdHlcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHRocm93IGU7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XG5cbnZhciBfQk9NID0gL15cXHVGRUZGLztcclxuLyogRU5EIFRZUEVTICovXHJcbi8qKlxyXG4gKiBHZXQgdGhlIHBhdGggdG8gdGhlIGluY2x1ZGVkIGZpbGUgZnJvbSB0aGUgcGFyZW50IGZpbGUgcGF0aCBhbmQgdGhlXHJcbiAqIHNwZWNpZmllZCBwYXRoLlxyXG4gKlxyXG4gKiBJZiBgbmFtZWAgZG9lcyBub3QgaGF2ZSBhbiBleHRlbnNpb24sIGl0IHdpbGwgZGVmYXVsdCB0byBgLmV0YWBcclxuICpcclxuICogQHBhcmFtIG5hbWUgc3BlY2lmaWVkIHBhdGhcclxuICogQHBhcmFtIHBhcmVudGZpbGUgcGFyZW50IGZpbGUgcGF0aFxyXG4gKiBAcGFyYW0gaXNEaXJlY3Rvcnkgd2hldGhlciBwYXJlbnRmaWxlIGlzIGEgZGlyZWN0b3J5XHJcbiAqIEByZXR1cm4gYWJzb2x1dGUgcGF0aCB0byB0ZW1wbGF0ZVxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0V2hvbGVGaWxlUGF0aChuYW1lLCBwYXJlbnRmaWxlLCBpc0RpcmVjdG9yeSkge1xyXG4gICAgdmFyIGluY2x1ZGVQYXRoID0gcGF0aC5yZXNvbHZlKGlzRGlyZWN0b3J5ID8gcGFyZW50ZmlsZSA6IHBhdGguZGlybmFtZShwYXJlbnRmaWxlKSwgLy8gcmV0dXJucyBkaXJlY3RvcnkgdGhlIHBhcmVudCBmaWxlIGlzIGluXHJcbiAgICBuYW1lIC8vIGZpbGVcclxuICAgICkgKyAocGF0aC5leHRuYW1lKG5hbWUpID8gJycgOiAnLmV0YScpO1xyXG4gICAgcmV0dXJuIGluY2x1ZGVQYXRoO1xyXG59XHJcbi8qKlxyXG4gKiBHZXQgdGhlIGFic29sdXRlIHBhdGggdG8gYW4gaW5jbHVkZWQgdGVtcGxhdGVcclxuICpcclxuICogSWYgdGhpcyBpcyBjYWxsZWQgd2l0aCBhbiBhYnNvbHV0ZSBwYXRoIChmb3IgZXhhbXBsZSwgc3RhcnRpbmcgd2l0aCAnLycgb3IgJ0M6XFwnKVxyXG4gKiB0aGVuIEV0YSB3aWxsIGF0dGVtcHQgdG8gcmVzb2x2ZSB0aGUgYWJzb2x1dGUgcGF0aCB3aXRoaW4gb3B0aW9ucy52aWV3cy4gSWYgaXQgY2Fubm90LFxyXG4gKiBFdGEgd2lsbCBmYWxsYmFjayB0byBvcHRpb25zLnJvb3Qgb3IgJy8nXHJcbiAqXHJcbiAqIElmIHRoaXMgaXMgY2FsbGVkIHdpdGggYSByZWxhdGl2ZSBwYXRoLCBFdGEgd2lsbDpcclxuICogLSBMb29rIHJlbGF0aXZlIHRvIHRoZSBjdXJyZW50IHRlbXBsYXRlIChpZiB0aGUgY3VycmVudCB0ZW1wbGF0ZSBoYXMgdGhlIGBmaWxlbmFtZWAgcHJvcGVydHkpXHJcbiAqIC0gTG9vayBpbnNpZGUgZWFjaCBkaXJlY3RvcnkgaW4gb3B0aW9ucy52aWV3c1xyXG4gKlxyXG4gKiBOb3RlOiBpZiBFdGEgaXMgdW5hYmxlIHRvIGZpbmQgYSB0ZW1wbGF0ZSB1c2luZyBwYXRoIGFuZCBvcHRpb25zLCBpdCB3aWxsIHRocm93IGFuIGVycm9yLlxyXG4gKlxyXG4gKiBAcGFyYW0gcGF0aCAgICBzcGVjaWZpZWQgcGF0aFxyXG4gKiBAcGFyYW0gb3B0aW9ucyBjb21waWxhdGlvbiBvcHRpb25zXHJcbiAqIEByZXR1cm4gYWJzb2x1dGUgcGF0aCB0byB0ZW1wbGF0ZVxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0UGF0aChwYXRoLCBvcHRpb25zKSB7XHJcbiAgICB2YXIgaW5jbHVkZVBhdGggPSBmYWxzZTtcclxuICAgIHZhciB2aWV3cyA9IG9wdGlvbnMudmlld3M7XHJcbiAgICB2YXIgc2VhcmNoZWRQYXRocyA9IFtdO1xyXG4gICAgLy8gSWYgdGhlc2UgZm91ciB2YWx1ZXMgYXJlIHRoZSBzYW1lLFxyXG4gICAgLy8gZ2V0UGF0aCgpIHdpbGwgcmV0dXJuIHRoZSBzYW1lIHJlc3VsdCBldmVyeSB0aW1lLlxyXG4gICAgLy8gV2UgY2FuIGNhY2hlIHRoZSByZXN1bHQgdG8gYXZvaWQgZXhwZW5zaXZlXHJcbiAgICAvLyBmaWxlIG9wZXJhdGlvbnMuXHJcbiAgICB2YXIgcGF0aE9wdGlvbnMgPSBKU09OLnN0cmluZ2lmeSh7XHJcbiAgICAgICAgZmlsZW5hbWU6IG9wdGlvbnMuZmlsZW5hbWUsXHJcbiAgICAgICAgcGF0aDogcGF0aCxcclxuICAgICAgICByb290OiBvcHRpb25zLnJvb3QsXHJcbiAgICAgICAgdmlld3M6IG9wdGlvbnMudmlld3NcclxuICAgIH0pO1xyXG4gICAgaWYgKG9wdGlvbnMuY2FjaGUgJiYgb3B0aW9ucy5maWxlcGF0aENhY2hlICYmIG9wdGlvbnMuZmlsZXBhdGhDYWNoZVtwYXRoT3B0aW9uc10pIHtcclxuICAgICAgICAvLyBVc2UgdGhlIGNhY2hlZCBmaWxlcGF0aFxyXG4gICAgICAgIHJldHVybiBvcHRpb25zLmZpbGVwYXRoQ2FjaGVbcGF0aE9wdGlvbnNdO1xyXG4gICAgfVxyXG4gICAgLyoqIEFkZCBhIGZpbGVwYXRoIHRvIHRoZSBsaXN0IG9mIHBhdGhzIHdlJ3ZlIGNoZWNrZWQgZm9yIGEgdGVtcGxhdGUgKi9cclxuICAgIGZ1bmN0aW9uIGFkZFBhdGhUb1NlYXJjaGVkKHBhdGhTZWFyY2hlZCkge1xyXG4gICAgICAgIGlmICghc2VhcmNoZWRQYXRocy5pbmNsdWRlcyhwYXRoU2VhcmNoZWQpKSB7XHJcbiAgICAgICAgICAgIHNlYXJjaGVkUGF0aHMucHVzaChwYXRoU2VhcmNoZWQpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIC8qKlxyXG4gICAgICogVGFrZSBhIGZpbGVwYXRoIChsaWtlICdwYXJ0aWFscy9teXBhcnRpYWwuZXRhJykuIEF0dGVtcHQgdG8gZmluZCB0aGUgdGVtcGxhdGUgZmlsZSBpbnNpZGUgYHZpZXdzYDtcclxuICAgICAqIHJldHVybiB0aGUgcmVzdWx0aW5nIHRlbXBsYXRlIGZpbGUgcGF0aCwgb3IgYGZhbHNlYCB0byBpbmRpY2F0ZSB0aGF0IHRoZSB0ZW1wbGF0ZSB3YXMgbm90IGZvdW5kLlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB2aWV3cyB0aGUgZmlsZXBhdGggdGhhdCBob2xkcyB0ZW1wbGF0ZXMsIG9yIGFuIGFycmF5IG9mIGZpbGVwYXRocyB0aGF0IGhvbGQgdGVtcGxhdGVzXHJcbiAgICAgKiBAcGFyYW0gcGF0aCB0aGUgcGF0aCB0byB0aGUgdGVtcGxhdGVcclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gc2VhcmNoVmlld3Modmlld3MsIHBhdGgpIHtcclxuICAgICAgICB2YXIgZmlsZVBhdGg7XHJcbiAgICAgICAgLy8gSWYgdmlld3MgaXMgYW4gYXJyYXksIHRoZW4gbG9vcCB0aHJvdWdoIGVhY2ggZGlyZWN0b3J5XHJcbiAgICAgICAgLy8gQW5kIGF0dGVtcHQgdG8gZmluZCB0aGUgdGVtcGxhdGVcclxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh2aWV3cykgJiZcclxuICAgICAgICAgICAgdmlld3Muc29tZShmdW5jdGlvbiAodikge1xyXG4gICAgICAgICAgICAgICAgZmlsZVBhdGggPSBnZXRXaG9sZUZpbGVQYXRoKHBhdGgsIHYsIHRydWUpO1xyXG4gICAgICAgICAgICAgICAgYWRkUGF0aFRvU2VhcmNoZWQoZmlsZVBhdGgpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGV4aXN0c1N5bmMoZmlsZVBhdGgpO1xyXG4gICAgICAgICAgICB9KSkge1xyXG4gICAgICAgICAgICAvLyBJZiB0aGUgYWJvdmUgcmV0dXJuZWQgdHJ1ZSwgd2Uga25vdyB0aGF0IHRoZSBmaWxlUGF0aCB3YXMganVzdCBzZXQgdG8gYSBwYXRoXHJcbiAgICAgICAgICAgIC8vIFRoYXQgZXhpc3RzIChBcnJheS5zb21lKCkgcmV0dXJucyBhcyBzb29uIGFzIGl0IGZpbmRzIGEgdmFsaWQgZWxlbWVudClcclxuICAgICAgICAgICAgcmV0dXJuIGZpbGVQYXRoO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmICh0eXBlb2Ygdmlld3MgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgICAgIC8vIFNlYXJjaCBmb3IgdGhlIGZpbGUgaWYgdmlld3MgaXMgYSBzaW5nbGUgZGlyZWN0b3J5XHJcbiAgICAgICAgICAgIGZpbGVQYXRoID0gZ2V0V2hvbGVGaWxlUGF0aChwYXRoLCB2aWV3cywgdHJ1ZSk7XHJcbiAgICAgICAgICAgIGFkZFBhdGhUb1NlYXJjaGVkKGZpbGVQYXRoKTtcclxuICAgICAgICAgICAgaWYgKGV4aXN0c1N5bmMoZmlsZVBhdGgpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmlsZVBhdGg7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gVW5hYmxlIHRvIGZpbmQgYSBmaWxlXHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gICAgLy8gUGF0aCBzdGFydHMgd2l0aCAnLycsICdDOlxcJywgZXRjLlxyXG4gICAgdmFyIG1hdGNoID0gL15bQS1aYS16XSs6XFxcXHxeXFwvLy5leGVjKHBhdGgpO1xyXG4gICAgLy8gQWJzb2x1dGUgcGF0aCwgbGlrZSAvcGFydGlhbHMvcGFydGlhbC5ldGFcclxuICAgIGlmIChtYXRjaCAmJiBtYXRjaC5sZW5ndGgpIHtcclxuICAgICAgICAvLyBXZSBoYXZlIHRvIHRyaW0gdGhlIGJlZ2lubmluZyAnLycgb2ZmIHRoZSBwYXRoLCBvciBlbHNlXHJcbiAgICAgICAgLy8gcGF0aC5yZXNvbHZlKGRpciwgcGF0aCkgd2lsbCBhbHdheXMgcmVzb2x2ZSB0byBqdXN0IHBhdGhcclxuICAgICAgICB2YXIgZm9ybWF0dGVkUGF0aCA9IHBhdGgucmVwbGFjZSgvXlxcLyovLCAnJyk7XHJcbiAgICAgICAgLy8gRmlyc3QsIHRyeSB0byByZXNvbHZlIHRoZSBwYXRoIHdpdGhpbiBvcHRpb25zLnZpZXdzXHJcbiAgICAgICAgaW5jbHVkZVBhdGggPSBzZWFyY2hWaWV3cyh2aWV3cywgZm9ybWF0dGVkUGF0aCk7XHJcbiAgICAgICAgaWYgKCFpbmNsdWRlUGF0aCkge1xyXG4gICAgICAgICAgICAvLyBJZiB0aGF0IGZhaWxzLCBzZWFyY2hWaWV3cyB3aWxsIHJldHVybiBmYWxzZS4gVHJ5IHRvIGZpbmQgdGhlIHBhdGhcclxuICAgICAgICAgICAgLy8gaW5zaWRlIG9wdGlvbnMucm9vdCAoYnkgZGVmYXVsdCAnLycsIHRoZSBiYXNlIG9mIHRoZSBmaWxlc3lzdGVtKVxyXG4gICAgICAgICAgICB2YXIgcGF0aEZyb21Sb290ID0gZ2V0V2hvbGVGaWxlUGF0aChmb3JtYXR0ZWRQYXRoLCBvcHRpb25zLnJvb3QgfHwgJy8nLCB0cnVlKTtcclxuICAgICAgICAgICAgYWRkUGF0aFRvU2VhcmNoZWQocGF0aEZyb21Sb290KTtcclxuICAgICAgICAgICAgaW5jbHVkZVBhdGggPSBwYXRoRnJvbVJvb3Q7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgICAgLy8gUmVsYXRpdmUgcGF0aHNcclxuICAgICAgICAvLyBMb29rIHJlbGF0aXZlIHRvIGEgcGFzc2VkIGZpbGVuYW1lIGZpcnN0XHJcbiAgICAgICAgaWYgKG9wdGlvbnMuZmlsZW5hbWUpIHtcclxuICAgICAgICAgICAgdmFyIGZpbGVQYXRoID0gZ2V0V2hvbGVGaWxlUGF0aChwYXRoLCBvcHRpb25zLmZpbGVuYW1lKTtcclxuICAgICAgICAgICAgYWRkUGF0aFRvU2VhcmNoZWQoZmlsZVBhdGgpO1xyXG4gICAgICAgICAgICBpZiAoZXhpc3RzU3luYyhmaWxlUGF0aCkpIHtcclxuICAgICAgICAgICAgICAgIGluY2x1ZGVQYXRoID0gZmlsZVBhdGg7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gVGhlbiBsb29rIGZvciB0aGUgdGVtcGxhdGUgaW4gb3B0aW9ucy52aWV3c1xyXG4gICAgICAgIGlmICghaW5jbHVkZVBhdGgpIHtcclxuICAgICAgICAgICAgaW5jbHVkZVBhdGggPSBzZWFyY2hWaWV3cyh2aWV3cywgcGF0aCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICghaW5jbHVkZVBhdGgpIHtcclxuICAgICAgICAgICAgdGhyb3cgRXRhRXJyKCdDb3VsZCBub3QgZmluZCB0aGUgdGVtcGxhdGUgXCInICsgcGF0aCArICdcIi4gUGF0aHMgdHJpZWQ6ICcgKyBzZWFyY2hlZFBhdGhzKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICAvLyBJZiBjYWNoaW5nIGFuZCBmaWxlcGF0aENhY2hlIGFyZSBlbmFibGVkLFxyXG4gICAgLy8gY2FjaGUgdGhlIGlucHV0ICYgb3V0cHV0IG9mIHRoaXMgZnVuY3Rpb24uXHJcbiAgICBpZiAob3B0aW9ucy5jYWNoZSAmJiBvcHRpb25zLmZpbGVwYXRoQ2FjaGUpIHtcclxuICAgICAgICBvcHRpb25zLmZpbGVwYXRoQ2FjaGVbcGF0aE9wdGlvbnNdID0gaW5jbHVkZVBhdGg7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gaW5jbHVkZVBhdGg7XHJcbn1cclxuLyoqXHJcbiAqIFJlYWRzIGEgZmlsZSBzeW5jaHJvbm91c2x5XHJcbiAqL1xyXG5mdW5jdGlvbiByZWFkRmlsZShmaWxlUGF0aCkge1xyXG4gICAgdHJ5IHtcclxuICAgICAgICByZXR1cm4gcmVhZEZpbGVTeW5jKGZpbGVQYXRoKS50b1N0cmluZygpLnJlcGxhY2UoX0JPTSwgJycpOyAvLyBUT0RPOiBpcyByZXBsYWNpbmcgQk9NJ3MgbmVjZXNzYXJ5P1xyXG4gICAgfVxyXG4gICAgY2F0Y2ggKF9hKSB7XHJcbiAgICAgICAgdGhyb3cgRXRhRXJyKFwiRmFpbGVkIHRvIHJlYWQgdGVtcGxhdGUgYXQgJ1wiICsgZmlsZVBhdGggKyBcIidcIik7XHJcbiAgICB9XHJcbn1cblxuLy8gZXhwcmVzcyBpcyBzZXQgbGlrZTogYXBwLmVuZ2luZSgnaHRtbCcsIHJlcXVpcmUoJ2V0YScpLnJlbmRlckZpbGUpXHJcbi8qIEVORCBUWVBFUyAqL1xyXG4vKipcclxuICogUmVhZHMgYSB0ZW1wbGF0ZSwgY29tcGlsZXMgaXQgaW50byBhIGZ1bmN0aW9uLCBjYWNoZXMgaXQgaWYgY2FjaGluZyBpc24ndCBkaXNhYmxlZCwgcmV0dXJucyB0aGUgZnVuY3Rpb25cclxuICpcclxuICogQHBhcmFtIGZpbGVQYXRoIEFic29sdXRlIHBhdGggdG8gdGVtcGxhdGUgZmlsZVxyXG4gKiBAcGFyYW0gb3B0aW9ucyBFdGEgY29uZmlndXJhdGlvbiBvdmVycmlkZXNcclxuICogQHBhcmFtIG5vQ2FjaGUgT3B0aW9uYWxseSwgbWFrZSBFdGEgbm90IGNhY2hlIHRoZSB0ZW1wbGF0ZVxyXG4gKi9cclxuZnVuY3Rpb24gbG9hZEZpbGUoZmlsZVBhdGgsIG9wdGlvbnMsIG5vQ2FjaGUpIHtcclxuICAgIHZhciBjb25maWcgPSBnZXRDb25maWcob3B0aW9ucyk7XHJcbiAgICB2YXIgdGVtcGxhdGUgPSByZWFkRmlsZShmaWxlUGF0aCk7XHJcbiAgICB0cnkge1xyXG4gICAgICAgIHZhciBjb21waWxlZFRlbXBsYXRlID0gY29tcGlsZSh0ZW1wbGF0ZSwgY29uZmlnKTtcclxuICAgICAgICBpZiAoIW5vQ2FjaGUpIHtcclxuICAgICAgICAgICAgY29uZmlnLnRlbXBsYXRlcy5kZWZpbmUoY29uZmlnLmZpbGVuYW1lLCBjb21waWxlZFRlbXBsYXRlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGNvbXBpbGVkVGVtcGxhdGU7XHJcbiAgICB9XHJcbiAgICBjYXRjaCAoZSkge1xyXG4gICAgICAgIHRocm93IEV0YUVycignTG9hZGluZyBmaWxlOiAnICsgZmlsZVBhdGggKyAnIGZhaWxlZDpcXG5cXG4nICsgZS5tZXNzYWdlKTtcclxuICAgIH1cclxufVxyXG4vKipcclxuICogR2V0IHRoZSB0ZW1wbGF0ZSBmcm9tIGEgc3RyaW5nIG9yIGEgZmlsZSwgZWl0aGVyIGNvbXBpbGVkIG9uLXRoZS1mbHkgb3JcclxuICogcmVhZCBmcm9tIGNhY2hlIChpZiBlbmFibGVkKSwgYW5kIGNhY2hlIHRoZSB0ZW1wbGF0ZSBpZiBuZWVkZWQuXHJcbiAqXHJcbiAqIElmIGBvcHRpb25zLmNhY2hlYCBpcyB0cnVlLCB0aGlzIGZ1bmN0aW9uIHJlYWRzIHRoZSBmaWxlIGZyb21cclxuICogYG9wdGlvbnMuZmlsZW5hbWVgIHNvIGl0IG11c3QgYmUgc2V0IHByaW9yIHRvIGNhbGxpbmcgdGhpcyBmdW5jdGlvbi5cclxuICpcclxuICogQHBhcmFtIG9wdGlvbnMgICBjb21waWxhdGlvbiBvcHRpb25zXHJcbiAqIEByZXR1cm4gRXRhIHRlbXBsYXRlIGZ1bmN0aW9uXHJcbiAqL1xyXG5mdW5jdGlvbiBoYW5kbGVDYWNoZSQxKG9wdGlvbnMpIHtcclxuICAgIHZhciBmaWxlbmFtZSA9IG9wdGlvbnMuZmlsZW5hbWU7XHJcbiAgICBpZiAob3B0aW9ucy5jYWNoZSkge1xyXG4gICAgICAgIHZhciBmdW5jID0gb3B0aW9ucy50ZW1wbGF0ZXMuZ2V0KGZpbGVuYW1lKTtcclxuICAgICAgICBpZiAoZnVuYykge1xyXG4gICAgICAgICAgICByZXR1cm4gZnVuYztcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGxvYWRGaWxlKGZpbGVuYW1lLCBvcHRpb25zKTtcclxuICAgIH1cclxuICAgIC8vIENhY2hpbmcgaXMgZGlzYWJsZWQsIHNvIHBhc3Mgbm9DYWNoZSA9IHRydWVcclxuICAgIHJldHVybiBsb2FkRmlsZShmaWxlbmFtZSwgb3B0aW9ucywgdHJ1ZSk7XHJcbn1cclxuLyoqXHJcbiAqIFRyeSBjYWxsaW5nIGhhbmRsZUNhY2hlIHdpdGggdGhlIGdpdmVuIG9wdGlvbnMgYW5kIGRhdGEgYW5kIGNhbGwgdGhlXHJcbiAqIGNhbGxiYWNrIHdpdGggdGhlIHJlc3VsdC4gSWYgYW4gZXJyb3Igb2NjdXJzLCBjYWxsIHRoZSBjYWxsYmFjayB3aXRoXHJcbiAqIHRoZSBlcnJvci4gVXNlZCBieSByZW5kZXJGaWxlKCkuXHJcbiAqXHJcbiAqIEBwYXJhbSBkYXRhIHRlbXBsYXRlIGRhdGFcclxuICogQHBhcmFtIG9wdGlvbnMgY29tcGlsYXRpb24gb3B0aW9uc1xyXG4gKiBAcGFyYW0gY2IgY2FsbGJhY2tcclxuICovXHJcbmZ1bmN0aW9uIHRyeUhhbmRsZUNhY2hlKGRhdGEsIG9wdGlvbnMsIGNiKSB7XHJcbiAgICBpZiAoY2IpIHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAvLyBOb3RlOiBpZiB0aGVyZSBpcyBhbiBlcnJvciB3aGlsZSByZW5kZXJpbmcgdGhlIHRlbXBsYXRlLFxyXG4gICAgICAgICAgICAvLyBJdCB3aWxsIGJ1YmJsZSB1cCBhbmQgYmUgY2F1Z2h0IGhlcmVcclxuICAgICAgICAgICAgdmFyIHRlbXBsYXRlRm4gPSBoYW5kbGVDYWNoZSQxKG9wdGlvbnMpO1xyXG4gICAgICAgICAgICB0ZW1wbGF0ZUZuKGRhdGEsIG9wdGlvbnMsIGNiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY2F0Y2ggKGVycikge1xyXG4gICAgICAgICAgICByZXR1cm4gY2IoZXJyKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgICAvLyBObyBjYWxsYmFjaywgdHJ5IHJldHVybmluZyBhIHByb21pc2VcclxuICAgICAgICBpZiAodHlwZW9mIHByb21pc2VJbXBsID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgcHJvbWlzZUltcGwoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xyXG4gICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgdGVtcGxhdGVGbiA9IGhhbmRsZUNhY2hlJDEob3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IHRlbXBsYXRlRm4oZGF0YSwgb3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShyZXN1bHQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY2F0Y2ggKGVycikge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHRocm93IEV0YUVycihcIlBsZWFzZSBwcm92aWRlIGEgY2FsbGJhY2sgZnVuY3Rpb24sIHRoaXMgZW52IGRvZXNuJ3Qgc3VwcG9ydCBQcm9taXNlc1wiKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuLyoqXHJcbiAqIEdldCB0aGUgdGVtcGxhdGUgZnVuY3Rpb24uXHJcbiAqXHJcbiAqIElmIGBvcHRpb25zLmNhY2hlYCBpcyBgdHJ1ZWAsIHRoZW4gdGhlIHRlbXBsYXRlIGlzIGNhY2hlZC5cclxuICpcclxuICogVGhpcyByZXR1cm5zIGEgdGVtcGxhdGUgZnVuY3Rpb24gYW5kIHRoZSBjb25maWcgb2JqZWN0IHdpdGggd2hpY2ggdGhhdCB0ZW1wbGF0ZSBmdW5jdGlvbiBzaG91bGQgYmUgY2FsbGVkLlxyXG4gKlxyXG4gKiBAcmVtYXJrc1xyXG4gKlxyXG4gKiBJdCdzIGltcG9ydGFudCB0aGF0IHRoaXMgcmV0dXJucyBhIGNvbmZpZyBvYmplY3Qgd2l0aCBgZmlsZW5hbWVgIHNldC5cclxuICogT3RoZXJ3aXNlLCB0aGUgaW5jbHVkZWQgZmlsZSB3b3VsZCBub3QgYmUgYWJsZSB0byB1c2UgcmVsYXRpdmUgcGF0aHNcclxuICpcclxuICogQHBhcmFtIHBhdGggcGF0aCBmb3IgdGhlIHNwZWNpZmllZCBmaWxlIChpZiByZWxhdGl2ZSwgc3BlY2lmeSBgdmlld3NgIG9uIGBvcHRpb25zYClcclxuICogQHBhcmFtIG9wdGlvbnMgY29tcGlsYXRpb24gb3B0aW9uc1xyXG4gKiBAcmV0dXJuIFtFdGEgdGVtcGxhdGUgZnVuY3Rpb24sIG5ldyBjb25maWcgb2JqZWN0XVxyXG4gKi9cclxuZnVuY3Rpb24gaW5jbHVkZUZpbGUocGF0aCwgb3B0aW9ucykge1xyXG4gICAgLy8gdGhlIGJlbG93IGNyZWF0ZXMgYSBuZXcgb3B0aW9ucyBvYmplY3QsIHVzaW5nIHRoZSBwYXJlbnQgZmlsZXBhdGggb2YgdGhlIG9sZCBvcHRpb25zIG9iamVjdCBhbmQgdGhlIHBhdGhcclxuICAgIHZhciBuZXdGaWxlT3B0aW9ucyA9IGdldENvbmZpZyh7IGZpbGVuYW1lOiBnZXRQYXRoKHBhdGgsIG9wdGlvbnMpIH0sIG9wdGlvbnMpO1xyXG4gICAgLy8gVE9ETzogbWFrZSBzdXJlIHByb3BlcnRpZXMgYXJlIGN1cnJlY3RseSBjb3BpZWQgb3ZlclxyXG4gICAgcmV0dXJuIFtoYW5kbGVDYWNoZSQxKG5ld0ZpbGVPcHRpb25zKSwgbmV3RmlsZU9wdGlvbnNdO1xyXG59XHJcbmZ1bmN0aW9uIHJlbmRlckZpbGUoZmlsZW5hbWUsIGRhdGEsIGNvbmZpZywgY2IpIHtcclxuICAgIC8qXHJcbiAgICBIZXJlIHdlIGhhdmUgc29tZSBmdW5jdGlvbiBvdmVybG9hZGluZy5cclxuICAgIEVzc2VudGlhbGx5LCB0aGUgZmlyc3QgMiBhcmd1bWVudHMgdG8gcmVuZGVyRmlsZSBzaG91bGQgYWx3YXlzIGJlIHRoZSBmaWxlbmFtZSBhbmQgZGF0YVxyXG4gICAgSG93ZXZlciwgd2l0aCBFeHByZXNzLCBjb25maWd1cmF0aW9uIG9wdGlvbnMgd2lsbCBiZSBwYXNzZWQgYWxvbmcgd2l0aCB0aGUgZGF0YS5cclxuICAgIFRodXMsIEV4cHJlc3Mgd2lsbCBjYWxsIHJlbmRlckZpbGUgd2l0aCAoZmlsZW5hbWUsIGRhdGFBbmRPcHRpb25zLCBjYilcclxuICAgIEFuZCB3ZSB3YW50IHRvIGFsc28gbWFrZSAoZmlsZW5hbWUsIGRhdGEsIG9wdGlvbnMsIGNiKSBhdmFpbGFibGVcclxuICAgICovXHJcbiAgICB2YXIgcmVuZGVyQ29uZmlnO1xyXG4gICAgdmFyIGNhbGxiYWNrO1xyXG4gICAgZGF0YSA9IGRhdGEgfHwge307IC8vIElmIGRhdGEgaXMgdW5kZWZpbmVkLCB3ZSBkb24ndCB3YW50IGFjY2Vzc2luZyBkYXRhLnNldHRpbmdzIHRvIGVycm9yXHJcbiAgICAvLyBGaXJzdCwgYXNzaWduIG91ciBjYWxsYmFjayBmdW5jdGlvbiB0byBgY2FsbGJhY2tgXHJcbiAgICAvLyBXZSBjYW4gbGVhdmUgaXQgdW5kZWZpbmVkIGlmIG5laXRoZXIgcGFyYW1ldGVyIGlzIGEgZnVuY3Rpb247XHJcbiAgICAvLyBDYWxsYmFja3MgYXJlIG9wdGlvbmFsXHJcbiAgICBpZiAodHlwZW9mIGNiID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgLy8gVGhlIDR0aCBhcmd1bWVudCBpcyB0aGUgY2FsbGJhY2tcclxuICAgICAgICBjYWxsYmFjayA9IGNiO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAodHlwZW9mIGNvbmZpZyA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgIC8vIFRoZSAzcmQgYXJnIGlzIHRoZSBjYWxsYmFja1xyXG4gICAgICAgIGNhbGxiYWNrID0gY29uZmlnO1xyXG4gICAgfVxyXG4gICAgLy8gSWYgdGhlcmUgaXMgYSBjb25maWcgb2JqZWN0IHBhc3NlZCBpbiBleHBsaWNpdGx5LCB1c2UgaXRcclxuICAgIGlmICh0eXBlb2YgY29uZmlnID09PSAnb2JqZWN0Jykge1xyXG4gICAgICAgIHJlbmRlckNvbmZpZyA9IGdldENvbmZpZyhjb25maWcgfHwge30pO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgICAgLy8gT3RoZXJ3aXNlLCBnZXQgdGhlIGNvbmZpZyBmcm9tIHRoZSBkYXRhIG9iamVjdFxyXG4gICAgICAgIC8vIEFuZCB0aGVuIGdyYWIgc29tZSBjb25maWcgb3B0aW9ucyBmcm9tIGRhdGEuc2V0dGluZ3NcclxuICAgICAgICAvLyBXaGljaCBpcyB3aGVyZSBFeHByZXNzIHNvbWV0aW1lcyBzdG9yZXMgdGhlbVxyXG4gICAgICAgIHJlbmRlckNvbmZpZyA9IGdldENvbmZpZyhkYXRhKTtcclxuICAgICAgICBpZiAoZGF0YS5zZXR0aW5ncykge1xyXG4gICAgICAgICAgICAvLyBQdWxsIGEgZmV3IHRoaW5ncyBmcm9tIGtub3duIGxvY2F0aW9uc1xyXG4gICAgICAgICAgICBpZiAoZGF0YS5zZXR0aW5ncy52aWV3cykge1xyXG4gICAgICAgICAgICAgICAgcmVuZGVyQ29uZmlnLnZpZXdzID0gZGF0YS5zZXR0aW5ncy52aWV3cztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoZGF0YS5zZXR0aW5nc1sndmlldyBjYWNoZSddKSB7XHJcbiAgICAgICAgICAgICAgICByZW5kZXJDb25maWcuY2FjaGUgPSB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIFVuZG9jdW1lbnRlZCBhZnRlciBFeHByZXNzIDIsIGJ1dCBzdGlsbCB1c2FibGUsIGVzcC4gZm9yXHJcbiAgICAgICAgICAgIC8vIGl0ZW1zIHRoYXQgYXJlIHVuc2FmZSB0byBiZSBwYXNzZWQgYWxvbmcgd2l0aCBkYXRhLCBsaWtlIGByb290YFxyXG4gICAgICAgICAgICB2YXIgdmlld09wdHMgPSBkYXRhLnNldHRpbmdzWyd2aWV3IG9wdGlvbnMnXTtcclxuICAgICAgICAgICAgaWYgKHZpZXdPcHRzKSB7XHJcbiAgICAgICAgICAgICAgICBjb3B5UHJvcHMocmVuZGVyQ29uZmlnLCB2aWV3T3B0cyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICAvLyBTZXQgdGhlIGZpbGVuYW1lIG9wdGlvbiBvbiB0aGUgdGVtcGxhdGVcclxuICAgIC8vIFRoaXMgd2lsbCBmaXJzdCB0cnkgdG8gcmVzb2x2ZSB0aGUgZmlsZSBwYXRoIChzZWUgZ2V0UGF0aCBmb3IgZGV0YWlscylcclxuICAgIHJlbmRlckNvbmZpZy5maWxlbmFtZSA9IGdldFBhdGgoZmlsZW5hbWUsIHJlbmRlckNvbmZpZyk7XHJcbiAgICByZXR1cm4gdHJ5SGFuZGxlQ2FjaGUoZGF0YSwgcmVuZGVyQ29uZmlnLCBjYWxsYmFjayk7XHJcbn1cclxuZnVuY3Rpb24gcmVuZGVyRmlsZUFzeW5jKGZpbGVuYW1lLCBkYXRhLCBjb25maWcsIGNiKSB7XHJcbiAgICByZXR1cm4gcmVuZGVyRmlsZShmaWxlbmFtZSwgdHlwZW9mIGNvbmZpZyA9PT0gJ2Z1bmN0aW9uJyA/IF9fYXNzaWduKF9fYXNzaWduKHt9LCBkYXRhKSwgeyBhc3luYzogdHJ1ZSB9KSA6IGRhdGEsIHR5cGVvZiBjb25maWcgPT09ICdvYmplY3QnID8gX19hc3NpZ24oX19hc3NpZ24oe30sIGNvbmZpZyksIHsgYXN5bmM6IHRydWUgfSkgOiBjb25maWcsIGNiKTtcclxufVxuXG4vKiBFTkQgVFlQRVMgKi9cclxuLyoqXHJcbiAqIENhbGxlZCB3aXRoIGBpbmNsdWRlRmlsZShwYXRoLCBkYXRhKWBcclxuICovXHJcbmZ1bmN0aW9uIGluY2x1ZGVGaWxlSGVscGVyKHBhdGgsIGRhdGEpIHtcclxuICAgIHZhciB0ZW1wbGF0ZUFuZENvbmZpZyA9IGluY2x1ZGVGaWxlKHBhdGgsIHRoaXMpO1xyXG4gICAgcmV0dXJuIHRlbXBsYXRlQW5kQ29uZmlnWzBdKGRhdGEsIHRlbXBsYXRlQW5kQ29uZmlnWzFdKTtcclxufVxuXG4vKiBFTkQgVFlQRVMgKi9cclxuZnVuY3Rpb24gaGFuZGxlQ2FjaGUodGVtcGxhdGUsIG9wdGlvbnMpIHtcclxuICAgIGlmIChvcHRpb25zLmNhY2hlICYmIG9wdGlvbnMubmFtZSAmJiBvcHRpb25zLnRlbXBsYXRlcy5nZXQob3B0aW9ucy5uYW1lKSkge1xyXG4gICAgICAgIHJldHVybiBvcHRpb25zLnRlbXBsYXRlcy5nZXQob3B0aW9ucy5uYW1lKTtcclxuICAgIH1cclxuICAgIHZhciB0ZW1wbGF0ZUZ1bmMgPSB0eXBlb2YgdGVtcGxhdGUgPT09ICdmdW5jdGlvbicgPyB0ZW1wbGF0ZSA6IGNvbXBpbGUodGVtcGxhdGUsIG9wdGlvbnMpO1xyXG4gICAgLy8gTm90ZSB0aGF0IHdlIGRvbid0IGhhdmUgdG8gY2hlY2sgaWYgaXQgYWxyZWFkeSBleGlzdHMgaW4gdGhlIGNhY2hlO1xyXG4gICAgLy8gaXQgd291bGQgaGF2ZSByZXR1cm5lZCBlYXJsaWVyIGlmIGl0IGhhZFxyXG4gICAgaWYgKG9wdGlvbnMuY2FjaGUgJiYgb3B0aW9ucy5uYW1lKSB7XHJcbiAgICAgICAgb3B0aW9ucy50ZW1wbGF0ZXMuZGVmaW5lKG9wdGlvbnMubmFtZSwgdGVtcGxhdGVGdW5jKTtcclxuICAgIH1cclxuICAgIHJldHVybiB0ZW1wbGF0ZUZ1bmM7XHJcbn1cclxuLyoqXHJcbiAqIFJlbmRlciBhIHRlbXBsYXRlXHJcbiAqXHJcbiAqIElmIGB0ZW1wbGF0ZWAgaXMgYSBzdHJpbmcsIEV0YSB3aWxsIGNvbXBpbGUgaXQgdG8gYSBmdW5jdGlvbiBhbmQgdGhlbiBjYWxsIGl0IHdpdGggdGhlIHByb3ZpZGVkIGRhdGEuXHJcbiAqIElmIGB0ZW1wbGF0ZWAgaXMgYSB0ZW1wbGF0ZSBmdW5jdGlvbiwgRXRhIHdpbGwgY2FsbCBpdCB3aXRoIHRoZSBwcm92aWRlZCBkYXRhLlxyXG4gKlxyXG4gKiBJZiBgY29uZmlnLmFzeW5jYCBpcyBgZmFsc2VgLCBFdGEgd2lsbCByZXR1cm4gdGhlIHJlbmRlcmVkIHRlbXBsYXRlLlxyXG4gKlxyXG4gKiBJZiBgY29uZmlnLmFzeW5jYCBpcyBgdHJ1ZWAgYW5kIHRoZXJlJ3MgYSBjYWxsYmFjayBmdW5jdGlvbiwgRXRhIHdpbGwgY2FsbCB0aGUgY2FsbGJhY2sgd2l0aCBgKGVyciwgcmVuZGVyZWRUZW1wbGF0ZSlgLlxyXG4gKiBJZiBgY29uZmlnLmFzeW5jYCBpcyBgdHJ1ZWAgYW5kIHRoZXJlJ3Mgbm90IGEgY2FsbGJhY2sgZnVuY3Rpb24sIEV0YSB3aWxsIHJldHVybiBhIFByb21pc2UgdGhhdCByZXNvbHZlcyB0byB0aGUgcmVuZGVyZWQgdGVtcGxhdGUuXHJcbiAqXHJcbiAqIElmIGBjb25maWcuY2FjaGVgIGlzIGB0cnVlYCBhbmQgYGNvbmZpZ2AgaGFzIGEgYG5hbWVgIG9yIGBmaWxlbmFtZWAgcHJvcGVydHksIEV0YSB3aWxsIGNhY2hlIHRoZSB0ZW1wbGF0ZSBvbiB0aGUgZmlyc3QgcmVuZGVyIGFuZCB1c2UgdGhlIGNhY2hlZCB0ZW1wbGF0ZSBmb3IgYWxsIHN1YnNlcXVlbnQgcmVuZGVycy5cclxuICpcclxuICogQHBhcmFtIHRlbXBsYXRlIFRlbXBsYXRlIHN0cmluZyBvciB0ZW1wbGF0ZSBmdW5jdGlvblxyXG4gKiBAcGFyYW0gZGF0YSBEYXRhIHRvIHJlbmRlciB0aGUgdGVtcGxhdGUgd2l0aFxyXG4gKiBAcGFyYW0gY29uZmlnIE9wdGlvbmFsIGNvbmZpZyBvcHRpb25zXHJcbiAqIEBwYXJhbSBjYiBDYWxsYmFjayBmdW5jdGlvblxyXG4gKi9cclxuZnVuY3Rpb24gcmVuZGVyKHRlbXBsYXRlLCBkYXRhLCBjb25maWcsIGNiKSB7XHJcbiAgICB2YXIgb3B0aW9ucyA9IGdldENvbmZpZyhjb25maWcgfHwge30pO1xyXG4gICAgaWYgKG9wdGlvbnMuYXN5bmMpIHtcclxuICAgICAgICBpZiAoY2IpIHtcclxuICAgICAgICAgICAgLy8gSWYgdXNlciBwYXNzZXMgY2FsbGJhY2tcclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIC8vIE5vdGU6IGlmIHRoZXJlIGlzIGFuIGVycm9yIHdoaWxlIHJlbmRlcmluZyB0aGUgdGVtcGxhdGUsXHJcbiAgICAgICAgICAgICAgICAvLyBJdCB3aWxsIGJ1YmJsZSB1cCBhbmQgYmUgY2F1Z2h0IGhlcmVcclxuICAgICAgICAgICAgICAgIHZhciB0ZW1wbGF0ZUZuID0gaGFuZGxlQ2FjaGUodGVtcGxhdGUsIG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgdGVtcGxhdGVGbihkYXRhLCBvcHRpb25zLCBjYik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY2F0Y2ggKGVycikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNiKGVycik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIE5vIGNhbGxiYWNrLCB0cnkgcmV0dXJuaW5nIGEgcHJvbWlzZVxyXG4gICAgICAgICAgICBpZiAodHlwZW9mIHByb21pc2VJbXBsID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IHByb21pc2VJbXBsKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcclxuICAgICAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGhhbmRsZUNhY2hlKHRlbXBsYXRlLCBvcHRpb25zKShkYXRhLCBvcHRpb25zKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycik7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBFdGFFcnIoXCJQbGVhc2UgcHJvdmlkZSBhIGNhbGxiYWNrIGZ1bmN0aW9uLCB0aGlzIGVudiBkb2Vzbid0IHN1cHBvcnQgUHJvbWlzZXNcIik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgICByZXR1cm4gaGFuZGxlQ2FjaGUodGVtcGxhdGUsIG9wdGlvbnMpKGRhdGEsIG9wdGlvbnMpO1xyXG4gICAgfVxyXG59XHJcbi8qKlxyXG4gKiBSZW5kZXIgYSB0ZW1wbGF0ZSBhc3luY2hyb25vdXNseVxyXG4gKlxyXG4gKiBJZiBgdGVtcGxhdGVgIGlzIGEgc3RyaW5nLCBFdGEgd2lsbCBjb21waWxlIGl0IHRvIGEgZnVuY3Rpb24gYW5kIGNhbGwgaXQgd2l0aCB0aGUgcHJvdmlkZWQgZGF0YS5cclxuICogSWYgYHRlbXBsYXRlYCBpcyBhIGZ1bmN0aW9uLCBFdGEgd2lsbCBjYWxsIGl0IHdpdGggdGhlIHByb3ZpZGVkIGRhdGEuXHJcbiAqXHJcbiAqIElmIHRoZXJlIGlzIGEgY2FsbGJhY2sgZnVuY3Rpb24sIEV0YSB3aWxsIGNhbGwgaXQgd2l0aCBgKGVyciwgcmVuZGVyZWRUZW1wbGF0ZSlgLlxyXG4gKiBJZiB0aGVyZSBpcyBub3QgYSBjYWxsYmFjayBmdW5jdGlvbiwgRXRhIHdpbGwgcmV0dXJuIGEgUHJvbWlzZSB0aGF0IHJlc29sdmVzIHRvIHRoZSByZW5kZXJlZCB0ZW1wbGF0ZVxyXG4gKlxyXG4gKiBAcGFyYW0gdGVtcGxhdGUgVGVtcGxhdGUgc3RyaW5nIG9yIHRlbXBsYXRlIGZ1bmN0aW9uXHJcbiAqIEBwYXJhbSBkYXRhIERhdGEgdG8gcmVuZGVyIHRoZSB0ZW1wbGF0ZSB3aXRoXHJcbiAqIEBwYXJhbSBjb25maWcgT3B0aW9uYWwgY29uZmlnIG9wdGlvbnNcclxuICogQHBhcmFtIGNiIENhbGxiYWNrIGZ1bmN0aW9uXHJcbiAqL1xyXG5mdW5jdGlvbiByZW5kZXJBc3luYyh0ZW1wbGF0ZSwgZGF0YSwgY29uZmlnLCBjYikge1xyXG4gICAgLy8gVXNpbmcgT2JqZWN0LmFzc2lnbiB0byBsb3dlciBidW5kbGUgc2l6ZSwgdXNpbmcgc3ByZWFkIG9wZXJhdG9yIG1ha2VzIGl0IGxhcmdlciBiZWNhdXNlIG9mIHR5cGVzY3JpcHQgaW5qZWN0ZWQgcG9seWZpbGxzXHJcbiAgICByZXR1cm4gcmVuZGVyKHRlbXBsYXRlLCBkYXRhLCBPYmplY3QuYXNzaWduKHt9LCBjb25maWcsIHsgYXN5bmM6IHRydWUgfSksIGNiKTtcclxufVxuXG4vLyBAZGVub2lmeS1pZ25vcmVcclxuY29uZmlnLmluY2x1ZGVGaWxlID0gaW5jbHVkZUZpbGVIZWxwZXI7XHJcbmNvbmZpZy5maWxlcGF0aENhY2hlID0ge307XG5cbmV4cG9ydCB7IHJlbmRlckZpbGUgYXMgX19leHByZXNzLCBjb21waWxlLCBjb21waWxlVG9TdHJpbmcsIGNvbmZpZywgY29uZmlndXJlLCBjb25maWcgYXMgZGVmYXVsdENvbmZpZywgZ2V0Q29uZmlnLCBsb2FkRmlsZSwgcGFyc2UsIHJlbmRlciwgcmVuZGVyQXN5bmMsIHJlbmRlckZpbGUsIHJlbmRlckZpbGVBc3luYywgdGVtcGxhdGVzIH07XG4vLyMgc291cmNlTWFwcGluZ1VSTD1ldGEuZXMuanMubWFwXG4iLCJpbXBvcnQgVGVtcGxhdGVyUGx1Z2luIGZyb20gXCJtYWluXCI7XG5pbXBvcnQgeyBBcHAgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IFJ1bm5pbmdDb25maWcgfSBmcm9tIFwiVGVtcGxhdGVyXCI7XG5pbXBvcnQgeyBUUGFyc2VyIH0gZnJvbSBcIlRQYXJzZXJcIjtcblxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIEludGVybmFsTW9kdWxlIGltcGxlbWVudHMgVFBhcnNlciB7XG4gICAgcHJvdGVjdGVkIGFic3RyYWN0IG5hbWU6IHN0cmluZztcbiAgICBwcm90ZWN0ZWQgc3RhdGljX3RlbXBsYXRlczogTWFwPHN0cmluZywgYW55PiA9IG5ldyBNYXAoKTtcbiAgICBwcm90ZWN0ZWQgZHluYW1pY190ZW1wbGF0ZXM6IE1hcDxzdHJpbmcsIGFueT4gPSBuZXcgTWFwKCk7XG4gICAgcHJvdGVjdGVkIGNvbmZpZzogUnVubmluZ0NvbmZpZztcbiAgICBwcml2YXRlIHN0YXRpY19jb250ZXh0OiB7W3g6IHN0cmluZ106IGFueX07XG5cbiAgICBjb25zdHJ1Y3Rvcihwcm90ZWN0ZWQgYXBwOiBBcHAsIHByb3RlY3RlZCBwbHVnaW46IFRlbXBsYXRlclBsdWdpbikge31cblxuICAgIGdldE5hbWUoKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubmFtZVxuICAgIH1cblxuICAgIGFic3RyYWN0IGNyZWF0ZVN0YXRpY1RlbXBsYXRlcygpOiBQcm9taXNlPHZvaWQ+O1xuICAgIGFic3RyYWN0IHVwZGF0ZVRlbXBsYXRlcygpOiBQcm9taXNlPHZvaWQ+O1xuXG4gICAgYXN5bmMgaW5pdCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgYXdhaXQgdGhpcy5jcmVhdGVTdGF0aWNUZW1wbGF0ZXMoKTtcbiAgICAgICAgdGhpcy5zdGF0aWNfY29udGV4dCA9IE9iamVjdC5mcm9tRW50cmllcyh0aGlzLnN0YXRpY190ZW1wbGF0ZXMpO1xuICAgIH1cblxuICAgIGFzeW5jIGdlbmVyYXRlQ29udGV4dChjb25maWc6IFJ1bm5pbmdDb25maWcpOiBQcm9taXNlPHtbeDogc3RyaW5nXTogYW55fT4ge1xuICAgICAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZztcbiAgICAgICAgYXdhaXQgdGhpcy51cGRhdGVUZW1wbGF0ZXMoKTtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgLi4udGhpcy5zdGF0aWNfY29udGV4dCxcbiAgICAgICAgICAgIC4uLk9iamVjdC5mcm9tRW50cmllcyh0aGlzLmR5bmFtaWNfdGVtcGxhdGVzKSxcbiAgICAgICAgfTtcbiAgICB9XG59IiwiaW1wb3J0IHsgVGVtcGxhdGVyRXJyb3IgfSBmcm9tIFwiRXJyb3JcIjtcbmltcG9ydCB7IEludGVybmFsTW9kdWxlIH0gZnJvbSBcIi4uL0ludGVybmFsTW9kdWxlXCI7XG5cbmV4cG9ydCBjbGFzcyBJbnRlcm5hbE1vZHVsZURhdGUgZXh0ZW5kcyBJbnRlcm5hbE1vZHVsZSB7XG4gICAgcHVibGljIG5hbWU6IHN0cmluZyA9IFwiZGF0ZVwiO1xuXG4gICAgYXN5bmMgY3JlYXRlU3RhdGljVGVtcGxhdGVzKCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICB0aGlzLnN0YXRpY190ZW1wbGF0ZXMuc2V0KFwibm93XCIsIHRoaXMuZ2VuZXJhdGVfbm93KCkpO1xuICAgICAgICB0aGlzLnN0YXRpY190ZW1wbGF0ZXMuc2V0KFwidG9tb3Jyb3dcIiwgdGhpcy5nZW5lcmF0ZV90b21vcnJvdygpKTtcbiAgICAgICAgdGhpcy5zdGF0aWNfdGVtcGxhdGVzLnNldChcIndlZWtkYXlcIiwgdGhpcy5nZW5lcmF0ZV93ZWVrZGF5KCkpO1xuICAgICAgICB0aGlzLnN0YXRpY190ZW1wbGF0ZXMuc2V0KFwieWVzdGVyZGF5XCIsIHRoaXMuZ2VuZXJhdGVfeWVzdGVyZGF5KCkpO1xuICAgIH1cblxuICAgIGFzeW5jIHVwZGF0ZVRlbXBsYXRlcygpOiBQcm9taXNlPHZvaWQ+IHt9XG5cbiAgICBnZW5lcmF0ZV9ub3coKTogRnVuY3Rpb24ge1xuICAgICAgICByZXR1cm4gKGZvcm1hdDogc3RyaW5nID0gXCJZWVlZLU1NLUREXCIsIG9mZnNldD86IG51bWJlcnxzdHJpbmcsIHJlZmVyZW5jZT86IHN0cmluZywgcmVmZXJlbmNlX2Zvcm1hdD86IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgaWYgKHJlZmVyZW5jZSAmJiAhd2luZG93Lm1vbWVudChyZWZlcmVuY2UsIHJlZmVyZW5jZV9mb3JtYXQpLmlzVmFsaWQoKSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBUZW1wbGF0ZXJFcnJvcihcIkludmFsaWQgcmVmZXJlbmNlIGRhdGUgZm9ybWF0LCB0cnkgc3BlY2lmeWluZyBvbmUgd2l0aCB0aGUgYXJndW1lbnQgJ3JlZmVyZW5jZV9mb3JtYXQnXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IGR1cmF0aW9uO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBvZmZzZXQgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgICAgICBkdXJhdGlvbiA9IHdpbmRvdy5tb21lbnQuZHVyYXRpb24ob2Zmc2V0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHR5cGVvZiBvZmZzZXQgPT09IFwibnVtYmVyXCIpIHtcbiAgICAgICAgICAgICAgICBkdXJhdGlvbiA9IHdpbmRvdy5tb21lbnQuZHVyYXRpb24ob2Zmc2V0LCBcImRheXNcIik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB3aW5kb3cubW9tZW50KHJlZmVyZW5jZSwgcmVmZXJlbmNlX2Zvcm1hdCkuYWRkKGR1cmF0aW9uKS5mb3JtYXQoZm9ybWF0KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGdlbmVyYXRlX3RvbW9ycm93KCk6IEZ1bmN0aW9uIHtcbiAgICAgICAgcmV0dXJuIChmb3JtYXQ6IHN0cmluZyA9IFwiWVlZWS1NTS1ERFwiKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gd2luZG93Lm1vbWVudCgpLmFkZCgxLCAnZGF5cycpLmZvcm1hdChmb3JtYXQpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZ2VuZXJhdGVfd2Vla2RheSgpOiBGdW5jdGlvbiB7XG4gICAgICAgIHJldHVybiAoZm9ybWF0OiBzdHJpbmcgPSBcIllZWVktTU0tRERcIiwgd2Vla2RheTogbnVtYmVyLCByZWZlcmVuY2U/OiBzdHJpbmcsIHJlZmVyZW5jZV9mb3JtYXQ/OiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIGlmIChyZWZlcmVuY2UgJiYgIXdpbmRvdy5tb21lbnQocmVmZXJlbmNlLCByZWZlcmVuY2VfZm9ybWF0KS5pc1ZhbGlkKCkpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVGVtcGxhdGVyRXJyb3IoXCJJbnZhbGlkIHJlZmVyZW5jZSBkYXRlIGZvcm1hdCwgdHJ5IHNwZWNpZnlpbmcgb25lIHdpdGggdGhlIGFyZ3VtZW50ICdyZWZlcmVuY2VfZm9ybWF0J1wiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB3aW5kb3cubW9tZW50KHJlZmVyZW5jZSwgcmVmZXJlbmNlX2Zvcm1hdCkud2Vla2RheSh3ZWVrZGF5KS5mb3JtYXQoZm9ybWF0KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGdlbmVyYXRlX3llc3RlcmRheSgpOiBGdW5jdGlvbiB7XG4gICAgICAgIHJldHVybiAoZm9ybWF0OiBzdHJpbmcgPSBcIllZWVktTU0tRERcIikgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHdpbmRvdy5tb21lbnQoKS5hZGQoLTEsICdkYXlzJykuZm9ybWF0KGZvcm1hdCk7XG4gICAgICAgIH1cbiAgICB9XG59IiwiaW1wb3J0IHsgSW50ZXJuYWxNb2R1bGUgfSBmcm9tIFwiLi4vSW50ZXJuYWxNb2R1bGVcIjtcblxuaW1wb3J0IHsgRmlsZVN5c3RlbUFkYXB0ZXIsIGdldEFsbFRhZ3MsIE1hcmtkb3duVmlldywgbm9ybWFsaXplUGF0aCwgcGFyc2VMaW5rdGV4dCwgUGxhdGZvcm0sIHJlc29sdmVTdWJwYXRoLCBURmlsZSwgVEZvbGRlciB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgVU5TVVBQT1JURURfTU9CSUxFX1RFTVBMQVRFIH0gZnJvbSBcIkNvbnN0YW50c1wiO1xuaW1wb3J0IHsgVGVtcGxhdGVyRXJyb3IgfSBmcm9tIFwiRXJyb3JcIjtcblxuZXhwb3J0IGNvbnN0IERFUFRIX0xJTUlUID0gMTA7XG5cbmV4cG9ydCBjbGFzcyBJbnRlcm5hbE1vZHVsZUZpbGUgZXh0ZW5kcyBJbnRlcm5hbE1vZHVsZSB7XG4gICAgcHVibGljIG5hbWU6IHN0cmluZyA9IFwiZmlsZVwiO1xuICAgIHByaXZhdGUgaW5jbHVkZV9kZXB0aDogbnVtYmVyID0gMDtcbiAgICBwcml2YXRlIGNyZWF0ZV9uZXdfZGVwdGg6IG51bWJlciA9IDA7XG4gICAgcHJpdmF0ZSBsaW5rcGF0aF9yZWdleDogUmVnRXhwID0gbmV3IFJlZ0V4cChcIl5cXFxcW1xcXFxbKC4qKVxcXFxdXFxcXF0kXCIpO1xuXG4gICAgYXN5bmMgY3JlYXRlU3RhdGljVGVtcGxhdGVzKCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICB0aGlzLnN0YXRpY190ZW1wbGF0ZXMuc2V0KFwiY3JlYXRpb25fZGF0ZVwiLCB0aGlzLmdlbmVyYXRlX2NyZWF0aW9uX2RhdGUoKSk7XG4gICAgICAgIHRoaXMuc3RhdGljX3RlbXBsYXRlcy5zZXQoXCJjcmVhdGVfbmV3XCIsIHRoaXMuZ2VuZXJhdGVfY3JlYXRlX25ldygpKTtcbiAgICAgICAgdGhpcy5zdGF0aWNfdGVtcGxhdGVzLnNldChcImN1cnNvclwiLCB0aGlzLmdlbmVyYXRlX2N1cnNvcigpKTtcbiAgICAgICAgdGhpcy5zdGF0aWNfdGVtcGxhdGVzLnNldChcImN1cnNvcl9hcHBlbmRcIiwgdGhpcy5nZW5lcmF0ZV9jdXJzb3JfYXBwZW5kKCkpO1xuICAgICAgICB0aGlzLnN0YXRpY190ZW1wbGF0ZXMuc2V0KFwiZXhpc3RzXCIsIHRoaXMuZ2VuZXJhdGVfZXhpc3RzKCkpO1xuICAgICAgICB0aGlzLnN0YXRpY190ZW1wbGF0ZXMuc2V0KFwiZmluZF90ZmlsZVwiLCB0aGlzLmdlbmVyYXRlX2ZpbmRfdGZpbGUoKSk7XG4gICAgICAgIHRoaXMuc3RhdGljX3RlbXBsYXRlcy5zZXQoXCJmb2xkZXJcIiwgdGhpcy5nZW5lcmF0ZV9mb2xkZXIoKSk7XG4gICAgICAgIHRoaXMuc3RhdGljX3RlbXBsYXRlcy5zZXQoXCJpbmNsdWRlXCIsIHRoaXMuZ2VuZXJhdGVfaW5jbHVkZSgpKTtcbiAgICAgICAgdGhpcy5zdGF0aWNfdGVtcGxhdGVzLnNldChcImxhc3RfbW9kaWZpZWRfZGF0ZVwiLCB0aGlzLmdlbmVyYXRlX2xhc3RfbW9kaWZpZWRfZGF0ZSgpKTtcbiAgICAgICAgdGhpcy5zdGF0aWNfdGVtcGxhdGVzLnNldChcIm1vdmVcIiwgdGhpcy5nZW5lcmF0ZV9tb3ZlKCkpO1xuICAgICAgICB0aGlzLnN0YXRpY190ZW1wbGF0ZXMuc2V0KFwicGF0aFwiLCB0aGlzLmdlbmVyYXRlX3BhdGgoKSk7XG4gICAgICAgIHRoaXMuc3RhdGljX3RlbXBsYXRlcy5zZXQoXCJyZW5hbWVcIiwgdGhpcy5nZW5lcmF0ZV9yZW5hbWUoKSk7XG4gICAgICAgIHRoaXMuc3RhdGljX3RlbXBsYXRlcy5zZXQoXCJzZWxlY3Rpb25cIiwgdGhpcy5nZW5lcmF0ZV9zZWxlY3Rpb24oKSk7XG4gICAgfVxuXG4gICAgYXN5bmMgdXBkYXRlVGVtcGxhdGVzKCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICB0aGlzLmR5bmFtaWNfdGVtcGxhdGVzLnNldChcImNvbnRlbnRcIiwgYXdhaXQgdGhpcy5nZW5lcmF0ZV9jb250ZW50KCkpO1xuICAgICAgICB0aGlzLmR5bmFtaWNfdGVtcGxhdGVzLnNldChcInRhZ3NcIiwgdGhpcy5nZW5lcmF0ZV90YWdzKCkpO1xuICAgICAgICB0aGlzLmR5bmFtaWNfdGVtcGxhdGVzLnNldChcInRpdGxlXCIsIHRoaXMuZ2VuZXJhdGVfdGl0bGUoKSk7XG4gICAgfSBcblxuICAgIGFzeW5jIGdlbmVyYXRlX2NvbnRlbnQoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuYXBwLnZhdWx0LnJlYWQodGhpcy5jb25maWcudGFyZ2V0X2ZpbGUpO1xuICAgIH1cblxuICAgIGdlbmVyYXRlX2NyZWF0ZV9uZXcoKTogRnVuY3Rpb24ge1xuICAgICAgICByZXR1cm4gYXN5bmMgKHRlbXBsYXRlOiBURmlsZSB8IHN0cmluZywgZmlsZW5hbWU/OiBzdHJpbmcsIG9wZW5fbmV3OiBib29sZWFuID0gZmFsc2UsIGZvbGRlcj86IFRGb2xkZXIpID0+IHtcbiAgICAgICAgICAgIHRoaXMuY3JlYXRlX25ld19kZXB0aCArPSAxO1xuICAgICAgICAgICAgaWYgKHRoaXMuY3JlYXRlX25ld19kZXB0aCA+IERFUFRIX0xJTUlUKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jcmVhdGVfbmV3X2RlcHRoID0gMDtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVGVtcGxhdGVyRXJyb3IoXCJSZWFjaGVkIGNyZWF0ZV9uZXcgZGVwdGggbGltaXQgKG1heCA9IDEwKVwiKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgbmV3X2ZpbGUgPSBhd2FpdCB0aGlzLnBsdWdpbi50ZW1wbGF0ZXIuY3JlYXRlX25ld19ub3RlX2Zyb21fdGVtcGxhdGUodGVtcGxhdGUsIGZvbGRlciwgZmlsZW5hbWUsIG9wZW5fbmV3KVxuXG4gICAgICAgICAgICB0aGlzLmNyZWF0ZV9uZXdfZGVwdGggLT0gMTtcblxuICAgICAgICAgICAgcmV0dXJuIG5ld19maWxlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZ2VuZXJhdGVfY3JlYXRpb25fZGF0ZSgpOiBGdW5jdGlvbiB7XG4gICAgICAgIHJldHVybiAoZm9ybWF0OiBzdHJpbmcgPSBcIllZWVktTU0tREQgSEg6bW1cIikgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHdpbmRvdy5tb21lbnQodGhpcy5jb25maWcudGFyZ2V0X2ZpbGUuc3RhdC5jdGltZSkuZm9ybWF0KGZvcm1hdCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBnZW5lcmF0ZV9jdXJzb3IoKTogRnVuY3Rpb24ge1xuICAgICAgICByZXR1cm4gKG9yZGVyPzogbnVtYmVyKSA9PiB7XG4gICAgICAgICAgICAvLyBIYWNrIHRvIHByZXZlbnQgZW1wdHkgb3V0cHV0XG4gICAgICAgICAgICByZXR1cm4gYDwlIHRwLmZpbGUuY3Vyc29yKCR7b3JkZXIgPz8gJyd9KSAlPmA7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBnZW5lcmF0ZV9jdXJzb3JfYXBwZW5kKCk6IEZ1bmN0aW9uIHtcbiAgICAgICAgcmV0dXJuIChjb250ZW50OiBzdHJpbmcpOiBzdHJpbmcgPT4ge1xuICAgICAgICAgICAgY29uc3QgYWN0aXZlX3ZpZXcgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlVmlld09mVHlwZShNYXJrZG93blZpZXcpO1xuICAgICAgICAgICAgaWYgKGFjdGl2ZV92aWV3ID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4ubG9nX2Vycm9yKG5ldyBUZW1wbGF0ZXJFcnJvcihcIk5vIGFjdGl2ZSB2aWV3LCBjYW4ndCBhcHBlbmQgdG8gY3Vyc29yLlwiKSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBlZGl0b3IgPSBhY3RpdmVfdmlldy5lZGl0b3I7XG4gICAgICAgICAgICBjb25zdCBkb2MgPSBlZGl0b3IuZ2V0RG9jKCk7XG4gICAgICAgICAgICBkb2MucmVwbGFjZVNlbGVjdGlvbihjb250ZW50KTtcbiAgICAgICAgICAgIHJldHVybiBcIlwiO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZ2VuZXJhdGVfZXhpc3RzKCk6IEZ1bmN0aW9uIHtcbiAgICAgICAgcmV0dXJuIChmaWxlbmFtZTogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAvLyBUT0RPOiBSZW1vdmUgdGhpcywgb25seSBoZXJlIHRvIHN1cHBvcnQgdGhlIG9sZCB3YXlcbiAgICAgICAgICAgIGxldCBtYXRjaDtcbiAgICAgICAgICAgIGlmICgobWF0Y2ggPSB0aGlzLmxpbmtwYXRoX3JlZ2V4LmV4ZWMoZmlsZW5hbWUpKSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGZpbGVuYW1lID0gbWF0Y2hbMV07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGZpbGUgPSB0aGlzLmFwcC5tZXRhZGF0YUNhY2hlLmdldEZpcnN0TGlua3BhdGhEZXN0KGZpbGVuYW1lLCBcIlwiKTtcbiAgICAgICAgICAgIHJldHVybiBmaWxlICE9IG51bGw7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBnZW5lcmF0ZV9maW5kX3RmaWxlKCk6IEZ1bmN0aW9uIHtcbiAgICAgICAgcmV0dXJuIChmaWxlbmFtZTogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBwYXRoID0gbm9ybWFsaXplUGF0aChmaWxlbmFtZSk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5hcHAubWV0YWRhdGFDYWNoZS5nZXRGaXJzdExpbmtwYXRoRGVzdChwYXRoLCBcIlwiKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGdlbmVyYXRlX2ZvbGRlcigpOiBGdW5jdGlvbiB7XG4gICAgICAgIHJldHVybiAocmVsYXRpdmU6IGJvb2xlYW4gPSBmYWxzZSkgPT4ge1xuICAgICAgICAgICAgbGV0IHBhcmVudCA9IHRoaXMuY29uZmlnLnRhcmdldF9maWxlLnBhcmVudDtcbiAgICAgICAgICAgIGxldCBmb2xkZXI7XG5cbiAgICAgICAgICAgIGlmIChyZWxhdGl2ZSkge1xuICAgICAgICAgICAgICAgIGZvbGRlciA9IHBhcmVudC5wYXRoO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgZm9sZGVyID0gcGFyZW50Lm5hbWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHJldHVybiBmb2xkZXI7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBnZW5lcmF0ZV9pbmNsdWRlKCk6IEZ1bmN0aW9uIHtcbiAgICAgICAgcmV0dXJuIGFzeW5jIChpbmNsdWRlX2xpbms6IHN0cmluZyB8IFRGaWxlKSA9PiB7XG4gICAgICAgICAgICAvLyBUT0RPOiBBZGQgbXV0ZXggZm9yIHRoaXMsIHRoaXMgbWF5IGN1cnJlbnRseSBsZWFkIHRvIGEgcmFjZSBjb25kaXRpb24uIFxuICAgICAgICAgICAgLy8gV2hpbGUgbm90IHZlcnkgaW1wYWN0ZnVsLCB0aGF0IGNvdWxkIHN0aWxsIGJlIGFubm95aW5nLlxuICAgICAgICAgICAgdGhpcy5pbmNsdWRlX2RlcHRoICs9IDE7XG4gICAgICAgICAgICBpZiAodGhpcy5pbmNsdWRlX2RlcHRoID4gREVQVEhfTElNSVQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmluY2x1ZGVfZGVwdGggPSAwO1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBUZW1wbGF0ZXJFcnJvcihcIlJlYWNoZWQgaW5jbHVzaW9uIGRlcHRoIGxpbWl0IChtYXggPSAxMClcIik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxldCBpbmNfZmlsZV9jb250ZW50OiBzdHJpbmc7XG5cbiAgICAgICAgICAgIGlmIChpbmNsdWRlX2xpbmsgaW5zdGFuY2VvZiBURmlsZSkge1xuICAgICAgICAgICAgICAgIGluY19maWxlX2NvbnRlbnQgPSBhd2FpdCB0aGlzLmFwcC52YXVsdC5yZWFkKGluY2x1ZGVfbGluayk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGxldCBtYXRjaDtcbiAgICAgICAgICAgICAgICBpZiAoKG1hdGNoID0gdGhpcy5saW5rcGF0aF9yZWdleC5leGVjKGluY2x1ZGVfbGluaykpID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBUZW1wbGF0ZXJFcnJvcihcIkludmFsaWQgZmlsZSBmb3JtYXQsIHByb3ZpZGUgYW4gb2JzaWRpYW4gbGluayBiZXR3ZWVuIHF1b3Rlcy5cIik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnN0IHtwYXRoLCBzdWJwYXRofSA9IHBhcnNlTGlua3RleHQobWF0Y2hbMV0pO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgaW5jX2ZpbGUgPSB0aGlzLmFwcC5tZXRhZGF0YUNhY2hlLmdldEZpcnN0TGlua3BhdGhEZXN0KHBhdGgsIFwiXCIpO1xuICAgICAgICAgICAgICAgIGlmICghaW5jX2ZpbGUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IFRlbXBsYXRlckVycm9yKGBGaWxlICR7aW5jbHVkZV9saW5rfSBkb2Vzbid0IGV4aXN0YCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGluY19maWxlX2NvbnRlbnQgPSBhd2FpdCB0aGlzLmFwcC52YXVsdC5yZWFkKGluY19maWxlKTtcblxuICAgICAgICAgICAgICAgIGlmIChzdWJwYXRoKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNhY2hlID0gdGhpcy5hcHAubWV0YWRhdGFDYWNoZS5nZXRGaWxlQ2FjaGUoaW5jX2ZpbGUpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoY2FjaGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHJlc29sdmVTdWJwYXRoKGNhY2hlLCBzdWJwYXRoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmNfZmlsZV9jb250ZW50ID0gaW5jX2ZpbGVfY29udGVudC5zbGljZShyZXN1bHQuc3RhcnQub2Zmc2V0LCByZXN1bHQuZW5kPy5vZmZzZXQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBcblxuICAgICAgICAgICAgY29uc3QgcGFyc2VkX2NvbnRlbnQgPSBhd2FpdCB0aGlzLnBsdWdpbi50ZW1wbGF0ZXIucGFyc2VyLnBhcnNlVGVtcGxhdGVzKGluY19maWxlX2NvbnRlbnQpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICB0aGlzLmluY2x1ZGVfZGVwdGggLT0gMTtcbiAgICAgICAgXG4gICAgICAgICAgICByZXR1cm4gcGFyc2VkX2NvbnRlbnQ7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBnZW5lcmF0ZV9sYXN0X21vZGlmaWVkX2RhdGUoKTogRnVuY3Rpb24ge1xuICAgICAgICByZXR1cm4gKGZvcm1hdDogc3RyaW5nID0gXCJZWVlZLU1NLUREIEhIOm1tXCIpOiBzdHJpbmcgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHdpbmRvdy5tb21lbnQodGhpcy5jb25maWcudGFyZ2V0X2ZpbGUuc3RhdC5tdGltZSkuZm9ybWF0KGZvcm1hdCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBnZW5lcmF0ZV9tb3ZlKCk6IEZ1bmN0aW9uIHtcbiAgICAgICAgcmV0dXJuIGFzeW5jIChwYXRoOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG5ld19wYXRoID0gbm9ybWFsaXplUGF0aChgJHtwYXRofS4ke3RoaXMuY29uZmlnLnRhcmdldF9maWxlLmV4dGVuc2lvbn1gKTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuYXBwLmZpbGVNYW5hZ2VyLnJlbmFtZUZpbGUodGhpcy5jb25maWcudGFyZ2V0X2ZpbGUsIG5ld19wYXRoKTtcbiAgICAgICAgICAgIHJldHVybiBcIlwiO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZ2VuZXJhdGVfcGF0aCgpOiBGdW5jdGlvbiB7XG4gICAgICAgIHJldHVybiAocmVsYXRpdmU6IGJvb2xlYW4gPSBmYWxzZSkgPT4ge1xuICAgICAgICAgICAgLy8gVE9ETzogQWRkIG1vYmlsZSBzdXBwb3J0XG4gICAgICAgICAgICBpZiAoUGxhdGZvcm0uaXNNb2JpbGVBcHApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gVU5TVVBQT1JURURfTU9CSUxFX1RFTVBMQVRFO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCEodGhpcy5hcHAudmF1bHQuYWRhcHRlciBpbnN0YW5jZW9mIEZpbGVTeXN0ZW1BZGFwdGVyKSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBUZW1wbGF0ZXJFcnJvcihcImFwcC52YXVsdCBpcyBub3QgYSBGaWxlU3lzdGVtQWRhcHRlciBpbnN0YW5jZVwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHZhdWx0X3BhdGggPSB0aGlzLmFwcC52YXVsdC5hZGFwdGVyLmdldEJhc2VQYXRoKCk7XG5cbiAgICAgICAgICAgIGlmIChyZWxhdGl2ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmNvbmZpZy50YXJnZXRfZmlsZS5wYXRoO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGAke3ZhdWx0X3BhdGh9LyR7dGhpcy5jb25maWcudGFyZ2V0X2ZpbGUucGF0aH1gO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgZ2VuZXJhdGVfcmVuYW1lKCk6IEZ1bmN0aW9uIHtcbiAgICAgICAgcmV0dXJuIGFzeW5jIChuZXdfdGl0bGU6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgaWYgKG5ld190aXRsZS5tYXRjaCgvW1xcXFxcXC86XSsvZykpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVGVtcGxhdGVyRXJyb3IoXCJGaWxlIG5hbWUgY2Fubm90IGNvbnRhaW4gYW55IG9mIHRoZXNlIGNoYXJhY3RlcnM6IFxcXFwgLyA6XCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgbmV3X3BhdGggPSBub3JtYWxpemVQYXRoKGAke3RoaXMuY29uZmlnLnRhcmdldF9maWxlLnBhcmVudC5wYXRofS8ke25ld190aXRsZX0uJHt0aGlzLmNvbmZpZy50YXJnZXRfZmlsZS5leHRlbnNpb259YCk7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLmFwcC5maWxlTWFuYWdlci5yZW5hbWVGaWxlKHRoaXMuY29uZmlnLnRhcmdldF9maWxlLCBuZXdfcGF0aCk7XG4gICAgICAgICAgICByZXR1cm4gXCJcIjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGdlbmVyYXRlX3NlbGVjdGlvbigpOiBGdW5jdGlvbiB7XG4gICAgICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBhY3RpdmVfdmlldyA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVWaWV3T2ZUeXBlKE1hcmtkb3duVmlldyk7XG4gICAgICAgICAgICBpZiAoYWN0aXZlX3ZpZXcgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBUZW1wbGF0ZXJFcnJvcihcIkFjdGl2ZSB2aWV3IGlzIG51bGwsIGNhbid0IHJlYWQgc2VsZWN0aW9uLlwiKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgZWRpdG9yID0gYWN0aXZlX3ZpZXcuZWRpdG9yO1xuICAgICAgICAgICAgcmV0dXJuIGVkaXRvci5nZXRTZWxlY3Rpb24oKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIFRPRE86IFR1cm4gdGhpcyBpbnRvIGEgZnVuY3Rpb25cbiAgICBnZW5lcmF0ZV90YWdzKCk6IHN0cmluZ1tdIHtcbiAgICAgICAgY29uc3QgY2FjaGUgPSB0aGlzLmFwcC5tZXRhZGF0YUNhY2hlLmdldEZpbGVDYWNoZSh0aGlzLmNvbmZpZy50YXJnZXRfZmlsZSk7XG4gICAgICAgIHJldHVybiBnZXRBbGxUYWdzKGNhY2hlKTtcbiAgICB9XG5cbiAgICAvLyBUT0RPOiBUdXJuIHRoaXMgaW50byBhIGZ1bmN0aW9uXG4gICAgZ2VuZXJhdGVfdGl0bGUoKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29uZmlnLnRhcmdldF9maWxlLmJhc2VuYW1lO1xuICAgIH1cbn0iLCJpbXBvcnQgeyBUZW1wbGF0ZXJFcnJvciB9IGZyb20gXCJFcnJvclwiO1xuaW1wb3J0IHsgSW50ZXJuYWxNb2R1bGUgfSBmcm9tIFwiLi4vSW50ZXJuYWxNb2R1bGVcIjtcblxuZXhwb3J0IGNsYXNzIEludGVybmFsTW9kdWxlV2ViIGV4dGVuZHMgSW50ZXJuYWxNb2R1bGUge1xuICAgIG5hbWUgPSBcIndlYlwiO1xuXG4gICAgYXN5bmMgY3JlYXRlU3RhdGljVGVtcGxhdGVzKCkge1xuICAgICAgICB0aGlzLnN0YXRpY190ZW1wbGF0ZXMuc2V0KFwiZGFpbHlfcXVvdGVcIiwgdGhpcy5nZW5lcmF0ZV9kYWlseV9xdW90ZSgpKTtcbiAgICAgICAgdGhpcy5zdGF0aWNfdGVtcGxhdGVzLnNldChcInJhbmRvbV9waWN0dXJlXCIsIHRoaXMuZ2VuZXJhdGVfcmFuZG9tX3BpY3R1cmUoKSk7XG4gICAgICAgIC8vdGhpcy5zdGF0aWNfdGVtcGxhdGVzLnNldChcImdldF9yZXF1ZXN0XCIsIHRoaXMuZ2VuZXJhdGVfZ2V0X3JlcXVlc3QoKSk7XG4gICAgfVxuICAgIFxuICAgIGFzeW5jIHVwZGF0ZVRlbXBsYXRlcygpIHt9XG5cbiAgICBhc3luYyBnZXRSZXF1ZXN0KHVybDogc3RyaW5nKTogUHJvbWlzZTxSZXNwb25zZT4ge1xuICAgICAgICBsZXQgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaCh1cmwpO1xuICAgICAgICBpZiAoIXJlc3BvbnNlLm9rKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVGVtcGxhdGVyRXJyb3IoXCJFcnJvciBwZXJmb3JtaW5nIEdFVCByZXF1ZXN0XCIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICB9XG5cbiAgICBnZW5lcmF0ZV9kYWlseV9xdW90ZSgpIHtcbiAgICAgICAgcmV0dXJuIGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIGxldCByZXNwb25zZSA9IGF3YWl0IHRoaXMuZ2V0UmVxdWVzdChcImh0dHBzOi8vcXVvdGVzLnJlc3QvcW9kXCIpO1xuICAgICAgICAgICAgbGV0IGpzb24gPSBhd2FpdCByZXNwb25zZS5qc29uKCk7XG5cbiAgICAgICAgICAgIGxldCBhdXRob3IgPSBqc29uLmNvbnRlbnRzLnF1b3Rlc1swXS5hdXRob3I7XG4gICAgICAgICAgICBsZXQgcXVvdGUgPSBqc29uLmNvbnRlbnRzLnF1b3Rlc1swXS5xdW90ZTtcbiAgICAgICAgICAgIGxldCBuZXdfY29udGVudCA9IGA+ICR7cXVvdGV9XFxuPiAmbWRhc2g7IDxjaXRlPiR7YXV0aG9yfTwvY2l0ZT5gO1xuXG4gICAgICAgICAgICByZXR1cm4gbmV3X2NvbnRlbnQ7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBnZW5lcmF0ZV9yYW5kb21fcGljdHVyZSgpIHtcbiAgICAgICAgcmV0dXJuIGFzeW5jIChzaXplOiBzdHJpbmcsIHF1ZXJ5Pzogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICBsZXQgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLmdldFJlcXVlc3QoYGh0dHBzOi8vc291cmNlLnVuc3BsYXNoLmNvbS9yYW5kb20vJHtzaXplID8/ICcnfT8ke3F1ZXJ5ID8/ICcnfWApO1xuICAgICAgICAgICAgbGV0IHVybCA9IHJlc3BvbnNlLnVybDtcbiAgICAgICAgICAgIHJldHVybiBgIVt0cC53ZWIucmFuZG9tX3BpY3R1cmVdKCR7dXJsfSlgOyAgIFxuICAgICAgICB9XG4gICAgfVxuXG4gICAgZ2VuZXJhdGVfZ2V0X3JlcXVlc3QoKSB7XG4gICAgICAgIHJldHVybiBhc3luYyAodXJsOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIGxldCByZXNwb25zZSA9IGF3YWl0IHRoaXMuZ2V0UmVxdWVzdCh1cmwpO1xuICAgICAgICAgICAgbGV0IGpzb24gPSBhd2FpdCByZXNwb25zZS5qc29uKCk7XG4gICAgICAgICAgICByZXR1cm4ganNvbjtcbiAgICAgICAgfVxuICAgIH1cbn0iLCJpbXBvcnQgeyBJbnRlcm5hbE1vZHVsZSB9IGZyb20gXCIuLi9JbnRlcm5hbE1vZHVsZVwiO1xuXG5leHBvcnQgY2xhc3MgSW50ZXJuYWxNb2R1bGVGcm9udG1hdHRlciBleHRlbmRzIEludGVybmFsTW9kdWxlIHtcbiAgICBwdWJsaWMgbmFtZTogc3RyaW5nID0gXCJmcm9udG1hdHRlclwiO1xuXG4gICAgYXN5bmMgY3JlYXRlU3RhdGljVGVtcGxhdGVzKCk6IFByb21pc2U8dm9pZD4ge31cblxuICAgIGFzeW5jIHVwZGF0ZVRlbXBsYXRlcygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgY29uc3QgY2FjaGUgPSB0aGlzLmFwcC5tZXRhZGF0YUNhY2hlLmdldEZpbGVDYWNoZSh0aGlzLmNvbmZpZy50YXJnZXRfZmlsZSlcbiAgICAgICAgdGhpcy5keW5hbWljX3RlbXBsYXRlcyA9IG5ldyBNYXAoT2JqZWN0LmVudHJpZXMoY2FjaGU/LmZyb250bWF0dGVyIHx8IHt9KSk7XG4gICAgfVxufSIsImltcG9ydCB7IFRlbXBsYXRlckVycm9yIH0gZnJvbSBcIkVycm9yXCI7XG5pbXBvcnQgeyBBcHAsIE1vZGFsIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5cbmV4cG9ydCBjbGFzcyBQcm9tcHRNb2RhbCBleHRlbmRzIE1vZGFsIHtcbiAgICBwcml2YXRlIHByb21wdEVsOiBIVE1MSW5wdXRFbGVtZW50O1xuICAgIHByaXZhdGUgcmVzb2x2ZTogKHZhbHVlOiBzdHJpbmcpID0+IHZvaWQ7XG4gICAgcHJpdmF0ZSByZWplY3Q6IChyZWFzb24/OiBhbnkpID0+IHZvaWQ7XG4gICAgcHJpdmF0ZSBzdWJtaXR0ZWQ6IGJvb2xlYW4gPSBmYWxzZTtcblxuICAgIGNvbnN0cnVjdG9yKGFwcDogQXBwLCBwcml2YXRlIHByb21wdF90ZXh0OiBzdHJpbmcsIHByaXZhdGUgZGVmYXVsdF92YWx1ZTogc3RyaW5nKSB7XG4gICAgICAgIHN1cGVyKGFwcCk7XG4gICAgfVxuXG4gICAgb25PcGVuKCk6IHZvaWQge1xuICAgICAgICB0aGlzLnRpdGxlRWwuc2V0VGV4dCh0aGlzLnByb21wdF90ZXh0KTtcbiAgICAgICAgdGhpcy5jcmVhdGVGb3JtKCk7XG4gICAgfVxuXG4gICAgb25DbG9zZSgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5jb250ZW50RWwuZW1wdHkoKTtcbiAgICAgICAgaWYgKCF0aGlzLnN1Ym1pdHRlZCkge1xuICAgICAgICAgICAgdGhpcy5yZWplY3QobmV3IFRlbXBsYXRlckVycm9yKFwiQ2FuY2VsbGVkIHByb21wdFwiKSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjcmVhdGVGb3JtKCk6IHZvaWQge1xuICAgICAgICBjb25zdCBkaXYgPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVEaXYoKTtcbiAgICAgICAgZGl2LmFkZENsYXNzKFwidGVtcGxhdGVyLXByb21wdC1kaXZcIik7XG5cbiAgICAgICAgY29uc3QgZm9ybSA9IGRpdi5jcmVhdGVFbChcImZvcm1cIik7XG4gICAgICAgIGZvcm0uYWRkQ2xhc3MoXCJ0ZW1wbGF0ZXItcHJvbXB0LWZvcm1cIik7XG4gICAgICAgIGZvcm0udHlwZSA9IFwic3VibWl0XCI7XG4gICAgICAgIGZvcm0ub25zdWJtaXQgPSAoZTogRXZlbnQpID0+IHtcbiAgICAgICAgICAgIHRoaXMuc3VibWl0dGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIHRoaXMucmVzb2x2ZSh0aGlzLnByb21wdEVsLnZhbHVlKTtcbiAgICAgICAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMucHJvbXB0RWwgPSBmb3JtLmNyZWF0ZUVsKFwiaW5wdXRcIik7XG4gICAgICAgIHRoaXMucHJvbXB0RWwudHlwZSA9IFwidGV4dFwiO1xuICAgICAgICB0aGlzLnByb21wdEVsLnBsYWNlaG9sZGVyID0gXCJUeXBlIHRleHQgaGVyZS4uLlwiO1xuICAgICAgICB0aGlzLnByb21wdEVsLnZhbHVlID0gdGhpcy5kZWZhdWx0X3ZhbHVlID8/IFwiXCI7XG4gICAgICAgIHRoaXMucHJvbXB0RWwuYWRkQ2xhc3MoXCJ0ZW1wbGF0ZXItcHJvbXB0LWlucHV0XCIpXG4gICAgICAgIHRoaXMucHJvbXB0RWwuc2VsZWN0KCk7XG4gICAgfVxuXG4gICAgYXN5bmMgb3BlbkFuZEdldFZhbHVlKHJlc29sdmU6ICh2YWx1ZTogc3RyaW5nKSA9PiB2b2lkLCByZWplY3Q6IChyZWFzb24/OiBhbnkpID0+IHZvaWQpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgdGhpcy5yZXNvbHZlID0gcmVzb2x2ZTtcbiAgICAgICAgdGhpcy5yZWplY3QgPSByZWplY3Q7XG4gICAgICAgIHRoaXMub3BlbigpO1xuICAgIH1cbn0iLCJpbXBvcnQgeyBUZW1wbGF0ZXJFcnJvciB9IGZyb20gXCJFcnJvclwiO1xuaW1wb3J0IHsgQXBwLCBGdXp6eU1hdGNoLCBGdXp6eVN1Z2dlc3RNb2RhbCB9IGZyb20gXCJvYnNpZGlhblwiO1xuXG5cbmV4cG9ydCBjbGFzcyBTdWdnZXN0ZXJNb2RhbDxUPiBleHRlbmRzIEZ1enp5U3VnZ2VzdE1vZGFsPFQ+IHtcbiAgICBwcml2YXRlIHJlc29sdmU6ICh2YWx1ZTogVCkgPT4gdm9pZDtcbiAgICBwcml2YXRlIHJlamVjdDogKHJlYXNvbj86IGFueSkgPT4gdm9pZDtcbiAgICBwcml2YXRlIHN1Ym1pdHRlZDogYm9vbGVhbiA9IGZhbHNlO1xuXG4gICAgY29uc3RydWN0b3IoYXBwOiBBcHAsIHByaXZhdGUgdGV4dF9pdGVtczogc3RyaW5nW10gfCAoKGl0ZW06IFQpID0+IHN0cmluZyksIHByaXZhdGUgaXRlbXM6IFRbXSwgcGxhY2Vob2xkZXI6IHN0cmluZykge1xuICAgICAgICBzdXBlcihhcHApO1xuICAgICAgICB0aGlzLnNldFBsYWNlaG9sZGVyKHBsYWNlaG9sZGVyKTtcbiAgICB9XG5cbiAgICBnZXRJdGVtcygpOiBUW10ge1xuICAgICAgICByZXR1cm4gdGhpcy5pdGVtcztcbiAgICB9XG4gICAgXG4gICAgb25DbG9zZSgpOiB2b2lkIHtcbiAgICAgICAgaWYgKCF0aGlzLnN1Ym1pdHRlZCkge1xuICAgICAgICAgICAgdGhpcy5yZWplY3QobmV3IFRlbXBsYXRlckVycm9yKFwiQ2FuY2VsbGVkIHByb21wdFwiKSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzZWxlY3RTdWdnZXN0aW9uKHZhbHVlOiBGdXp6eU1hdGNoPFQ+LCBldnQ6IE1vdXNlRXZlbnQgfCBLZXlib2FyZEV2ZW50KTogdm9pZCB7XG4gICAgICAgIHRoaXMuc3VibWl0dGVkID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5jbG9zZSgpO1xuICAgICAgICB0aGlzLm9uQ2hvb3NlU3VnZ2VzdGlvbih2YWx1ZSwgZXZ0KTtcbiAgICB9XG5cbiAgICBnZXRJdGVtVGV4dChpdGVtOiBUKTogc3RyaW5nIHtcbiAgICAgICAgaWYgKHRoaXMudGV4dF9pdGVtcyBpbnN0YW5jZW9mIEZ1bmN0aW9uKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy50ZXh0X2l0ZW1zKGl0ZW0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLnRleHRfaXRlbXNbdGhpcy5pdGVtcy5pbmRleE9mKGl0ZW0pXSB8fCBcIlVuZGVmaW5lZCBUZXh0IEl0ZW1cIjtcbiAgICB9XG5cbiAgICBvbkNob29zZUl0ZW0oaXRlbTogVCwgX2V2dDogTW91c2VFdmVudCB8IEtleWJvYXJkRXZlbnQpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5yZXNvbHZlKGl0ZW0pO1xuICAgIH1cblxuICAgIGFzeW5jIG9wZW5BbmRHZXRWYWx1ZShyZXNvbHZlOiAodmFsdWU6IFQpID0+IHZvaWQsIHJlamVjdDogKHJlYXNvbj86IGFueSkgPT4gdm9pZCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICB0aGlzLnJlc29sdmUgPSByZXNvbHZlO1xuICAgICAgICB0aGlzLnJlamVjdCA9IHJlamVjdDtcbiAgICAgICAgdGhpcy5vcGVuKCk7XG4gICAgfVxufSIsImltcG9ydCB7IFVOU1VQUE9SVEVEX01PQklMRV9URU1QTEFURSB9IGZyb20gXCJDb25zdGFudHNcIjtcbmltcG9ydCB7IEludGVybmFsTW9kdWxlIH0gZnJvbSBcIkludGVybmFsVGVtcGxhdGVzL0ludGVybmFsTW9kdWxlXCI7XG5pbXBvcnQgeyBQbGF0Zm9ybSB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgUHJvbXB0TW9kYWwgfSBmcm9tIFwiLi9Qcm9tcHRNb2RhbFwiO1xuaW1wb3J0IHsgU3VnZ2VzdGVyTW9kYWwgfSBmcm9tIFwiLi9TdWdnZXN0ZXJNb2RhbFwiO1xuXG5leHBvcnQgY2xhc3MgSW50ZXJuYWxNb2R1bGVTeXN0ZW0gZXh0ZW5kcyBJbnRlcm5hbE1vZHVsZSB7XG4gICAgcHVibGljIG5hbWU6IHN0cmluZyA9IFwic3lzdGVtXCI7XG5cbiAgICBhc3luYyBjcmVhdGVTdGF0aWNUZW1wbGF0ZXMoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIHRoaXMuc3RhdGljX3RlbXBsYXRlcy5zZXQoXCJjbGlwYm9hcmRcIiwgdGhpcy5nZW5lcmF0ZV9jbGlwYm9hcmQoKSk7XG4gICAgICAgIHRoaXMuc3RhdGljX3RlbXBsYXRlcy5zZXQoXCJwcm9tcHRcIiwgdGhpcy5nZW5lcmF0ZV9wcm9tcHQoKSk7XG4gICAgICAgIHRoaXMuc3RhdGljX3RlbXBsYXRlcy5zZXQoXCJzdWdnZXN0ZXJcIiwgdGhpcy5nZW5lcmF0ZV9zdWdnZXN0ZXIoKSk7XG4gICAgfVxuXG4gICAgYXN5bmMgdXBkYXRlVGVtcGxhdGVzKCk6IFByb21pc2U8dm9pZD4ge31cblxuICAgIGdlbmVyYXRlX2NsaXBib2FyZCgpOiBGdW5jdGlvbiB7XG4gICAgICAgIHJldHVybiBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAvLyBUT0RPOiBBZGQgbW9iaWxlIHN1cHBvcnRcbiAgICAgICAgICAgIGlmIChQbGF0Zm9ybS5pc01vYmlsZUFwcCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBVTlNVUFBPUlRFRF9NT0JJTEVfVEVNUExBVEU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gYXdhaXQgbmF2aWdhdG9yLmNsaXBib2FyZC5yZWFkVGV4dCgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZ2VuZXJhdGVfcHJvbXB0KCk6IEZ1bmN0aW9uIHtcbiAgICAgICAgcmV0dXJuIGFzeW5jIChwcm9tcHRfdGV4dD86IHN0cmluZywgZGVmYXVsdF92YWx1ZT86IHN0cmluZywgdGhyb3dfb25fY2FuY2VsOiBib29sZWFuID0gZmFsc2UpOiBQcm9taXNlPHN0cmluZz4gPT4ge1xuICAgICAgICAgICAgY29uc3QgcHJvbXB0ID0gbmV3IFByb21wdE1vZGFsKHRoaXMuYXBwLCBwcm9tcHRfdGV4dCwgZGVmYXVsdF92YWx1ZSk7XG4gICAgICAgICAgICBjb25zdCBwcm9taXNlID0gbmV3IFByb21pc2UoKHJlc29sdmU6ICh2YWx1ZTogc3RyaW5nKSA9PiB2b2lkLCByZWplY3Q6IChyZWFzb24/OiBhbnkpID0+IHZvaWQpID0+IHByb21wdC5vcGVuQW5kR2V0VmFsdWUocmVzb2x2ZSwgcmVqZWN0KSk7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCBwcm9taXNlO1xuICAgICAgICAgICAgfSBjYXRjaChlcnJvcikge1xuICAgICAgICAgICAgICAgIGlmICh0aHJvd19vbl9jYW5jZWwpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgZ2VuZXJhdGVfc3VnZ2VzdGVyKCk6IEZ1bmN0aW9uIHtcbiAgICAgICAgcmV0dXJuIGFzeW5jIDxUPih0ZXh0X2l0ZW1zOiBzdHJpbmdbXSB8ICgoaXRlbTogVCkgPT4gc3RyaW5nKSwgaXRlbXM6IFRbXSwgdGhyb3dfb25fY2FuY2VsOiBib29sZWFuID0gZmFsc2UsIHBsYWNlaG9sZGVyOiBzdHJpbmcgPSBcIlwiKTogUHJvbWlzZTxUPiA9PiB7XG4gICAgICAgICAgICBjb25zdCBzdWdnZXN0ZXIgPSBuZXcgU3VnZ2VzdGVyTW9kYWwodGhpcy5hcHAsIHRleHRfaXRlbXMsIGl0ZW1zLCBwbGFjZWhvbGRlcik7XG4gICAgICAgICAgICBjb25zdCBwcm9taXNlID0gbmV3IFByb21pc2UoKHJlc29sdmU6ICh2YWx1ZTogVCkgPT4gdm9pZCwgcmVqZWN0OiAocmVhc29uPzogYW55KSA9PiB2b2lkKSA9PiBzdWdnZXN0ZXIub3BlbkFuZEdldFZhbHVlKHJlc29sdmUsIHJlamVjdCkpO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgcHJvbWlzZVxuICAgICAgICAgICAgfSBjYXRjaChlcnJvcikge1xuICAgICAgICAgICAgICAgIGlmICh0aHJvd19vbl9jYW5jZWwpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufSIsImltcG9ydCB7IEludGVybmFsTW9kdWxlIH0gZnJvbSBcIkludGVybmFsVGVtcGxhdGVzL0ludGVybmFsTW9kdWxlXCI7XG5pbXBvcnQgeyBSdW5Nb2RlLCBSdW5uaW5nQ29uZmlnIH0gZnJvbSBcIlRlbXBsYXRlclwiO1xuXG5leHBvcnQgY2xhc3MgSW50ZXJuYWxNb2R1bGVDb25maWcgZXh0ZW5kcyBJbnRlcm5hbE1vZHVsZSB7XG4gICAgcHVibGljIG5hbWU6IHN0cmluZyA9IFwiY29uZmlnXCI7XG5cbiAgICBhc3luYyBjcmVhdGVTdGF0aWNUZW1wbGF0ZXMoKTogUHJvbWlzZTx2b2lkPiB7fVxuXG4gICAgYXN5bmMgdXBkYXRlVGVtcGxhdGVzKCk6IFByb21pc2U8dm9pZD4ge31cblxuICAgIGFzeW5jIGdlbmVyYXRlQ29udGV4dChjb25maWc6IFJ1bm5pbmdDb25maWcpOiBQcm9taXNlPHtbeDogc3RyaW5nXTogYW55fT4ge1xuICAgICAgICByZXR1cm4gY29uZmlnO1xuICAgIH1cbn0iLCJpbXBvcnQgeyBBcHAsIFRGaWxlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5cbmltcG9ydCBUZW1wbGF0ZXJQbHVnaW4gZnJvbSBcIm1haW5cIjtcbmltcG9ydCB7IFRQYXJzZXIgfSBmcm9tIFwiVFBhcnNlclwiO1xuaW1wb3J0IHsgSW50ZXJuYWxNb2R1bGUgfSBmcm9tIFwiLi9JbnRlcm5hbE1vZHVsZVwiO1xuaW1wb3J0IHsgSW50ZXJuYWxNb2R1bGVEYXRlIH0gZnJvbSBcIi4vZGF0ZS9JbnRlcm5hbE1vZHVsZURhdGVcIjtcbmltcG9ydCB7IEludGVybmFsTW9kdWxlRmlsZSB9IGZyb20gXCIuL2ZpbGUvSW50ZXJuYWxNb2R1bGVGaWxlXCI7XG5pbXBvcnQgeyBJbnRlcm5hbE1vZHVsZVdlYiB9IGZyb20gXCIuL3dlYi9JbnRlcm5hbE1vZHVsZVdlYlwiO1xuaW1wb3J0IHsgSW50ZXJuYWxNb2R1bGVGcm9udG1hdHRlciB9IGZyb20gXCIuL2Zyb250bWF0dGVyL0ludGVybmFsTW9kdWxlRnJvbnRtYXR0ZXJcIjtcbmltcG9ydCB7IEludGVybmFsTW9kdWxlU3lzdGVtIH0gZnJvbSBcIi4vc3lzdGVtL0ludGVybmFsTW9kdWxlU3lzdGVtXCI7XG5pbXBvcnQgeyBSdW5uaW5nQ29uZmlnIH0gZnJvbSBcIlRlbXBsYXRlclwiO1xuaW1wb3J0IHsgSW50ZXJuYWxNb2R1bGVDb25maWcgfSBmcm9tIFwiLi9jb25maWcvSW50ZXJuYWxNb2R1bGVDb25maWdcIjtcblxuZXhwb3J0IGNsYXNzIEludGVybmFsVGVtcGxhdGVQYXJzZXIgaW1wbGVtZW50cyBUUGFyc2VyIHtcbiAgICBwcml2YXRlIG1vZHVsZXNfYXJyYXk6IEFycmF5PEludGVybmFsTW9kdWxlPiA9IG5ldyBBcnJheSgpO1xuXG4gICAgY29uc3RydWN0b3IocHJvdGVjdGVkIGFwcDogQXBwLCBwcm90ZWN0ZWQgcGx1Z2luOiBUZW1wbGF0ZXJQbHVnaW4pIHtcbiAgICAgICAgdGhpcy5tb2R1bGVzX2FycmF5LnB1c2gobmV3IEludGVybmFsTW9kdWxlRGF0ZSh0aGlzLmFwcCwgdGhpcy5wbHVnaW4pKTtcbiAgICAgICAgdGhpcy5tb2R1bGVzX2FycmF5LnB1c2gobmV3IEludGVybmFsTW9kdWxlRmlsZSh0aGlzLmFwcCwgdGhpcy5wbHVnaW4pKTtcbiAgICAgICAgdGhpcy5tb2R1bGVzX2FycmF5LnB1c2gobmV3IEludGVybmFsTW9kdWxlV2ViKHRoaXMuYXBwLCB0aGlzLnBsdWdpbikpO1xuICAgICAgICB0aGlzLm1vZHVsZXNfYXJyYXkucHVzaChuZXcgSW50ZXJuYWxNb2R1bGVGcm9udG1hdHRlcih0aGlzLmFwcCwgdGhpcy5wbHVnaW4pKTtcbiAgICAgICAgdGhpcy5tb2R1bGVzX2FycmF5LnB1c2gobmV3IEludGVybmFsTW9kdWxlU3lzdGVtKHRoaXMuYXBwLCB0aGlzLnBsdWdpbikpO1xuICAgICAgICB0aGlzLm1vZHVsZXNfYXJyYXkucHVzaChuZXcgSW50ZXJuYWxNb2R1bGVDb25maWcodGhpcy5hcHAsIHRoaXMucGx1Z2luKSk7XG4gICAgfVxuXG4gICAgYXN5bmMgaW5pdCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgZm9yIChjb25zdCBtb2Qgb2YgdGhpcy5tb2R1bGVzX2FycmF5KSB7XG4gICAgICAgICAgICBhd2FpdCBtb2QuaW5pdCgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgYXN5bmMgZ2VuZXJhdGVDb250ZXh0KGNvbmZpZzogUnVubmluZ0NvbmZpZyk6IFByb21pc2U8e30+IHtcbiAgICAgICAgY29uc3QgbW9kdWxlc19jb250ZXh0OiB7W2tleTogc3RyaW5nXTogYW55fSA9IHt9O1xuXG4gICAgICAgIGZvciAoY29uc3QgbW9kIG9mIHRoaXMubW9kdWxlc19hcnJheSkge1xuICAgICAgICAgICAgbW9kdWxlc19jb250ZXh0W21vZC5nZXROYW1lKCldID0gYXdhaXQgbW9kLmdlbmVyYXRlQ29udGV4dChjb25maWcpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG1vZHVsZXNfY29udGV4dDtcbiAgICB9XG59IiwiaW1wb3J0IHsgQXBwLCBGaWxlU3lzdGVtQWRhcHRlciwgUGxhdGZvcm0sIFRGaWxlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBleGVjIH0gZnJvbSBcImNoaWxkX3Byb2Nlc3NcIjtcbmltcG9ydCB7IHByb21pc2lmeSB9IGZyb20gXCJ1dGlsXCI7XG5cbmltcG9ydCBUZW1wbGF0ZXJQbHVnaW4gZnJvbSBcIm1haW5cIjtcbmltcG9ydCB7IENvbnRleHRNb2RlIH0gZnJvbSBcIlRlbXBsYXRlUGFyc2VyXCI7XG5pbXBvcnQgeyBUUGFyc2VyIH0gZnJvbSBcIlRQYXJzZXJcIjtcbmltcG9ydCB7IFVOU1VQUE9SVEVEX01PQklMRV9URU1QTEFURSB9IGZyb20gXCJDb25zdGFudHNcIjtcbmltcG9ydCB7IFJ1bm5pbmdDb25maWcgfSBmcm9tIFwiVGVtcGxhdGVyXCI7XG5pbXBvcnQgeyBnZXRURmlsZXNGcm9tRm9sZGVyIH0gZnJvbSBcIlV0aWxzXCI7XG5pbXBvcnQgeyBUZW1wbGF0ZXJFcnJvciB9IGZyb20gXCJFcnJvclwiO1xuXG5leHBvcnQgY2xhc3MgVXNlclRlbXBsYXRlUGFyc2VyIGltcGxlbWVudHMgVFBhcnNlciB7XG4gICAgcHJpdmF0ZSBjd2Q6IHN0cmluZztcbiAgICBwcml2YXRlIGV4ZWNfcHJvbWlzZTogRnVuY3Rpb247XG4gICAgcHJpdmF0ZSB1c2VyX3N5c3RlbV9jb21tYW5kX2Z1bmN0aW9uczogTWFwPHN0cmluZywgRnVuY3Rpb24+ID0gbmV3IE1hcCgpO1xuICAgIHByaXZhdGUgdXNlcl9zY3JpcHRfZnVuY3Rpb25zOiBNYXA8c3RyaW5nLCBGdW5jdGlvbj4gPSBuZXcgTWFwKCk7XG5cbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIGFwcDogQXBwLCBwcml2YXRlIHBsdWdpbjogVGVtcGxhdGVyUGx1Z2luKSB7XG4gICAgICAgIHRoaXMuc2V0dXAoKTsgICAgICAgIFxuICAgIH1cblxuICAgIHNldHVwKCk6IHZvaWQge1xuICAgICAgICBpZiAoUGxhdGZvcm0uaXNNb2JpbGVBcHAgfHwgISh0aGlzLmFwcC52YXVsdC5hZGFwdGVyIGluc3RhbmNlb2YgRmlsZVN5c3RlbUFkYXB0ZXIpKSB7XG4gICAgICAgICAgICB0aGlzLmN3ZCA9IFwiXCI7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmN3ZCA9IHRoaXMuYXBwLnZhdWx0LmFkYXB0ZXIuZ2V0QmFzZVBhdGgoKTtcbiAgICAgICAgICAgIHRoaXMuZXhlY19wcm9taXNlID0gcHJvbWlzaWZ5KGV4ZWMpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgYXN5bmMgaW5pdCgpOiBQcm9taXNlPHZvaWQ+IHt9XG5cbiAgICBhc3luYyBnZW5lcmF0ZV91c2VyX3NjcmlwdF9mdW5jdGlvbnMoY29uZmlnOiBSdW5uaW5nQ29uZmlnKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGxldCBmaWxlcyA9IGdldFRGaWxlc0Zyb21Gb2xkZXIodGhpcy5hcHAsIHRoaXMucGx1Z2luLnNldHRpbmdzLnNjcmlwdF9mb2xkZXIpO1xuXG4gICAgICAgIGZvciAobGV0IGZpbGUgb2YgZmlsZXMpIHtcbiAgICAgICAgICAgIGlmIChmaWxlLmV4dGVuc2lvbi50b0xvd2VyQ2FzZSgpID09PSBcImpzXCIpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLmxvYWRfdXNlcl9zY3JpcHRfZnVuY3Rpb24oY29uZmlnLCBmaWxlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFzeW5jIGxvYWRfdXNlcl9zY3JpcHRfZnVuY3Rpb24oY29uZmlnOiBSdW5uaW5nQ29uZmlnLCBmaWxlOiBURmlsZSk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBpZiAoISh0aGlzLmFwcC52YXVsdC5hZGFwdGVyIGluc3RhbmNlb2YgRmlsZVN5c3RlbUFkYXB0ZXIpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVGVtcGxhdGVyRXJyb3IoXCJhcHAudmF1bHQgaXMgbm90IGEgRmlsZVN5c3RlbUFkYXB0ZXIgaW5zdGFuY2VcIik7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHZhdWx0X3BhdGggPSB0aGlzLmFwcC52YXVsdC5hZGFwdGVyLmdldEJhc2VQYXRoKCk7XG4gICAgICAgIGxldCBmaWxlX3BhdGggPSBgJHt2YXVsdF9wYXRofS8ke2ZpbGUucGF0aH1gO1xuXG4gICAgICAgIC8vIGh0dHBzOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzI2NjMzOTAxL3JlbG9hZC1tb2R1bGUtYXQtcnVudGltZVxuICAgICAgICAvLyBodHRwczovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8xOTcyMjQyL2hvdy10by1hdXRvLXJlbG9hZC1maWxlcy1pbi1ub2RlLWpzXG4gICAgICAgIGlmIChPYmplY3Qua2V5cyh3aW5kb3cucmVxdWlyZS5jYWNoZSkuY29udGFpbnMoZmlsZV9wYXRoKSkge1xuICAgICAgICAgICAgZGVsZXRlIHdpbmRvdy5yZXF1aXJlLmNhY2hlW3dpbmRvdy5yZXF1aXJlLnJlc29sdmUoZmlsZV9wYXRoKV07XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB1c2VyX2Z1bmN0aW9uID0gYXdhaXQgaW1wb3J0KGZpbGVfcGF0aCk7XG4gICAgICAgIGlmICghdXNlcl9mdW5jdGlvbi5kZWZhdWx0KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVGVtcGxhdGVyRXJyb3IoYEZhaWxlZCB0byBsb2FkIHVzZXIgc2NyaXB0ICR7ZmlsZV9wYXRofS4gTm8gZXhwb3J0cyBkZXRlY3RlZC5gKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoISh1c2VyX2Z1bmN0aW9uLmRlZmF1bHQgaW5zdGFuY2VvZiBGdW5jdGlvbikpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUZW1wbGF0ZXJFcnJvcihgRmFpbGVkIHRvIGxvYWQgdXNlciBzY3JpcHQgJHtmaWxlX3BhdGh9LiBEZWZhdWx0IGV4cG9ydCBpcyBub3QgYSBmdW5jdGlvbi5gKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnVzZXJfc2NyaXB0X2Z1bmN0aW9ucy5zZXQoYCR7ZmlsZS5iYXNlbmFtZX1gLCB1c2VyX2Z1bmN0aW9uLmRlZmF1bHQpO1xuICAgIH1cblxuICAgIC8vIFRPRE86IEFkZCBtb2JpbGUgc3VwcG9ydFxuICAgIGFzeW5jIGdlbmVyYXRlX3N5c3RlbV9jb21tYW5kX3VzZXJfZnVuY3Rpb25zKGNvbmZpZzogUnVubmluZ0NvbmZpZyk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBjb25zdCBjb250ZXh0ID0gYXdhaXQgdGhpcy5wbHVnaW4udGVtcGxhdGVyLnBhcnNlci5nZW5lcmF0ZUNvbnRleHQoY29uZmlnLCBDb250ZXh0TW9kZS5JTlRFUk5BTCk7XG5cbiAgICAgICAgZm9yIChsZXQgW3RlbXBsYXRlLCBjbWRdIG9mIHRoaXMucGx1Z2luLnNldHRpbmdzLnRlbXBsYXRlc19wYWlycykge1xuICAgICAgICAgICAgaWYgKHRlbXBsYXRlID09PSBcIlwiIHx8IGNtZCA9PT0gXCJcIikge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoUGxhdGZvcm0uaXNNb2JpbGVBcHApIHtcbiAgICAgICAgICAgICAgICB0aGlzLnVzZXJfc3lzdGVtX2NvbW1hbmRfZnVuY3Rpb25zLnNldCh0ZW1wbGF0ZSwgKHVzZXJfYXJncz86IGFueSk6IHN0cmluZyA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBVTlNVUFBPUlRFRF9NT0JJTEVfVEVNUExBVEU7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGNtZCA9IGF3YWl0IHRoaXMucGx1Z2luLnRlbXBsYXRlci5wYXJzZXIucGFyc2VUZW1wbGF0ZXMoY21kLCBjb250ZXh0KTtcblxuICAgICAgICAgICAgICAgIHRoaXMudXNlcl9zeXN0ZW1fY29tbWFuZF9mdW5jdGlvbnMuc2V0KHRlbXBsYXRlLCBhc3luYyAodXNlcl9hcmdzPzogYW55KTogUHJvbWlzZTxzdHJpbmc+ID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcHJvY2Vzc19lbnYgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAuLi5wcm9jZXNzLmVudixcbiAgICAgICAgICAgICAgICAgICAgICAgIC4uLnVzZXJfYXJncyxcbiAgICAgICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgICAgICBjb25zdCBjbWRfb3B0aW9ucyA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpbWVvdXQ6IHRoaXMucGx1Z2luLnNldHRpbmdzLmNvbW1hbmRfdGltZW91dCAqIDEwMDAsXG4gICAgICAgICAgICAgICAgICAgICAgICBjd2Q6IHRoaXMuY3dkLFxuICAgICAgICAgICAgICAgICAgICAgICAgZW52OiBwcm9jZXNzX2VudixcbiAgICAgICAgICAgICAgICAgICAgICAgIC4uLih0aGlzLnBsdWdpbi5zZXR0aW5ncy5zaGVsbF9wYXRoICE9PSBcIlwiICYmIHtzaGVsbDogdGhpcy5wbHVnaW4uc2V0dGluZ3Muc2hlbGxfcGF0aH0pLFxuICAgICAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB7c3Rkb3V0fSA9IGF3YWl0IHRoaXMuZXhlY19wcm9taXNlKGNtZCwgY21kX29wdGlvbnMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHN0ZG91dC50cmltUmlnaHQoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjYXRjaChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IFRlbXBsYXRlckVycm9yKGBFcnJvciB3aXRoIFVzZXIgVGVtcGxhdGUgJHt0ZW1wbGF0ZX1gLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFzeW5jIGdlbmVyYXRlQ29udGV4dChjb25maWc6IFJ1bm5pbmdDb25maWcpOiBQcm9taXNlPHt9PiB7XG4gICAgICAgIHRoaXMudXNlcl9zeXN0ZW1fY29tbWFuZF9mdW5jdGlvbnMuY2xlYXIoKTtcbiAgICAgICAgdGhpcy51c2VyX3NjcmlwdF9mdW5jdGlvbnMuY2xlYXIoKTtcblxuICAgICAgICBpZiAodGhpcy5wbHVnaW4uc2V0dGluZ3MuZW5hYmxlX3N5c3RlbV9jb21tYW5kcykge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5nZW5lcmF0ZV9zeXN0ZW1fY29tbWFuZF91c2VyX2Z1bmN0aW9ucyhjb25maWcpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVE9ETzogQWRkIG1vYmlsZSBzdXBwb3J0XG4gICAgICAgIGlmIChQbGF0Zm9ybS5pc0Rlc2t0b3BBcHAgJiYgdGhpcy5wbHVnaW4uc2V0dGluZ3Muc2NyaXB0X2ZvbGRlcikge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5nZW5lcmF0ZV91c2VyX3NjcmlwdF9mdW5jdGlvbnMoY29uZmlnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAuLi5PYmplY3QuZnJvbUVudHJpZXModGhpcy51c2VyX3N5c3RlbV9jb21tYW5kX2Z1bmN0aW9ucyksXG4gICAgICAgICAgICAuLi5PYmplY3QuZnJvbUVudHJpZXModGhpcy51c2VyX3NjcmlwdF9mdW5jdGlvbnMpLFxuICAgICAgICB9O1xuICAgIH1cbn0iLCJpbXBvcnQgeyBBcHAgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCAqIGFzIEV0YSBmcm9tIFwiZXRhXCI7XG5cbmltcG9ydCB7IEludGVybmFsVGVtcGxhdGVQYXJzZXIgfSBmcm9tIFwiLi9JbnRlcm5hbFRlbXBsYXRlcy9JbnRlcm5hbFRlbXBsYXRlUGFyc2VyXCI7XG5pbXBvcnQgVGVtcGxhdGVyUGx1Z2luIGZyb20gXCIuL21haW5cIjtcbmltcG9ydCB7IFVzZXJUZW1wbGF0ZVBhcnNlciB9IGZyb20gXCIuL1VzZXJUZW1wbGF0ZXMvVXNlclRlbXBsYXRlUGFyc2VyXCI7XG5pbXBvcnQgeyBUUGFyc2VyIH0gZnJvbSBcIlRQYXJzZXJcIjtcbmltcG9ydCB7IG9ic2lkaWFuX21vZHVsZSB9IGZyb20gXCJVdGlsc1wiO1xuaW1wb3J0IHsgUnVubmluZ0NvbmZpZyB9IGZyb20gXCJUZW1wbGF0ZXJcIjtcblxuZXhwb3J0IGVudW0gQ29udGV4dE1vZGUge1xuICAgIElOVEVSTkFMLFxuICAgIFVTRVJfSU5URVJOQUwsXG59O1xuXG5leHBvcnQgY2xhc3MgVGVtcGxhdGVQYXJzZXIgaW1wbGVtZW50cyBUUGFyc2VyIHtcbiAgICBwdWJsaWMgaW50ZXJuYWxUZW1wbGF0ZVBhcnNlcjogSW50ZXJuYWxUZW1wbGF0ZVBhcnNlcjtcblx0cHVibGljIHVzZXJUZW1wbGF0ZVBhcnNlcjogVXNlclRlbXBsYXRlUGFyc2VyO1xuICAgIHB1YmxpYyBjdXJyZW50X2NvbnRleHQ6IHt9O1xuICAgIFxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgYXBwOiBBcHAsIHByaXZhdGUgcGx1Z2luOiBUZW1wbGF0ZXJQbHVnaW4pIHtcbiAgICAgICAgdGhpcy5pbnRlcm5hbFRlbXBsYXRlUGFyc2VyID0gbmV3IEludGVybmFsVGVtcGxhdGVQYXJzZXIodGhpcy5hcHAsIHRoaXMucGx1Z2luKTtcbiAgICAgICAgdGhpcy51c2VyVGVtcGxhdGVQYXJzZXIgPSBuZXcgVXNlclRlbXBsYXRlUGFyc2VyKHRoaXMuYXBwLCB0aGlzLnBsdWdpbik7XG4gICAgfVxuXG4gICAgYXN5bmMgaW5pdCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgYXdhaXQgdGhpcy5pbnRlcm5hbFRlbXBsYXRlUGFyc2VyLmluaXQoKTtcbiAgICAgICAgYXdhaXQgdGhpcy51c2VyVGVtcGxhdGVQYXJzZXIuaW5pdCgpO1xuICAgIH1cblxuICAgIGFzeW5jIHNldEN1cnJlbnRDb250ZXh0KGNvbmZpZzogUnVubmluZ0NvbmZpZywgY29udGV4dF9tb2RlOiBDb250ZXh0TW9kZSk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICB0aGlzLmN1cnJlbnRfY29udGV4dCA9IGF3YWl0IHRoaXMuZ2VuZXJhdGVDb250ZXh0KGNvbmZpZywgY29udGV4dF9tb2RlKTtcbiAgICB9XG5cbiAgICBhZGRpdGlvbmFsQ29udGV4dCgpOiB7fSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBvYnNpZGlhbjogb2JzaWRpYW5fbW9kdWxlLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGFzeW5jIGdlbmVyYXRlQ29udGV4dChjb25maWc6IFJ1bm5pbmdDb25maWcsIGNvbnRleHRfbW9kZTogQ29udGV4dE1vZGUgPSBDb250ZXh0TW9kZS5VU0VSX0lOVEVSTkFMKTogUHJvbWlzZTx7fT4ge1xuICAgICAgICBjb25zdCBjb250ZXh0ID0ge307XG4gICAgICAgIGNvbnN0IGFkZGl0aW9uYWxfY29udGV4dCA9IHRoaXMuYWRkaXRpb25hbENvbnRleHQoKTtcbiAgICAgICAgY29uc3QgaW50ZXJuYWxfY29udGV4dCA9IGF3YWl0IHRoaXMuaW50ZXJuYWxUZW1wbGF0ZVBhcnNlci5nZW5lcmF0ZUNvbnRleHQoY29uZmlnKTtcbiAgICAgICAgbGV0IHVzZXJfY29udGV4dCA9IHt9O1xuXG4gICAgICAgIGlmICghdGhpcy5jdXJyZW50X2NvbnRleHQpIHtcbiAgICAgICAgICAgIC8vIElmIGEgdXNlciBzeXN0ZW0gY29tbWFuZCBpcyB1c2luZyB0cC5maWxlLmluY2x1ZGUsIHdlIG5lZWQgdGhlIGNvbnRleHQgdG8gYmUgc2V0LlxuICAgICAgICAgICAgdGhpcy5jdXJyZW50X2NvbnRleHQgPSBpbnRlcm5hbF9jb250ZXh0O1xuICAgICAgICB9XG5cbiAgICAgICAgT2JqZWN0LmFzc2lnbihjb250ZXh0LCBhZGRpdGlvbmFsX2NvbnRleHQpO1xuICAgICAgICBzd2l0Y2ggKGNvbnRleHRfbW9kZSkge1xuICAgICAgICAgICAgY2FzZSBDb250ZXh0TW9kZS5JTlRFUk5BTDpcbiAgICAgICAgICAgICAgICBPYmplY3QuYXNzaWduKGNvbnRleHQsIGludGVybmFsX2NvbnRleHQpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBDb250ZXh0TW9kZS5VU0VSX0lOVEVSTkFMOlxuICAgICAgICAgICAgICAgIHVzZXJfY29udGV4dCA9IGF3YWl0IHRoaXMudXNlclRlbXBsYXRlUGFyc2VyLmdlbmVyYXRlQ29udGV4dChjb25maWcpO1xuICAgICAgICAgICAgICAgIE9iamVjdC5hc3NpZ24oY29udGV4dCwge1xuICAgICAgICAgICAgICAgICAgICAuLi5pbnRlcm5hbF9jb250ZXh0LFxuICAgICAgICAgICAgICAgICAgICB1c2VyOiB1c2VyX2NvbnRleHQsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY29udGV4dDtcbiAgICB9XG5cbiAgICBhc3luYyBwYXJzZVRlbXBsYXRlcyhjb250ZW50OiBzdHJpbmcsIGNvbnRleHQ/OiBhbnkpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgICAgICBpZiAoIWNvbnRleHQpIHtcbiAgICAgICAgICAgIGNvbnRleHQgPSB0aGlzLmN1cnJlbnRfY29udGV4dDtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnRlbnQgPSBhd2FpdCBFdGEucmVuZGVyQXN5bmMoY29udGVudCwgY29udGV4dCwge1xuICAgICAgICAgICAgdmFyTmFtZTogXCJ0cFwiLFxuICAgICAgICAgICAgcGFyc2U6IHtcbiAgICAgICAgICAgICAgICBleGVjOiBcIipcIixcbiAgICAgICAgICAgICAgICBpbnRlcnBvbGF0ZTogXCJ+XCIsXG4gICAgICAgICAgICAgICAgcmF3OiBcIlwiLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGF1dG9UcmltOiBmYWxzZSxcbiAgICAgICAgICAgIGdsb2JhbEF3YWl0OiB0cnVlLFxuICAgICAgICB9KSBhcyBzdHJpbmc7XG5cbiAgICAgICAgcmV0dXJuIGNvbnRlbnQ7XG4gICAgfVxufSIsImltcG9ydCB7IEFwcCwgTWFya2Rvd25Qb3N0UHJvY2Vzc29yQ29udGV4dCwgTWFya2Rvd25WaWV3LCBURmlsZSwgVEZvbGRlciB9IGZyb20gXCJvYnNpZGlhblwiO1xuXG5pbXBvcnQgeyBDdXJzb3JKdW1wZXIgfSBmcm9tIFwiQ3Vyc29ySnVtcGVyXCI7XG5pbXBvcnQgVGVtcGxhdGVyUGx1Z2luIGZyb20gXCJtYWluXCI7XG5pbXBvcnQgeyBDb250ZXh0TW9kZSwgVGVtcGxhdGVQYXJzZXIgfSBmcm9tIFwiVGVtcGxhdGVQYXJzZXJcIjtcbmltcG9ydCB7IFRlbXBsYXRlckVycm9yIH0gZnJvbSBcIkVycm9yXCI7XG5cbmV4cG9ydCBlbnVtIFJ1bk1vZGUge1xuICAgIENyZWF0ZU5ld0Zyb21UZW1wbGF0ZSxcbiAgICBBcHBlbmRBY3RpdmVGaWxlLFxuICAgIE92ZXJ3cml0ZUZpbGUsXG4gICAgT3ZlcndyaXRlQWN0aXZlRmlsZSxcbiAgICBEeW5hbWljUHJvY2Vzc29yLFxufTtcblxuZXhwb3J0IGludGVyZmFjZSBSdW5uaW5nQ29uZmlnIHtcbiAgICB0ZW1wbGF0ZV9maWxlOiBURmlsZSxcbiAgICB0YXJnZXRfZmlsZTogVEZpbGUsXG4gICAgcnVuX21vZGU6IFJ1bk1vZGUsXG59O1xuXG5leHBvcnQgY2xhc3MgVGVtcGxhdGVyIHtcbiAgICBwdWJsaWMgcGFyc2VyOiBUZW1wbGF0ZVBhcnNlcjtcbiAgICBwdWJsaWMgY3Vyc29yX2p1bXBlcjogQ3Vyc29ySnVtcGVyO1xuXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBhcHA6IEFwcCwgcHJpdmF0ZSBwbHVnaW46IFRlbXBsYXRlclBsdWdpbikge1xuICAgICAgICB0aGlzLmN1cnNvcl9qdW1wZXIgPSBuZXcgQ3Vyc29ySnVtcGVyKHRoaXMuYXBwKTtcblx0XHR0aGlzLnBhcnNlciA9IG5ldyBUZW1wbGF0ZVBhcnNlcih0aGlzLmFwcCwgdGhpcy5wbHVnaW4pO1xuICAgIH1cblxuICAgIGFzeW5jIHNldHVwKCkge1xuICAgICAgICBhd2FpdCB0aGlzLnBhcnNlci5pbml0KCk7XG4gICAgfVxuXG4gICAgY3JlYXRlX3J1bm5pbmdfY29uZmlnKHRlbXBsYXRlX2ZpbGU6IFRGaWxlLCB0YXJnZXRfZmlsZTogVEZpbGUsIHJ1bl9tb2RlOiBSdW5Nb2RlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0ZW1wbGF0ZV9maWxlOiB0ZW1wbGF0ZV9maWxlLFxuICAgICAgICAgICAgdGFyZ2V0X2ZpbGU6IHRhcmdldF9maWxlLFxuICAgICAgICAgICAgcnVuX21vZGU6IHJ1bl9tb2RlLFxuICAgICAgICB9XG4gICAgfVxuXG4gICAgYXN5bmMgcmVhZF9hbmRfcGFyc2VfdGVtcGxhdGUoY29uZmlnOiBSdW5uaW5nQ29uZmlnKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICAgICAgY29uc3QgdGVtcGxhdGVfY29udGVudCA9IGF3YWl0IHRoaXMuYXBwLnZhdWx0LnJlYWQoY29uZmlnLnRlbXBsYXRlX2ZpbGUpO1xuICAgICAgICByZXR1cm4gdGhpcy5wYXJzZV90ZW1wbGF0ZShjb25maWcsIHRlbXBsYXRlX2NvbnRlbnQpO1xuICAgIH1cblxuICAgIGFzeW5jIHBhcnNlX3RlbXBsYXRlKGNvbmZpZzogUnVubmluZ0NvbmZpZywgdGVtcGxhdGVfY29udGVudDogc3RyaW5nKTogUHJvbWlzZSA8c3RyaW5nPiB7XG4gICAgICAgIGF3YWl0IHRoaXMucGFyc2VyLnNldEN1cnJlbnRDb250ZXh0KGNvbmZpZywgQ29udGV4dE1vZGUuVVNFUl9JTlRFUk5BTCk7XG4gICAgICAgIGNvbnN0IGNvbnRlbnQgPSBhd2FpdCB0aGlzLnBhcnNlci5wYXJzZVRlbXBsYXRlcyh0ZW1wbGF0ZV9jb250ZW50KTtcbiAgICAgICAgcmV0dXJuIGNvbnRlbnQ7XG4gICAgfVxuXG4gICAgYXN5bmMgY3JlYXRlX25ld19ub3RlX2Zyb21fdGVtcGxhdGUodGVtcGxhdGU6IFRGaWxlIHwgc3RyaW5nLCBmb2xkZXI/OiBURm9sZGVyLCBmaWxlbmFtZT86IHN0cmluZywgb3Blbl9uZXdfbm90ZTogYm9vbGVhbiA9IHRydWUpOiBQcm9taXNlPFRGaWxlPiB7XG4gICAgICAgIGlmICghZm9sZGVyKSB7XG4gICAgICAgICAgICBmb2xkZXIgPSB0aGlzLmFwcC5maWxlTWFuYWdlci5nZXROZXdGaWxlUGFyZW50KFwiXCIpO1xuICAgICAgICB9XG4gICAgICAgIC8vIFRPRE86IENoYW5nZSB0aGF0LCBub3Qgc3RhYmxlIGF0bVxuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIGNvbnN0IGNyZWF0ZWRfbm90ZSA9IGF3YWl0IHRoaXMuYXBwLmZpbGVNYW5hZ2VyLmNyZWF0ZU5ld01hcmtkb3duRmlsZShmb2xkZXIsIGZpbGVuYW1lID8/IFwiVW50aXRsZWRcIik7XG5cbiAgICAgICAgbGV0IHJ1bm5pbmdfY29uZmlnOiBSdW5uaW5nQ29uZmlnO1xuICAgICAgICBsZXQgb3V0cHV0X2NvbnRlbnQ6IHN0cmluZztcbiAgICAgICAgaWYgKHRlbXBsYXRlIGluc3RhbmNlb2YgVEZpbGUpIHtcbiAgICAgICAgICAgIHJ1bm5pbmdfY29uZmlnID0gdGhpcy5jcmVhdGVfcnVubmluZ19jb25maWcodGVtcGxhdGUsIGNyZWF0ZWRfbm90ZSwgUnVuTW9kZS5DcmVhdGVOZXdGcm9tVGVtcGxhdGUpO1xuICAgICAgICAgICAgb3V0cHV0X2NvbnRlbnQgPSBhd2FpdCB0aGlzLnBsdWdpbi5lcnJvcldyYXBwZXIoYXN5bmMgKCkgPT4gdGhpcy5yZWFkX2FuZF9wYXJzZV90ZW1wbGF0ZShydW5uaW5nX2NvbmZpZykpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcnVubmluZ19jb25maWcgPSB0aGlzLmNyZWF0ZV9ydW5uaW5nX2NvbmZpZyh1bmRlZmluZWQsIGNyZWF0ZWRfbm90ZSwgUnVuTW9kZS5DcmVhdGVOZXdGcm9tVGVtcGxhdGUpO1xuICAgICAgICAgICAgb3V0cHV0X2NvbnRlbnQgPSBhd2FpdCB0aGlzLnBsdWdpbi5lcnJvcldyYXBwZXIoYXN5bmMgKCkgPT4gdGhpcy5wYXJzZV90ZW1wbGF0ZShydW5uaW5nX2NvbmZpZywgdGVtcGxhdGUpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChvdXRwdXRfY29udGVudCA9PSBudWxsKSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLmFwcC52YXVsdC5kZWxldGUoY3JlYXRlZF9ub3RlKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGF3YWl0IHRoaXMuYXBwLnZhdWx0Lm1vZGlmeShjcmVhdGVkX25vdGUsIG91dHB1dF9jb250ZW50KTtcblxuICAgICAgICBpZiAob3Blbl9uZXdfbm90ZSkge1xuICAgICAgICAgICAgY29uc3QgYWN0aXZlX2xlYWYgPSB0aGlzLmFwcC53b3Jrc3BhY2UuYWN0aXZlTGVhZjtcbiAgICAgICAgICAgIGlmICghYWN0aXZlX2xlYWYpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5sb2dfZXJyb3IobmV3IFRlbXBsYXRlckVycm9yKFwiTm8gYWN0aXZlIGxlYWZcIikpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGF3YWl0IGFjdGl2ZV9sZWFmLm9wZW5GaWxlKGNyZWF0ZWRfbm90ZSwge3N0YXRlOiB7bW9kZTogJ3NvdXJjZSd9LCBlU3RhdGU6IHtyZW5hbWU6ICdhbGwnfX0pO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5jdXJzb3JfanVtcGVyLmp1bXBfdG9fbmV4dF9jdXJzb3JfbG9jYXRpb24oKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjcmVhdGVkX25vdGU7XG4gICAgfVxuXG4gICAgYXN5bmMgYXBwZW5kX3RlbXBsYXRlKHRlbXBsYXRlX2ZpbGU6IFRGaWxlKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGNvbnN0IGFjdGl2ZV92aWV3ID0gdGhpcy5hcHAud29ya3NwYWNlLmdldEFjdGl2ZVZpZXdPZlR5cGUoTWFya2Rvd25WaWV3KTtcbiAgICAgICAgaWYgKGFjdGl2ZV92aWV3ID09PSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5sb2dfZXJyb3IobmV3IFRlbXBsYXRlckVycm9yKFwiTm8gYWN0aXZlIHZpZXcsIGNhbid0IGFwcGVuZCB0ZW1wbGF0ZXMuXCIpKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBydW5uaW5nX2NvbmZpZyA9IHRoaXMuY3JlYXRlX3J1bm5pbmdfY29uZmlnKHRlbXBsYXRlX2ZpbGUsIGFjdGl2ZV92aWV3LmZpbGUsIFJ1bk1vZGUuQXBwZW5kQWN0aXZlRmlsZSk7XG4gICAgICAgIGNvbnN0IG91dHB1dF9jb250ZW50ID0gYXdhaXQgdGhpcy5wbHVnaW4uZXJyb3JXcmFwcGVyKGFzeW5jICgpID0+IHRoaXMucmVhZF9hbmRfcGFyc2VfdGVtcGxhdGUocnVubmluZ19jb25maWcpKTtcbiAgICAgICAgaWYgKG91dHB1dF9jb250ZW50ID09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGVkaXRvciA9IGFjdGl2ZV92aWV3LmVkaXRvcjtcbiAgICAgICAgY29uc3QgZG9jID0gZWRpdG9yLmdldERvYygpO1xuICAgICAgICBkb2MucmVwbGFjZVNlbGVjdGlvbihvdXRwdXRfY29udGVudCk7XG5cbiAgICAgICAgYXdhaXQgdGhpcy5jdXJzb3JfanVtcGVyLmp1bXBfdG9fbmV4dF9jdXJzb3JfbG9jYXRpb24oKTtcbiAgICB9XG5cbiAgICBvdmVyd3JpdGVfYWN0aXZlX2ZpbGVfdGVtcGxhdGVzKCk6IHZvaWQge1xuICAgICAgICBjb25zdCBhY3RpdmVfdmlldyA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVWaWV3T2ZUeXBlKE1hcmtkb3duVmlldyk7XG4gICAgICAgIGlmIChhY3RpdmVfdmlldyA9PT0gbnVsbCkge1xuXHRcdFx0dGhpcy5wbHVnaW4ubG9nX2Vycm9yKG5ldyBUZW1wbGF0ZXJFcnJvcihcIkFjdGl2ZSB2aWV3IGlzIG51bGwsIGNhbid0IG92ZXJ3cml0ZSBjb250ZW50XCIpKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLm92ZXJ3cml0ZV9maWxlX3RlbXBsYXRlcyhhY3RpdmVfdmlldy5maWxlLCB0cnVlKTtcblx0fVxuXG4gICAgYXN5bmMgb3ZlcndyaXRlX2ZpbGVfdGVtcGxhdGVzKGZpbGU6IFRGaWxlLCBhY3RpdmVfZmlsZTogYm9vbGVhbiA9IGZhbHNlKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGNvbnN0IHJ1bm5pbmdfY29uZmlnID0gdGhpcy5jcmVhdGVfcnVubmluZ19jb25maWcoZmlsZSwgZmlsZSwgYWN0aXZlX2ZpbGUgPyBSdW5Nb2RlLk92ZXJ3cml0ZUFjdGl2ZUZpbGUgOiBSdW5Nb2RlLk92ZXJ3cml0ZUZpbGUpO1xuICAgICAgICBjb25zdCBvdXRwdXRfY29udGVudCA9IGF3YWl0IHRoaXMucGx1Z2luLmVycm9yV3JhcHBlcihhc3luYyAoKSA9PiB0aGlzLnJlYWRfYW5kX3BhcnNlX3RlbXBsYXRlKHJ1bm5pbmdfY29uZmlnKSk7XG4gICAgICAgIGlmIChvdXRwdXRfY29udGVudCA9PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgYXdhaXQgdGhpcy5hcHAudmF1bHQubW9kaWZ5KGZpbGUsIG91dHB1dF9jb250ZW50KTtcbiAgICAgICAgaWYgKHRoaXMuYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVGaWxlKCkgPT09IGZpbGUpIHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuY3Vyc29yX2p1bXBlci5qdW1wX3RvX25leHRfY3Vyc29yX2xvY2F0aW9uKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhc3luYyBwcm9jZXNzX2R5bmFtaWNfdGVtcGxhdGVzKGVsOiBIVE1MRWxlbWVudCwgY3R4OiBNYXJrZG93blBvc3RQcm9jZXNzb3JDb250ZXh0KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGNvbnN0IGR5bmFtaWNfY29tbWFuZF9yZWdleDogUmVnRXhwID0gLyg8JSg/Oi18Xyk/XFxzKlsqfl17MCwxfSlcXCsoKD86LnxcXHMpKj8lPikvZztcblxuICAgICAgICBjb25zdCB3YWxrZXIgPSBkb2N1bWVudC5jcmVhdGVOb2RlSXRlcmF0b3IoZWwsIE5vZGVGaWx0ZXIuU0hPV19URVhUKTtcbiAgICAgICAgbGV0IG5vZGU7XG4gICAgICAgIGxldCBwYXNzID0gZmFsc2U7XG4gICAgICAgIHdoaWxlICgobm9kZSA9IHdhbGtlci5uZXh0Tm9kZSgpKSkge1xuICAgICAgICAgICAgbGV0IGNvbnRlbnQgPSBub2RlLm5vZGVWYWx1ZTtcbiAgICAgICAgICAgIGxldCBtYXRjaDtcbiAgICAgICAgICAgIGlmICgobWF0Y2ggPSBkeW5hbWljX2NvbW1hbmRfcmVnZXguZXhlYyhjb250ZW50KSkgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZpbGUgPSB0aGlzLmFwcC5tZXRhZGF0YUNhY2hlLmdldEZpcnN0TGlua3BhdGhEZXN0KFwiXCIsIGN0eC5zb3VyY2VQYXRoKTtcbiAgICAgICAgICAgICAgICBpZiAoIWZpbGUgfHwgIShmaWxlIGluc3RhbmNlb2YgVEZpbGUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKCFwYXNzKSB7XG4gICAgICAgICAgICAgICAgICAgIHBhc3MgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBydW5uaW5nX2NvbmZpZyA9IHRoaXMuY3JlYXRlX3J1bm5pbmdfY29uZmlnKGZpbGUsIGZpbGUsIFJ1bk1vZGUuRHluYW1pY1Byb2Nlc3Nvcik7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMucGFyc2VyLnNldEN1cnJlbnRDb250ZXh0KHJ1bm5pbmdfY29uZmlnLCBDb250ZXh0TW9kZS5VU0VSX0lOVEVSTkFMKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB3aGlsZSAobWF0Y2ggIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBOb3QgdGhlIG1vc3QgZWZmaWNpZW50IHdheSB0byBleGNsdWRlIHRoZSAnKycgZnJvbSB0aGUgY29tbWFuZCBidXQgSSBjb3VsZG4ndCBmaW5kIHNvbWV0aGluZyBiZXR0ZXJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY29tcGxldGVfY29tbWFuZCA9IG1hdGNoWzFdICsgbWF0Y2hbMl07XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbW1hbmRfb3V0cHV0OiBzdHJpbmcgPSBhd2FpdCB0aGlzLnBsdWdpbi5lcnJvcldyYXBwZXIoYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMucGFyc2VyLnBhcnNlVGVtcGxhdGVzKGNvbXBsZXRlX2NvbW1hbmQpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNvbW1hbmRfb3V0cHV0ID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBsZXQgc3RhcnQgPSBkeW5hbWljX2NvbW1hbmRfcmVnZXgubGFzdEluZGV4IC0gbWF0Y2hbMF0ubGVuZ3RoO1xuICAgICAgICAgICAgICAgICAgICBsZXQgZW5kID0gZHluYW1pY19jb21tYW5kX3JlZ2V4Lmxhc3RJbmRleDtcbiAgICAgICAgICAgICAgICAgICAgY29udGVudCA9IGNvbnRlbnQuc3Vic3RyaW5nKDAsIHN0YXJ0KSArIGNvbW1hbmRfb3V0cHV0ICsgY29udGVudC5zdWJzdHJpbmcoZW5kKTtcblxuICAgICAgICAgICAgICAgICAgICBkeW5hbWljX2NvbW1hbmRfcmVnZXgubGFzdEluZGV4ICs9IChjb21tYW5kX291dHB1dC5sZW5ndGggLSBtYXRjaFswXS5sZW5ndGgpO1xuICAgICAgICAgICAgICAgICAgICBtYXRjaCA9IGR5bmFtaWNfY29tbWFuZF9yZWdleC5leGVjKGNvbnRlbnQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBub2RlLm5vZGVWYWx1ZSA9IGNvbnRlbnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblx0fVxufSIsIi8vIENvZGVNaXJyb3IsIGNvcHlyaWdodCAoYykgYnkgTWFyaWpuIEhhdmVyYmVrZSBhbmQgb3RoZXJzXG4vLyBEaXN0cmlidXRlZCB1bmRlciBhbiBNSVQgbGljZW5zZTogaHR0cHM6Ly9jb2RlbWlycm9yLm5ldC9MSUNFTlNFXG5cbihmdW5jdGlvbihtb2QpIHtcbiAgbW9kKHdpbmRvdy5Db2RlTWlycm9yKTtcbn0pKGZ1bmN0aW9uKENvZGVNaXJyb3IpIHtcblwidXNlIHN0cmljdFwiO1xuXG5Db2RlTWlycm9yLmRlZmluZU1vZGUoXCJqYXZhc2NyaXB0XCIsIGZ1bmN0aW9uKGNvbmZpZywgcGFyc2VyQ29uZmlnKSB7XG4gIHZhciBpbmRlbnRVbml0ID0gY29uZmlnLmluZGVudFVuaXQ7XG4gIHZhciBzdGF0ZW1lbnRJbmRlbnQgPSBwYXJzZXJDb25maWcuc3RhdGVtZW50SW5kZW50O1xuICB2YXIganNvbmxkTW9kZSA9IHBhcnNlckNvbmZpZy5qc29ubGQ7XG4gIHZhciBqc29uTW9kZSA9IHBhcnNlckNvbmZpZy5qc29uIHx8IGpzb25sZE1vZGU7XG4gIHZhciB0cmFja1Njb3BlID0gcGFyc2VyQ29uZmlnLnRyYWNrU2NvcGUgIT09IGZhbHNlXG4gIHZhciBpc1RTID0gcGFyc2VyQ29uZmlnLnR5cGVzY3JpcHQ7XG4gIHZhciB3b3JkUkUgPSBwYXJzZXJDb25maWcud29yZENoYXJhY3RlcnMgfHwgL1tcXHckXFx4YTEtXFx1ZmZmZl0vO1xuXG4gIC8vIFRva2VuaXplclxuXG4gIHZhciBrZXl3b3JkcyA9IGZ1bmN0aW9uKCl7XG4gICAgZnVuY3Rpb24ga3codHlwZSkge3JldHVybiB7dHlwZTogdHlwZSwgc3R5bGU6IFwia2V5d29yZFwifTt9XG4gICAgdmFyIEEgPSBrdyhcImtleXdvcmQgYVwiKSwgQiA9IGt3KFwia2V5d29yZCBiXCIpLCBDID0ga3coXCJrZXl3b3JkIGNcIiksIEQgPSBrdyhcImtleXdvcmQgZFwiKTtcbiAgICB2YXIgb3BlcmF0b3IgPSBrdyhcIm9wZXJhdG9yXCIpLCBhdG9tID0ge3R5cGU6IFwiYXRvbVwiLCBzdHlsZTogXCJhdG9tXCJ9O1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIFwiaWZcIjoga3coXCJpZlwiKSwgXCJ3aGlsZVwiOiBBLCBcIndpdGhcIjogQSwgXCJlbHNlXCI6IEIsIFwiZG9cIjogQiwgXCJ0cnlcIjogQiwgXCJmaW5hbGx5XCI6IEIsXG4gICAgICBcInJldHVyblwiOiBELCBcImJyZWFrXCI6IEQsIFwiY29udGludWVcIjogRCwgXCJuZXdcIjoga3coXCJuZXdcIiksIFwiZGVsZXRlXCI6IEMsIFwidm9pZFwiOiBDLCBcInRocm93XCI6IEMsXG4gICAgICBcImRlYnVnZ2VyXCI6IGt3KFwiZGVidWdnZXJcIiksIFwidmFyXCI6IGt3KFwidmFyXCIpLCBcImNvbnN0XCI6IGt3KFwidmFyXCIpLCBcImxldFwiOiBrdyhcInZhclwiKSxcbiAgICAgIFwiZnVuY3Rpb25cIjoga3coXCJmdW5jdGlvblwiKSwgXCJjYXRjaFwiOiBrdyhcImNhdGNoXCIpLFxuICAgICAgXCJmb3JcIjoga3coXCJmb3JcIiksIFwic3dpdGNoXCI6IGt3KFwic3dpdGNoXCIpLCBcImNhc2VcIjoga3coXCJjYXNlXCIpLCBcImRlZmF1bHRcIjoga3coXCJkZWZhdWx0XCIpLFxuICAgICAgXCJpblwiOiBvcGVyYXRvciwgXCJ0eXBlb2ZcIjogb3BlcmF0b3IsIFwiaW5zdGFuY2VvZlwiOiBvcGVyYXRvcixcbiAgICAgIFwidHJ1ZVwiOiBhdG9tLCBcImZhbHNlXCI6IGF0b20sIFwibnVsbFwiOiBhdG9tLCBcInVuZGVmaW5lZFwiOiBhdG9tLCBcIk5hTlwiOiBhdG9tLCBcIkluZmluaXR5XCI6IGF0b20sXG4gICAgICBcInRoaXNcIjoga3coXCJ0aGlzXCIpLCBcImNsYXNzXCI6IGt3KFwiY2xhc3NcIiksIFwic3VwZXJcIjoga3coXCJhdG9tXCIpLFxuICAgICAgXCJ5aWVsZFwiOiBDLCBcImV4cG9ydFwiOiBrdyhcImV4cG9ydFwiKSwgXCJpbXBvcnRcIjoga3coXCJpbXBvcnRcIiksIFwiZXh0ZW5kc1wiOiBDLFxuICAgICAgXCJhd2FpdFwiOiBDXG4gICAgfTtcbiAgfSgpO1xuXG4gIHZhciBpc09wZXJhdG9yQ2hhciA9IC9bK1xcLSomJT08PiE/fH5eQF0vO1xuICB2YXIgaXNKc29ubGRLZXl3b3JkID0gL15AKGNvbnRleHR8aWR8dmFsdWV8bGFuZ3VhZ2V8dHlwZXxjb250YWluZXJ8bGlzdHxzZXR8cmV2ZXJzZXxpbmRleHxiYXNlfHZvY2FifGdyYXBoKVwiLztcblxuICBmdW5jdGlvbiByZWFkUmVnZXhwKHN0cmVhbSkge1xuICAgIHZhciBlc2NhcGVkID0gZmFsc2UsIG5leHQsIGluU2V0ID0gZmFsc2U7XG4gICAgd2hpbGUgKChuZXh0ID0gc3RyZWFtLm5leHQoKSkgIT0gbnVsbCkge1xuICAgICAgaWYgKCFlc2NhcGVkKSB7XG4gICAgICAgIGlmIChuZXh0ID09IFwiL1wiICYmICFpblNldCkgcmV0dXJuO1xuICAgICAgICBpZiAobmV4dCA9PSBcIltcIikgaW5TZXQgPSB0cnVlO1xuICAgICAgICBlbHNlIGlmIChpblNldCAmJiBuZXh0ID09IFwiXVwiKSBpblNldCA9IGZhbHNlO1xuICAgICAgfVxuICAgICAgZXNjYXBlZCA9ICFlc2NhcGVkICYmIG5leHQgPT0gXCJcXFxcXCI7XG4gICAgfVxuICB9XG5cbiAgLy8gVXNlZCBhcyBzY3JhdGNoIHZhcmlhYmxlcyB0byBjb21tdW5pY2F0ZSBtdWx0aXBsZSB2YWx1ZXMgd2l0aG91dFxuICAvLyBjb25zaW5nIHVwIHRvbnMgb2Ygb2JqZWN0cy5cbiAgdmFyIHR5cGUsIGNvbnRlbnQ7XG4gIGZ1bmN0aW9uIHJldCh0cCwgc3R5bGUsIGNvbnQpIHtcbiAgICB0eXBlID0gdHA7IGNvbnRlbnQgPSBjb250O1xuICAgIHJldHVybiBzdHlsZTtcbiAgfVxuICBmdW5jdGlvbiB0b2tlbkJhc2Uoc3RyZWFtLCBzdGF0ZSkge1xuICAgIHZhciBjaCA9IHN0cmVhbS5uZXh0KCk7XG4gICAgaWYgKGNoID09ICdcIicgfHwgY2ggPT0gXCInXCIpIHtcbiAgICAgIHN0YXRlLnRva2VuaXplID0gdG9rZW5TdHJpbmcoY2gpO1xuICAgICAgcmV0dXJuIHN0YXRlLnRva2VuaXplKHN0cmVhbSwgc3RhdGUpO1xuICAgIH0gZWxzZSBpZiAoY2ggPT0gXCIuXCIgJiYgc3RyZWFtLm1hdGNoKC9eXFxkW1xcZF9dKig/OltlRV1bK1xcLV0/W1xcZF9dKyk/LykpIHtcbiAgICAgIHJldHVybiByZXQoXCJudW1iZXJcIiwgXCJudW1iZXJcIik7XG4gICAgfSBlbHNlIGlmIChjaCA9PSBcIi5cIiAmJiBzdHJlYW0ubWF0Y2goXCIuLlwiKSkge1xuICAgICAgcmV0dXJuIHJldChcInNwcmVhZFwiLCBcIm1ldGFcIik7XG4gICAgfSBlbHNlIGlmICgvW1xcW1xcXXt9XFwoXFwpLDtcXDpcXC5dLy50ZXN0KGNoKSkge1xuICAgICAgcmV0dXJuIHJldChjaCk7XG4gICAgfSBlbHNlIGlmIChjaCA9PSBcIj1cIiAmJiBzdHJlYW0uZWF0KFwiPlwiKSkge1xuICAgICAgcmV0dXJuIHJldChcIj0+XCIsIFwib3BlcmF0b3JcIik7XG4gICAgfSBlbHNlIGlmIChjaCA9PSBcIjBcIiAmJiBzdHJlYW0ubWF0Y2goL14oPzp4W1xcZEEtRmEtZl9dK3xvWzAtN19dK3xiWzAxX10rKW4/LykpIHtcbiAgICAgIHJldHVybiByZXQoXCJudW1iZXJcIiwgXCJudW1iZXJcIik7XG4gICAgfSBlbHNlIGlmICgvXFxkLy50ZXN0KGNoKSkge1xuICAgICAgc3RyZWFtLm1hdGNoKC9eW1xcZF9dKig/Om58KD86XFwuW1xcZF9dKik/KD86W2VFXVsrXFwtXT9bXFxkX10rKT8pPy8pO1xuICAgICAgcmV0dXJuIHJldChcIm51bWJlclwiLCBcIm51bWJlclwiKTtcbiAgICB9IGVsc2UgaWYgKGNoID09IFwiL1wiKSB7XG4gICAgICBpZiAoc3RyZWFtLmVhdChcIipcIikpIHtcbiAgICAgICAgc3RhdGUudG9rZW5pemUgPSB0b2tlbkNvbW1lbnQ7XG4gICAgICAgIHJldHVybiB0b2tlbkNvbW1lbnQoc3RyZWFtLCBzdGF0ZSk7XG4gICAgICB9IGVsc2UgaWYgKHN0cmVhbS5lYXQoXCIvXCIpKSB7XG4gICAgICAgIHN0cmVhbS5za2lwVG9FbmQoKTtcbiAgICAgICAgcmV0dXJuIHJldChcImNvbW1lbnRcIiwgXCJjb21tZW50XCIpO1xuICAgICAgfSBlbHNlIGlmIChleHByZXNzaW9uQWxsb3dlZChzdHJlYW0sIHN0YXRlLCAxKSkge1xuICAgICAgICByZWFkUmVnZXhwKHN0cmVhbSk7XG4gICAgICAgIHN0cmVhbS5tYXRjaCgvXlxcYigoW2dpbXl1c10pKD8hW2dpbXl1c10qXFwyKSkrXFxiLyk7XG4gICAgICAgIHJldHVybiByZXQoXCJyZWdleHBcIiwgXCJzdHJpbmctMlwiKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0cmVhbS5lYXQoXCI9XCIpO1xuICAgICAgICByZXR1cm4gcmV0KFwib3BlcmF0b3JcIiwgXCJvcGVyYXRvclwiLCBzdHJlYW0uY3VycmVudCgpKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGNoID09IFwiYFwiKSB7XG4gICAgICBzdGF0ZS50b2tlbml6ZSA9IHRva2VuUXVhc2k7XG4gICAgICByZXR1cm4gdG9rZW5RdWFzaShzdHJlYW0sIHN0YXRlKTtcbiAgICB9IGVsc2UgaWYgKGNoID09IFwiI1wiICYmIHN0cmVhbS5wZWVrKCkgPT0gXCIhXCIpIHtcbiAgICAgIHN0cmVhbS5za2lwVG9FbmQoKTtcbiAgICAgIHJldHVybiByZXQoXCJtZXRhXCIsIFwibWV0YVwiKTtcbiAgICB9IGVsc2UgaWYgKGNoID09IFwiI1wiICYmIHN0cmVhbS5lYXRXaGlsZSh3b3JkUkUpKSB7XG4gICAgICByZXR1cm4gcmV0KFwidmFyaWFibGVcIiwgXCJwcm9wZXJ0eVwiKVxuICAgIH0gZWxzZSBpZiAoY2ggPT0gXCI8XCIgJiYgc3RyZWFtLm1hdGNoKFwiIS0tXCIpIHx8XG4gICAgICAgICAgICAgICAoY2ggPT0gXCItXCIgJiYgc3RyZWFtLm1hdGNoKFwiLT5cIikgJiYgIS9cXFMvLnRlc3Qoc3RyZWFtLnN0cmluZy5zbGljZSgwLCBzdHJlYW0uc3RhcnQpKSkpIHtcbiAgICAgIHN0cmVhbS5za2lwVG9FbmQoKVxuICAgICAgcmV0dXJuIHJldChcImNvbW1lbnRcIiwgXCJjb21tZW50XCIpXG4gICAgfSBlbHNlIGlmIChpc09wZXJhdG9yQ2hhci50ZXN0KGNoKSkge1xuICAgICAgaWYgKGNoICE9IFwiPlwiIHx8ICFzdGF0ZS5sZXhpY2FsIHx8IHN0YXRlLmxleGljYWwudHlwZSAhPSBcIj5cIikge1xuICAgICAgICBpZiAoc3RyZWFtLmVhdChcIj1cIikpIHtcbiAgICAgICAgICBpZiAoY2ggPT0gXCIhXCIgfHwgY2ggPT0gXCI9XCIpIHN0cmVhbS5lYXQoXCI9XCIpXG4gICAgICAgIH0gZWxzZSBpZiAoL1s8PiorXFwtfCY/XS8udGVzdChjaCkpIHtcbiAgICAgICAgICBzdHJlYW0uZWF0KGNoKVxuICAgICAgICAgIGlmIChjaCA9PSBcIj5cIikgc3RyZWFtLmVhdChjaClcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKGNoID09IFwiP1wiICYmIHN0cmVhbS5lYXQoXCIuXCIpKSByZXR1cm4gcmV0KFwiLlwiKVxuICAgICAgcmV0dXJuIHJldChcIm9wZXJhdG9yXCIsIFwib3BlcmF0b3JcIiwgc3RyZWFtLmN1cnJlbnQoKSk7XG4gICAgfSBlbHNlIGlmICh3b3JkUkUudGVzdChjaCkpIHtcbiAgICAgIHN0cmVhbS5lYXRXaGlsZSh3b3JkUkUpO1xuICAgICAgdmFyIHdvcmQgPSBzdHJlYW0uY3VycmVudCgpXG4gICAgICBpZiAoc3RhdGUubGFzdFR5cGUgIT0gXCIuXCIpIHtcbiAgICAgICAgaWYgKGtleXdvcmRzLnByb3BlcnR5SXNFbnVtZXJhYmxlKHdvcmQpKSB7XG4gICAgICAgICAgdmFyIGt3ID0ga2V5d29yZHNbd29yZF1cbiAgICAgICAgICByZXR1cm4gcmV0KGt3LnR5cGUsIGt3LnN0eWxlLCB3b3JkKVxuICAgICAgICB9XG4gICAgICAgIGlmICh3b3JkID09IFwiYXN5bmNcIiAmJiBzdHJlYW0ubWF0Y2goL14oXFxzfFxcL1xcKihbXipdfFxcKig/IVxcLykpKj9cXCpcXC8pKltcXFtcXChcXHddLywgZmFsc2UpKVxuICAgICAgICAgIHJldHVybiByZXQoXCJhc3luY1wiLCBcImtleXdvcmRcIiwgd29yZClcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXQoXCJ2YXJpYWJsZVwiLCBcInZhcmlhYmxlXCIsIHdvcmQpXG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gdG9rZW5TdHJpbmcocXVvdGUpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oc3RyZWFtLCBzdGF0ZSkge1xuICAgICAgdmFyIGVzY2FwZWQgPSBmYWxzZSwgbmV4dDtcbiAgICAgIGlmIChqc29ubGRNb2RlICYmIHN0cmVhbS5wZWVrKCkgPT0gXCJAXCIgJiYgc3RyZWFtLm1hdGNoKGlzSnNvbmxkS2V5d29yZCkpe1xuICAgICAgICBzdGF0ZS50b2tlbml6ZSA9IHRva2VuQmFzZTtcbiAgICAgICAgcmV0dXJuIHJldChcImpzb25sZC1rZXl3b3JkXCIsIFwibWV0YVwiKTtcbiAgICAgIH1cbiAgICAgIHdoaWxlICgobmV4dCA9IHN0cmVhbS5uZXh0KCkpICE9IG51bGwpIHtcbiAgICAgICAgaWYgKG5leHQgPT0gcXVvdGUgJiYgIWVzY2FwZWQpIGJyZWFrO1xuICAgICAgICBlc2NhcGVkID0gIWVzY2FwZWQgJiYgbmV4dCA9PSBcIlxcXFxcIjtcbiAgICAgIH1cbiAgICAgIGlmICghZXNjYXBlZCkgc3RhdGUudG9rZW5pemUgPSB0b2tlbkJhc2U7XG4gICAgICByZXR1cm4gcmV0KFwic3RyaW5nXCIsIFwic3RyaW5nXCIpO1xuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiB0b2tlbkNvbW1lbnQoc3RyZWFtLCBzdGF0ZSkge1xuICAgIHZhciBtYXliZUVuZCA9IGZhbHNlLCBjaDtcbiAgICB3aGlsZSAoY2ggPSBzdHJlYW0ubmV4dCgpKSB7XG4gICAgICBpZiAoY2ggPT0gXCIvXCIgJiYgbWF5YmVFbmQpIHtcbiAgICAgICAgc3RhdGUudG9rZW5pemUgPSB0b2tlbkJhc2U7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgbWF5YmVFbmQgPSAoY2ggPT0gXCIqXCIpO1xuICAgIH1cbiAgICByZXR1cm4gcmV0KFwiY29tbWVudFwiLCBcImNvbW1lbnRcIik7XG4gIH1cblxuICBmdW5jdGlvbiB0b2tlblF1YXNpKHN0cmVhbSwgc3RhdGUpIHtcbiAgICB2YXIgZXNjYXBlZCA9IGZhbHNlLCBuZXh0O1xuICAgIHdoaWxlICgobmV4dCA9IHN0cmVhbS5uZXh0KCkpICE9IG51bGwpIHtcbiAgICAgIGlmICghZXNjYXBlZCAmJiAobmV4dCA9PSBcImBcIiB8fCBuZXh0ID09IFwiJFwiICYmIHN0cmVhbS5lYXQoXCJ7XCIpKSkge1xuICAgICAgICBzdGF0ZS50b2tlbml6ZSA9IHRva2VuQmFzZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBlc2NhcGVkID0gIWVzY2FwZWQgJiYgbmV4dCA9PSBcIlxcXFxcIjtcbiAgICB9XG4gICAgcmV0dXJuIHJldChcInF1YXNpXCIsIFwic3RyaW5nLTJcIiwgc3RyZWFtLmN1cnJlbnQoKSk7XG4gIH1cblxuICB2YXIgYnJhY2tldHMgPSBcIihbe31dKVwiO1xuICAvLyBUaGlzIGlzIGEgY3J1ZGUgbG9va2FoZWFkIHRyaWNrIHRvIHRyeSBhbmQgbm90aWNlIHRoYXQgd2UncmVcbiAgLy8gcGFyc2luZyB0aGUgYXJndW1lbnQgcGF0dGVybnMgZm9yIGEgZmF0LWFycm93IGZ1bmN0aW9uIGJlZm9yZSB3ZVxuICAvLyBhY3R1YWxseSBoaXQgdGhlIGFycm93IHRva2VuLiBJdCBvbmx5IHdvcmtzIGlmIHRoZSBhcnJvdyBpcyBvblxuICAvLyB0aGUgc2FtZSBsaW5lIGFzIHRoZSBhcmd1bWVudHMgYW5kIHRoZXJlJ3Mgbm8gc3RyYW5nZSBub2lzZVxuICAvLyAoY29tbWVudHMpIGluIGJldHdlZW4uIEZhbGxiYWNrIGlzIHRvIG9ubHkgbm90aWNlIHdoZW4gd2UgaGl0IHRoZVxuICAvLyBhcnJvdywgYW5kIG5vdCBkZWNsYXJlIHRoZSBhcmd1bWVudHMgYXMgbG9jYWxzIGZvciB0aGUgYXJyb3dcbiAgLy8gYm9keS5cbiAgZnVuY3Rpb24gZmluZEZhdEFycm93KHN0cmVhbSwgc3RhdGUpIHtcbiAgICBpZiAoc3RhdGUuZmF0QXJyb3dBdCkgc3RhdGUuZmF0QXJyb3dBdCA9IG51bGw7XG4gICAgdmFyIGFycm93ID0gc3RyZWFtLnN0cmluZy5pbmRleE9mKFwiPT5cIiwgc3RyZWFtLnN0YXJ0KTtcbiAgICBpZiAoYXJyb3cgPCAwKSByZXR1cm47XG5cbiAgICBpZiAoaXNUUykgeyAvLyBUcnkgdG8gc2tpcCBUeXBlU2NyaXB0IHJldHVybiB0eXBlIGRlY2xhcmF0aW9ucyBhZnRlciB0aGUgYXJndW1lbnRzXG4gICAgICB2YXIgbSA9IC86XFxzKig/OlxcdysoPzo8W14+XSo+fFxcW1xcXSk/fFxce1tefV0qXFx9KVxccyokLy5leGVjKHN0cmVhbS5zdHJpbmcuc2xpY2Uoc3RyZWFtLnN0YXJ0LCBhcnJvdykpXG4gICAgICBpZiAobSkgYXJyb3cgPSBtLmluZGV4XG4gICAgfVxuXG4gICAgdmFyIGRlcHRoID0gMCwgc2F3U29tZXRoaW5nID0gZmFsc2U7XG4gICAgZm9yICh2YXIgcG9zID0gYXJyb3cgLSAxOyBwb3MgPj0gMDsgLS1wb3MpIHtcbiAgICAgIHZhciBjaCA9IHN0cmVhbS5zdHJpbmcuY2hhckF0KHBvcyk7XG4gICAgICB2YXIgYnJhY2tldCA9IGJyYWNrZXRzLmluZGV4T2YoY2gpO1xuICAgICAgaWYgKGJyYWNrZXQgPj0gMCAmJiBicmFja2V0IDwgMykge1xuICAgICAgICBpZiAoIWRlcHRoKSB7ICsrcG9zOyBicmVhazsgfVxuICAgICAgICBpZiAoLS1kZXB0aCA9PSAwKSB7IGlmIChjaCA9PSBcIihcIikgc2F3U29tZXRoaW5nID0gdHJ1ZTsgYnJlYWs7IH1cbiAgICAgIH0gZWxzZSBpZiAoYnJhY2tldCA+PSAzICYmIGJyYWNrZXQgPCA2KSB7XG4gICAgICAgICsrZGVwdGg7XG4gICAgICB9IGVsc2UgaWYgKHdvcmRSRS50ZXN0KGNoKSkge1xuICAgICAgICBzYXdTb21ldGhpbmcgPSB0cnVlO1xuICAgICAgfSBlbHNlIGlmICgvW1wiJ1xcL2BdLy50ZXN0KGNoKSkge1xuICAgICAgICBmb3IgKDs7IC0tcG9zKSB7XG4gICAgICAgICAgaWYgKHBvcyA9PSAwKSByZXR1cm5cbiAgICAgICAgICB2YXIgbmV4dCA9IHN0cmVhbS5zdHJpbmcuY2hhckF0KHBvcyAtIDEpXG4gICAgICAgICAgaWYgKG5leHQgPT0gY2ggJiYgc3RyZWFtLnN0cmluZy5jaGFyQXQocG9zIC0gMikgIT0gXCJcXFxcXCIpIHsgcG9zLS07IGJyZWFrIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChzYXdTb21ldGhpbmcgJiYgIWRlcHRoKSB7XG4gICAgICAgICsrcG9zO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHNhd1NvbWV0aGluZyAmJiAhZGVwdGgpIHN0YXRlLmZhdEFycm93QXQgPSBwb3M7XG4gIH1cblxuICAvLyBQYXJzZXJcblxuICB2YXIgYXRvbWljVHlwZXMgPSB7XCJhdG9tXCI6IHRydWUsIFwibnVtYmVyXCI6IHRydWUsIFwidmFyaWFibGVcIjogdHJ1ZSwgXCJzdHJpbmdcIjogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgIFwicmVnZXhwXCI6IHRydWUsIFwidGhpc1wiOiB0cnVlLCBcImltcG9ydFwiOiB0cnVlLCBcImpzb25sZC1rZXl3b3JkXCI6IHRydWV9O1xuXG4gIGZ1bmN0aW9uIEpTTGV4aWNhbChpbmRlbnRlZCwgY29sdW1uLCB0eXBlLCBhbGlnbiwgcHJldiwgaW5mbykge1xuICAgIHRoaXMuaW5kZW50ZWQgPSBpbmRlbnRlZDtcbiAgICB0aGlzLmNvbHVtbiA9IGNvbHVtbjtcbiAgICB0aGlzLnR5cGUgPSB0eXBlO1xuICAgIHRoaXMucHJldiA9IHByZXY7XG4gICAgdGhpcy5pbmZvID0gaW5mbztcbiAgICBpZiAoYWxpZ24gIT0gbnVsbCkgdGhpcy5hbGlnbiA9IGFsaWduO1xuICB9XG5cbiAgZnVuY3Rpb24gaW5TY29wZShzdGF0ZSwgdmFybmFtZSkge1xuICAgIGlmICghdHJhY2tTY29wZSkgcmV0dXJuIGZhbHNlXG4gICAgZm9yICh2YXIgdiA9IHN0YXRlLmxvY2FsVmFyczsgdjsgdiA9IHYubmV4dClcbiAgICAgIGlmICh2Lm5hbWUgPT0gdmFybmFtZSkgcmV0dXJuIHRydWU7XG4gICAgZm9yICh2YXIgY3ggPSBzdGF0ZS5jb250ZXh0OyBjeDsgY3ggPSBjeC5wcmV2KSB7XG4gICAgICBmb3IgKHZhciB2ID0gY3gudmFyczsgdjsgdiA9IHYubmV4dClcbiAgICAgICAgaWYgKHYubmFtZSA9PSB2YXJuYW1lKSByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBwYXJzZUpTKHN0YXRlLCBzdHlsZSwgdHlwZSwgY29udGVudCwgc3RyZWFtKSB7XG4gICAgdmFyIGNjID0gc3RhdGUuY2M7XG4gICAgLy8gQ29tbXVuaWNhdGUgb3VyIGNvbnRleHQgdG8gdGhlIGNvbWJpbmF0b3JzLlxuICAgIC8vIChMZXNzIHdhc3RlZnVsIHRoYW4gY29uc2luZyB1cCBhIGh1bmRyZWQgY2xvc3VyZXMgb24gZXZlcnkgY2FsbC4pXG4gICAgY3guc3RhdGUgPSBzdGF0ZTsgY3guc3RyZWFtID0gc3RyZWFtOyBjeC5tYXJrZWQgPSBudWxsLCBjeC5jYyA9IGNjOyBjeC5zdHlsZSA9IHN0eWxlO1xuXG4gICAgaWYgKCFzdGF0ZS5sZXhpY2FsLmhhc093blByb3BlcnR5KFwiYWxpZ25cIikpXG4gICAgICBzdGF0ZS5sZXhpY2FsLmFsaWduID0gdHJ1ZTtcblxuICAgIHdoaWxlKHRydWUpIHtcbiAgICAgIHZhciBjb21iaW5hdG9yID0gY2MubGVuZ3RoID8gY2MucG9wKCkgOiBqc29uTW9kZSA/IGV4cHJlc3Npb24gOiBzdGF0ZW1lbnQ7XG4gICAgICBpZiAoY29tYmluYXRvcih0eXBlLCBjb250ZW50KSkge1xuICAgICAgICB3aGlsZShjYy5sZW5ndGggJiYgY2NbY2MubGVuZ3RoIC0gMV0ubGV4KVxuICAgICAgICAgIGNjLnBvcCgpKCk7XG4gICAgICAgIGlmIChjeC5tYXJrZWQpIHJldHVybiBjeC5tYXJrZWQ7XG4gICAgICAgIGlmICh0eXBlID09IFwidmFyaWFibGVcIiAmJiBpblNjb3BlKHN0YXRlLCBjb250ZW50KSkgcmV0dXJuIFwidmFyaWFibGUtMlwiO1xuICAgICAgICByZXR1cm4gc3R5bGU7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gQ29tYmluYXRvciB1dGlsc1xuXG4gIHZhciBjeCA9IHtzdGF0ZTogbnVsbCwgY29sdW1uOiBudWxsLCBtYXJrZWQ6IG51bGwsIGNjOiBudWxsfTtcbiAgZnVuY3Rpb24gcGFzcygpIHtcbiAgICBmb3IgKHZhciBpID0gYXJndW1lbnRzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSBjeC5jYy5wdXNoKGFyZ3VtZW50c1tpXSk7XG4gIH1cbiAgZnVuY3Rpb24gY29udCgpIHtcbiAgICBwYXNzLmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgZnVuY3Rpb24gaW5MaXN0KG5hbWUsIGxpc3QpIHtcbiAgICBmb3IgKHZhciB2ID0gbGlzdDsgdjsgdiA9IHYubmV4dCkgaWYgKHYubmFtZSA9PSBuYW1lKSByZXR1cm4gdHJ1ZVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBmdW5jdGlvbiByZWdpc3Rlcih2YXJuYW1lKSB7XG4gICAgdmFyIHN0YXRlID0gY3guc3RhdGU7XG4gICAgY3gubWFya2VkID0gXCJkZWZcIjtcbiAgICBpZiAoIXRyYWNrU2NvcGUpIHJldHVyblxuICAgIGlmIChzdGF0ZS5jb250ZXh0KSB7XG4gICAgICBpZiAoc3RhdGUubGV4aWNhbC5pbmZvID09IFwidmFyXCIgJiYgc3RhdGUuY29udGV4dCAmJiBzdGF0ZS5jb250ZXh0LmJsb2NrKSB7XG4gICAgICAgIC8vIEZJWE1FIGZ1bmN0aW9uIGRlY2xzIGFyZSBhbHNvIG5vdCBibG9jayBzY29wZWRcbiAgICAgICAgdmFyIG5ld0NvbnRleHQgPSByZWdpc3RlclZhclNjb3BlZCh2YXJuYW1lLCBzdGF0ZS5jb250ZXh0KVxuICAgICAgICBpZiAobmV3Q29udGV4dCAhPSBudWxsKSB7XG4gICAgICAgICAgc3RhdGUuY29udGV4dCA9IG5ld0NvbnRleHRcbiAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmICghaW5MaXN0KHZhcm5hbWUsIHN0YXRlLmxvY2FsVmFycykpIHtcbiAgICAgICAgc3RhdGUubG9jYWxWYXJzID0gbmV3IFZhcih2YXJuYW1lLCBzdGF0ZS5sb2NhbFZhcnMpXG4gICAgICAgIHJldHVyblxuICAgICAgfVxuICAgIH1cbiAgICAvLyBGYWxsIHRocm91Z2ggbWVhbnMgdGhpcyBpcyBnbG9iYWxcbiAgICBpZiAocGFyc2VyQ29uZmlnLmdsb2JhbFZhcnMgJiYgIWluTGlzdCh2YXJuYW1lLCBzdGF0ZS5nbG9iYWxWYXJzKSlcbiAgICAgIHN0YXRlLmdsb2JhbFZhcnMgPSBuZXcgVmFyKHZhcm5hbWUsIHN0YXRlLmdsb2JhbFZhcnMpXG4gIH1cbiAgZnVuY3Rpb24gcmVnaXN0ZXJWYXJTY29wZWQodmFybmFtZSwgY29udGV4dCkge1xuICAgIGlmICghY29udGV4dCkge1xuICAgICAgcmV0dXJuIG51bGxcbiAgICB9IGVsc2UgaWYgKGNvbnRleHQuYmxvY2spIHtcbiAgICAgIHZhciBpbm5lciA9IHJlZ2lzdGVyVmFyU2NvcGVkKHZhcm5hbWUsIGNvbnRleHQucHJldilcbiAgICAgIGlmICghaW5uZXIpIHJldHVybiBudWxsXG4gICAgICBpZiAoaW5uZXIgPT0gY29udGV4dC5wcmV2KSByZXR1cm4gY29udGV4dFxuICAgICAgcmV0dXJuIG5ldyBDb250ZXh0KGlubmVyLCBjb250ZXh0LnZhcnMsIHRydWUpXG4gICAgfSBlbHNlIGlmIChpbkxpc3QodmFybmFtZSwgY29udGV4dC52YXJzKSkge1xuICAgICAgcmV0dXJuIGNvbnRleHRcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIG5ldyBDb250ZXh0KGNvbnRleHQucHJldiwgbmV3IFZhcih2YXJuYW1lLCBjb250ZXh0LnZhcnMpLCBmYWxzZSlcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBpc01vZGlmaWVyKG5hbWUpIHtcbiAgICByZXR1cm4gbmFtZSA9PSBcInB1YmxpY1wiIHx8IG5hbWUgPT0gXCJwcml2YXRlXCIgfHwgbmFtZSA9PSBcInByb3RlY3RlZFwiIHx8IG5hbWUgPT0gXCJhYnN0cmFjdFwiIHx8IG5hbWUgPT0gXCJyZWFkb25seVwiXG4gIH1cblxuICAvLyBDb21iaW5hdG9yc1xuXG4gIGZ1bmN0aW9uIENvbnRleHQocHJldiwgdmFycywgYmxvY2spIHsgdGhpcy5wcmV2ID0gcHJldjsgdGhpcy52YXJzID0gdmFyczsgdGhpcy5ibG9jayA9IGJsb2NrIH1cbiAgZnVuY3Rpb24gVmFyKG5hbWUsIG5leHQpIHsgdGhpcy5uYW1lID0gbmFtZTsgdGhpcy5uZXh0ID0gbmV4dCB9XG5cbiAgdmFyIGRlZmF1bHRWYXJzID0gbmV3IFZhcihcInRoaXNcIiwgbmV3IFZhcihcImFyZ3VtZW50c1wiLCBudWxsKSlcbiAgZnVuY3Rpb24gcHVzaGNvbnRleHQoKSB7XG4gICAgY3guc3RhdGUuY29udGV4dCA9IG5ldyBDb250ZXh0KGN4LnN0YXRlLmNvbnRleHQsIGN4LnN0YXRlLmxvY2FsVmFycywgZmFsc2UpXG4gICAgY3guc3RhdGUubG9jYWxWYXJzID0gZGVmYXVsdFZhcnNcbiAgfVxuICBmdW5jdGlvbiBwdXNoYmxvY2tjb250ZXh0KCkge1xuICAgIGN4LnN0YXRlLmNvbnRleHQgPSBuZXcgQ29udGV4dChjeC5zdGF0ZS5jb250ZXh0LCBjeC5zdGF0ZS5sb2NhbFZhcnMsIHRydWUpXG4gICAgY3guc3RhdGUubG9jYWxWYXJzID0gbnVsbFxuICB9XG4gIGZ1bmN0aW9uIHBvcGNvbnRleHQoKSB7XG4gICAgY3guc3RhdGUubG9jYWxWYXJzID0gY3guc3RhdGUuY29udGV4dC52YXJzXG4gICAgY3guc3RhdGUuY29udGV4dCA9IGN4LnN0YXRlLmNvbnRleHQucHJldlxuICB9XG4gIHBvcGNvbnRleHQubGV4ID0gdHJ1ZVxuICBmdW5jdGlvbiBwdXNobGV4KHR5cGUsIGluZm8pIHtcbiAgICB2YXIgcmVzdWx0ID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgc3RhdGUgPSBjeC5zdGF0ZSwgaW5kZW50ID0gc3RhdGUuaW5kZW50ZWQ7XG4gICAgICBpZiAoc3RhdGUubGV4aWNhbC50eXBlID09IFwic3RhdFwiKSBpbmRlbnQgPSBzdGF0ZS5sZXhpY2FsLmluZGVudGVkO1xuICAgICAgZWxzZSBmb3IgKHZhciBvdXRlciA9IHN0YXRlLmxleGljYWw7IG91dGVyICYmIG91dGVyLnR5cGUgPT0gXCIpXCIgJiYgb3V0ZXIuYWxpZ247IG91dGVyID0gb3V0ZXIucHJldilcbiAgICAgICAgaW5kZW50ID0gb3V0ZXIuaW5kZW50ZWQ7XG4gICAgICBzdGF0ZS5sZXhpY2FsID0gbmV3IEpTTGV4aWNhbChpbmRlbnQsIGN4LnN0cmVhbS5jb2x1bW4oKSwgdHlwZSwgbnVsbCwgc3RhdGUubGV4aWNhbCwgaW5mbyk7XG4gICAgfTtcbiAgICByZXN1bHQubGV4ID0gdHJ1ZTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG4gIGZ1bmN0aW9uIHBvcGxleCgpIHtcbiAgICB2YXIgc3RhdGUgPSBjeC5zdGF0ZTtcbiAgICBpZiAoc3RhdGUubGV4aWNhbC5wcmV2KSB7XG4gICAgICBpZiAoc3RhdGUubGV4aWNhbC50eXBlID09IFwiKVwiKVxuICAgICAgICBzdGF0ZS5pbmRlbnRlZCA9IHN0YXRlLmxleGljYWwuaW5kZW50ZWQ7XG4gICAgICBzdGF0ZS5sZXhpY2FsID0gc3RhdGUubGV4aWNhbC5wcmV2O1xuICAgIH1cbiAgfVxuICBwb3BsZXgubGV4ID0gdHJ1ZTtcblxuICBmdW5jdGlvbiBleHBlY3Qod2FudGVkKSB7XG4gICAgZnVuY3Rpb24gZXhwKHR5cGUpIHtcbiAgICAgIGlmICh0eXBlID09IHdhbnRlZCkgcmV0dXJuIGNvbnQoKTtcbiAgICAgIGVsc2UgaWYgKHdhbnRlZCA9PSBcIjtcIiB8fCB0eXBlID09IFwifVwiIHx8IHR5cGUgPT0gXCIpXCIgfHwgdHlwZSA9PSBcIl1cIikgcmV0dXJuIHBhc3MoKTtcbiAgICAgIGVsc2UgcmV0dXJuIGNvbnQoZXhwKTtcbiAgICB9O1xuICAgIHJldHVybiBleHA7XG4gIH1cblxuICBmdW5jdGlvbiBzdGF0ZW1lbnQodHlwZSwgdmFsdWUpIHtcbiAgICBpZiAodHlwZSA9PSBcInZhclwiKSByZXR1cm4gY29udChwdXNobGV4KFwidmFyZGVmXCIsIHZhbHVlKSwgdmFyZGVmLCBleHBlY3QoXCI7XCIpLCBwb3BsZXgpO1xuICAgIGlmICh0eXBlID09IFwia2V5d29yZCBhXCIpIHJldHVybiBjb250KHB1c2hsZXgoXCJmb3JtXCIpLCBwYXJlbkV4cHIsIHN0YXRlbWVudCwgcG9wbGV4KTtcbiAgICBpZiAodHlwZSA9PSBcImtleXdvcmQgYlwiKSByZXR1cm4gY29udChwdXNobGV4KFwiZm9ybVwiKSwgc3RhdGVtZW50LCBwb3BsZXgpO1xuICAgIGlmICh0eXBlID09IFwia2V5d29yZCBkXCIpIHJldHVybiBjeC5zdHJlYW0ubWF0Y2goL15cXHMqJC8sIGZhbHNlKSA/IGNvbnQoKSA6IGNvbnQocHVzaGxleChcInN0YXRcIiksIG1heWJlZXhwcmVzc2lvbiwgZXhwZWN0KFwiO1wiKSwgcG9wbGV4KTtcbiAgICBpZiAodHlwZSA9PSBcImRlYnVnZ2VyXCIpIHJldHVybiBjb250KGV4cGVjdChcIjtcIikpO1xuICAgIGlmICh0eXBlID09IFwie1wiKSByZXR1cm4gY29udChwdXNobGV4KFwifVwiKSwgcHVzaGJsb2NrY29udGV4dCwgYmxvY2ssIHBvcGxleCwgcG9wY29udGV4dCk7XG4gICAgaWYgKHR5cGUgPT0gXCI7XCIpIHJldHVybiBjb250KCk7XG4gICAgaWYgKHR5cGUgPT0gXCJpZlwiKSB7XG4gICAgICBpZiAoY3guc3RhdGUubGV4aWNhbC5pbmZvID09IFwiZWxzZVwiICYmIGN4LnN0YXRlLmNjW2N4LnN0YXRlLmNjLmxlbmd0aCAtIDFdID09IHBvcGxleClcbiAgICAgICAgY3guc3RhdGUuY2MucG9wKCkoKTtcbiAgICAgIHJldHVybiBjb250KHB1c2hsZXgoXCJmb3JtXCIpLCBwYXJlbkV4cHIsIHN0YXRlbWVudCwgcG9wbGV4LCBtYXliZWVsc2UpO1xuICAgIH1cbiAgICBpZiAodHlwZSA9PSBcImZ1bmN0aW9uXCIpIHJldHVybiBjb250KGZ1bmN0aW9uZGVmKTtcbiAgICBpZiAodHlwZSA9PSBcImZvclwiKSByZXR1cm4gY29udChwdXNobGV4KFwiZm9ybVwiKSwgcHVzaGJsb2NrY29udGV4dCwgZm9yc3BlYywgc3RhdGVtZW50LCBwb3Bjb250ZXh0LCBwb3BsZXgpO1xuICAgIGlmICh0eXBlID09IFwiY2xhc3NcIiB8fCAoaXNUUyAmJiB2YWx1ZSA9PSBcImludGVyZmFjZVwiKSkge1xuICAgICAgY3gubWFya2VkID0gXCJrZXl3b3JkXCJcbiAgICAgIHJldHVybiBjb250KHB1c2hsZXgoXCJmb3JtXCIsIHR5cGUgPT0gXCJjbGFzc1wiID8gdHlwZSA6IHZhbHVlKSwgY2xhc3NOYW1lLCBwb3BsZXgpXG4gICAgfVxuICAgIGlmICh0eXBlID09IFwidmFyaWFibGVcIikge1xuICAgICAgaWYgKGlzVFMgJiYgdmFsdWUgPT0gXCJkZWNsYXJlXCIpIHtcbiAgICAgICAgY3gubWFya2VkID0gXCJrZXl3b3JkXCJcbiAgICAgICAgcmV0dXJuIGNvbnQoc3RhdGVtZW50KVxuICAgICAgfSBlbHNlIGlmIChpc1RTICYmICh2YWx1ZSA9PSBcIm1vZHVsZVwiIHx8IHZhbHVlID09IFwiZW51bVwiIHx8IHZhbHVlID09IFwidHlwZVwiKSAmJiBjeC5zdHJlYW0ubWF0Y2goL15cXHMqXFx3LywgZmFsc2UpKSB7XG4gICAgICAgIGN4Lm1hcmtlZCA9IFwia2V5d29yZFwiXG4gICAgICAgIGlmICh2YWx1ZSA9PSBcImVudW1cIikgcmV0dXJuIGNvbnQoZW51bWRlZik7XG4gICAgICAgIGVsc2UgaWYgKHZhbHVlID09IFwidHlwZVwiKSByZXR1cm4gY29udCh0eXBlbmFtZSwgZXhwZWN0KFwib3BlcmF0b3JcIiksIHR5cGVleHByLCBleHBlY3QoXCI7XCIpKTtcbiAgICAgICAgZWxzZSByZXR1cm4gY29udChwdXNobGV4KFwiZm9ybVwiKSwgcGF0dGVybiwgZXhwZWN0KFwie1wiKSwgcHVzaGxleChcIn1cIiksIGJsb2NrLCBwb3BsZXgsIHBvcGxleClcbiAgICAgIH0gZWxzZSBpZiAoaXNUUyAmJiB2YWx1ZSA9PSBcIm5hbWVzcGFjZVwiKSB7XG4gICAgICAgIGN4Lm1hcmtlZCA9IFwia2V5d29yZFwiXG4gICAgICAgIHJldHVybiBjb250KHB1c2hsZXgoXCJmb3JtXCIpLCBleHByZXNzaW9uLCBzdGF0ZW1lbnQsIHBvcGxleClcbiAgICAgIH0gZWxzZSBpZiAoaXNUUyAmJiB2YWx1ZSA9PSBcImFic3RyYWN0XCIpIHtcbiAgICAgICAgY3gubWFya2VkID0gXCJrZXl3b3JkXCJcbiAgICAgICAgcmV0dXJuIGNvbnQoc3RhdGVtZW50KVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGNvbnQocHVzaGxleChcInN0YXRcIiksIG1heWJlbGFiZWwpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAodHlwZSA9PSBcInN3aXRjaFwiKSByZXR1cm4gY29udChwdXNobGV4KFwiZm9ybVwiKSwgcGFyZW5FeHByLCBleHBlY3QoXCJ7XCIpLCBwdXNobGV4KFwifVwiLCBcInN3aXRjaFwiKSwgcHVzaGJsb2NrY29udGV4dCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYmxvY2ssIHBvcGxleCwgcG9wbGV4LCBwb3Bjb250ZXh0KTtcbiAgICBpZiAodHlwZSA9PSBcImNhc2VcIikgcmV0dXJuIGNvbnQoZXhwcmVzc2lvbiwgZXhwZWN0KFwiOlwiKSk7XG4gICAgaWYgKHR5cGUgPT0gXCJkZWZhdWx0XCIpIHJldHVybiBjb250KGV4cGVjdChcIjpcIikpO1xuICAgIGlmICh0eXBlID09IFwiY2F0Y2hcIikgcmV0dXJuIGNvbnQocHVzaGxleChcImZvcm1cIiksIHB1c2hjb250ZXh0LCBtYXliZUNhdGNoQmluZGluZywgc3RhdGVtZW50LCBwb3BsZXgsIHBvcGNvbnRleHQpO1xuICAgIGlmICh0eXBlID09IFwiZXhwb3J0XCIpIHJldHVybiBjb250KHB1c2hsZXgoXCJzdGF0XCIpLCBhZnRlckV4cG9ydCwgcG9wbGV4KTtcbiAgICBpZiAodHlwZSA9PSBcImltcG9ydFwiKSByZXR1cm4gY29udChwdXNobGV4KFwic3RhdFwiKSwgYWZ0ZXJJbXBvcnQsIHBvcGxleCk7XG4gICAgaWYgKHR5cGUgPT0gXCJhc3luY1wiKSByZXR1cm4gY29udChzdGF0ZW1lbnQpXG4gICAgaWYgKHZhbHVlID09IFwiQFwiKSByZXR1cm4gY29udChleHByZXNzaW9uLCBzdGF0ZW1lbnQpXG4gICAgcmV0dXJuIHBhc3MocHVzaGxleChcInN0YXRcIiksIGV4cHJlc3Npb24sIGV4cGVjdChcIjtcIiksIHBvcGxleCk7XG4gIH1cbiAgZnVuY3Rpb24gbWF5YmVDYXRjaEJpbmRpbmcodHlwZSkge1xuICAgIGlmICh0eXBlID09IFwiKFwiKSByZXR1cm4gY29udChmdW5hcmcsIGV4cGVjdChcIilcIikpXG4gIH1cbiAgZnVuY3Rpb24gZXhwcmVzc2lvbih0eXBlLCB2YWx1ZSkge1xuICAgIHJldHVybiBleHByZXNzaW9uSW5uZXIodHlwZSwgdmFsdWUsIGZhbHNlKTtcbiAgfVxuICBmdW5jdGlvbiBleHByZXNzaW9uTm9Db21tYSh0eXBlLCB2YWx1ZSkge1xuICAgIHJldHVybiBleHByZXNzaW9uSW5uZXIodHlwZSwgdmFsdWUsIHRydWUpO1xuICB9XG4gIGZ1bmN0aW9uIHBhcmVuRXhwcih0eXBlKSB7XG4gICAgaWYgKHR5cGUgIT0gXCIoXCIpIHJldHVybiBwYXNzKClcbiAgICByZXR1cm4gY29udChwdXNobGV4KFwiKVwiKSwgbWF5YmVleHByZXNzaW9uLCBleHBlY3QoXCIpXCIpLCBwb3BsZXgpXG4gIH1cbiAgZnVuY3Rpb24gZXhwcmVzc2lvbklubmVyKHR5cGUsIHZhbHVlLCBub0NvbW1hKSB7XG4gICAgaWYgKGN4LnN0YXRlLmZhdEFycm93QXQgPT0gY3guc3RyZWFtLnN0YXJ0KSB7XG4gICAgICB2YXIgYm9keSA9IG5vQ29tbWEgPyBhcnJvd0JvZHlOb0NvbW1hIDogYXJyb3dCb2R5O1xuICAgICAgaWYgKHR5cGUgPT0gXCIoXCIpIHJldHVybiBjb250KHB1c2hjb250ZXh0LCBwdXNobGV4KFwiKVwiKSwgY29tbWFzZXAoZnVuYXJnLCBcIilcIiksIHBvcGxleCwgZXhwZWN0KFwiPT5cIiksIGJvZHksIHBvcGNvbnRleHQpO1xuICAgICAgZWxzZSBpZiAodHlwZSA9PSBcInZhcmlhYmxlXCIpIHJldHVybiBwYXNzKHB1c2hjb250ZXh0LCBwYXR0ZXJuLCBleHBlY3QoXCI9PlwiKSwgYm9keSwgcG9wY29udGV4dCk7XG4gICAgfVxuXG4gICAgdmFyIG1heWJlb3AgPSBub0NvbW1hID8gbWF5YmVvcGVyYXRvck5vQ29tbWEgOiBtYXliZW9wZXJhdG9yQ29tbWE7XG4gICAgaWYgKGF0b21pY1R5cGVzLmhhc093blByb3BlcnR5KHR5cGUpKSByZXR1cm4gY29udChtYXliZW9wKTtcbiAgICBpZiAodHlwZSA9PSBcImZ1bmN0aW9uXCIpIHJldHVybiBjb250KGZ1bmN0aW9uZGVmLCBtYXliZW9wKTtcbiAgICBpZiAodHlwZSA9PSBcImNsYXNzXCIgfHwgKGlzVFMgJiYgdmFsdWUgPT0gXCJpbnRlcmZhY2VcIikpIHsgY3gubWFya2VkID0gXCJrZXl3b3JkXCI7IHJldHVybiBjb250KHB1c2hsZXgoXCJmb3JtXCIpLCBjbGFzc0V4cHJlc3Npb24sIHBvcGxleCk7IH1cbiAgICBpZiAodHlwZSA9PSBcImtleXdvcmQgY1wiIHx8IHR5cGUgPT0gXCJhc3luY1wiKSByZXR1cm4gY29udChub0NvbW1hID8gZXhwcmVzc2lvbk5vQ29tbWEgOiBleHByZXNzaW9uKTtcbiAgICBpZiAodHlwZSA9PSBcIihcIikgcmV0dXJuIGNvbnQocHVzaGxleChcIilcIiksIG1heWJlZXhwcmVzc2lvbiwgZXhwZWN0KFwiKVwiKSwgcG9wbGV4LCBtYXliZW9wKTtcbiAgICBpZiAodHlwZSA9PSBcIm9wZXJhdG9yXCIgfHwgdHlwZSA9PSBcInNwcmVhZFwiKSByZXR1cm4gY29udChub0NvbW1hID8gZXhwcmVzc2lvbk5vQ29tbWEgOiBleHByZXNzaW9uKTtcbiAgICBpZiAodHlwZSA9PSBcIltcIikgcmV0dXJuIGNvbnQocHVzaGxleChcIl1cIiksIGFycmF5TGl0ZXJhbCwgcG9wbGV4LCBtYXliZW9wKTtcbiAgICBpZiAodHlwZSA9PSBcIntcIikgcmV0dXJuIGNvbnRDb21tYXNlcChvYmpwcm9wLCBcIn1cIiwgbnVsbCwgbWF5YmVvcCk7XG4gICAgaWYgKHR5cGUgPT0gXCJxdWFzaVwiKSByZXR1cm4gcGFzcyhxdWFzaSwgbWF5YmVvcCk7XG4gICAgaWYgKHR5cGUgPT0gXCJuZXdcIikgcmV0dXJuIGNvbnQobWF5YmVUYXJnZXQobm9Db21tYSkpO1xuICAgIHJldHVybiBjb250KCk7XG4gIH1cbiAgZnVuY3Rpb24gbWF5YmVleHByZXNzaW9uKHR5cGUpIHtcbiAgICBpZiAodHlwZS5tYXRjaCgvWztcXH1cXClcXF0sXS8pKSByZXR1cm4gcGFzcygpO1xuICAgIHJldHVybiBwYXNzKGV4cHJlc3Npb24pO1xuICB9XG5cbiAgZnVuY3Rpb24gbWF5YmVvcGVyYXRvckNvbW1hKHR5cGUsIHZhbHVlKSB7XG4gICAgaWYgKHR5cGUgPT0gXCIsXCIpIHJldHVybiBjb250KG1heWJlZXhwcmVzc2lvbik7XG4gICAgcmV0dXJuIG1heWJlb3BlcmF0b3JOb0NvbW1hKHR5cGUsIHZhbHVlLCBmYWxzZSk7XG4gIH1cbiAgZnVuY3Rpb24gbWF5YmVvcGVyYXRvck5vQ29tbWEodHlwZSwgdmFsdWUsIG5vQ29tbWEpIHtcbiAgICB2YXIgbWUgPSBub0NvbW1hID09IGZhbHNlID8gbWF5YmVvcGVyYXRvckNvbW1hIDogbWF5YmVvcGVyYXRvck5vQ29tbWE7XG4gICAgdmFyIGV4cHIgPSBub0NvbW1hID09IGZhbHNlID8gZXhwcmVzc2lvbiA6IGV4cHJlc3Npb25Ob0NvbW1hO1xuICAgIGlmICh0eXBlID09IFwiPT5cIikgcmV0dXJuIGNvbnQocHVzaGNvbnRleHQsIG5vQ29tbWEgPyBhcnJvd0JvZHlOb0NvbW1hIDogYXJyb3dCb2R5LCBwb3Bjb250ZXh0KTtcbiAgICBpZiAodHlwZSA9PSBcIm9wZXJhdG9yXCIpIHtcbiAgICAgIGlmICgvXFwrXFwrfC0tLy50ZXN0KHZhbHVlKSB8fCBpc1RTICYmIHZhbHVlID09IFwiIVwiKSByZXR1cm4gY29udChtZSk7XG4gICAgICBpZiAoaXNUUyAmJiB2YWx1ZSA9PSBcIjxcIiAmJiBjeC5zdHJlYW0ubWF0Y2goL14oW148Pl18PFtePD5dKj4pKj5cXHMqXFwoLywgZmFsc2UpKVxuICAgICAgICByZXR1cm4gY29udChwdXNobGV4KFwiPlwiKSwgY29tbWFzZXAodHlwZWV4cHIsIFwiPlwiKSwgcG9wbGV4LCBtZSk7XG4gICAgICBpZiAodmFsdWUgPT0gXCI/XCIpIHJldHVybiBjb250KGV4cHJlc3Npb24sIGV4cGVjdChcIjpcIiksIGV4cHIpO1xuICAgICAgcmV0dXJuIGNvbnQoZXhwcik7XG4gICAgfVxuICAgIGlmICh0eXBlID09IFwicXVhc2lcIikgeyByZXR1cm4gcGFzcyhxdWFzaSwgbWUpOyB9XG4gICAgaWYgKHR5cGUgPT0gXCI7XCIpIHJldHVybjtcbiAgICBpZiAodHlwZSA9PSBcIihcIikgcmV0dXJuIGNvbnRDb21tYXNlcChleHByZXNzaW9uTm9Db21tYSwgXCIpXCIsIFwiY2FsbFwiLCBtZSk7XG4gICAgaWYgKHR5cGUgPT0gXCIuXCIpIHJldHVybiBjb250KHByb3BlcnR5LCBtZSk7XG4gICAgaWYgKHR5cGUgPT0gXCJbXCIpIHJldHVybiBjb250KHB1c2hsZXgoXCJdXCIpLCBtYXliZWV4cHJlc3Npb24sIGV4cGVjdChcIl1cIiksIHBvcGxleCwgbWUpO1xuICAgIGlmIChpc1RTICYmIHZhbHVlID09IFwiYXNcIikgeyBjeC5tYXJrZWQgPSBcImtleXdvcmRcIjsgcmV0dXJuIGNvbnQodHlwZWV4cHIsIG1lKSB9XG4gICAgaWYgKHR5cGUgPT0gXCJyZWdleHBcIikge1xuICAgICAgY3guc3RhdGUubGFzdFR5cGUgPSBjeC5tYXJrZWQgPSBcIm9wZXJhdG9yXCJcbiAgICAgIGN4LnN0cmVhbS5iYWNrVXAoY3guc3RyZWFtLnBvcyAtIGN4LnN0cmVhbS5zdGFydCAtIDEpXG4gICAgICByZXR1cm4gY29udChleHByKVxuICAgIH1cbiAgfVxuICBmdW5jdGlvbiBxdWFzaSh0eXBlLCB2YWx1ZSkge1xuICAgIGlmICh0eXBlICE9IFwicXVhc2lcIikgcmV0dXJuIHBhc3MoKTtcbiAgICBpZiAodmFsdWUuc2xpY2UodmFsdWUubGVuZ3RoIC0gMikgIT0gXCIke1wiKSByZXR1cm4gY29udChxdWFzaSk7XG4gICAgcmV0dXJuIGNvbnQobWF5YmVleHByZXNzaW9uLCBjb250aW51ZVF1YXNpKTtcbiAgfVxuICBmdW5jdGlvbiBjb250aW51ZVF1YXNpKHR5cGUpIHtcbiAgICBpZiAodHlwZSA9PSBcIn1cIikge1xuICAgICAgY3gubWFya2VkID0gXCJzdHJpbmctMlwiO1xuICAgICAgY3guc3RhdGUudG9rZW5pemUgPSB0b2tlblF1YXNpO1xuICAgICAgcmV0dXJuIGNvbnQocXVhc2kpO1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiBhcnJvd0JvZHkodHlwZSkge1xuICAgIGZpbmRGYXRBcnJvdyhjeC5zdHJlYW0sIGN4LnN0YXRlKTtcbiAgICByZXR1cm4gcGFzcyh0eXBlID09IFwie1wiID8gc3RhdGVtZW50IDogZXhwcmVzc2lvbik7XG4gIH1cbiAgZnVuY3Rpb24gYXJyb3dCb2R5Tm9Db21tYSh0eXBlKSB7XG4gICAgZmluZEZhdEFycm93KGN4LnN0cmVhbSwgY3guc3RhdGUpO1xuICAgIHJldHVybiBwYXNzKHR5cGUgPT0gXCJ7XCIgPyBzdGF0ZW1lbnQgOiBleHByZXNzaW9uTm9Db21tYSk7XG4gIH1cbiAgZnVuY3Rpb24gbWF5YmVUYXJnZXQobm9Db21tYSkge1xuICAgIHJldHVybiBmdW5jdGlvbih0eXBlKSB7XG4gICAgICBpZiAodHlwZSA9PSBcIi5cIikgcmV0dXJuIGNvbnQobm9Db21tYSA/IHRhcmdldE5vQ29tbWEgOiB0YXJnZXQpO1xuICAgICAgZWxzZSBpZiAodHlwZSA9PSBcInZhcmlhYmxlXCIgJiYgaXNUUykgcmV0dXJuIGNvbnQobWF5YmVUeXBlQXJncywgbm9Db21tYSA/IG1heWJlb3BlcmF0b3JOb0NvbW1hIDogbWF5YmVvcGVyYXRvckNvbW1hKVxuICAgICAgZWxzZSByZXR1cm4gcGFzcyhub0NvbW1hID8gZXhwcmVzc2lvbk5vQ29tbWEgOiBleHByZXNzaW9uKTtcbiAgICB9O1xuICB9XG4gIGZ1bmN0aW9uIHRhcmdldChfLCB2YWx1ZSkge1xuICAgIGlmICh2YWx1ZSA9PSBcInRhcmdldFwiKSB7IGN4Lm1hcmtlZCA9IFwia2V5d29yZFwiOyByZXR1cm4gY29udChtYXliZW9wZXJhdG9yQ29tbWEpOyB9XG4gIH1cbiAgZnVuY3Rpb24gdGFyZ2V0Tm9Db21tYShfLCB2YWx1ZSkge1xuICAgIGlmICh2YWx1ZSA9PSBcInRhcmdldFwiKSB7IGN4Lm1hcmtlZCA9IFwia2V5d29yZFwiOyByZXR1cm4gY29udChtYXliZW9wZXJhdG9yTm9Db21tYSk7IH1cbiAgfVxuICBmdW5jdGlvbiBtYXliZWxhYmVsKHR5cGUpIHtcbiAgICBpZiAodHlwZSA9PSBcIjpcIikgcmV0dXJuIGNvbnQocG9wbGV4LCBzdGF0ZW1lbnQpO1xuICAgIHJldHVybiBwYXNzKG1heWJlb3BlcmF0b3JDb21tYSwgZXhwZWN0KFwiO1wiKSwgcG9wbGV4KTtcbiAgfVxuICBmdW5jdGlvbiBwcm9wZXJ0eSh0eXBlKSB7XG4gICAgaWYgKHR5cGUgPT0gXCJ2YXJpYWJsZVwiKSB7Y3gubWFya2VkID0gXCJwcm9wZXJ0eVwiOyByZXR1cm4gY29udCgpO31cbiAgfVxuICBmdW5jdGlvbiBvYmpwcm9wKHR5cGUsIHZhbHVlKSB7XG4gICAgaWYgKHR5cGUgPT0gXCJhc3luY1wiKSB7XG4gICAgICBjeC5tYXJrZWQgPSBcInByb3BlcnR5XCI7XG4gICAgICByZXR1cm4gY29udChvYmpwcm9wKTtcbiAgICB9IGVsc2UgaWYgKHR5cGUgPT0gXCJ2YXJpYWJsZVwiIHx8IGN4LnN0eWxlID09IFwia2V5d29yZFwiKSB7XG4gICAgICBjeC5tYXJrZWQgPSBcInByb3BlcnR5XCI7XG4gICAgICBpZiAodmFsdWUgPT0gXCJnZXRcIiB8fCB2YWx1ZSA9PSBcInNldFwiKSByZXR1cm4gY29udChnZXR0ZXJTZXR0ZXIpO1xuICAgICAgdmFyIG0gLy8gV29yayBhcm91bmQgZmF0LWFycm93LWRldGVjdGlvbiBjb21wbGljYXRpb24gZm9yIGRldGVjdGluZyB0eXBlc2NyaXB0IHR5cGVkIGFycm93IHBhcmFtc1xuICAgICAgaWYgKGlzVFMgJiYgY3guc3RhdGUuZmF0QXJyb3dBdCA9PSBjeC5zdHJlYW0uc3RhcnQgJiYgKG0gPSBjeC5zdHJlYW0ubWF0Y2goL15cXHMqOlxccyovLCBmYWxzZSkpKVxuICAgICAgICBjeC5zdGF0ZS5mYXRBcnJvd0F0ID0gY3guc3RyZWFtLnBvcyArIG1bMF0ubGVuZ3RoXG4gICAgICByZXR1cm4gY29udChhZnRlcnByb3ApO1xuICAgIH0gZWxzZSBpZiAodHlwZSA9PSBcIm51bWJlclwiIHx8IHR5cGUgPT0gXCJzdHJpbmdcIikge1xuICAgICAgY3gubWFya2VkID0ganNvbmxkTW9kZSA/IFwicHJvcGVydHlcIiA6IChjeC5zdHlsZSArIFwiIHByb3BlcnR5XCIpO1xuICAgICAgcmV0dXJuIGNvbnQoYWZ0ZXJwcm9wKTtcbiAgICB9IGVsc2UgaWYgKHR5cGUgPT0gXCJqc29ubGQta2V5d29yZFwiKSB7XG4gICAgICByZXR1cm4gY29udChhZnRlcnByb3ApO1xuICAgIH0gZWxzZSBpZiAoaXNUUyAmJiBpc01vZGlmaWVyKHZhbHVlKSkge1xuICAgICAgY3gubWFya2VkID0gXCJrZXl3b3JkXCJcbiAgICAgIHJldHVybiBjb250KG9ianByb3ApXG4gICAgfSBlbHNlIGlmICh0eXBlID09IFwiW1wiKSB7XG4gICAgICByZXR1cm4gY29udChleHByZXNzaW9uLCBtYXliZXR5cGUsIGV4cGVjdChcIl1cIiksIGFmdGVycHJvcCk7XG4gICAgfSBlbHNlIGlmICh0eXBlID09IFwic3ByZWFkXCIpIHtcbiAgICAgIHJldHVybiBjb250KGV4cHJlc3Npb25Ob0NvbW1hLCBhZnRlcnByb3ApO1xuICAgIH0gZWxzZSBpZiAodmFsdWUgPT0gXCIqXCIpIHtcbiAgICAgIGN4Lm1hcmtlZCA9IFwia2V5d29yZFwiO1xuICAgICAgcmV0dXJuIGNvbnQob2JqcHJvcCk7XG4gICAgfSBlbHNlIGlmICh0eXBlID09IFwiOlwiKSB7XG4gICAgICByZXR1cm4gcGFzcyhhZnRlcnByb3ApXG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIGdldHRlclNldHRlcih0eXBlKSB7XG4gICAgaWYgKHR5cGUgIT0gXCJ2YXJpYWJsZVwiKSByZXR1cm4gcGFzcyhhZnRlcnByb3ApO1xuICAgIGN4Lm1hcmtlZCA9IFwicHJvcGVydHlcIjtcbiAgICByZXR1cm4gY29udChmdW5jdGlvbmRlZik7XG4gIH1cbiAgZnVuY3Rpb24gYWZ0ZXJwcm9wKHR5cGUpIHtcbiAgICBpZiAodHlwZSA9PSBcIjpcIikgcmV0dXJuIGNvbnQoZXhwcmVzc2lvbk5vQ29tbWEpO1xuICAgIGlmICh0eXBlID09IFwiKFwiKSByZXR1cm4gcGFzcyhmdW5jdGlvbmRlZik7XG4gIH1cbiAgZnVuY3Rpb24gY29tbWFzZXAod2hhdCwgZW5kLCBzZXApIHtcbiAgICBmdW5jdGlvbiBwcm9jZWVkKHR5cGUsIHZhbHVlKSB7XG4gICAgICBpZiAoc2VwID8gc2VwLmluZGV4T2YodHlwZSkgPiAtMSA6IHR5cGUgPT0gXCIsXCIpIHtcbiAgICAgICAgdmFyIGxleCA9IGN4LnN0YXRlLmxleGljYWw7XG4gICAgICAgIGlmIChsZXguaW5mbyA9PSBcImNhbGxcIikgbGV4LnBvcyA9IChsZXgucG9zIHx8IDApICsgMTtcbiAgICAgICAgcmV0dXJuIGNvbnQoZnVuY3Rpb24odHlwZSwgdmFsdWUpIHtcbiAgICAgICAgICBpZiAodHlwZSA9PSBlbmQgfHwgdmFsdWUgPT0gZW5kKSByZXR1cm4gcGFzcygpXG4gICAgICAgICAgcmV0dXJuIHBhc3Mod2hhdClcbiAgICAgICAgfSwgcHJvY2VlZCk7XG4gICAgICB9XG4gICAgICBpZiAodHlwZSA9PSBlbmQgfHwgdmFsdWUgPT0gZW5kKSByZXR1cm4gY29udCgpO1xuICAgICAgaWYgKHNlcCAmJiBzZXAuaW5kZXhPZihcIjtcIikgPiAtMSkgcmV0dXJuIHBhc3Mod2hhdClcbiAgICAgIHJldHVybiBjb250KGV4cGVjdChlbmQpKTtcbiAgICB9XG4gICAgcmV0dXJuIGZ1bmN0aW9uKHR5cGUsIHZhbHVlKSB7XG4gICAgICBpZiAodHlwZSA9PSBlbmQgfHwgdmFsdWUgPT0gZW5kKSByZXR1cm4gY29udCgpO1xuICAgICAgcmV0dXJuIHBhc3Mod2hhdCwgcHJvY2VlZCk7XG4gICAgfTtcbiAgfVxuICBmdW5jdGlvbiBjb250Q29tbWFzZXAod2hhdCwgZW5kLCBpbmZvKSB7XG4gICAgZm9yICh2YXIgaSA9IDM7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspXG4gICAgICBjeC5jYy5wdXNoKGFyZ3VtZW50c1tpXSk7XG4gICAgcmV0dXJuIGNvbnQocHVzaGxleChlbmQsIGluZm8pLCBjb21tYXNlcCh3aGF0LCBlbmQpLCBwb3BsZXgpO1xuICB9XG4gIGZ1bmN0aW9uIGJsb2NrKHR5cGUpIHtcbiAgICBpZiAodHlwZSA9PSBcIn1cIikgcmV0dXJuIGNvbnQoKTtcbiAgICByZXR1cm4gcGFzcyhzdGF0ZW1lbnQsIGJsb2NrKTtcbiAgfVxuICBmdW5jdGlvbiBtYXliZXR5cGUodHlwZSwgdmFsdWUpIHtcbiAgICBpZiAoaXNUUykge1xuICAgICAgaWYgKHR5cGUgPT0gXCI6XCIpIHJldHVybiBjb250KHR5cGVleHByKTtcbiAgICAgIGlmICh2YWx1ZSA9PSBcIj9cIikgcmV0dXJuIGNvbnQobWF5YmV0eXBlKTtcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gbWF5YmV0eXBlT3JJbih0eXBlLCB2YWx1ZSkge1xuICAgIGlmIChpc1RTICYmICh0eXBlID09IFwiOlwiIHx8IHZhbHVlID09IFwiaW5cIikpIHJldHVybiBjb250KHR5cGVleHByKVxuICB9XG4gIGZ1bmN0aW9uIG1heWJlcmV0dHlwZSh0eXBlKSB7XG4gICAgaWYgKGlzVFMgJiYgdHlwZSA9PSBcIjpcIikge1xuICAgICAgaWYgKGN4LnN0cmVhbS5tYXRjaCgvXlxccypcXHcrXFxzK2lzXFxiLywgZmFsc2UpKSByZXR1cm4gY29udChleHByZXNzaW9uLCBpc0tXLCB0eXBlZXhwcilcbiAgICAgIGVsc2UgcmV0dXJuIGNvbnQodHlwZWV4cHIpXG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIGlzS1coXywgdmFsdWUpIHtcbiAgICBpZiAodmFsdWUgPT0gXCJpc1wiKSB7XG4gICAgICBjeC5tYXJrZWQgPSBcImtleXdvcmRcIlxuICAgICAgcmV0dXJuIGNvbnQoKVxuICAgIH1cbiAgfVxuICBmdW5jdGlvbiB0eXBlZXhwcih0eXBlLCB2YWx1ZSkge1xuICAgIGlmICh2YWx1ZSA9PSBcImtleW9mXCIgfHwgdmFsdWUgPT0gXCJ0eXBlb2ZcIiB8fCB2YWx1ZSA9PSBcImluZmVyXCIgfHwgdmFsdWUgPT0gXCJyZWFkb25seVwiKSB7XG4gICAgICBjeC5tYXJrZWQgPSBcImtleXdvcmRcIlxuICAgICAgcmV0dXJuIGNvbnQodmFsdWUgPT0gXCJ0eXBlb2ZcIiA/IGV4cHJlc3Npb25Ob0NvbW1hIDogdHlwZWV4cHIpXG4gICAgfVxuICAgIGlmICh0eXBlID09IFwidmFyaWFibGVcIiB8fCB2YWx1ZSA9PSBcInZvaWRcIikge1xuICAgICAgY3gubWFya2VkID0gXCJ0eXBlXCJcbiAgICAgIHJldHVybiBjb250KGFmdGVyVHlwZSlcbiAgICB9XG4gICAgaWYgKHZhbHVlID09IFwifFwiIHx8IHZhbHVlID09IFwiJlwiKSByZXR1cm4gY29udCh0eXBlZXhwcilcbiAgICBpZiAodHlwZSA9PSBcInN0cmluZ1wiIHx8IHR5cGUgPT0gXCJudW1iZXJcIiB8fCB0eXBlID09IFwiYXRvbVwiKSByZXR1cm4gY29udChhZnRlclR5cGUpO1xuICAgIGlmICh0eXBlID09IFwiW1wiKSByZXR1cm4gY29udChwdXNobGV4KFwiXVwiKSwgY29tbWFzZXAodHlwZWV4cHIsIFwiXVwiLCBcIixcIiksIHBvcGxleCwgYWZ0ZXJUeXBlKVxuICAgIGlmICh0eXBlID09IFwie1wiKSByZXR1cm4gY29udChwdXNobGV4KFwifVwiKSwgdHlwZXByb3BzLCBwb3BsZXgsIGFmdGVyVHlwZSlcbiAgICBpZiAodHlwZSA9PSBcIihcIikgcmV0dXJuIGNvbnQoY29tbWFzZXAodHlwZWFyZywgXCIpXCIpLCBtYXliZVJldHVyblR5cGUsIGFmdGVyVHlwZSlcbiAgICBpZiAodHlwZSA9PSBcIjxcIikgcmV0dXJuIGNvbnQoY29tbWFzZXAodHlwZWV4cHIsIFwiPlwiKSwgdHlwZWV4cHIpXG4gICAgaWYgKHR5cGUgPT0gXCJxdWFzaVwiKSB7IHJldHVybiBwYXNzKHF1YXNpVHlwZSwgYWZ0ZXJUeXBlKTsgfVxuICB9XG4gIGZ1bmN0aW9uIG1heWJlUmV0dXJuVHlwZSh0eXBlKSB7XG4gICAgaWYgKHR5cGUgPT0gXCI9PlwiKSByZXR1cm4gY29udCh0eXBlZXhwcilcbiAgfVxuICBmdW5jdGlvbiB0eXBlcHJvcHModHlwZSkge1xuICAgIGlmICh0eXBlLm1hdGNoKC9bXFx9XFwpXFxdXS8pKSByZXR1cm4gY29udCgpXG4gICAgaWYgKHR5cGUgPT0gXCIsXCIgfHwgdHlwZSA9PSBcIjtcIikgcmV0dXJuIGNvbnQodHlwZXByb3BzKVxuICAgIHJldHVybiBwYXNzKHR5cGVwcm9wLCB0eXBlcHJvcHMpXG4gIH1cbiAgZnVuY3Rpb24gdHlwZXByb3AodHlwZSwgdmFsdWUpIHtcbiAgICBpZiAodHlwZSA9PSBcInZhcmlhYmxlXCIgfHwgY3guc3R5bGUgPT0gXCJrZXl3b3JkXCIpIHtcbiAgICAgIGN4Lm1hcmtlZCA9IFwicHJvcGVydHlcIlxuICAgICAgcmV0dXJuIGNvbnQodHlwZXByb3ApXG4gICAgfSBlbHNlIGlmICh2YWx1ZSA9PSBcIj9cIiB8fCB0eXBlID09IFwibnVtYmVyXCIgfHwgdHlwZSA9PSBcInN0cmluZ1wiKSB7XG4gICAgICByZXR1cm4gY29udCh0eXBlcHJvcClcbiAgICB9IGVsc2UgaWYgKHR5cGUgPT0gXCI6XCIpIHtcbiAgICAgIHJldHVybiBjb250KHR5cGVleHByKVxuICAgIH0gZWxzZSBpZiAodHlwZSA9PSBcIltcIikge1xuICAgICAgcmV0dXJuIGNvbnQoZXhwZWN0KFwidmFyaWFibGVcIiksIG1heWJldHlwZU9ySW4sIGV4cGVjdChcIl1cIiksIHR5cGVwcm9wKVxuICAgIH0gZWxzZSBpZiAodHlwZSA9PSBcIihcIikge1xuICAgICAgcmV0dXJuIHBhc3MoZnVuY3Rpb25kZWNsLCB0eXBlcHJvcClcbiAgICB9IGVsc2UgaWYgKCF0eXBlLm1hdGNoKC9bO1xcfVxcKVxcXSxdLykpIHtcbiAgICAgIHJldHVybiBjb250KClcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gcXVhc2lUeXBlKHR5cGUsIHZhbHVlKSB7XG4gICAgaWYgKHR5cGUgIT0gXCJxdWFzaVwiKSByZXR1cm4gcGFzcygpO1xuICAgIGlmICh2YWx1ZS5zbGljZSh2YWx1ZS5sZW5ndGggLSAyKSAhPSBcIiR7XCIpIHJldHVybiBjb250KHF1YXNpVHlwZSk7XG4gICAgcmV0dXJuIGNvbnQodHlwZWV4cHIsIGNvbnRpbnVlUXVhc2lUeXBlKTtcbiAgfVxuICBmdW5jdGlvbiBjb250aW51ZVF1YXNpVHlwZSh0eXBlKSB7XG4gICAgaWYgKHR5cGUgPT0gXCJ9XCIpIHtcbiAgICAgIGN4Lm1hcmtlZCA9IFwic3RyaW5nLTJcIjtcbiAgICAgIGN4LnN0YXRlLnRva2VuaXplID0gdG9rZW5RdWFzaTtcbiAgICAgIHJldHVybiBjb250KHF1YXNpVHlwZSk7XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIHR5cGVhcmcodHlwZSwgdmFsdWUpIHtcbiAgICBpZiAodHlwZSA9PSBcInZhcmlhYmxlXCIgJiYgY3guc3RyZWFtLm1hdGNoKC9eXFxzKls/Ol0vLCBmYWxzZSkgfHwgdmFsdWUgPT0gXCI/XCIpIHJldHVybiBjb250KHR5cGVhcmcpXG4gICAgaWYgKHR5cGUgPT0gXCI6XCIpIHJldHVybiBjb250KHR5cGVleHByKVxuICAgIGlmICh0eXBlID09IFwic3ByZWFkXCIpIHJldHVybiBjb250KHR5cGVhcmcpXG4gICAgcmV0dXJuIHBhc3ModHlwZWV4cHIpXG4gIH1cbiAgZnVuY3Rpb24gYWZ0ZXJUeXBlKHR5cGUsIHZhbHVlKSB7XG4gICAgaWYgKHZhbHVlID09IFwiPFwiKSByZXR1cm4gY29udChwdXNobGV4KFwiPlwiKSwgY29tbWFzZXAodHlwZWV4cHIsIFwiPlwiKSwgcG9wbGV4LCBhZnRlclR5cGUpXG4gICAgaWYgKHZhbHVlID09IFwifFwiIHx8IHR5cGUgPT0gXCIuXCIgfHwgdmFsdWUgPT0gXCImXCIpIHJldHVybiBjb250KHR5cGVleHByKVxuICAgIGlmICh0eXBlID09IFwiW1wiKSByZXR1cm4gY29udCh0eXBlZXhwciwgZXhwZWN0KFwiXVwiKSwgYWZ0ZXJUeXBlKVxuICAgIGlmICh2YWx1ZSA9PSBcImV4dGVuZHNcIiB8fCB2YWx1ZSA9PSBcImltcGxlbWVudHNcIikgeyBjeC5tYXJrZWQgPSBcImtleXdvcmRcIjsgcmV0dXJuIGNvbnQodHlwZWV4cHIpIH1cbiAgICBpZiAodmFsdWUgPT0gXCI/XCIpIHJldHVybiBjb250KHR5cGVleHByLCBleHBlY3QoXCI6XCIpLCB0eXBlZXhwcilcbiAgfVxuICBmdW5jdGlvbiBtYXliZVR5cGVBcmdzKF8sIHZhbHVlKSB7XG4gICAgaWYgKHZhbHVlID09IFwiPFwiKSByZXR1cm4gY29udChwdXNobGV4KFwiPlwiKSwgY29tbWFzZXAodHlwZWV4cHIsIFwiPlwiKSwgcG9wbGV4LCBhZnRlclR5cGUpXG4gIH1cbiAgZnVuY3Rpb24gdHlwZXBhcmFtKCkge1xuICAgIHJldHVybiBwYXNzKHR5cGVleHByLCBtYXliZVR5cGVEZWZhdWx0KVxuICB9XG4gIGZ1bmN0aW9uIG1heWJlVHlwZURlZmF1bHQoXywgdmFsdWUpIHtcbiAgICBpZiAodmFsdWUgPT0gXCI9XCIpIHJldHVybiBjb250KHR5cGVleHByKVxuICB9XG4gIGZ1bmN0aW9uIHZhcmRlZihfLCB2YWx1ZSkge1xuICAgIGlmICh2YWx1ZSA9PSBcImVudW1cIikge2N4Lm1hcmtlZCA9IFwia2V5d29yZFwiOyByZXR1cm4gY29udChlbnVtZGVmKX1cbiAgICByZXR1cm4gcGFzcyhwYXR0ZXJuLCBtYXliZXR5cGUsIG1heWJlQXNzaWduLCB2YXJkZWZDb250KTtcbiAgfVxuICBmdW5jdGlvbiBwYXR0ZXJuKHR5cGUsIHZhbHVlKSB7XG4gICAgaWYgKGlzVFMgJiYgaXNNb2RpZmllcih2YWx1ZSkpIHsgY3gubWFya2VkID0gXCJrZXl3b3JkXCI7IHJldHVybiBjb250KHBhdHRlcm4pIH1cbiAgICBpZiAodHlwZSA9PSBcInZhcmlhYmxlXCIpIHsgcmVnaXN0ZXIodmFsdWUpOyByZXR1cm4gY29udCgpOyB9XG4gICAgaWYgKHR5cGUgPT0gXCJzcHJlYWRcIikgcmV0dXJuIGNvbnQocGF0dGVybik7XG4gICAgaWYgKHR5cGUgPT0gXCJbXCIpIHJldHVybiBjb250Q29tbWFzZXAoZWx0cGF0dGVybiwgXCJdXCIpO1xuICAgIGlmICh0eXBlID09IFwie1wiKSByZXR1cm4gY29udENvbW1hc2VwKHByb3BwYXR0ZXJuLCBcIn1cIik7XG4gIH1cbiAgZnVuY3Rpb24gcHJvcHBhdHRlcm4odHlwZSwgdmFsdWUpIHtcbiAgICBpZiAodHlwZSA9PSBcInZhcmlhYmxlXCIgJiYgIWN4LnN0cmVhbS5tYXRjaCgvXlxccyo6LywgZmFsc2UpKSB7XG4gICAgICByZWdpc3Rlcih2YWx1ZSk7XG4gICAgICByZXR1cm4gY29udChtYXliZUFzc2lnbik7XG4gICAgfVxuICAgIGlmICh0eXBlID09IFwidmFyaWFibGVcIikgY3gubWFya2VkID0gXCJwcm9wZXJ0eVwiO1xuICAgIGlmICh0eXBlID09IFwic3ByZWFkXCIpIHJldHVybiBjb250KHBhdHRlcm4pO1xuICAgIGlmICh0eXBlID09IFwifVwiKSByZXR1cm4gcGFzcygpO1xuICAgIGlmICh0eXBlID09IFwiW1wiKSByZXR1cm4gY29udChleHByZXNzaW9uLCBleHBlY3QoJ10nKSwgZXhwZWN0KCc6JyksIHByb3BwYXR0ZXJuKTtcbiAgICByZXR1cm4gY29udChleHBlY3QoXCI6XCIpLCBwYXR0ZXJuLCBtYXliZUFzc2lnbik7XG4gIH1cbiAgZnVuY3Rpb24gZWx0cGF0dGVybigpIHtcbiAgICByZXR1cm4gcGFzcyhwYXR0ZXJuLCBtYXliZUFzc2lnbilcbiAgfVxuICBmdW5jdGlvbiBtYXliZUFzc2lnbihfdHlwZSwgdmFsdWUpIHtcbiAgICBpZiAodmFsdWUgPT0gXCI9XCIpIHJldHVybiBjb250KGV4cHJlc3Npb25Ob0NvbW1hKTtcbiAgfVxuICBmdW5jdGlvbiB2YXJkZWZDb250KHR5cGUpIHtcbiAgICBpZiAodHlwZSA9PSBcIixcIikgcmV0dXJuIGNvbnQodmFyZGVmKTtcbiAgfVxuICBmdW5jdGlvbiBtYXliZWVsc2UodHlwZSwgdmFsdWUpIHtcbiAgICBpZiAodHlwZSA9PSBcImtleXdvcmQgYlwiICYmIHZhbHVlID09IFwiZWxzZVwiKSByZXR1cm4gY29udChwdXNobGV4KFwiZm9ybVwiLCBcImVsc2VcIiksIHN0YXRlbWVudCwgcG9wbGV4KTtcbiAgfVxuICBmdW5jdGlvbiBmb3JzcGVjKHR5cGUsIHZhbHVlKSB7XG4gICAgaWYgKHZhbHVlID09IFwiYXdhaXRcIikgcmV0dXJuIGNvbnQoZm9yc3BlYyk7XG4gICAgaWYgKHR5cGUgPT0gXCIoXCIpIHJldHVybiBjb250KHB1c2hsZXgoXCIpXCIpLCBmb3JzcGVjMSwgcG9wbGV4KTtcbiAgfVxuICBmdW5jdGlvbiBmb3JzcGVjMSh0eXBlKSB7XG4gICAgaWYgKHR5cGUgPT0gXCJ2YXJcIikgcmV0dXJuIGNvbnQodmFyZGVmLCBmb3JzcGVjMik7XG4gICAgaWYgKHR5cGUgPT0gXCJ2YXJpYWJsZVwiKSByZXR1cm4gY29udChmb3JzcGVjMik7XG4gICAgcmV0dXJuIHBhc3MoZm9yc3BlYzIpXG4gIH1cbiAgZnVuY3Rpb24gZm9yc3BlYzIodHlwZSwgdmFsdWUpIHtcbiAgICBpZiAodHlwZSA9PSBcIilcIikgcmV0dXJuIGNvbnQoKVxuICAgIGlmICh0eXBlID09IFwiO1wiKSByZXR1cm4gY29udChmb3JzcGVjMilcbiAgICBpZiAodmFsdWUgPT0gXCJpblwiIHx8IHZhbHVlID09IFwib2ZcIikgeyBjeC5tYXJrZWQgPSBcImtleXdvcmRcIjsgcmV0dXJuIGNvbnQoZXhwcmVzc2lvbiwgZm9yc3BlYzIpIH1cbiAgICByZXR1cm4gcGFzcyhleHByZXNzaW9uLCBmb3JzcGVjMilcbiAgfVxuICBmdW5jdGlvbiBmdW5jdGlvbmRlZih0eXBlLCB2YWx1ZSkge1xuICAgIGlmICh2YWx1ZSA9PSBcIipcIikge2N4Lm1hcmtlZCA9IFwia2V5d29yZFwiOyByZXR1cm4gY29udChmdW5jdGlvbmRlZik7fVxuICAgIGlmICh0eXBlID09IFwidmFyaWFibGVcIikge3JlZ2lzdGVyKHZhbHVlKTsgcmV0dXJuIGNvbnQoZnVuY3Rpb25kZWYpO31cbiAgICBpZiAodHlwZSA9PSBcIihcIikgcmV0dXJuIGNvbnQocHVzaGNvbnRleHQsIHB1c2hsZXgoXCIpXCIpLCBjb21tYXNlcChmdW5hcmcsIFwiKVwiKSwgcG9wbGV4LCBtYXliZXJldHR5cGUsIHN0YXRlbWVudCwgcG9wY29udGV4dCk7XG4gICAgaWYgKGlzVFMgJiYgdmFsdWUgPT0gXCI8XCIpIHJldHVybiBjb250KHB1c2hsZXgoXCI+XCIpLCBjb21tYXNlcCh0eXBlcGFyYW0sIFwiPlwiKSwgcG9wbGV4LCBmdW5jdGlvbmRlZilcbiAgfVxuICBmdW5jdGlvbiBmdW5jdGlvbmRlY2wodHlwZSwgdmFsdWUpIHtcbiAgICBpZiAodmFsdWUgPT0gXCIqXCIpIHtjeC5tYXJrZWQgPSBcImtleXdvcmRcIjsgcmV0dXJuIGNvbnQoZnVuY3Rpb25kZWNsKTt9XG4gICAgaWYgKHR5cGUgPT0gXCJ2YXJpYWJsZVwiKSB7cmVnaXN0ZXIodmFsdWUpOyByZXR1cm4gY29udChmdW5jdGlvbmRlY2wpO31cbiAgICBpZiAodHlwZSA9PSBcIihcIikgcmV0dXJuIGNvbnQocHVzaGNvbnRleHQsIHB1c2hsZXgoXCIpXCIpLCBjb21tYXNlcChmdW5hcmcsIFwiKVwiKSwgcG9wbGV4LCBtYXliZXJldHR5cGUsIHBvcGNvbnRleHQpO1xuICAgIGlmIChpc1RTICYmIHZhbHVlID09IFwiPFwiKSByZXR1cm4gY29udChwdXNobGV4KFwiPlwiKSwgY29tbWFzZXAodHlwZXBhcmFtLCBcIj5cIiksIHBvcGxleCwgZnVuY3Rpb25kZWNsKVxuICB9XG4gIGZ1bmN0aW9uIHR5cGVuYW1lKHR5cGUsIHZhbHVlKSB7XG4gICAgaWYgKHR5cGUgPT0gXCJrZXl3b3JkXCIgfHwgdHlwZSA9PSBcInZhcmlhYmxlXCIpIHtcbiAgICAgIGN4Lm1hcmtlZCA9IFwidHlwZVwiXG4gICAgICByZXR1cm4gY29udCh0eXBlbmFtZSlcbiAgICB9IGVsc2UgaWYgKHZhbHVlID09IFwiPFwiKSB7XG4gICAgICByZXR1cm4gY29udChwdXNobGV4KFwiPlwiKSwgY29tbWFzZXAodHlwZXBhcmFtLCBcIj5cIiksIHBvcGxleClcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gZnVuYXJnKHR5cGUsIHZhbHVlKSB7XG4gICAgaWYgKHZhbHVlID09IFwiQFwiKSBjb250KGV4cHJlc3Npb24sIGZ1bmFyZylcbiAgICBpZiAodHlwZSA9PSBcInNwcmVhZFwiKSByZXR1cm4gY29udChmdW5hcmcpO1xuICAgIGlmIChpc1RTICYmIGlzTW9kaWZpZXIodmFsdWUpKSB7IGN4Lm1hcmtlZCA9IFwia2V5d29yZFwiOyByZXR1cm4gY29udChmdW5hcmcpOyB9XG4gICAgaWYgKGlzVFMgJiYgdHlwZSA9PSBcInRoaXNcIikgcmV0dXJuIGNvbnQobWF5YmV0eXBlLCBtYXliZUFzc2lnbilcbiAgICByZXR1cm4gcGFzcyhwYXR0ZXJuLCBtYXliZXR5cGUsIG1heWJlQXNzaWduKTtcbiAgfVxuICBmdW5jdGlvbiBjbGFzc0V4cHJlc3Npb24odHlwZSwgdmFsdWUpIHtcbiAgICAvLyBDbGFzcyBleHByZXNzaW9ucyBtYXkgaGF2ZSBhbiBvcHRpb25hbCBuYW1lLlxuICAgIGlmICh0eXBlID09IFwidmFyaWFibGVcIikgcmV0dXJuIGNsYXNzTmFtZSh0eXBlLCB2YWx1ZSk7XG4gICAgcmV0dXJuIGNsYXNzTmFtZUFmdGVyKHR5cGUsIHZhbHVlKTtcbiAgfVxuICBmdW5jdGlvbiBjbGFzc05hbWUodHlwZSwgdmFsdWUpIHtcbiAgICBpZiAodHlwZSA9PSBcInZhcmlhYmxlXCIpIHtyZWdpc3Rlcih2YWx1ZSk7IHJldHVybiBjb250KGNsYXNzTmFtZUFmdGVyKTt9XG4gIH1cbiAgZnVuY3Rpb24gY2xhc3NOYW1lQWZ0ZXIodHlwZSwgdmFsdWUpIHtcbiAgICBpZiAodmFsdWUgPT0gXCI8XCIpIHJldHVybiBjb250KHB1c2hsZXgoXCI+XCIpLCBjb21tYXNlcCh0eXBlcGFyYW0sIFwiPlwiKSwgcG9wbGV4LCBjbGFzc05hbWVBZnRlcilcbiAgICBpZiAodmFsdWUgPT0gXCJleHRlbmRzXCIgfHwgdmFsdWUgPT0gXCJpbXBsZW1lbnRzXCIgfHwgKGlzVFMgJiYgdHlwZSA9PSBcIixcIikpIHtcbiAgICAgIGlmICh2YWx1ZSA9PSBcImltcGxlbWVudHNcIikgY3gubWFya2VkID0gXCJrZXl3b3JkXCI7XG4gICAgICByZXR1cm4gY29udChpc1RTID8gdHlwZWV4cHIgOiBleHByZXNzaW9uLCBjbGFzc05hbWVBZnRlcik7XG4gICAgfVxuICAgIGlmICh0eXBlID09IFwie1wiKSByZXR1cm4gY29udChwdXNobGV4KFwifVwiKSwgY2xhc3NCb2R5LCBwb3BsZXgpO1xuICB9XG4gIGZ1bmN0aW9uIGNsYXNzQm9keSh0eXBlLCB2YWx1ZSkge1xuICAgIGlmICh0eXBlID09IFwiYXN5bmNcIiB8fFxuICAgICAgICAodHlwZSA9PSBcInZhcmlhYmxlXCIgJiZcbiAgICAgICAgICh2YWx1ZSA9PSBcInN0YXRpY1wiIHx8IHZhbHVlID09IFwiZ2V0XCIgfHwgdmFsdWUgPT0gXCJzZXRcIiB8fCAoaXNUUyAmJiBpc01vZGlmaWVyKHZhbHVlKSkpICYmXG4gICAgICAgICBjeC5zdHJlYW0ubWF0Y2goL15cXHMrW1xcdyRcXHhhMS1cXHVmZmZmXS8sIGZhbHNlKSkpIHtcbiAgICAgIGN4Lm1hcmtlZCA9IFwia2V5d29yZFwiO1xuICAgICAgcmV0dXJuIGNvbnQoY2xhc3NCb2R5KTtcbiAgICB9XG4gICAgaWYgKHR5cGUgPT0gXCJ2YXJpYWJsZVwiIHx8IGN4LnN0eWxlID09IFwia2V5d29yZFwiKSB7XG4gICAgICBjeC5tYXJrZWQgPSBcInByb3BlcnR5XCI7XG4gICAgICByZXR1cm4gY29udChjbGFzc2ZpZWxkLCBjbGFzc0JvZHkpO1xuICAgIH1cbiAgICBpZiAodHlwZSA9PSBcIm51bWJlclwiIHx8IHR5cGUgPT0gXCJzdHJpbmdcIikgcmV0dXJuIGNvbnQoY2xhc3NmaWVsZCwgY2xhc3NCb2R5KTtcbiAgICBpZiAodHlwZSA9PSBcIltcIilcbiAgICAgIHJldHVybiBjb250KGV4cHJlc3Npb24sIG1heWJldHlwZSwgZXhwZWN0KFwiXVwiKSwgY2xhc3NmaWVsZCwgY2xhc3NCb2R5KVxuICAgIGlmICh2YWx1ZSA9PSBcIipcIikge1xuICAgICAgY3gubWFya2VkID0gXCJrZXl3b3JkXCI7XG4gICAgICByZXR1cm4gY29udChjbGFzc0JvZHkpO1xuICAgIH1cbiAgICBpZiAoaXNUUyAmJiB0eXBlID09IFwiKFwiKSByZXR1cm4gcGFzcyhmdW5jdGlvbmRlY2wsIGNsYXNzQm9keSlcbiAgICBpZiAodHlwZSA9PSBcIjtcIiB8fCB0eXBlID09IFwiLFwiKSByZXR1cm4gY29udChjbGFzc0JvZHkpO1xuICAgIGlmICh0eXBlID09IFwifVwiKSByZXR1cm4gY29udCgpO1xuICAgIGlmICh2YWx1ZSA9PSBcIkBcIikgcmV0dXJuIGNvbnQoZXhwcmVzc2lvbiwgY2xhc3NCb2R5KVxuICB9XG4gIGZ1bmN0aW9uIGNsYXNzZmllbGQodHlwZSwgdmFsdWUpIHtcbiAgICBpZiAodmFsdWUgPT0gXCIhXCIpIHJldHVybiBjb250KGNsYXNzZmllbGQpXG4gICAgaWYgKHZhbHVlID09IFwiP1wiKSByZXR1cm4gY29udChjbGFzc2ZpZWxkKVxuICAgIGlmICh0eXBlID09IFwiOlwiKSByZXR1cm4gY29udCh0eXBlZXhwciwgbWF5YmVBc3NpZ24pXG4gICAgaWYgKHZhbHVlID09IFwiPVwiKSByZXR1cm4gY29udChleHByZXNzaW9uTm9Db21tYSlcbiAgICB2YXIgY29udGV4dCA9IGN4LnN0YXRlLmxleGljYWwucHJldiwgaXNJbnRlcmZhY2UgPSBjb250ZXh0ICYmIGNvbnRleHQuaW5mbyA9PSBcImludGVyZmFjZVwiXG4gICAgcmV0dXJuIHBhc3MoaXNJbnRlcmZhY2UgPyBmdW5jdGlvbmRlY2wgOiBmdW5jdGlvbmRlZilcbiAgfVxuICBmdW5jdGlvbiBhZnRlckV4cG9ydCh0eXBlLCB2YWx1ZSkge1xuICAgIGlmICh2YWx1ZSA9PSBcIipcIikgeyBjeC5tYXJrZWQgPSBcImtleXdvcmRcIjsgcmV0dXJuIGNvbnQobWF5YmVGcm9tLCBleHBlY3QoXCI7XCIpKTsgfVxuICAgIGlmICh2YWx1ZSA9PSBcImRlZmF1bHRcIikgeyBjeC5tYXJrZWQgPSBcImtleXdvcmRcIjsgcmV0dXJuIGNvbnQoZXhwcmVzc2lvbiwgZXhwZWN0KFwiO1wiKSk7IH1cbiAgICBpZiAodHlwZSA9PSBcIntcIikgcmV0dXJuIGNvbnQoY29tbWFzZXAoZXhwb3J0RmllbGQsIFwifVwiKSwgbWF5YmVGcm9tLCBleHBlY3QoXCI7XCIpKTtcbiAgICByZXR1cm4gcGFzcyhzdGF0ZW1lbnQpO1xuICB9XG4gIGZ1bmN0aW9uIGV4cG9ydEZpZWxkKHR5cGUsIHZhbHVlKSB7XG4gICAgaWYgKHZhbHVlID09IFwiYXNcIikgeyBjeC5tYXJrZWQgPSBcImtleXdvcmRcIjsgcmV0dXJuIGNvbnQoZXhwZWN0KFwidmFyaWFibGVcIikpOyB9XG4gICAgaWYgKHR5cGUgPT0gXCJ2YXJpYWJsZVwiKSByZXR1cm4gcGFzcyhleHByZXNzaW9uTm9Db21tYSwgZXhwb3J0RmllbGQpO1xuICB9XG4gIGZ1bmN0aW9uIGFmdGVySW1wb3J0KHR5cGUpIHtcbiAgICBpZiAodHlwZSA9PSBcInN0cmluZ1wiKSByZXR1cm4gY29udCgpO1xuICAgIGlmICh0eXBlID09IFwiKFwiKSByZXR1cm4gcGFzcyhleHByZXNzaW9uKTtcbiAgICBpZiAodHlwZSA9PSBcIi5cIikgcmV0dXJuIHBhc3MobWF5YmVvcGVyYXRvckNvbW1hKTtcbiAgICByZXR1cm4gcGFzcyhpbXBvcnRTcGVjLCBtYXliZU1vcmVJbXBvcnRzLCBtYXliZUZyb20pO1xuICB9XG4gIGZ1bmN0aW9uIGltcG9ydFNwZWModHlwZSwgdmFsdWUpIHtcbiAgICBpZiAodHlwZSA9PSBcIntcIikgcmV0dXJuIGNvbnRDb21tYXNlcChpbXBvcnRTcGVjLCBcIn1cIik7XG4gICAgaWYgKHR5cGUgPT0gXCJ2YXJpYWJsZVwiKSByZWdpc3Rlcih2YWx1ZSk7XG4gICAgaWYgKHZhbHVlID09IFwiKlwiKSBjeC5tYXJrZWQgPSBcImtleXdvcmRcIjtcbiAgICByZXR1cm4gY29udChtYXliZUFzKTtcbiAgfVxuICBmdW5jdGlvbiBtYXliZU1vcmVJbXBvcnRzKHR5cGUpIHtcbiAgICBpZiAodHlwZSA9PSBcIixcIikgcmV0dXJuIGNvbnQoaW1wb3J0U3BlYywgbWF5YmVNb3JlSW1wb3J0cylcbiAgfVxuICBmdW5jdGlvbiBtYXliZUFzKF90eXBlLCB2YWx1ZSkge1xuICAgIGlmICh2YWx1ZSA9PSBcImFzXCIpIHsgY3gubWFya2VkID0gXCJrZXl3b3JkXCI7IHJldHVybiBjb250KGltcG9ydFNwZWMpOyB9XG4gIH1cbiAgZnVuY3Rpb24gbWF5YmVGcm9tKF90eXBlLCB2YWx1ZSkge1xuICAgIGlmICh2YWx1ZSA9PSBcImZyb21cIikgeyBjeC5tYXJrZWQgPSBcImtleXdvcmRcIjsgcmV0dXJuIGNvbnQoZXhwcmVzc2lvbik7IH1cbiAgfVxuICBmdW5jdGlvbiBhcnJheUxpdGVyYWwodHlwZSkge1xuICAgIGlmICh0eXBlID09IFwiXVwiKSByZXR1cm4gY29udCgpO1xuICAgIHJldHVybiBwYXNzKGNvbW1hc2VwKGV4cHJlc3Npb25Ob0NvbW1hLCBcIl1cIikpO1xuICB9XG4gIGZ1bmN0aW9uIGVudW1kZWYoKSB7XG4gICAgcmV0dXJuIHBhc3MocHVzaGxleChcImZvcm1cIiksIHBhdHRlcm4sIGV4cGVjdChcIntcIiksIHB1c2hsZXgoXCJ9XCIpLCBjb21tYXNlcChlbnVtbWVtYmVyLCBcIn1cIiksIHBvcGxleCwgcG9wbGV4KVxuICB9XG4gIGZ1bmN0aW9uIGVudW1tZW1iZXIoKSB7XG4gICAgcmV0dXJuIHBhc3MocGF0dGVybiwgbWF5YmVBc3NpZ24pO1xuICB9XG5cbiAgZnVuY3Rpb24gaXNDb250aW51ZWRTdGF0ZW1lbnQoc3RhdGUsIHRleHRBZnRlcikge1xuICAgIHJldHVybiBzdGF0ZS5sYXN0VHlwZSA9PSBcIm9wZXJhdG9yXCIgfHwgc3RhdGUubGFzdFR5cGUgPT0gXCIsXCIgfHxcbiAgICAgIGlzT3BlcmF0b3JDaGFyLnRlc3QodGV4dEFmdGVyLmNoYXJBdCgwKSkgfHxcbiAgICAgIC9bLC5dLy50ZXN0KHRleHRBZnRlci5jaGFyQXQoMCkpO1xuICB9XG5cbiAgZnVuY3Rpb24gZXhwcmVzc2lvbkFsbG93ZWQoc3RyZWFtLCBzdGF0ZSwgYmFja1VwKSB7XG4gICAgcmV0dXJuIHN0YXRlLnRva2VuaXplID09IHRva2VuQmFzZSAmJlxuICAgICAgL14oPzpvcGVyYXRvcnxzb2Z8a2V5d29yZCBbYmNkXXxjYXNlfG5ld3xleHBvcnR8ZGVmYXVsdHxzcHJlYWR8W1xcW3t9XFwoLDs6XXw9PikkLy50ZXN0KHN0YXRlLmxhc3RUeXBlKSB8fFxuICAgICAgKHN0YXRlLmxhc3RUeXBlID09IFwicXVhc2lcIiAmJiAvXFx7XFxzKiQvLnRlc3Qoc3RyZWFtLnN0cmluZy5zbGljZSgwLCBzdHJlYW0ucG9zIC0gKGJhY2tVcCB8fCAwKSkpKVxuICB9XG5cbiAgLy8gSW50ZXJmYWNlXG5cbiAgcmV0dXJuIHtcbiAgICBzdGFydFN0YXRlOiBmdW5jdGlvbihiYXNlY29sdW1uKSB7XG4gICAgICB2YXIgc3RhdGUgPSB7XG4gICAgICAgIHRva2VuaXplOiB0b2tlbkJhc2UsXG4gICAgICAgIGxhc3RUeXBlOiBcInNvZlwiLFxuICAgICAgICBjYzogW10sXG4gICAgICAgIGxleGljYWw6IG5ldyBKU0xleGljYWwoKGJhc2Vjb2x1bW4gfHwgMCkgLSBpbmRlbnRVbml0LCAwLCBcImJsb2NrXCIsIGZhbHNlKSxcbiAgICAgICAgbG9jYWxWYXJzOiBwYXJzZXJDb25maWcubG9jYWxWYXJzLFxuICAgICAgICBjb250ZXh0OiBwYXJzZXJDb25maWcubG9jYWxWYXJzICYmIG5ldyBDb250ZXh0KG51bGwsIG51bGwsIGZhbHNlKSxcbiAgICAgICAgaW5kZW50ZWQ6IGJhc2Vjb2x1bW4gfHwgMFxuICAgICAgfTtcbiAgICAgIGlmIChwYXJzZXJDb25maWcuZ2xvYmFsVmFycyAmJiB0eXBlb2YgcGFyc2VyQ29uZmlnLmdsb2JhbFZhcnMgPT0gXCJvYmplY3RcIilcbiAgICAgICAgc3RhdGUuZ2xvYmFsVmFycyA9IHBhcnNlckNvbmZpZy5nbG9iYWxWYXJzO1xuICAgICAgcmV0dXJuIHN0YXRlO1xuICAgIH0sXG5cbiAgICB0b2tlbjogZnVuY3Rpb24oc3RyZWFtLCBzdGF0ZSkge1xuICAgICAgaWYgKHN0cmVhbS5zb2woKSkge1xuICAgICAgICBpZiAoIXN0YXRlLmxleGljYWwuaGFzT3duUHJvcGVydHkoXCJhbGlnblwiKSlcbiAgICAgICAgICBzdGF0ZS5sZXhpY2FsLmFsaWduID0gZmFsc2U7XG4gICAgICAgIHN0YXRlLmluZGVudGVkID0gc3RyZWFtLmluZGVudGF0aW9uKCk7XG4gICAgICAgIGZpbmRGYXRBcnJvdyhzdHJlYW0sIHN0YXRlKTtcbiAgICAgIH1cbiAgICAgIGlmIChzdGF0ZS50b2tlbml6ZSAhPSB0b2tlbkNvbW1lbnQgJiYgc3RyZWFtLmVhdFNwYWNlKCkpIHJldHVybiBudWxsO1xuICAgICAgdmFyIHN0eWxlID0gc3RhdGUudG9rZW5pemUoc3RyZWFtLCBzdGF0ZSk7XG4gICAgICBpZiAodHlwZSA9PSBcImNvbW1lbnRcIikgcmV0dXJuIHN0eWxlO1xuICAgICAgc3RhdGUubGFzdFR5cGUgPSB0eXBlID09IFwib3BlcmF0b3JcIiAmJiAoY29udGVudCA9PSBcIisrXCIgfHwgY29udGVudCA9PSBcIi0tXCIpID8gXCJpbmNkZWNcIiA6IHR5cGU7XG4gICAgICByZXR1cm4gcGFyc2VKUyhzdGF0ZSwgc3R5bGUsIHR5cGUsIGNvbnRlbnQsIHN0cmVhbSk7XG4gICAgfSxcblxuICAgIGluZGVudDogZnVuY3Rpb24oc3RhdGUsIHRleHRBZnRlcikge1xuICAgICAgaWYgKHN0YXRlLnRva2VuaXplID09IHRva2VuQ29tbWVudCB8fCBzdGF0ZS50b2tlbml6ZSA9PSB0b2tlblF1YXNpKSByZXR1cm4gQ29kZU1pcnJvci5QYXNzO1xuICAgICAgaWYgKHN0YXRlLnRva2VuaXplICE9IHRva2VuQmFzZSkgcmV0dXJuIDA7XG4gICAgICB2YXIgZmlyc3RDaGFyID0gdGV4dEFmdGVyICYmIHRleHRBZnRlci5jaGFyQXQoMCksIGxleGljYWwgPSBzdGF0ZS5sZXhpY2FsLCB0b3BcbiAgICAgIC8vIEtsdWRnZSB0byBwcmV2ZW50ICdtYXliZWxzZScgZnJvbSBibG9ja2luZyBsZXhpY2FsIHNjb3BlIHBvcHNcbiAgICAgIGlmICghL15cXHMqZWxzZVxcYi8udGVzdCh0ZXh0QWZ0ZXIpKSBmb3IgKHZhciBpID0gc3RhdGUuY2MubGVuZ3RoIC0gMTsgaSA+PSAwOyAtLWkpIHtcbiAgICAgICAgdmFyIGMgPSBzdGF0ZS5jY1tpXTtcbiAgICAgICAgaWYgKGMgPT0gcG9wbGV4KSBsZXhpY2FsID0gbGV4aWNhbC5wcmV2O1xuICAgICAgICBlbHNlIGlmIChjICE9IG1heWJlZWxzZSAmJiBjICE9IHBvcGNvbnRleHQpIGJyZWFrO1xuICAgICAgfVxuICAgICAgd2hpbGUgKChsZXhpY2FsLnR5cGUgPT0gXCJzdGF0XCIgfHwgbGV4aWNhbC50eXBlID09IFwiZm9ybVwiKSAmJlxuICAgICAgICAgICAgIChmaXJzdENoYXIgPT0gXCJ9XCIgfHwgKCh0b3AgPSBzdGF0ZS5jY1tzdGF0ZS5jYy5sZW5ndGggLSAxXSkgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKHRvcCA9PSBtYXliZW9wZXJhdG9yQ29tbWEgfHwgdG9wID09IG1heWJlb3BlcmF0b3JOb0NvbW1hKSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAhL15bLFxcLj0rXFwtKjo/W1xcKF0vLnRlc3QodGV4dEFmdGVyKSkpKVxuICAgICAgICBsZXhpY2FsID0gbGV4aWNhbC5wcmV2O1xuICAgICAgaWYgKHN0YXRlbWVudEluZGVudCAmJiBsZXhpY2FsLnR5cGUgPT0gXCIpXCIgJiYgbGV4aWNhbC5wcmV2LnR5cGUgPT0gXCJzdGF0XCIpXG4gICAgICAgIGxleGljYWwgPSBsZXhpY2FsLnByZXY7XG4gICAgICB2YXIgdHlwZSA9IGxleGljYWwudHlwZSwgY2xvc2luZyA9IGZpcnN0Q2hhciA9PSB0eXBlO1xuXG4gICAgICBpZiAodHlwZSA9PSBcInZhcmRlZlwiKSByZXR1cm4gbGV4aWNhbC5pbmRlbnRlZCArIChzdGF0ZS5sYXN0VHlwZSA9PSBcIm9wZXJhdG9yXCIgfHwgc3RhdGUubGFzdFR5cGUgPT0gXCIsXCIgPyBsZXhpY2FsLmluZm8ubGVuZ3RoICsgMSA6IDApO1xuICAgICAgZWxzZSBpZiAodHlwZSA9PSBcImZvcm1cIiAmJiBmaXJzdENoYXIgPT0gXCJ7XCIpIHJldHVybiBsZXhpY2FsLmluZGVudGVkO1xuICAgICAgZWxzZSBpZiAodHlwZSA9PSBcImZvcm1cIikgcmV0dXJuIGxleGljYWwuaW5kZW50ZWQgKyBpbmRlbnRVbml0O1xuICAgICAgZWxzZSBpZiAodHlwZSA9PSBcInN0YXRcIilcbiAgICAgICAgcmV0dXJuIGxleGljYWwuaW5kZW50ZWQgKyAoaXNDb250aW51ZWRTdGF0ZW1lbnQoc3RhdGUsIHRleHRBZnRlcikgPyBzdGF0ZW1lbnRJbmRlbnQgfHwgaW5kZW50VW5pdCA6IDApO1xuICAgICAgZWxzZSBpZiAobGV4aWNhbC5pbmZvID09IFwic3dpdGNoXCIgJiYgIWNsb3NpbmcgJiYgcGFyc2VyQ29uZmlnLmRvdWJsZUluZGVudFN3aXRjaCAhPSBmYWxzZSlcbiAgICAgICAgcmV0dXJuIGxleGljYWwuaW5kZW50ZWQgKyAoL14oPzpjYXNlfGRlZmF1bHQpXFxiLy50ZXN0KHRleHRBZnRlcikgPyBpbmRlbnRVbml0IDogMiAqIGluZGVudFVuaXQpO1xuICAgICAgZWxzZSBpZiAobGV4aWNhbC5hbGlnbikgcmV0dXJuIGxleGljYWwuY29sdW1uICsgKGNsb3NpbmcgPyAwIDogMSk7XG4gICAgICBlbHNlIHJldHVybiBsZXhpY2FsLmluZGVudGVkICsgKGNsb3NpbmcgPyAwIDogaW5kZW50VW5pdCk7XG4gICAgfSxcblxuICAgIGVsZWN0cmljSW5wdXQ6IC9eXFxzKig/OmNhc2UgLio/OnxkZWZhdWx0OnxcXHt8XFx9KSQvLFxuICAgIGJsb2NrQ29tbWVudFN0YXJ0OiBqc29uTW9kZSA/IG51bGwgOiBcIi8qXCIsXG4gICAgYmxvY2tDb21tZW50RW5kOiBqc29uTW9kZSA/IG51bGwgOiBcIiovXCIsXG4gICAgYmxvY2tDb21tZW50Q29udGludWU6IGpzb25Nb2RlID8gbnVsbCA6IFwiICogXCIsXG4gICAgbGluZUNvbW1lbnQ6IGpzb25Nb2RlID8gbnVsbCA6IFwiLy9cIixcbiAgICBmb2xkOiBcImJyYWNlXCIsXG4gICAgY2xvc2VCcmFja2V0czogXCIoKVtde30nJ1xcXCJcXFwiYGBcIixcblxuICAgIGhlbHBlclR5cGU6IGpzb25Nb2RlID8gXCJqc29uXCIgOiBcImphdmFzY3JpcHRcIixcbiAgICBqc29ubGRNb2RlOiBqc29ubGRNb2RlLFxuICAgIGpzb25Nb2RlOiBqc29uTW9kZSxcblxuICAgIGV4cHJlc3Npb25BbGxvd2VkOiBleHByZXNzaW9uQWxsb3dlZCxcblxuICAgIHNraXBFeHByZXNzaW9uOiBmdW5jdGlvbihzdGF0ZSkge1xuICAgICAgcGFyc2VKUyhzdGF0ZSwgXCJhdG9tXCIsIFwiYXRvbVwiLCBcInRydWVcIiwgbmV3IENvZGVNaXJyb3IuU3RyaW5nU3RyZWFtKFwiXCIsIDIsIG51bGwpKVxuICAgIH1cbiAgfTtcbn0pO1xuXG5Db2RlTWlycm9yLnJlZ2lzdGVySGVscGVyKFwid29yZENoYXJzXCIsIFwiamF2YXNjcmlwdFwiLCAvW1xcdyRdLyk7XG5cbkNvZGVNaXJyb3IuZGVmaW5lTUlNRShcInRleHQvamF2YXNjcmlwdFwiLCBcImphdmFzY3JpcHRcIik7XG5Db2RlTWlycm9yLmRlZmluZU1JTUUoXCJ0ZXh0L2VjbWFzY3JpcHRcIiwgXCJqYXZhc2NyaXB0XCIpO1xuQ29kZU1pcnJvci5kZWZpbmVNSU1FKFwiYXBwbGljYXRpb24vamF2YXNjcmlwdFwiLCBcImphdmFzY3JpcHRcIik7XG5Db2RlTWlycm9yLmRlZmluZU1JTUUoXCJhcHBsaWNhdGlvbi94LWphdmFzY3JpcHRcIiwgXCJqYXZhc2NyaXB0XCIpO1xuQ29kZU1pcnJvci5kZWZpbmVNSU1FKFwiYXBwbGljYXRpb24vZWNtYXNjcmlwdFwiLCBcImphdmFzY3JpcHRcIik7XG5Db2RlTWlycm9yLmRlZmluZU1JTUUoXCJhcHBsaWNhdGlvbi9qc29uXCIsIHsgbmFtZTogXCJqYXZhc2NyaXB0XCIsIGpzb246IHRydWUgfSk7XG5Db2RlTWlycm9yLmRlZmluZU1JTUUoXCJhcHBsaWNhdGlvbi94LWpzb25cIiwgeyBuYW1lOiBcImphdmFzY3JpcHRcIiwganNvbjogdHJ1ZSB9KTtcbkNvZGVNaXJyb3IuZGVmaW5lTUlNRShcImFwcGxpY2F0aW9uL21hbmlmZXN0K2pzb25cIiwgeyBuYW1lOiBcImphdmFzY3JpcHRcIiwganNvbjogdHJ1ZSB9KVxuQ29kZU1pcnJvci5kZWZpbmVNSU1FKFwiYXBwbGljYXRpb24vbGQranNvblwiLCB7IG5hbWU6IFwiamF2YXNjcmlwdFwiLCBqc29ubGQ6IHRydWUgfSk7XG5Db2RlTWlycm9yLmRlZmluZU1JTUUoXCJ0ZXh0L3R5cGVzY3JpcHRcIiwgeyBuYW1lOiBcImphdmFzY3JpcHRcIiwgdHlwZXNjcmlwdDogdHJ1ZSB9KTtcbkNvZGVNaXJyb3IuZGVmaW5lTUlNRShcImFwcGxpY2F0aW9uL3R5cGVzY3JpcHRcIiwgeyBuYW1lOiBcImphdmFzY3JpcHRcIiwgdHlwZXNjcmlwdDogdHJ1ZSB9KTtcblxufSk7XG4iLCJpbXBvcnQgeyBBcHAsIFBsYXRmb3JtIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgXCJtb2RlL2phdmFzY3JpcHRcIjtcbmltcG9ydCBUZW1wbGF0ZXJQbHVnaW4gZnJvbSBcIm1haW5cIjtcbmltcG9ydCB7IFRlbXBsYXRlckVycm9yIH0gZnJvbSBcIkVycm9yXCI7XG5cbmNvbnN0IFRQX0NNRF9UT0tFTl9DTEFTUzogc3RyaW5nID0gXCJ0ZW1wbGF0ZXItY29tbWFuZFwiO1xuY29uc3QgVFBfSU5MSU5FX0NMQVNTOiBzdHJpbmcgPSBcInRlbXBsYXRlci1pbmxpbmVcIjtcblxuY29uc3QgVFBfT1BFTklOR19UQUdfVE9LRU5fQ0xBU1M6IHN0cmluZyA9IFwidGVtcGxhdGVyLW9wZW5pbmctdGFnXCI7XG5jb25zdCBUUF9DTE9TSU5HX1RBR19UT0tFTl9DTEFTUzogc3RyaW5nID0gXCJ0ZW1wbGF0ZXItY2xvc2luZy10YWdcIjtcblxuY29uc3QgVFBfSU5URVJQT0xBVElPTl9UQUdfVE9LRU5fQ0xBU1M6IHN0cmluZyA9IFwidGVtcGxhdGVyLWludGVycG9sYXRpb24tdGFnXCI7XG5jb25zdCBUUF9SQVdfVEFHX1RPS0VOX0NMQVNTOiBzdHJpbmcgPSBcInRlbXBsYXRlci1yYXctdGFnXCI7XG5jb25zdCBUUF9FWEVDX1RBR19UT0tFTl9DTEFTUzogc3RyaW5nID0gXCJ0ZW1wbGF0ZXItZXhlY3V0aW9uLXRhZ1wiO1xuXG5leHBvcnQgY2xhc3MgVGVtcGxhdGVyRWRpdG9yIHtcbiAgICBwdWJsaWMgY29uc3RydWN0b3IocHJpdmF0ZSBhcHA6IEFwcCwgcHJpdmF0ZSBwbHVnaW46IFRlbXBsYXRlclBsdWdpbikge31cblxuICAgIGFzeW5jIHNldHVwKCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBhd2FpdCB0aGlzLnJlZ2lzdGVyQ29kZU1pcnJvck1vZGUoKTtcbiAgICB9XG5cblx0YXN5bmMgcmVnaXN0ZXJDb2RlTWlycm9yTW9kZSgpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHQvLyBjbS1lZGl0b3Itc3ludGF4LWhpZ2hsaWdodC1vYnNpZGlhbiBwbHVnaW5cblx0XHQvLyBodHRwczovL2NvZGVtaXJyb3IubmV0L2RvYy9tYW51YWwuaHRtbCNtb2RlYXBpXG5cdFx0Ly8gaHR0cHM6Ly9jb2RlbWlycm9yLm5ldC9tb2RlL2RpZmYvZGlmZi5qc1xuICAgICAgICAvLyBodHRwczovL2NvZGVtaXJyb3IubmV0L2RlbW8vbXVzdGFjaGUuaHRtbFxuXHRcdC8vIGh0dHBzOi8vbWFyaWpuaGF2ZXJiZWtlLm5sL2Jsb2cvY29kZW1pcnJvci1tb2RlLXN5c3RlbS5odG1sXG5cbiAgICAgICAgaWYgKCF0aGlzLnBsdWdpbi5zZXR0aW5ncy5zeW50YXhfaGlnaGxpZ2h0aW5nKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBUT0RPOiBBZGQgbW9iaWxlIHN1cHBvcnRcblx0XHRpZiAoUGxhdGZvcm0uaXNNb2JpbGVBcHApIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cbiAgICAgICAgbGV0IGpzX21vZGUgPSB3aW5kb3cuQ29kZU1pcnJvci5nZXRNb2RlKHt9LCBcImphdmFzY3JpcHRcIik7XG5cdFx0aWYgKGpzX21vZGUubmFtZSA9PT0gXCJudWxsXCIpIHtcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLmxvZ19lcnJvcihuZXcgVGVtcGxhdGVyRXJyb3IoXCJKYXZhc2NyaXB0IHN5bnRheCBtb2RlIGNvdWxkbid0IGJlIGZvdW5kLCBjYW4ndCBlbmFibGUgc3ludGF4IGhpZ2hsaWdodGluZy5cIikpO1xuICAgICAgICAgICAgcmV0dXJuO1xuXHRcdH1cblxuICAgICAgICB3aW5kb3cuQ29kZU1pcnJvci5kZWZpbmVNb2RlKFwidGVtcGxhdGVyXCIsIGZ1bmN0aW9uKGNvbmZpZywgcGFyc2VyQ29uZmlnKSB7XG5cdFx0XHRjb25zdCB0ZW1wbGF0ZXJPdmVybGF5ID0ge1xuICAgICAgICAgICAgICAgIHN0YXJ0U3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBqc19zdGF0ZSA9IHdpbmRvdy5Db2RlTWlycm9yLnN0YXJ0U3RhdGUoanNfbW9kZSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAuLi5qc19zdGF0ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGluQ29tbWFuZDogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICB0YWdfY2xhc3M6IFwiXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBmcmVlTGluZTogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBjb3B5U3RhdGU6IGZ1bmN0aW9uKHN0YXRlOiBhbnkpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QganNfc3RhdGUgPSB3aW5kb3cuQ29kZU1pcnJvci5zdGFydFN0YXRlKGpzX21vZGUpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBuZXdfc3RhdGUgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAuLi5qc19zdGF0ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGluQ29tbWFuZDogc3RhdGUuaW5Db21tYW5kLFxuICAgICAgICAgICAgICAgICAgICAgICAgdGFnX2NsYXNzOiBzdGF0ZS50YWdfY2xhc3MsXG4gICAgICAgICAgICAgICAgICAgICAgICBmcmVlTGluZTogc3RhdGUuZnJlZUxpbmUsXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXdfc3RhdGU7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBibGFua0xpbmU6IGZ1bmN0aW9uKHN0YXRlOiBhbnkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHN0YXRlLmluQ29tbWFuZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGBsaW5lLWJhY2tncm91bmQtdGVtcGxhdGVyLWNvbW1hbmQtYmdgO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgdG9rZW46IGZ1bmN0aW9uKHN0cmVhbTogYW55LCBzdGF0ZTogYW55KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzdHJlYW0uc29sKCkgJiYgc3RhdGUuaW5Db21tYW5kKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0ZS5mcmVlTGluZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAoc3RhdGUuaW5Db21tYW5kKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQga2V5d29yZHMgPSBcIlwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHN0cmVhbS5tYXRjaCgvW1xcLV9dezAsMX0lPi8sIHRydWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhdGUuaW5Db21tYW5kID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhdGUuZnJlZUxpbmUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB0YWdfY2xhc3MgPSBzdGF0ZS50YWdfY2xhc3M7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhdGUudGFnX2NsYXNzID0gXCJcIjtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBgbGluZS0ke1RQX0lOTElORV9DTEFTU30gJHtUUF9DTURfVE9LRU5fQ0xBU1N9ICR7VFBfQ0xPU0lOR19UQUdfVE9LRU5fQ0xBU1N9ICR7dGFnX2NsYXNzfWA7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IFxuXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBqc19yZXN1bHQgPSBqc19tb2RlLnRva2VuKHN0cmVhbSwgc3RhdGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHN0cmVhbS5wZWVrKCkgPT0gbnVsbCAmJiBzdGF0ZS5mcmVlTGluZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtleXdvcmRzICs9IGAgbGluZS1iYWNrZ3JvdW5kLXRlbXBsYXRlci1jb21tYW5kLWJnYDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghc3RhdGUuZnJlZUxpbmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBrZXl3b3JkcyArPSBgIGxpbmUtJHtUUF9JTkxJTkVfQ0xBU1N9YDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGAke2tleXdvcmRzfSAke1RQX0NNRF9UT0tFTl9DTEFTU30gbGluZS0ke1RQX0NNRF9UT0tFTl9DTEFTU30gJHtqc19yZXN1bHR9YDtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG1hdGNoID0gc3RyZWFtLm1hdGNoKC88JVtcXC1fXXswLDF9XFxzKihbKn4rXXswLDF9KS8sIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICBpZiAobWF0Y2ggIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3dpdGNoIChtYXRjaFsxXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJyonOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGF0ZS50YWdfY2xhc3MgPSBUUF9FWEVDX1RBR19UT0tFTl9DTEFTUztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnfic6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRlLnRhZ19jbGFzcyA9IFRQX1JBV19UQUdfVE9LRU5fQ0xBU1M7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRlLnRhZ19jbGFzcyA9IFRQX0lOVEVSUE9MQVRJT05fVEFHX1RPS0VOX0NMQVNTO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRlLmluQ29tbWFuZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYGxpbmUtJHtUUF9JTkxJTkVfQ0xBU1N9ICR7VFBfQ01EX1RPS0VOX0NMQVNTfSAke1RQX09QRU5JTkdfVEFHX1RPS0VOX0NMQVNTfSAke3N0YXRlLnRhZ19jbGFzc31gO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKHN0cmVhbS5uZXh0KCkgIT0gbnVsbCAmJiAhc3RyZWFtLm1hdGNoKC88JS8sIGZhbHNlKSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgICAgIH1cblx0XHRcdH07XG4gICAgICAgICAgICByZXR1cm4gd2luZG93LkNvZGVNaXJyb3Iub3ZlcmxheU1vZGUod2luZG93LkNvZGVNaXJyb3IuZ2V0TW9kZShjb25maWcsIFwiaHlwZXJtZFwiKSwgdGVtcGxhdGVyT3ZlcmxheSk7XG5cdFx0fSk7IFxuXHR9XG59IiwiaW1wb3J0IHsgYWRkSWNvbiwgRXZlbnRSZWYsIE1lbnUsIE1lbnVJdGVtLCBub3JtYWxpemVQYXRoLCBOb3RpY2UsIFBsYXRmb3JtLCBQbHVnaW4sIFRBYnN0cmFjdEZpbGUsIFRGaWxlLCBURm9sZGVyIH0gZnJvbSAnb2JzaWRpYW4nO1xyXG5cclxuaW1wb3J0IHsgREVGQVVMVF9TRVRUSU5HUywgVGVtcGxhdGVyU2V0dGluZ3MsIFRlbXBsYXRlclNldHRpbmdUYWIgfSBmcm9tICdTZXR0aW5ncyc7XHJcbmltcG9ydCB7IFRlbXBsYXRlckZ1enp5U3VnZ2VzdE1vZGFsIH0gZnJvbSAnVGVtcGxhdGVyRnV6enlTdWdnZXN0JztcclxuaW1wb3J0IHsgSUNPTl9EQVRBIH0gZnJvbSAnQ29uc3RhbnRzJztcclxuaW1wb3J0IHsgZGVsYXksIHJlc29sdmVURmlsZSB9IGZyb20gJ1V0aWxzJztcclxuaW1wb3J0IHsgVGVtcGxhdGVyIH0gZnJvbSAnVGVtcGxhdGVyJztcclxuaW1wb3J0IHsgVGVtcGxhdGVyRXJyb3IgfSBmcm9tICdFcnJvcic7XHJcbmltcG9ydCB7IFRlbXBsYXRlckVkaXRvciB9IGZyb20gJ1RlbXBsYXRlckVkaXRvcic7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBUZW1wbGF0ZXJQbHVnaW4gZXh0ZW5kcyBQbHVnaW4ge1xyXG5cdHB1YmxpYyBzZXR0aW5nczogVGVtcGxhdGVyU2V0dGluZ3M7IFxyXG5cdHB1YmxpYyBlZGl0b3I6IFRlbXBsYXRlckVkaXRvcjtcclxuXHRwdWJsaWMgdGVtcGxhdGVyOiBUZW1wbGF0ZXI7XHJcblx0cHJpdmF0ZSBmdXp6eVN1Z2dlc3Q6IFRlbXBsYXRlckZ1enp5U3VnZ2VzdE1vZGFsO1xyXG5cdHByaXZhdGUgdHJpZ2dlcl9vbl9maWxlX2NyZWF0aW9uX2V2ZW50OiBFdmVudFJlZjtcclxuXHRwcml2YXRlIHN5bnRheF9oaWdobGlnaHRpbmdfZXZlbnQ6IEV2ZW50UmVmO1xyXG5cclxuXHRhc3luYyBvbmxvYWQoKTogUHJvbWlzZTx2b2lkPiB7XHJcblx0XHRhd2FpdCB0aGlzLmxvYWRTZXR0aW5ncygpO1xyXG5cclxuXHRcdHRoaXMudGVtcGxhdGVyID0gbmV3IFRlbXBsYXRlcih0aGlzLmFwcCwgdGhpcyk7XHJcblx0XHRhd2FpdCB0aGlzLnRlbXBsYXRlci5zZXR1cCgpO1xyXG5cclxuXHRcdHRoaXMuZWRpdG9yID0gbmV3IFRlbXBsYXRlckVkaXRvcih0aGlzLmFwcCwgdGhpcyk7XHJcblx0XHRhd2FpdCB0aGlzLmVkaXRvci5zZXR1cCgpO1xyXG5cdFx0dGhpcy51cGRhdGVfc3ludGF4X2hpZ2hsaWdodGluZygpO1xyXG5cclxuXHRcdHRoaXMuZnV6enlTdWdnZXN0ID0gbmV3IFRlbXBsYXRlckZ1enp5U3VnZ2VzdE1vZGFsKHRoaXMuYXBwLCB0aGlzKTtcclxuXHJcblx0XHR0aGlzLnJlZ2lzdGVyTWFya2Rvd25Qb3N0UHJvY2Vzc29yKChlbCwgY3R4KSA9PiB0aGlzLnRlbXBsYXRlci5wcm9jZXNzX2R5bmFtaWNfdGVtcGxhdGVzKGVsLCBjdHgpKTtcclxuXHJcblx0XHRhZGRJY29uKFwidGVtcGxhdGVyLWljb25cIiwgSUNPTl9EQVRBKTtcclxuXHRcdHRoaXMuYWRkUmliYm9uSWNvbigndGVtcGxhdGVyLWljb24nLCAnVGVtcGxhdGVyJywgYXN5bmMgKCkgPT4ge1xyXG5cdFx0XHR0aGlzLmZ1enp5U3VnZ2VzdC5pbnNlcnRfdGVtcGxhdGUoKTtcclxuXHRcdH0pO1xyXG5cclxuXHRcdHRoaXMuYWRkQ29tbWFuZCh7XHJcblx0XHRcdGlkOiBcImluc2VydC10ZW1wbGF0ZXJcIixcclxuXHRcdFx0bmFtZTogXCJJbnNlcnQgVGVtcGxhdGVcIixcclxuXHRcdFx0aG90a2V5czogW1xyXG5cdFx0XHRcdHtcclxuXHRcdFx0XHRcdG1vZGlmaWVyczogW1wiQWx0XCJdLFxyXG5cdFx0XHRcdFx0a2V5OiAnZScsXHJcblx0XHRcdFx0fSxcclxuXHRcdFx0XSxcclxuXHRcdFx0Y2FsbGJhY2s6ICgpID0+IHtcclxuXHRcdFx0XHR0aGlzLmZ1enp5U3VnZ2VzdC5pbnNlcnRfdGVtcGxhdGUoKTtcclxuXHRcdFx0fSxcclxuXHRcdH0pO1xyXG5cclxuXHRcdHRoaXMuYWRkQ29tbWFuZCh7XHJcbiAgICAgICAgICAgIGlkOiBcInJlcGxhY2UtaW4tZmlsZS10ZW1wbGF0ZXJcIixcclxuICAgICAgICAgICAgbmFtZTogXCJSZXBsYWNlIHRlbXBsYXRlcyBpbiB0aGUgYWN0aXZlIGZpbGVcIixcclxuICAgICAgICAgICAgaG90a2V5czogW1xyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIG1vZGlmaWVyczogW1wiQWx0XCJdLFxyXG4gICAgICAgICAgICAgICAgICAgIGtleTogJ3InLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgY2FsbGJhY2s6ICgpID0+IHtcclxuXHRcdFx0XHR0aGlzLnRlbXBsYXRlci5vdmVyd3JpdGVfYWN0aXZlX2ZpbGVfdGVtcGxhdGVzKCk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgfSk7XHJcblxyXG5cdFx0dGhpcy5hZGRDb21tYW5kKHtcclxuXHRcdFx0aWQ6IFwianVtcC10by1uZXh0LWN1cnNvci1sb2NhdGlvblwiLFxyXG5cdFx0XHRuYW1lOiBcIkp1bXAgdG8gbmV4dCBjdXJzb3IgbG9jYXRpb25cIixcclxuXHRcdFx0aG90a2V5czogW1xyXG5cdFx0XHRcdHtcclxuXHRcdFx0XHRcdG1vZGlmaWVyczogW1wiQWx0XCJdLFxyXG5cdFx0XHRcdFx0a2V5OiBcIlRhYlwiLFxyXG5cdFx0XHRcdH0sXHJcblx0XHRcdF0sXHJcblx0XHRcdGNhbGxiYWNrOiAoKSA9PiB7XHJcblx0XHRcdFx0dGhpcy50ZW1wbGF0ZXIuY3Vyc29yX2p1bXBlci5qdW1wX3RvX25leHRfY3Vyc29yX2xvY2F0aW9uKCk7XHJcblx0XHRcdH1cclxuXHRcdH0pO1xyXG5cclxuXHRcdHRoaXMuYWRkQ29tbWFuZCh7XHJcblx0XHRcdGlkOiBcImNyZWF0ZS1uZXctbm90ZS1mcm9tLXRlbXBsYXRlXCIsXHJcblx0XHRcdG5hbWU6IFwiQ3JlYXRlIG5ldyBub3RlIGZyb20gdGVtcGxhdGVcIixcclxuXHRcdFx0aG90a2V5czogW1xyXG5cdFx0XHRcdHtcclxuXHRcdFx0XHRcdG1vZGlmaWVyczogW1wiQWx0XCJdLFxyXG5cdFx0XHRcdFx0a2V5OiBcIm5cIixcclxuXHRcdFx0XHR9LFxyXG5cdFx0XHRdLFxyXG5cdFx0XHRjYWxsYmFjazogKCkgPT4ge1xyXG5cdFx0XHRcdHRoaXMuZnV6enlTdWdnZXN0LmNyZWF0ZV9uZXdfbm90ZV9mcm9tX3RlbXBsYXRlKCk7XHJcblx0XHRcdH1cclxuXHRcdH0pO1xyXG5cclxuXHRcdHRoaXMuYXBwLndvcmtzcGFjZS5vbkxheW91dFJlYWR5KCgpID0+IHtcclxuXHRcdFx0dGhpcy51cGRhdGVfdHJpZ2dlcl9maWxlX29uX2NyZWF0aW9uKCk7XHRcclxuXHRcdH0pO1xyXG5cclxuXHRcdHRoaXMucmVnaXN0ZXJFdmVudChcclxuXHRcdFx0dGhpcy5hcHAud29ya3NwYWNlLm9uKFwiZmlsZS1tZW51XCIsIChtZW51OiBNZW51LCBmaWxlOiBURmlsZSkgPT4ge1xyXG5cdFx0XHRcdGlmIChmaWxlIGluc3RhbmNlb2YgVEZvbGRlcikge1xyXG5cdFx0XHRcdFx0bWVudS5hZGRJdGVtKChpdGVtOiBNZW51SXRlbSkgPT4ge1xyXG5cdFx0XHRcdFx0XHRpdGVtLnNldFRpdGxlKFwiQ3JlYXRlIG5ldyBub3RlIGZyb20gdGVtcGxhdGVcIilcclxuXHRcdFx0XHRcdFx0XHQuc2V0SWNvbihcInRlbXBsYXRlci1pY29uXCIpXHJcblx0XHRcdFx0XHRcdFx0Lm9uQ2xpY2soZXZ0ID0+IHtcclxuXHRcdFx0XHRcdFx0XHRcdHRoaXMuZnV6enlTdWdnZXN0LmNyZWF0ZV9uZXdfbm90ZV9mcm9tX3RlbXBsYXRlKGZpbGUpO1xyXG5cdFx0XHRcdFx0XHRcdH0pXHJcblx0XHRcdFx0XHR9KTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0pXHJcblx0XHQpO1xyXG5cclxuXHRcdHRoaXMuYWRkU2V0dGluZ1RhYihuZXcgVGVtcGxhdGVyU2V0dGluZ1RhYih0aGlzLmFwcCwgdGhpcykpO1xyXG5cdH1cclxuXHJcblx0YXN5bmMgc2F2ZVNldHRpbmdzKCk6IFByb21pc2U8dm9pZD4ge1xyXG5cdFx0YXdhaXQgdGhpcy5zYXZlRGF0YSh0aGlzLnNldHRpbmdzKTtcclxuXHR9XHJcblxyXG5cdGFzeW5jIGxvYWRTZXR0aW5ncygpOiBQcm9taXNlPHZvaWQ+IHtcclxuXHRcdHRoaXMuc2V0dGluZ3MgPSBPYmplY3QuYXNzaWduKHt9LCBERUZBVUxUX1NFVFRJTkdTLCBhd2FpdCB0aGlzLmxvYWREYXRhKCkpO1xyXG5cdH1cdFxyXG5cclxuXHR1cGRhdGVfdHJpZ2dlcl9maWxlX29uX2NyZWF0aW9uKCk6IHZvaWQge1xyXG5cdFx0aWYgKHRoaXMuc2V0dGluZ3MudHJpZ2dlcl9vbl9maWxlX2NyZWF0aW9uKSB7XHJcblx0XHRcdHRoaXMudHJpZ2dlcl9vbl9maWxlX2NyZWF0aW9uX2V2ZW50ID0gdGhpcy5hcHAudmF1bHQub24oXCJjcmVhdGVcIiwgYXN5bmMgKGZpbGU6IFRBYnN0cmFjdEZpbGUpID0+IHtcclxuXHRcdFx0XHRpZiAoIShmaWxlIGluc3RhbmNlb2YgVEZpbGUpIHx8IGZpbGUuZXh0ZW5zaW9uICE9PSBcIm1kXCIpIHtcclxuXHRcdFx0XHRcdHJldHVybjtcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdC8qIEF2b2lkcyB0ZW1wbGF0ZSByZXBsYWNlbWVudCB3aGVuIHN5bmNpbmcgZmlsZXMgKi9cclxuXHRcdFx0XHRjb25zdCB0ZW1wbGF0ZV9mb2xkZXIgPSBub3JtYWxpemVQYXRoKHRoaXMuc2V0dGluZ3MudGVtcGxhdGVfZm9sZGVyKTtcclxuXHRcdFx0XHRpZiAodGVtcGxhdGVfZm9sZGVyICE9PSBcIi9cIikge1xyXG5cdFx0XHRcdFx0bGV0IHBhcmVudCA9IGZpbGUucGFyZW50O1xyXG5cdFx0XHRcdFx0d2hpbGUgKHBhcmVudCAhPSBudWxsKSB7XHJcblx0XHRcdFx0XHRcdGlmIChwYXJlbnQucGF0aCA9PT0gdGVtcGxhdGVfZm9sZGVyKSB7XHJcblx0XHRcdFx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdHBhcmVudCA9IHBhcmVudC5wYXJlbnQ7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHQvLyBUT0RPOiBmaW5kIGEgYmV0dGVyIHdheSB0byBkbyB0aGlzXHJcblx0XHRcdFx0Ly8gQ3VycmVudGx5LCBJIGhhdmUgdG8gd2FpdCBmb3IgdGhlIGRhaWx5IG5vdGUgcGx1Z2luIHRvIGFkZCB0aGUgZmlsZSBjb250ZW50IGJlZm9yZSByZXBsYWNpbmdcclxuXHRcdFx0XHQvLyBOb3QgYSBwcm9ibGVtIHdpdGggQ2FsZW5kYXIgaG93ZXZlciBzaW5jZSBpdCBjcmVhdGVzIHRoZSBmaWxlIHdpdGggdGhlIGV4aXN0aW5nIGNvbnRlbnRcclxuXHRcdFx0XHRhd2FpdCBkZWxheSgzMDApO1xyXG5cclxuXHRcdFx0XHRpZiAoZmlsZS5zdGF0LnNpemUgPT0gMCAmJiB0aGlzLnNldHRpbmdzLmVtcHR5X2ZpbGVfdGVtcGxhdGUpIHtcclxuXHRcdFx0XHRcdGNvbnN0IHRlbXBsYXRlX2ZpbGUgPSBhd2FpdCB0aGlzLmVycm9yV3JhcHBlcihhc3luYyAoKTogUHJvbWlzZTxURmlsZT4gPT4ge1xyXG5cdFx0XHRcdFx0XHRyZXR1cm4gcmVzb2x2ZVRGaWxlKHRoaXMuYXBwLCB0aGlzLnNldHRpbmdzLmVtcHR5X2ZpbGVfdGVtcGxhdGUgKyBcIi5tZFwiKTtcclxuXHRcdFx0XHRcdH0pO1xyXG5cdFx0XHRcdFx0aWYgKCF0ZW1wbGF0ZV9maWxlKSB7XHJcblx0XHRcdFx0XHRcdHJldHVybjtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdGNvbnN0IGNvbnRlbnQgPSBhd2FpdCB0aGlzLmFwcC52YXVsdC5yZWFkKHRlbXBsYXRlX2ZpbGUpO1xyXG5cdFx0XHRcdFx0YXdhaXQgdGhpcy5hcHAudmF1bHQubW9kaWZ5KGZpbGUsIGNvbnRlbnQpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHR0aGlzLnRlbXBsYXRlci5vdmVyd3JpdGVfZmlsZV90ZW1wbGF0ZXMoZmlsZSk7XHJcblx0XHRcdH0pO1xyXG5cdFx0XHR0aGlzLnJlZ2lzdGVyRXZlbnQodGhpcy50cmlnZ2VyX29uX2ZpbGVfY3JlYXRpb25fZXZlbnQpO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0aWYgKHRoaXMudHJpZ2dlcl9vbl9maWxlX2NyZWF0aW9uX2V2ZW50KSB7XHJcblx0XHRcdFx0dGhpcy5hcHAudmF1bHQub2ZmcmVmKHRoaXMudHJpZ2dlcl9vbl9maWxlX2NyZWF0aW9uX2V2ZW50KTtcclxuXHRcdFx0XHR0aGlzLnRyaWdnZXJfb25fZmlsZV9jcmVhdGlvbl9ldmVudCA9IHVuZGVmaW5lZDtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0dXBkYXRlX3N5bnRheF9oaWdobGlnaHRpbmcoKSB7XHJcblx0XHRpZiAodGhpcy5zZXR0aW5ncy5zeW50YXhfaGlnaGxpZ2h0aW5nKSB7XHJcblx0XHRcdHRoaXMuc3ludGF4X2hpZ2hsaWdodGluZ19ldmVudCA9IHRoaXMuYXBwLndvcmtzcGFjZS5vbihcImNvZGVtaXJyb3JcIiwgY20gPT4ge1xyXG5cdFx0XHRcdGNtLnNldE9wdGlvbihcIm1vZGVcIiwgXCJ0ZW1wbGF0ZXJcIik7XHJcblx0XHRcdH0pO1xyXG5cdFx0XHR0aGlzLmFwcC53b3Jrc3BhY2UuaXRlcmF0ZUNvZGVNaXJyb3JzKGNtID0+IHtcclxuXHRcdFx0XHRjbS5zZXRPcHRpb24oXCJtb2RlXCIsIFwidGVtcGxhdGVyXCIpO1xyXG5cdFx0XHR9KTtcclxuXHRcdFx0dGhpcy5yZWdpc3RlckV2ZW50KHRoaXMuc3ludGF4X2hpZ2hsaWdodGluZ19ldmVudCk7XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHRpZiAodGhpcy5zeW50YXhfaGlnaGxpZ2h0aW5nX2V2ZW50KSB7XHJcblx0XHRcdFx0dGhpcy5hcHAudmF1bHQub2ZmcmVmKHRoaXMuc3ludGF4X2hpZ2hsaWdodGluZ19ldmVudCk7XHJcblx0XHRcdH1cclxuXHRcdFx0dGhpcy5hcHAud29ya3NwYWNlLml0ZXJhdGVDb2RlTWlycm9ycyhjbSA9PiB7XHJcblx0XHRcdFx0Y20uc2V0T3B0aW9uKFwibW9kZVwiLCBcImh5cGVybWRcIik7XHJcblx0XHRcdH0pO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0YXN5bmMgZXJyb3JXcmFwcGVyKGZuOiBGdW5jdGlvbik6IFByb21pc2U8YW55PiB7XHJcblx0XHR0cnkge1xyXG5cdFx0XHRyZXR1cm4gYXdhaXQgZm4oKTtcclxuXHRcdH0gY2F0Y2goZSkge1xyXG5cdFx0XHRpZiAoIShlIGluc3RhbmNlb2YgVGVtcGxhdGVyRXJyb3IpKSB7XHJcblx0XHRcdFx0dGhpcy5sb2dfZXJyb3IobmV3IFRlbXBsYXRlckVycm9yKGBUZW1wbGF0ZSBwYXJzaW5nIGVycm9yLCBhYm9ydGluZy5gLCBlLm1lc3NhZ2UpKTtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHR0aGlzLmxvZ19lcnJvcihlKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gbnVsbDtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdGxvZ191cGRhdGUobXNnOiBzdHJpbmcpOiB2b2lkIHtcclxuXHRcdGNvbnN0IG5vdGljZSA9IG5ldyBOb3RpY2UoXCJcIiwgMTUwMDApO1xyXG5cdFx0Ly8gVE9ETzogRmluZCBiZXR0ZXIgd2F5IGZvciB0aGlzXHJcblx0XHQvLyBAdHMtaWdub3JlXHJcblx0XHRub3RpY2Uubm90aWNlRWwuaW5uZXJIVE1MID0gYDxiPlRlbXBsYXRlciB1cGRhdGU8L2I+Ojxici8+JHttc2d9YDtcclxuXHR9XHJcblxyXG5cdGxvZ19lcnJvcihlOiBFcnJvciB8IFRlbXBsYXRlckVycm9yKTogdm9pZCB7XHJcblx0XHRjb25zdCBub3RpY2UgPSBuZXcgTm90aWNlKFwiXCIsIDgwMDApO1xyXG5cdFx0aWYgKGUgaW5zdGFuY2VvZiBUZW1wbGF0ZXJFcnJvciAmJiBlLmNvbnNvbGVfbXNnKSB7XHJcblx0XHRcdC8vIFRPRE86IEZpbmQgYSBiZXR0ZXIgd2F5IGZvciB0aGlzXHJcblx0XHRcdC8vIEB0cy1pZ25vcmVcclxuXHRcdFx0bm90aWNlLm5vdGljZUVsLmlubmVySFRNTCA9IGA8Yj5UZW1wbGF0ZXIgRXJyb3I8L2I+Ojxici8+JHtlLm1lc3NhZ2V9PGJyLz5DaGVjayBjb25zb2xlIGZvciBtb3JlIGluZm9ybWF0aW9uc2A7XHJcblx0XHRcdGNvbnNvbGUuZXJyb3IoZS5tZXNzYWdlLCBlLmNvbnNvbGVfbXNnKTtcclxuXHRcdH1cclxuXHRcdGVsc2Uge1xyXG5cdFx0XHQvLyBAdHMtaWdub3JlXHJcblx0XHRcdG5vdGljZS5ub3RpY2VFbC5pbm5lckhUTUwgPSBgPGI+VGVtcGxhdGVyIEVycm9yPC9iPjo8YnIvPiR7ZS5tZXNzYWdlfWA7XHJcblx0XHR9XHJcblx0fVx0XHJcbn07Il0sIm5hbWVzIjpbIlBsdWdpblNldHRpbmdUYWIiLCJTZXR0aW5nIiwiZXNjYXBlUmVnRXhwIiwibm9ybWFsaXplUGF0aCIsIlRGaWxlIiwiVEZvbGRlciIsIlZhdWx0IiwiRnV6enlTdWdnZXN0TW9kYWwiLCJNYXJrZG93blZpZXciLCJwYXRoIiwiZXhpc3RzU3luYyIsInJlYWRGaWxlU3luYyIsInBhcnNlTGlua3RleHQiLCJyZXNvbHZlU3VicGF0aCIsIlBsYXRmb3JtIiwiRmlsZVN5c3RlbUFkYXB0ZXIiLCJnZXRBbGxUYWdzIiwiTW9kYWwiLCJwcm9taXNpZnkiLCJleGVjIiwiRXRhLnJlbmRlckFzeW5jIiwiUGx1Z2luIiwiYWRkSWNvbiIsIk5vdGljZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQXVEQTtBQUNPLFNBQVMsU0FBUyxDQUFDLE9BQU8sRUFBRSxVQUFVLEVBQUUsQ0FBQyxFQUFFLFNBQVMsRUFBRTtBQUM3RCxJQUFJLFNBQVMsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLE9BQU8sS0FBSyxZQUFZLENBQUMsR0FBRyxLQUFLLEdBQUcsSUFBSSxDQUFDLENBQUMsVUFBVSxPQUFPLEVBQUUsRUFBRSxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRTtBQUNoSCxJQUFJLE9BQU8sS0FBSyxDQUFDLEtBQUssQ0FBQyxHQUFHLE9BQU8sQ0FBQyxFQUFFLFVBQVUsT0FBTyxFQUFFLE1BQU0sRUFBRTtBQUMvRCxRQUFRLFNBQVMsU0FBUyxDQUFDLEtBQUssRUFBRSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsRUFBRSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUU7QUFDbkcsUUFBUSxTQUFTLFFBQVEsQ0FBQyxLQUFLLEVBQUUsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFP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QUFLLElBQUksSUFBSSxLQUFLLElBQUksV0FBVyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsTUFBTSxHQUFHLFNBQVMsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsRUFBRSxlQUFlLEVBQUUsTUFBTSxDQUFDLENBQUMsRUFBRTtBQUM1SSxJQUFJLElBQUksSUFBSSxJQUFJLFdBQVcsSUFBSSxJQUFJLElBQUksT0FBTyxFQUFFLE9BQU8sSUFBSSxDQUFDLE9BQU8sR0FBRyxpQkFBaUIsR0FBRyxVQUFVLENBQUMsQ0FBQztBQUN0RyxJQUFJLElBQUksSUFBSSxJQUFJLEdBQUcsRUFBRSxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUUsZUFBZSxFQUFFLE1BQU0sQ0FBQyxHQUFHLENBQUMsRUFBRSxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUM7QUFDOUYsSUFBSSxJQUFJLElBQUksSUFBSSxVQUFVLElBQUksSUFBSSxJQUFJLFFBQVEsRUFBRSxPQUFPLElBQUksQ0FBQyxPQUFPLEdBQUcsaUJBQWlCLEdBQUcsVUFBVSxDQUFDLENBQUM7QUFDdEcsSUFBSSxJQUFJLElBQUksSUFBSSxHQUFHLEVBQUUsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLFlBQVksRUFBRSxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUM7QUFDOUUsSUFBSSxJQUFJLElBQUksSUFBSSxHQUFHLEVBQUUsT0FBTyxZQUFZLENBQUMsT0FBTyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7QUFDdEUsSUFBSSxJQUFJLElBQUksSUFBSSxPQUFPLEVBQUUsT0FBTyxJQUFJLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0FBQ3JELElBQUksSUFBSSxJQUFJLElBQUksS0FBSyxFQUFFLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO0FBQ3pELElBQUksT0FBTyxJQUFJLEVBQUUsQ0FBQztBQUNs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aEMsSUFBSSxJQUFJLElBQUksSUFBSSxVQUFVLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsVUFBVSxFQUFFLEtBQUssQ0FBQyxJQUFJLEtBQUssSUFBSSxHQUFHLEVBQUUsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDO0FBQ3RHLElBQUksSUFBSSxJQUFJLElBQUksR0FBRyxFQUFFLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQztBQUMxQyxJQUFJLElBQUksSUFBSSxJQUFJLFFBQVEsRUFBRSxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUM7QUFDOUMsSUFBSSxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUM7QUFDekIsR0FBRztBQUNILEVBQUUsU0FBUyxTQUFTLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRTtBQUNsQyxJQUFJLElBQUksS0FBSyxJQUFJLEdBQUcsRUFBRSxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUUsUUFBUSxDQUFDLFFBQVEsRUFBRSxHQUFHLENBQUMsRUFBRSxNQUFNLEVBQUUsU0FBUyxDQUFDO0FBQzNGLElBQUksSUFBSSxLQUFLLElBQUksR0FBRyxJQUFJLElBQUksSUFBSSxHQUFHLElBQUksS0FBSyxJQUFJLEdBQUcsRUFBRSxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUM7QUFDMUUsSUFBSSxJQUFJLElBQUksSUFBSSxHQUFHLEVBQUUsT0FBTyxJQUFJLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxHQUFHLENBQUMsRUFBRSxTQUFTLENBQUM7QUFDbEUsSUFBSSxJQUFJLEtBQUssSUFBSSxTQUFTLElBQUksS0FBSyxJQUFJLFlBQVksRUFBRSxFQUFFLEVBQUUsQ0FBQyxNQUFNLEdBQUcsU0FBUyxDQUFDLENBQUMsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUU7QUFDckcsSUFBSSxJQUFJLEtBQUssSUFBSSxHQUFHLEVBQUUsT0FBTyxJQUFJLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxHQUFHLENBQUMsRUFBRSxRQUFRLENBQUM7QUFD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
