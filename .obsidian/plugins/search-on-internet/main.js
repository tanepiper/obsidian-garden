'use strict';

var obsidian = require('obsidian');
var require$$0 = require('util');
var path = require('path');
var childProcess = require('child_process');
var fs = require('fs');
var os = require('os');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var require$$0__default = /*#__PURE__*/_interopDefaultLegacy(require$$0);
var path__default = /*#__PURE__*/_interopDefaultLegacy(path);
var childProcess__default = /*#__PURE__*/_interopDefaultLegacy(childProcess);
var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);
var os__default = /*#__PURE__*/_interopDefaultLegacy(os);

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
/* global Reflect, Promise */

var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
    return extendStatics(d, b);
};

function __extends(d, b) {
    if (typeof b !== "function" && b !== null)
        throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

function __generator(thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
}

var DEFAULT_QUERY = {
    tags: [],
    query: '{{query}}',
    name: '',
    encode: true,
};
var DEFAULT_SETTING = {
    searches: [{
            tags: [],
            query: 'https://www.google.com/search?&q={{query}}',
            name: 'Google',
            encode: true,
        }, {
            tags: [],
            query: 'https://en.wikipedia.org/wiki/Special:Search/{{query}}',
            name: 'Wikipedia',
            encode: true,
        }],
    useIframe: true,
};
var parseTags = function (inputs) {
    return inputs.split(',')
        .map(function (s) { return s.trim(); })
        .filter(function (s) { return /^#([A-Za-z])\w+$/.test(s); });
};
var SOISettingTab = /** @class */ (function (_super) {
    __extends(SOISettingTab, _super);
    function SOISettingTab(app, plugin) {
        var _this = _super.call(this, app, plugin) || this;
        _this.plugin = plugin;
        return _this;
    }
    SOISettingTab.prototype.display = function () {
        var _this = this;
        var containerEl = this.containerEl;
        containerEl.empty();
        var plugin = this.plugin;
        new obsidian.Setting(containerEl)
            .setName('Open in iframe')
            .setDesc('If set to true, this will open your searches in an iframe within Obsidian. ' +
            'Otherwise, it will open in your default browser.')
            .addToggle(function (toggle) {
            toggle.setValue(_this.plugin.settings.useIframe)
                .onChange(function (new_value) {
                _this.plugin.settings.useIframe = new_value;
                _this.plugin.saveData(_this.plugin.settings);
            });
        });
        // Code mostly taken from https://github.com/SilentVoid13/Templater/blob/master/src/settings.ts
        plugin.settings.searches.forEach(function (search) {
            var div = containerEl.createEl('div');
            div.addClass('soi_div');
            new obsidian.Setting(div) //
                .addExtraButton(function (extra) {
                extra.setIcon('cross')
                    .setTooltip('Delete')
                    .onClick(function () {
                    var index = plugin.settings.searches.indexOf(search);
                    if (index > -1) {
                        plugin.settings.searches.splice(index, 1);
                        // Force refresh
                        _this.display();
                    }
                });
            })
                .addText(function (text) {
                return text.setPlaceholder('Search name')
                    .setValue(search.name)
                    .onChange(function (newValue) {
                    var index = plugin.settings.searches.indexOf(search);
                    if (index > -1) {
                        search.name = newValue;
                        plugin.saveSettings();
                        // title.textContent = newValue;
                    }
                });
            }).setName('Name')
                .setDesc('Name of the search. Click the cross to delete the search.');
            new obsidian.Setting(div)
                .setName('Encode')
                .setDesc('If set to true, this will encode raw text to be used in URLs. ' +
                'Otherwise, it will not encode your query.')
                .addToggle(function (toggle) {
                toggle.setValue(search.encode)
                    .onChange(function (newValue) {
                    var index = plugin.settings.searches.indexOf(search);
                    if (index > -1) {
                        search.encode = newValue;
                        plugin.saveSettings();
                    }
                });
            });
            new obsidian.Setting(div)
                .addTextArea(function (text) {
                var t = text.setPlaceholder('Search query')
                    .setValue(search.query)
                    .onChange(function (newQuery) {
                    var index = plugin.settings.searches.indexOf(search);
                    if (index > -1) {
                        search.query = newQuery;
                        plugin.saveSettings();
                    }
                });
                t.inputEl.setAttr('rows', 2);
                return t; //
            }).setName('URL')
                .setDesc('URL to open when executing the search. ' +
                'Use {{query}} to refer to the query, which is either the selected text, or the title of a note.');
            new obsidian.Setting(div).addText(function (text) {
                return text.setPlaceholder('')
                    .setValue(search.tags.join(', '))
                    .onChange(function (newValue) {
                    var index = plugin.settings.searches.indexOf(search);
                    if (index > -1) {
                        search.tags = parseTags(newValue);
                        plugin.saveSettings();
                    }
                });
            }).setName('Tags')
                .setDesc('Only add search to notes with these comma-separated tags. Leave empty to use all tags.');
        });
        var div = containerEl.createEl('div');
        div.addClass('soi_div2');
        var setting = new obsidian.Setting(containerEl)
            .addButton(function (button) {
            return button.setButtonText('Add Search').onClick(function () {
                plugin.settings.searches.push({
                    name: '',
                    query: '',
                    tags: [],
                    encode: true,
                });
                // Force refresh
                _this.display();
            });
        });
        setting.infoEl.remove();
        div.appendChild(containerEl.lastChild);
    };
    return SOISettingTab;
}(obsidian.PluginSettingTab));

function createCommonjsModule(fn, basedir, module) {
	return module = {
		path: basedir,
		exports: {},
		require: function (path, base) {
			return commonjsRequire(path, (base === undefined || base === null) ? module.path : base);
		}
	}, fn(module, module.exports), module.exports;
}

function commonjsRequire () {
	throw new Error('Dynamic requires are not currently supported by @rollup/plugin-commonjs');
}

let isDocker;

function hasDockerEnv() {
	try {
		fs__default['default'].statSync('/.dockerenv');
		return true;
	} catch (_) {
		return false;
	}
}

function hasDockerCGroup() {
	try {
		return fs__default['default'].readFileSync('/proc/self/cgroup', 'utf8').includes('docker');
	} catch (_) {
		return false;
	}
}

var isDocker_1 = () => {
	if (isDocker === undefined) {
		isDocker = hasDockerEnv() || hasDockerCGroup();
	}

	return isDocker;
};

var isWsl_1 = createCommonjsModule(function (module) {




const isWsl = () => {
	if (process.platform !== 'linux') {
		return false;
	}

	if (os__default['default'].release().toLowerCase().includes('microsoft')) {
		if (isDocker_1()) {
			return false;
		}

		return true;
	}

	try {
		return fs__default['default'].readFileSync('/proc/version', 'utf8').toLowerCase().includes('microsoft') ?
			!isDocker_1() : false;
	} catch (_) {
		return false;
	}
};

if (process.env.__IS_WSL_TEST__) {
	module.exports = isWsl;
} else {
	module.exports = isWsl();
}
});

const {promisify} = require$$0__default['default'];






const pAccess = promisify(fs__default['default'].access);

// Path to included `xdg-open`.
const localXdgOpenPath = path__default['default'].join(__dirname, 'xdg-open');

var open = async (target, options) => {
	if (typeof target !== 'string') {
		throw new TypeError('Expected a `target`');
	}

	options = {
		wait: false,
		background: false,
		allowNonzeroExitCode: false,
		...options
	};

	let command;
	let {app} = options;
	let appArguments = [];
	const cliArguments = [];
	const childProcessOptions = {};

	if (Array.isArray(app)) {
		appArguments = app.slice(1);
		app = app[0];
	}

	if (process.platform === 'darwin') {
		command = 'open';

		if (options.wait) {
			cliArguments.push('--wait-apps');
		}

		if (options.background) {
			cliArguments.push('--background');
		}

		if (app) {
			cliArguments.push('-a', app);
		}
	} else if (process.platform === 'win32' || (isWsl_1 && !isDocker_1())) {
		command = isWsl_1 ?
			'/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe' :
			`${process.env.SYSTEMROOT}\\System32\\WindowsPowerShell\\v1.0\\powershell`;

		cliArguments.push(
			'-NoProfile',
			'-NonInteractive',
			'–ExecutionPolicy',
			'Bypass',
			'-EncodedCommand'
		);

		if (!isWsl_1) {
			childProcessOptions.windowsVerbatimArguments = true;
		}

		const encodedArguments = ['Start'];

		if (options.wait) {
			encodedArguments.push('-Wait');
		}

		if (app) {
			// Double quote with double quotes to ensure the inner quotes are passed through.
			// Inner quotes are delimited for PowerShell interpretation with backticks.
			encodedArguments.push(`"\`"${app}\`""`, '-ArgumentList');
			appArguments.unshift(target);
		} else {
			encodedArguments.push(`"\`"${target}\`""`);
		}

		if (appArguments.length > 0) {
			appArguments = appArguments.map(arg => `"\`"${arg}\`""`);
			encodedArguments.push(appArguments.join(','));
		}

		// Using Base64-encoded command, accepted by PowerShell, to allow special characters.
		target = Buffer.from(encodedArguments.join(' '), 'utf16le').toString('base64');
	} else {
		if (app) {
			command = app;
		} else {
			// When bundled by Webpack, there's no actual package file path and no local `xdg-open`.
			const isBundled = !__dirname || __dirname === '/';

			// Check if local `xdg-open` exists and is executable.
			let exeLocalXdgOpen = false;
			try {
				await pAccess(localXdgOpenPath, fs__default['default'].constants.X_OK);
				exeLocalXdgOpen = true;
			} catch (_) {}

			const useSystemXdgOpen = process.versions.electron ||
				process.platform === 'android' || isBundled || !exeLocalXdgOpen;
			command = useSystemXdgOpen ? 'xdg-open' : localXdgOpenPath;
		}

		if (appArguments.length > 0) {
			cliArguments.push(...appArguments);
		}

		if (!options.wait) {
			// `xdg-open` will block the process unless stdio is ignored
			// and it's detached from the parent even if it's unref'd.
			childProcessOptions.stdio = 'ignore';
			childProcessOptions.detached = true;
		}
	}

	cliArguments.push(target);

	if (process.platform === 'darwin' && appArguments.length > 0) {
		cliArguments.push('--args', ...appArguments);
	}

	const subprocess = childProcess__default['default'].spawn(command, cliArguments, childProcessOptions);

	if (options.wait) {
		return new Promise((resolve, reject) => {
			subprocess.once('error', reject);

			subprocess.once('close', exitCode => {
				if (options.allowNonzeroExitCode && exitCode > 0) {
					reject(new Error(`Exited with code ${exitCode}`));
					return;
				}

				resolve(subprocess);
			});
		});
	}

	subprocess.unref();

	return subprocess;
};

var SearchModal = /** @class */ (function (_super) {
    __extends(SearchModal, _super);
    function SearchModal(app, plugin, query) {
        var _this = _super.call(this, app) || this;
        _this.plugin = plugin;
        _this.setPlaceholder('');
        _this.query = query;
        _this.setInstructions([{ command: '↑↓', purpose: 'to navigate' }, { command: '↵', purpose: "to search " + _this.query }, { command: 'esc', purpose: 'to dismiss' }]);
        return _this;
    }
    SearchModal.prototype.onOpen = function () {
        _super.prototype.onOpen.call(this);
        // const {contentEl} = this;
        this.inputEl.focus();
    };
    SearchModal.prototype.onClose = function () {
        _super.prototype.onClose.call(this);
        var contentEl = this.contentEl;
        contentEl.empty();
    };
    SearchModal.prototype.getItemText = function (item) {
        return item.name;
    };
    SearchModal.prototype.renderSuggestion = function (item, el) {
        _super.prototype.renderSuggestion.call(this, item, el);
        el.innerHTML = "Search on: " + el.innerHTML;
    };
    SearchModal.prototype.getItems = function () {
        return this.plugin.settings.searches;
    };
    SearchModal.prototype.onChooseItem = function (item, evt) {
        this.plugin.openSearch(item, this.query);
    };
    return SearchModal;
}(obsidian.FuzzySuggestModal));

var SearchView = /** @class */ (function (_super) {
    __extends(SearchView, _super);
    function SearchView(plugin, leaf, query, site, url) {
        var _this = _super.call(this, leaf) || this;
        _this.query = query;
        _this.site = site;
        _this.url = url;
        _this.plugin = plugin;
        return _this;
    }
    SearchView.prototype.onOpen = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.frame = document.createElement('iframe');
                this.frame.addClass("soi-site");
                this.frame.setAttr('style', 'height: 100%; width:100%');
                this.frame.setAttr('src', this.url);
                this.frame.setAttr('tabindex', '0');
                this.containerEl.children[1].appendChild(this.frame);
                return [2 /*return*/];
            });
        });
    };
    SearchView.prototype.getDisplayText = function () {
        return this.site + ": " + this.query;
    };
    SearchView.prototype.getViewType = function () {
        return 'Search on Internet';
    };
    return SearchView;
}(obsidian.ItemView));

var SearchOnInternetPlugin = /** @class */ (function (_super) {
    __extends(SearchOnInternetPlugin, _super);
    function SearchOnInternetPlugin() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    SearchOnInternetPlugin.prototype.onload = function () {
        return __awaiter(this, void 0, void 0, function () {
            var plugin;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('loading search-on-internet');
                        return [4 /*yield*/, this.loadSettings()];
                    case 1:
                        _a.sent();
                        this.addSettingTab(new SOISettingTab(this.app, this));
                        plugin = this;
                        this.registerEvent(this.app.workspace.on('file-menu', function (menu, file, source) {
                            var _a, _b;
                            if (file === null) {
                                return;
                            }
                            var fileTags = (_b = (_a = _this.app.metadataCache.getFileCache(file)) === null || _a === void 0 ? void 0 : _a.tags) === null || _b === void 0 ? void 0 : _b.map(function (t) { return t.tag; });
                            _this.settings.searches.forEach(function (search) {
                                if (search.tags.length === 0 || (fileTags === null || fileTags === void 0 ? void 0 : fileTags.some(function (t) { return search.tags.contains(t); }))) {
                                    menu.addItem(function (item) {
                                        item.setTitle("Search " + search.name).setIcon('search')
                                            .onClick(function (evt) {
                                            plugin.openSearch(search, file.basename);
                                        });
                                    });
                                }
                            });
                        }));
                        this.addCommand({
                            id: 'search-on-internet',
                            name: 'Perform search',
                            callback: function () {
                                var query = _this.getSelectedText();
                                if (query === null || query === '') {
                                    var activeView = _this.app.workspace.getActiveViewOfType(obsidian.MarkdownView);
                                    if (activeView == null) {
                                        return;
                                    }
                                    query = activeView.getDisplayText();
                                }
                                var modal = new SearchModal(plugin.app, plugin, query);
                                modal.open();
                            },
                        });
                        // Changing the context menu is a bit problematic:
                        // Obsidian sometimes uses its own context menu, eg when right-clicking
                        // on internal link. But other times, it's a context menu that
                        // cannot really be edited easily. It would be nice if Obsidian
                        // provided its own context menu everywhere to hook into.
                        this.registerCodeMirror(function (cm) {
                            // @ts-ignore
                            cm.resetSelectionOnContextMenu = false;
                            cm.on('contextmenu', function (editor, event) {
                                plugin.handleContext(event);
                            });
                        });
                        this.onDom = function (event) {
                            plugin.handleContext(event);
                        };
                        this.onDomSettings = {};
                        document.on('contextmenu', '.markdown-preview-view', this.onDom, this.onDomSettings);
                        return [2 /*return*/];
                }
            });
        });
    };
    SearchOnInternetPlugin.prototype.getSelectedText = function () {
        var wSelection = window.getSelection();
        var docSelection = document === null || document === void 0 ? void 0 : document.getSelection();
        if (wSelection) {
            return wSelection.toString();
        }
        else if (document && docSelection.type != 'Control') {
            return docSelection.toString();
        }
        return null;
    };
    SearchOnInternetPlugin.prototype.handleContext = function (e, activeView) {
        if (activeView === void 0) { activeView = null; }
        return __awaiter(this, void 0, void 0, function () {
            var fileMenu, onUrl, classes, url_1, query, hasSelection, _loop_1, _i, _a, setting;
            var _this = this;
            return __generator(this, function (_b) {
                fileMenu = new obsidian.Menu();
                onUrl = false;
                // @ts-ignore
                fileMenu.dom.classList.add('soi-file-menu');
                if (e.target) {
                    classes = e.target.classList;
                    // @ts-ignore
                    if (classes.contains('cm-url') || classes.contains('external-link')) {
                        url_1 = classes.contains('cm-url') ? e.target.textContent : e.target.href;
                        onUrl = true;
                        fileMenu.addItem(function (item) {
                            item.setTitle("Open in iframe").setIcon('link')
                                .onClick(function (evt) {
                                _this.openSearch({
                                    tags: [],
                                    query: '{{query}}',
                                    name: '',
                                    encode: false,
                                }, url_1, activeView);
                            });
                        });
                    }
                }
                query = this.getSelectedText();
                hasSelection = !(query === null || query === '');
                if (!onUrl && !hasSelection) {
                    return [2 /*return*/];
                }
                if (hasSelection) {
                    console.log(query);
                    _loop_1 = function (setting) {
                        fileMenu.addItem(function (item) {
                            item.setTitle("Search " + setting.name).setIcon('search')
                                .onClick(function (evt) {
                                _this.openSearch(setting, query, activeView);
                            });
                        });
                    };
                    for (_i = 0, _a = this.settings.searches; _i < _a.length; _i++) {
                        setting = _a[_i];
                        _loop_1(setting);
                    }
                }
                fileMenu.showAtPosition({ x: e.x, y: e.y });
                e.preventDefault();
                return [2 /*return*/];
            });
        });
    };
    SearchOnInternetPlugin.prototype.openSearch = function (search, query, activeView) {
        if (activeView === void 0) { activeView = null; }
        return __awaiter(this, void 0, void 0, function () {
            var encodedQuery, url, leaf, view;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        encodedQuery = query;
                        if (search.encode) {
                            encodedQuery = encodeURIComponent(query);
                        }
                        url = search.query.replace('{{title}}', encodedQuery)
                            .replace('{{query}}', encodedQuery);
                        console.log("SOI: Opening URL " + url);
                        if (!this.settings.useIframe) return [3 /*break*/, 4];
                        if (!activeView) return [3 /*break*/, 1];
                        activeView.frame.setAttr('src', url);
                        activeView.url = url;
                        return [3 /*break*/, 3];
                    case 1:
                        leaf = this.app.workspace.getLeaf(!(this.app.workspace.activeLeaf.view.getViewType() === 'empty'));
                        view = new SearchView(this, leaf, query, search.name, url);
                        return [4 /*yield*/, leaf.open(view)];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3: return [3 /*break*/, 6];
                    case 4: return [4 /*yield*/, open(url)];
                    case 5:
                        _a.sent();
                        _a.label = 6;
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    SearchOnInternetPlugin.prototype.onunload = function () {
        console.log('unloading search-on-internet');
        document.off('contextmenu', '.markdown-preview-view', this.onDom, this.onDomSettings);
    };
    SearchOnInternetPlugin.prototype.loadSettings = function () {
        return __awaiter(this, void 0, void 0, function () {
            var loadedSettings;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.loadData()];
                    case 1:
                        loadedSettings = _a.sent();
                        if (loadedSettings && loadedSettings.hasOwnProperty('searches')) {
                            loadedSettings.searches = Array.from(loadedSettings.searches.map(function (s) { return Object.assign({}, DEFAULT_QUERY, s); }));
                            this.settings = loadedSettings;
                        }
                        else {
                            this.settings = DEFAULT_SETTING;
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    SearchOnInternetPlugin.prototype.saveSettings = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.saveData(this.settings)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return SearchOnInternetPlugin;
}(obsidian.Plugin));

module.exports = SearchOnInternetPlugin;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXMiOlsibm9kZV9tb2R1bGVzL3RzbGliL3RzbGliLmVzNi5qcyIsInNldHRpbmdzLnRzIiwibm9kZV9tb2R1bGVzL2lzLWRvY2tlci9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9pcy13c2wvaW5kZXguanMiLCJub2RlX21vZHVsZXMvb3Blbi9pbmRleC5qcyIsIm1vZGFsLnRzIiwidmlldy50cyIsIm1haW4udHMiXSwic291cmNlc0NvbnRlbnQiOlsiLyohICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXHJcbkNvcHlyaWdodCAoYykgTWljcm9zb2Z0IENvcnBvcmF0aW9uLlxyXG5cclxuUGVybWlzc2lvbiB0byB1c2UsIGNvcHksIG1vZGlmeSwgYW5kL29yIGRpc3RyaWJ1dGUgdGhpcyBzb2Z0d2FyZSBmb3IgYW55XHJcbnB1cnBvc2Ugd2l0aCBvciB3aXRob3V0IGZlZSBpcyBoZXJlYnkgZ3JhbnRlZC5cclxuXHJcblRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIgQU5EIFRIRSBBVVRIT1IgRElTQ0xBSU1TIEFMTCBXQVJSQU5USUVTIFdJVEhcclxuUkVHQVJEIFRPIFRISVMgU09GVFdBUkUgSU5DTFVESU5HIEFMTCBJTVBMSUVEIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZXHJcbkFORCBGSVRORVNTLiBJTiBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SIEJFIExJQUJMRSBGT1IgQU5ZIFNQRUNJQUwsIERJUkVDVCxcclxuSU5ESVJFQ1QsIE9SIENPTlNFUVVFTlRJQUwgREFNQUdFUyBPUiBBTlkgREFNQUdFUyBXSEFUU09FVkVSIFJFU1VMVElORyBGUk9NXHJcbkxPU1MgT0YgVVNFLCBEQVRBIE9SIFBST0ZJVFMsIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBORUdMSUdFTkNFIE9SXHJcbk9USEVSIFRPUlRJT1VTIEFDVElPTiwgQVJJU0lORyBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBVU0UgT1JcclxuUEVSRk9STUFOQ0UgT0YgVEhJUyBTT0ZUV0FSRS5cclxuKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiogKi9cclxuLyogZ2xvYmFsIFJlZmxlY3QsIFByb21pc2UgKi9cclxuXHJcbnZhciBleHRlbmRTdGF0aWNzID0gZnVuY3Rpb24oZCwgYikge1xyXG4gICAgZXh0ZW5kU3RhdGljcyA9IE9iamVjdC5zZXRQcm90b3R5cGVPZiB8fFxyXG4gICAgICAgICh7IF9fcHJvdG9fXzogW10gfSBpbnN0YW5jZW9mIEFycmF5ICYmIGZ1bmN0aW9uIChkLCBiKSB7IGQuX19wcm90b19fID0gYjsgfSkgfHxcclxuICAgICAgICBmdW5jdGlvbiAoZCwgYikgeyBmb3IgKHZhciBwIGluIGIpIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoYiwgcCkpIGRbcF0gPSBiW3BdOyB9O1xyXG4gICAgcmV0dXJuIGV4dGVuZFN0YXRpY3MoZCwgYik7XHJcbn07XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19leHRlbmRzKGQsIGIpIHtcclxuICAgIGlmICh0eXBlb2YgYiAhPT0gXCJmdW5jdGlvblwiICYmIGIgIT09IG51bGwpXHJcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNsYXNzIGV4dGVuZHMgdmFsdWUgXCIgKyBTdHJpbmcoYikgKyBcIiBpcyBub3QgYSBjb25zdHJ1Y3RvciBvciBudWxsXCIpO1xyXG4gICAgZXh0ZW5kU3RhdGljcyhkLCBiKTtcclxuICAgIGZ1bmN0aW9uIF9fKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gZDsgfVxyXG4gICAgZC5wcm90b3R5cGUgPSBiID09PSBudWxsID8gT2JqZWN0LmNyZWF0ZShiKSA6IChfXy5wcm90b3R5cGUgPSBiLnByb3RvdHlwZSwgbmV3IF9fKCkpO1xyXG59XHJcblxyXG5leHBvcnQgdmFyIF9fYXNzaWduID0gZnVuY3Rpb24oKSB7XHJcbiAgICBfX2Fzc2lnbiA9IE9iamVjdC5hc3NpZ24gfHwgZnVuY3Rpb24gX19hc3NpZ24odCkge1xyXG4gICAgICAgIGZvciAodmFyIHMsIGkgPSAxLCBuID0gYXJndW1lbnRzLmxlbmd0aDsgaSA8IG47IGkrKykge1xyXG4gICAgICAgICAgICBzID0gYXJndW1lbnRzW2ldO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBwIGluIHMpIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwocywgcCkpIHRbcF0gPSBzW3BdO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdDtcclxuICAgIH1cclxuICAgIHJldHVybiBfX2Fzc2lnbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19yZXN0KHMsIGUpIHtcclxuICAgIHZhciB0ID0ge307XHJcbiAgICBmb3IgKHZhciBwIGluIHMpIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwocywgcCkgJiYgZS5pbmRleE9mKHApIDwgMClcclxuICAgICAgICB0W3BdID0gc1twXTtcclxuICAgIGlmIChzICE9IG51bGwgJiYgdHlwZW9mIE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMgPT09IFwiZnVuY3Rpb25cIilcclxuICAgICAgICBmb3IgKHZhciBpID0gMCwgcCA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMocyk7IGkgPCBwLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGlmIChlLmluZGV4T2YocFtpXSkgPCAwICYmIE9iamVjdC5wcm90b3R5cGUucHJvcGVydHlJc0VudW1lcmFibGUuY2FsbChzLCBwW2ldKSlcclxuICAgICAgICAgICAgICAgIHRbcFtpXV0gPSBzW3BbaV1dO1xyXG4gICAgICAgIH1cclxuICAgIHJldHVybiB0O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19kZWNvcmF0ZShkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYykge1xyXG4gICAgdmFyIGMgPSBhcmd1bWVudHMubGVuZ3RoLCByID0gYyA8IDMgPyB0YXJnZXQgOiBkZXNjID09PSBudWxsID8gZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodGFyZ2V0LCBrZXkpIDogZGVzYywgZDtcclxuICAgIGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgUmVmbGVjdC5kZWNvcmF0ZSA9PT0gXCJmdW5jdGlvblwiKSByID0gUmVmbGVjdC5kZWNvcmF0ZShkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYyk7XHJcbiAgICBlbHNlIGZvciAodmFyIGkgPSBkZWNvcmF0b3JzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSBpZiAoZCA9IGRlY29yYXRvcnNbaV0pIHIgPSAoYyA8IDMgPyBkKHIpIDogYyA+IDMgPyBkKHRhcmdldCwga2V5LCByKSA6IGQodGFyZ2V0LCBrZXkpKSB8fCByO1xyXG4gICAgcmV0dXJuIGMgPiAzICYmIHIgJiYgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwga2V5LCByKSwgcjtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fcGFyYW0ocGFyYW1JbmRleCwgZGVjb3JhdG9yKSB7XHJcbiAgICByZXR1cm4gZnVuY3Rpb24gKHRhcmdldCwga2V5KSB7IGRlY29yYXRvcih0YXJnZXQsIGtleSwgcGFyYW1JbmRleCk7IH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fbWV0YWRhdGEobWV0YWRhdGFLZXksIG1ldGFkYXRhVmFsdWUpIHtcclxuICAgIGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgUmVmbGVjdC5tZXRhZGF0YSA9PT0gXCJmdW5jdGlvblwiKSByZXR1cm4gUmVmbGVjdC5tZXRhZGF0YShtZXRhZGF0YUtleSwgbWV0YWRhdGFWYWx1ZSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2F3YWl0ZXIodGhpc0FyZywgX2FyZ3VtZW50cywgUCwgZ2VuZXJhdG9yKSB7XHJcbiAgICBmdW5jdGlvbiBhZG9wdCh2YWx1ZSkgeyByZXR1cm4gdmFsdWUgaW5zdGFuY2VvZiBQID8gdmFsdWUgOiBuZXcgUChmdW5jdGlvbiAocmVzb2x2ZSkgeyByZXNvbHZlKHZhbHVlKTsgfSk7IH1cclxuICAgIHJldHVybiBuZXcgKFAgfHwgKFAgPSBQcm9taXNlKSkoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xyXG4gICAgICAgIGZ1bmN0aW9uIGZ1bGZpbGxlZCh2YWx1ZSkgeyB0cnkgeyBzdGVwKGdlbmVyYXRvci5uZXh0KHZhbHVlKSk7IH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpOyB9IH1cclxuICAgICAgICBmdW5jdGlvbiByZWplY3RlZCh2YWx1ZSkgeyB0cnkgeyBzdGVwKGdlbmVyYXRvcltcInRocm93XCJdKHZhbHVlKSk7IH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpOyB9IH1cclxuICAgICAgICBmdW5jdGlvbiBzdGVwKHJlc3VsdCkgeyByZXN1bHQuZG9uZSA/IHJlc29sdmUocmVzdWx0LnZhbHVlKSA6IGFkb3B0KHJlc3VsdC52YWx1ZSkudGhlbihmdWxmaWxsZWQsIHJlamVjdGVkKTsgfVxyXG4gICAgICAgIHN0ZXAoKGdlbmVyYXRvciA9IGdlbmVyYXRvci5hcHBseSh0aGlzQXJnLCBfYXJndW1lbnRzIHx8IFtdKSkubmV4dCgpKTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19nZW5lcmF0b3IodGhpc0FyZywgYm9keSkge1xyXG4gICAgdmFyIF8gPSB7IGxhYmVsOiAwLCBzZW50OiBmdW5jdGlvbigpIHsgaWYgKHRbMF0gJiAxKSB0aHJvdyB0WzFdOyByZXR1cm4gdFsxXTsgfSwgdHJ5czogW10sIG9wczogW10gfSwgZiwgeSwgdCwgZztcclxuICAgIHJldHVybiBnID0geyBuZXh0OiB2ZXJiKDApLCBcInRocm93XCI6IHZlcmIoMSksIFwicmV0dXJuXCI6IHZlcmIoMikgfSwgdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIChnW1N5bWJvbC5pdGVyYXRvcl0gPSBmdW5jdGlvbigpIHsgcmV0dXJuIHRoaXM7IH0pLCBnO1xyXG4gICAgZnVuY3Rpb24gdmVyYihuKSB7IHJldHVybiBmdW5jdGlvbiAodikgeyByZXR1cm4gc3RlcChbbiwgdl0pOyB9OyB9XHJcbiAgICBmdW5jdGlvbiBzdGVwKG9wKSB7XHJcbiAgICAgICAgaWYgKGYpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJHZW5lcmF0b3IgaXMgYWxyZWFkeSBleGVjdXRpbmcuXCIpO1xyXG4gICAgICAgIHdoaWxlIChfKSB0cnkge1xyXG4gICAgICAgICAgICBpZiAoZiA9IDEsIHkgJiYgKHQgPSBvcFswXSAmIDIgPyB5W1wicmV0dXJuXCJdIDogb3BbMF0gPyB5W1widGhyb3dcIl0gfHwgKCh0ID0geVtcInJldHVyblwiXSkgJiYgdC5jYWxsKHkpLCAwKSA6IHkubmV4dCkgJiYgISh0ID0gdC5jYWxsKHksIG9wWzFdKSkuZG9uZSkgcmV0dXJuIHQ7XHJcbiAgICAgICAgICAgIGlmICh5ID0gMCwgdCkgb3AgPSBbb3BbMF0gJiAyLCB0LnZhbHVlXTtcclxuICAgICAgICAgICAgc3dpdGNoIChvcFswXSkge1xyXG4gICAgICAgICAgICAgICAgY2FzZSAwOiBjYXNlIDE6IHQgPSBvcDsgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlIDQ6IF8ubGFiZWwrKzsgcmV0dXJuIHsgdmFsdWU6IG9wWzFdLCBkb25lOiBmYWxzZSB9O1xyXG4gICAgICAgICAgICAgICAgY2FzZSA1OiBfLmxhYmVsKys7IHkgPSBvcFsxXTsgb3AgPSBbMF07IGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgICAgY2FzZSA3OiBvcCA9IF8ub3BzLnBvcCgpOyBfLnRyeXMucG9wKCk7IGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgICAgICBpZiAoISh0ID0gXy50cnlzLCB0ID0gdC5sZW5ndGggPiAwICYmIHRbdC5sZW5ndGggLSAxXSkgJiYgKG9wWzBdID09PSA2IHx8IG9wWzBdID09PSAyKSkgeyBfID0gMDsgY29udGludWU7IH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAob3BbMF0gPT09IDMgJiYgKCF0IHx8IChvcFsxXSA+IHRbMF0gJiYgb3BbMV0gPCB0WzNdKSkpIHsgXy5sYWJlbCA9IG9wWzFdOyBicmVhazsgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChvcFswXSA9PT0gNiAmJiBfLmxhYmVsIDwgdFsxXSkgeyBfLmxhYmVsID0gdFsxXTsgdCA9IG9wOyBicmVhazsgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0ICYmIF8ubGFiZWwgPCB0WzJdKSB7IF8ubGFiZWwgPSB0WzJdOyBfLm9wcy5wdXNoKG9wKTsgYnJlYWs7IH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAodFsyXSkgXy5vcHMucG9wKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgXy50cnlzLnBvcCgpOyBjb250aW51ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBvcCA9IGJvZHkuY2FsbCh0aGlzQXJnLCBfKTtcclxuICAgICAgICB9IGNhdGNoIChlKSB7IG9wID0gWzYsIGVdOyB5ID0gMDsgfSBmaW5hbGx5IHsgZiA9IHQgPSAwOyB9XHJcbiAgICAgICAgaWYgKG9wWzBdICYgNSkgdGhyb3cgb3BbMV07IHJldHVybiB7IHZhbHVlOiBvcFswXSA/IG9wWzFdIDogdm9pZCAwLCBkb25lOiB0cnVlIH07XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCB2YXIgX19jcmVhdGVCaW5kaW5nID0gT2JqZWN0LmNyZWF0ZSA/IChmdW5jdGlvbihvLCBtLCBrLCBrMikge1xyXG4gICAgaWYgKGsyID09PSB1bmRlZmluZWQpIGsyID0gaztcclxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvLCBrMiwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGZ1bmN0aW9uKCkgeyByZXR1cm4gbVtrXTsgfSB9KTtcclxufSkgOiAoZnVuY3Rpb24obywgbSwgaywgazIpIHtcclxuICAgIGlmIChrMiA9PT0gdW5kZWZpbmVkKSBrMiA9IGs7XHJcbiAgICBvW2syXSA9IG1ba107XHJcbn0pO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fZXhwb3J0U3RhcihtLCBvKSB7XHJcbiAgICBmb3IgKHZhciBwIGluIG0pIGlmIChwICE9PSBcImRlZmF1bHRcIiAmJiAhT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG8sIHApKSBfX2NyZWF0ZUJpbmRpbmcobywgbSwgcCk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX3ZhbHVlcyhvKSB7XHJcbiAgICB2YXIgcyA9IHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiBTeW1ib2wuaXRlcmF0b3IsIG0gPSBzICYmIG9bc10sIGkgPSAwO1xyXG4gICAgaWYgKG0pIHJldHVybiBtLmNhbGwobyk7XHJcbiAgICBpZiAobyAmJiB0eXBlb2Ygby5sZW5ndGggPT09IFwibnVtYmVyXCIpIHJldHVybiB7XHJcbiAgICAgICAgbmV4dDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBpZiAobyAmJiBpID49IG8ubGVuZ3RoKSBvID0gdm9pZCAwO1xyXG4gICAgICAgICAgICByZXR1cm4geyB2YWx1ZTogbyAmJiBvW2krK10sIGRvbmU6ICFvIH07XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuICAgIHRocm93IG5ldyBUeXBlRXJyb3IocyA/IFwiT2JqZWN0IGlzIG5vdCBpdGVyYWJsZS5cIiA6IFwiU3ltYm9sLml0ZXJhdG9yIGlzIG5vdCBkZWZpbmVkLlwiKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fcmVhZChvLCBuKSB7XHJcbiAgICB2YXIgbSA9IHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiBvW1N5bWJvbC5pdGVyYXRvcl07XHJcbiAgICBpZiAoIW0pIHJldHVybiBvO1xyXG4gICAgdmFyIGkgPSBtLmNhbGwobyksIHIsIGFyID0gW10sIGU7XHJcbiAgICB0cnkge1xyXG4gICAgICAgIHdoaWxlICgobiA9PT0gdm9pZCAwIHx8IG4tLSA+IDApICYmICEociA9IGkubmV4dCgpKS5kb25lKSBhci5wdXNoKHIudmFsdWUpO1xyXG4gICAgfVxyXG4gICAgY2F0Y2ggKGVycm9yKSB7IGUgPSB7IGVycm9yOiBlcnJvciB9OyB9XHJcbiAgICBmaW5hbGx5IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBpZiAociAmJiAhci5kb25lICYmIChtID0gaVtcInJldHVyblwiXSkpIG0uY2FsbChpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZmluYWxseSB7IGlmIChlKSB0aHJvdyBlLmVycm9yOyB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gYXI7XHJcbn1cclxuXHJcbi8qKiBAZGVwcmVjYXRlZCAqL1xyXG5leHBvcnQgZnVuY3Rpb24gX19zcHJlYWQoKSB7XHJcbiAgICBmb3IgKHZhciBhciA9IFtdLCBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKylcclxuICAgICAgICBhciA9IGFyLmNvbmNhdChfX3JlYWQoYXJndW1lbnRzW2ldKSk7XHJcbiAgICByZXR1cm4gYXI7XHJcbn1cclxuXHJcbi8qKiBAZGVwcmVjYXRlZCAqL1xyXG5leHBvcnQgZnVuY3Rpb24gX19zcHJlYWRBcnJheXMoKSB7XHJcbiAgICBmb3IgKHZhciBzID0gMCwgaSA9IDAsIGlsID0gYXJndW1lbnRzLmxlbmd0aDsgaSA8IGlsOyBpKyspIHMgKz0gYXJndW1lbnRzW2ldLmxlbmd0aDtcclxuICAgIGZvciAodmFyIHIgPSBBcnJheShzKSwgayA9IDAsIGkgPSAwOyBpIDwgaWw7IGkrKylcclxuICAgICAgICBmb3IgKHZhciBhID0gYXJndW1lbnRzW2ldLCBqID0gMCwgamwgPSBhLmxlbmd0aDsgaiA8IGpsOyBqKyssIGsrKylcclxuICAgICAgICAgICAgcltrXSA9IGFbal07XHJcbiAgICByZXR1cm4gcjtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fc3ByZWFkQXJyYXkodG8sIGZyb20pIHtcclxuICAgIGZvciAodmFyIGkgPSAwLCBpbCA9IGZyb20ubGVuZ3RoLCBqID0gdG8ubGVuZ3RoOyBpIDwgaWw7IGkrKywgaisrKVxyXG4gICAgICAgIHRvW2pdID0gZnJvbVtpXTtcclxuICAgIHJldHVybiB0bztcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fYXdhaXQodikge1xyXG4gICAgcmV0dXJuIHRoaXMgaW5zdGFuY2VvZiBfX2F3YWl0ID8gKHRoaXMudiA9IHYsIHRoaXMpIDogbmV3IF9fYXdhaXQodik7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2FzeW5jR2VuZXJhdG9yKHRoaXNBcmcsIF9hcmd1bWVudHMsIGdlbmVyYXRvcikge1xyXG4gICAgaWYgKCFTeW1ib2wuYXN5bmNJdGVyYXRvcikgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlN5bWJvbC5hc3luY0l0ZXJhdG9yIGlzIG5vdCBkZWZpbmVkLlwiKTtcclxuICAgIHZhciBnID0gZ2VuZXJhdG9yLmFwcGx5KHRoaXNBcmcsIF9hcmd1bWVudHMgfHwgW10pLCBpLCBxID0gW107XHJcbiAgICByZXR1cm4gaSA9IHt9LCB2ZXJiKFwibmV4dFwiKSwgdmVyYihcInRocm93XCIpLCB2ZXJiKFwicmV0dXJuXCIpLCBpW1N5bWJvbC5hc3luY0l0ZXJhdG9yXSA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRoaXM7IH0sIGk7XHJcbiAgICBmdW5jdGlvbiB2ZXJiKG4pIHsgaWYgKGdbbl0pIGlbbl0gPSBmdW5jdGlvbiAodikgeyByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKGEsIGIpIHsgcS5wdXNoKFtuLCB2LCBhLCBiXSkgPiAxIHx8IHJlc3VtZShuLCB2KTsgfSk7IH07IH1cclxuICAgIGZ1bmN0aW9uIHJlc3VtZShuLCB2KSB7IHRyeSB7IHN0ZXAoZ1tuXSh2KSk7IH0gY2F0Y2ggKGUpIHsgc2V0dGxlKHFbMF1bM10sIGUpOyB9IH1cclxuICAgIGZ1bmN0aW9uIHN0ZXAocikgeyByLnZhbHVlIGluc3RhbmNlb2YgX19hd2FpdCA/IFByb21pc2UucmVzb2x2ZShyLnZhbHVlLnYpLnRoZW4oZnVsZmlsbCwgcmVqZWN0KSA6IHNldHRsZShxWzBdWzJdLCByKTsgfVxyXG4gICAgZnVuY3Rpb24gZnVsZmlsbCh2YWx1ZSkgeyByZXN1bWUoXCJuZXh0XCIsIHZhbHVlKTsgfVxyXG4gICAgZnVuY3Rpb24gcmVqZWN0KHZhbHVlKSB7IHJlc3VtZShcInRocm93XCIsIHZhbHVlKTsgfVxyXG4gICAgZnVuY3Rpb24gc2V0dGxlKGYsIHYpIHsgaWYgKGYodiksIHEuc2hpZnQoKSwgcS5sZW5ndGgpIHJlc3VtZShxWzBdWzBdLCBxWzBdWzFdKTsgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19hc3luY0RlbGVnYXRvcihvKSB7XHJcbiAgICB2YXIgaSwgcDtcclxuICAgIHJldHVybiBpID0ge30sIHZlcmIoXCJuZXh0XCIpLCB2ZXJiKFwidGhyb3dcIiwgZnVuY3Rpb24gKGUpIHsgdGhyb3cgZTsgfSksIHZlcmIoXCJyZXR1cm5cIiksIGlbU3ltYm9sLml0ZXJhdG9yXSA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRoaXM7IH0sIGk7XHJcbiAgICBmdW5jdGlvbiB2ZXJiKG4sIGYpIHsgaVtuXSA9IG9bbl0gPyBmdW5jdGlvbiAodikgeyByZXR1cm4gKHAgPSAhcCkgPyB7IHZhbHVlOiBfX2F3YWl0KG9bbl0odikpLCBkb25lOiBuID09PSBcInJldHVyblwiIH0gOiBmID8gZih2KSA6IHY7IH0gOiBmOyB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2FzeW5jVmFsdWVzKG8pIHtcclxuICAgIGlmICghU3ltYm9sLmFzeW5jSXRlcmF0b3IpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJTeW1ib2wuYXN5bmNJdGVyYXRvciBpcyBub3QgZGVmaW5lZC5cIik7XHJcbiAgICB2YXIgbSA9IG9bU3ltYm9sLmFzeW5jSXRlcmF0b3JdLCBpO1xyXG4gICAgcmV0dXJuIG0gPyBtLmNhbGwobykgOiAobyA9IHR5cGVvZiBfX3ZhbHVlcyA9PT0gXCJmdW5jdGlvblwiID8gX192YWx1ZXMobykgOiBvW1N5bWJvbC5pdGVyYXRvcl0oKSwgaSA9IHt9LCB2ZXJiKFwibmV4dFwiKSwgdmVyYihcInRocm93XCIpLCB2ZXJiKFwicmV0dXJuXCIpLCBpW1N5bWJvbC5hc3luY0l0ZXJhdG9yXSA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRoaXM7IH0sIGkpO1xyXG4gICAgZnVuY3Rpb24gdmVyYihuKSB7IGlbbl0gPSBvW25dICYmIGZ1bmN0aW9uICh2KSB7IHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7IHYgPSBvW25dKHYpLCBzZXR0bGUocmVzb2x2ZSwgcmVqZWN0LCB2LmRvbmUsIHYudmFsdWUpOyB9KTsgfTsgfVxyXG4gICAgZnVuY3Rpb24gc2V0dGxlKHJlc29sdmUsIHJlamVjdCwgZCwgdikgeyBQcm9taXNlLnJlc29sdmUodikudGhlbihmdW5jdGlvbih2KSB7IHJlc29sdmUoeyB2YWx1ZTogdiwgZG9uZTogZCB9KTsgfSwgcmVqZWN0KTsgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19tYWtlVGVtcGxhdGVPYmplY3QoY29va2VkLCByYXcpIHtcclxuICAgIGlmIChPYmplY3QuZGVmaW5lUHJvcGVydHkpIHsgT2JqZWN0LmRlZmluZVByb3BlcnR5KGNvb2tlZCwgXCJyYXdcIiwgeyB2YWx1ZTogcmF3IH0pOyB9IGVsc2UgeyBjb29rZWQucmF3ID0gcmF3OyB9XHJcbiAgICByZXR1cm4gY29va2VkO1xyXG59O1xyXG5cclxudmFyIF9fc2V0TW9kdWxlRGVmYXVsdCA9IE9iamVjdC5jcmVhdGUgPyAoZnVuY3Rpb24obywgdikge1xyXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG8sIFwiZGVmYXVsdFwiLCB7IGVudW1lcmFibGU6IHRydWUsIHZhbHVlOiB2IH0pO1xyXG59KSA6IGZ1bmN0aW9uKG8sIHYpIHtcclxuICAgIG9bXCJkZWZhdWx0XCJdID0gdjtcclxufTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2ltcG9ydFN0YXIobW9kKSB7XHJcbiAgICBpZiAobW9kICYmIG1vZC5fX2VzTW9kdWxlKSByZXR1cm4gbW9kO1xyXG4gICAgdmFyIHJlc3VsdCA9IHt9O1xyXG4gICAgaWYgKG1vZCAhPSBudWxsKSBmb3IgKHZhciBrIGluIG1vZCkgaWYgKGsgIT09IFwiZGVmYXVsdFwiICYmIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChtb2QsIGspKSBfX2NyZWF0ZUJpbmRpbmcocmVzdWx0LCBtb2QsIGspO1xyXG4gICAgX19zZXRNb2R1bGVEZWZhdWx0KHJlc3VsdCwgbW9kKTtcclxuICAgIHJldHVybiByZXN1bHQ7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2ltcG9ydERlZmF1bHQobW9kKSB7XHJcbiAgICByZXR1cm4gKG1vZCAmJiBtb2QuX19lc01vZHVsZSkgPyBtb2QgOiB7IGRlZmF1bHQ6IG1vZCB9O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19jbGFzc1ByaXZhdGVGaWVsZEdldChyZWNlaXZlciwgcHJpdmF0ZU1hcCkge1xyXG4gICAgaWYgKCFwcml2YXRlTWFwLmhhcyhyZWNlaXZlcikpIHtcclxuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYXR0ZW1wdGVkIHRvIGdldCBwcml2YXRlIGZpZWxkIG9uIG5vbi1pbnN0YW5jZVwiKTtcclxuICAgIH1cclxuICAgIHJldHVybiBwcml2YXRlTWFwLmdldChyZWNlaXZlcik7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2NsYXNzUHJpdmF0ZUZpZWxkU2V0KHJlY2VpdmVyLCBwcml2YXRlTWFwLCB2YWx1ZSkge1xyXG4gICAgaWYgKCFwcml2YXRlTWFwLmhhcyhyZWNlaXZlcikpIHtcclxuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYXR0ZW1wdGVkIHRvIHNldCBwcml2YXRlIGZpZWxkIG9uIG5vbi1pbnN0YW5jZVwiKTtcclxuICAgIH1cclxuICAgIHByaXZhdGVNYXAuc2V0KHJlY2VpdmVyLCB2YWx1ZSk7XHJcbiAgICByZXR1cm4gdmFsdWU7XHJcbn1cclxuIiwiaW1wb3J0IHtBcHAsIFBsdWdpblNldHRpbmdUYWIsIFNldHRpbmd9IGZyb20gJ29ic2lkaWFuJztcbmltcG9ydCBTZWFyY2hPbkludGVybmV0UGx1Z2luIGZyb20gJy4vbWFpbic7XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2VhcmNoU2V0dGluZyB7XG4gICAgdGFnczogc3RyaW5nW107XG4gICAgcXVlcnk6IHN0cmluZztcbiAgICBuYW1lOiBzdHJpbmc7XG4gICAgZW5jb2RlOiBib29sZWFuO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFNPSVNldHRpbmdzIHtcbiAgICBzZWFyY2hlczogU2VhcmNoU2V0dGluZ1tdO1xuICAgIHVzZUlmcmFtZTogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGNvbnN0IERFRkFVTFRfUVVFUlk6IFNlYXJjaFNldHRpbmcgPSB7XG4gIHRhZ3M6IFtdLFxuICBxdWVyeTogJ3t7cXVlcnl9fScsXG4gIG5hbWU6ICcnLFxuICBlbmNvZGU6IHRydWUsXG59O1xuXG5leHBvcnQgY29uc3QgREVGQVVMVF9TRVRUSU5HOiBTT0lTZXR0aW5ncyA9IHtcbiAgc2VhcmNoZXM6IFt7XG4gICAgdGFnczogW10gYXMgc3RyaW5nW10sXG4gICAgcXVlcnk6ICdodHRwczovL3d3dy5nb29nbGUuY29tL3NlYXJjaD8mcT17e3F1ZXJ5fX0nLFxuICAgIG5hbWU6ICdHb29nbGUnLFxuICAgIGVuY29kZTogdHJ1ZSxcbiAgfSBhcyBTZWFyY2hTZXR0aW5nLCB7XG4gICAgdGFnczogW10gYXMgc3RyaW5nW10sXG4gICAgcXVlcnk6ICdodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9TcGVjaWFsOlNlYXJjaC97e3F1ZXJ5fX0nLFxuICAgIG5hbWU6ICdXaWtpcGVkaWEnLFxuICAgIGVuY29kZTogdHJ1ZSxcbiAgfSBhcyBTZWFyY2hTZXR0aW5nXSxcbiAgdXNlSWZyYW1lOiB0cnVlLFxufTtcblxuY29uc3QgcGFyc2VUYWdzID0gZnVuY3Rpb24oaW5wdXRzOiBzdHJpbmcpOiBzdHJpbmdbXSB7XG4gIHJldHVybiBpbnB1dHMuc3BsaXQoJywnKVxuICAgICAgLm1hcCgocykgPT4gcy50cmltKCkpXG4gICAgICAuZmlsdGVyKChzKSA9PiAvXiMoW0EtWmEtel0pXFx3KyQvLnRlc3QocykpO1xufTtcblxuXG5leHBvcnQgY2xhc3MgU09JU2V0dGluZ1RhYiBleHRlbmRzIFBsdWdpblNldHRpbmdUYWIge1xuICAgIHBsdWdpbjogU2VhcmNoT25JbnRlcm5ldFBsdWdpbjtcblxuICAgIGNvbnN0cnVjdG9yKGFwcDogQXBwLCBwbHVnaW46IFNlYXJjaE9uSW50ZXJuZXRQbHVnaW4pIHtcbiAgICAgIHN1cGVyKGFwcCwgcGx1Z2luKTtcbiAgICAgIHRoaXMucGx1Z2luID0gcGx1Z2luO1xuICAgIH1cblxuICAgIGRpc3BsYXkoKTogdm9pZCB7XG4gICAgICBjb25zdCB7Y29udGFpbmVyRWx9ID0gdGhpcztcblxuICAgICAgY29udGFpbmVyRWwuZW1wdHkoKTtcblxuICAgICAgY29uc3QgcGx1Z2luID0gdGhpcy5wbHVnaW47XG5cbiAgICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgICAgIC5zZXROYW1lKCdPcGVuIGluIGlmcmFtZScpXG4gICAgICAgICAgLnNldERlc2MoJ0lmIHNldCB0byB0cnVlLCB0aGlzIHdpbGwgb3BlbiB5b3VyIHNlYXJjaGVzIGluIGFuIGlmcmFtZSB3aXRoaW4gT2JzaWRpYW4uICcgK1xuICAgICAgICAgICAgICAgICdPdGhlcndpc2UsIGl0IHdpbGwgb3BlbiBpbiB5b3VyIGRlZmF1bHQgYnJvd3Nlci4nKVxuICAgICAgICAgIC5hZGRUb2dnbGUoKHRvZ2dsZSkgPT4ge1xuICAgICAgICAgICAgdG9nZ2xlLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLnVzZUlmcmFtZSlcbiAgICAgICAgICAgICAgICAub25DaGFuZ2UoKG5ld192YWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MudXNlSWZyYW1lID0gbmV3X3ZhbHVlO1xuICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2F2ZURhdGEodGhpcy5wbHVnaW4uc2V0dGluZ3MpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pO1xuXG4gICAgICAvLyBDb2RlIG1vc3RseSB0YWtlbiBmcm9tIGh0dHBzOi8vZ2l0aHViLmNvbS9TaWxlbnRWb2lkMTMvVGVtcGxhdGVyL2Jsb2IvbWFzdGVyL3NyYy9zZXR0aW5ncy50c1xuICAgICAgcGx1Z2luLnNldHRpbmdzLnNlYXJjaGVzLmZvckVhY2goKHNlYXJjaCkgPT4ge1xuICAgICAgICBjb25zdCBkaXYgPSBjb250YWluZXJFbC5jcmVhdGVFbCgnZGl2Jyk7XG4gICAgICAgIGRpdi5hZGRDbGFzcygnc29pX2RpdicpO1xuXG4gICAgICAgIG5ldyBTZXR0aW5nKGRpdikvL1xuICAgICAgICAgICAgLmFkZEV4dHJhQnV0dG9uKChleHRyYSkgPT4ge1xuICAgICAgICAgICAgICBleHRyYS5zZXRJY29uKCdjcm9zcycpXG4gICAgICAgICAgICAgICAgICAuc2V0VG9vbHRpcCgnRGVsZXRlJylcbiAgICAgICAgICAgICAgICAgIC5vbkNsaWNrKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaW5kZXggPSBwbHVnaW4uc2V0dGluZ3Muc2VhcmNoZXMuaW5kZXhPZihzZWFyY2gpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChpbmRleCA+IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgcGx1Z2luLnNldHRpbmdzLnNlYXJjaGVzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICAgICAgICAgICAgLy8gRm9yY2UgcmVmcmVzaFxuICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGlzcGxheSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuYWRkVGV4dCgodGV4dCkgPT4ge1xuICAgICAgICAgICAgICByZXR1cm4gdGV4dC5zZXRQbGFjZWhvbGRlcignU2VhcmNoIG5hbWUnKVxuICAgICAgICAgICAgICAgICAgLnNldFZhbHVlKHNlYXJjaC5uYW1lKVxuICAgICAgICAgICAgICAgICAgLm9uQ2hhbmdlKChuZXdWYWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBpbmRleCA9IHBsdWdpbi5zZXR0aW5ncy5zZWFyY2hlcy5pbmRleE9mKHNlYXJjaCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpbmRleCA+IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgc2VhcmNoLm5hbWUgPSBuZXdWYWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICBwbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgICAgICAgICAgICAgICAgLy8gdGl0bGUudGV4dENvbnRlbnQgPSBuZXdWYWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KS5zZXROYW1lKCdOYW1lJylcbiAgICAgICAgICAgIC5zZXREZXNjKCdOYW1lIG9mIHRoZSBzZWFyY2guIENsaWNrIHRoZSBjcm9zcyB0byBkZWxldGUgdGhlIHNlYXJjaC4nKTtcblxuICAgICAgICBuZXcgU2V0dGluZyhkaXYpXG4gICAgICAgICAgICAuc2V0TmFtZSgnRW5jb2RlJylcbiAgICAgICAgICAgIC5zZXREZXNjKCdJZiBzZXQgdG8gdHJ1ZSwgdGhpcyB3aWxsIGVuY29kZSByYXcgdGV4dCB0byBiZSB1c2VkIGluIFVSTHMuICcgK1xuICAgICAgICAgICAgICAgICAgJ090aGVyd2lzZSwgaXQgd2lsbCBub3QgZW5jb2RlIHlvdXIgcXVlcnkuJylcbiAgICAgICAgICAgIC5hZGRUb2dnbGUoKHRvZ2dsZSkgPT4ge1xuICAgICAgICAgICAgICB0b2dnbGUuc2V0VmFsdWUoc2VhcmNoLmVuY29kZSlcbiAgICAgICAgICAgICAgICAgIC5vbkNoYW5nZSgobmV3VmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaW5kZXggPSBwbHVnaW4uc2V0dGluZ3Muc2VhcmNoZXMuaW5kZXhPZihzZWFyY2gpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgIHNlYXJjaC5lbmNvZGUgPSBuZXdWYWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICBwbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIG5ldyBTZXR0aW5nKGRpdilcbiAgICAgICAgICAgIC5hZGRUZXh0QXJlYSgodGV4dCkgPT4ge1xuICAgICAgICAgICAgICBjb25zdCB0ID0gdGV4dC5zZXRQbGFjZWhvbGRlcignU2VhcmNoIHF1ZXJ5JylcbiAgICAgICAgICAgICAgICAgIC5zZXRWYWx1ZShzZWFyY2gucXVlcnkpXG4gICAgICAgICAgICAgICAgICAub25DaGFuZ2UoKG5ld1F1ZXJ5KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGluZGV4ID0gcGx1Z2luLnNldHRpbmdzLnNlYXJjaGVzLmluZGV4T2Yoc2VhcmNoKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICBzZWFyY2gucXVlcnkgPSBuZXdRdWVyeTtcbiAgICAgICAgICAgICAgICAgICAgICBwbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICB0LmlucHV0RWwuc2V0QXR0cigncm93cycsIDIpO1xuICAgICAgICAgICAgICByZXR1cm4gdDsvL1xuICAgICAgICAgICAgfSkuc2V0TmFtZSgnVVJMJylcbiAgICAgICAgICAgIC5zZXREZXNjKCdVUkwgdG8gb3BlbiB3aGVuIGV4ZWN1dGluZyB0aGUgc2VhcmNoLiAnICtcbiAgICAgICAgICAgICAgICAnVXNlIHt7cXVlcnl9fSB0byByZWZlciB0byB0aGUgcXVlcnksIHdoaWNoIGlzIGVpdGhlciB0aGUgc2VsZWN0ZWQgdGV4dCwgb3IgdGhlIHRpdGxlIG9mIGEgbm90ZS4nKTtcbiAgICAgICAgbmV3IFNldHRpbmcoZGl2KS5hZGRUZXh0KCh0ZXh0KSA9PiB7XG4gICAgICAgICAgcmV0dXJuIHRleHQuc2V0UGxhY2Vob2xkZXIoJycpXG4gICAgICAgICAgICAgIC5zZXRWYWx1ZShzZWFyY2gudGFncy5qb2luKCcsICcpKVxuICAgICAgICAgICAgICAub25DaGFuZ2UoKG5ld1ZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgaW5kZXggPSBwbHVnaW4uc2V0dGluZ3Muc2VhcmNoZXMuaW5kZXhPZihzZWFyY2gpO1xuICAgICAgICAgICAgICAgIGlmIChpbmRleCA+IC0xKSB7XG4gICAgICAgICAgICAgICAgICBzZWFyY2gudGFncyA9IHBhcnNlVGFncyhuZXdWYWx1ZSk7XG4gICAgICAgICAgICAgICAgICBwbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfSkuc2V0TmFtZSgnVGFncycpXG4gICAgICAgICAgICAuc2V0RGVzYygnT25seSBhZGQgc2VhcmNoIHRvIG5vdGVzIHdpdGggdGhlc2UgY29tbWEtc2VwYXJhdGVkIHRhZ3MuIExlYXZlIGVtcHR5IHRvIHVzZSBhbGwgdGFncy4nKTtcbiAgICAgIH0pO1xuXG4gICAgICBjb25zdCBkaXYgPSBjb250YWluZXJFbC5jcmVhdGVFbCgnZGl2Jyk7XG4gICAgICBkaXYuYWRkQ2xhc3MoJ3NvaV9kaXYyJyk7XG5cbiAgICAgIGNvbnN0IHNldHRpbmcgPSBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgICAgICAuYWRkQnV0dG9uKChidXR0b24pID0+IHtcbiAgICAgICAgICAgIHJldHVybiBidXR0b24uc2V0QnV0dG9uVGV4dCgnQWRkIFNlYXJjaCcpLm9uQ2xpY2soKCkgPT4ge1xuICAgICAgICAgICAgICBwbHVnaW4uc2V0dGluZ3Muc2VhcmNoZXMucHVzaCh7XG4gICAgICAgICAgICAgICAgbmFtZTogJycsXG4gICAgICAgICAgICAgICAgcXVlcnk6ICcnLFxuICAgICAgICAgICAgICAgIHRhZ3M6IFtdLFxuICAgICAgICAgICAgICAgIGVuY29kZTogdHJ1ZSxcbiAgICAgICAgICAgICAgfSBhcyBTZWFyY2hTZXR0aW5nKTtcbiAgICAgICAgICAgICAgLy8gRm9yY2UgcmVmcmVzaFxuICAgICAgICAgICAgICB0aGlzLmRpc3BsYXkoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pO1xuICAgICAgc2V0dGluZy5pbmZvRWwucmVtb3ZlKCk7XG5cbiAgICAgIGRpdi5hcHBlbmRDaGlsZChjb250YWluZXJFbC5sYXN0Q2hpbGQpO1xuICAgIH1cbn1cbiIsIid1c2Ugc3RyaWN0JztcbmNvbnN0IGZzID0gcmVxdWlyZSgnZnMnKTtcblxubGV0IGlzRG9ja2VyO1xuXG5mdW5jdGlvbiBoYXNEb2NrZXJFbnYoKSB7XG5cdHRyeSB7XG5cdFx0ZnMuc3RhdFN5bmMoJy8uZG9ja2VyZW52Jyk7XG5cdFx0cmV0dXJuIHRydWU7XG5cdH0gY2F0Y2ggKF8pIHtcblx0XHRyZXR1cm4gZmFsc2U7XG5cdH1cbn1cblxuZnVuY3Rpb24gaGFzRG9ja2VyQ0dyb3VwKCkge1xuXHR0cnkge1xuXHRcdHJldHVybiBmcy5yZWFkRmlsZVN5bmMoJy9wcm9jL3NlbGYvY2dyb3VwJywgJ3V0ZjgnKS5pbmNsdWRlcygnZG9ja2VyJyk7XG5cdH0gY2F0Y2ggKF8pIHtcblx0XHRyZXR1cm4gZmFsc2U7XG5cdH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSAoKSA9PiB7XG5cdGlmIChpc0RvY2tlciA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0aXNEb2NrZXIgPSBoYXNEb2NrZXJFbnYoKSB8fCBoYXNEb2NrZXJDR3JvdXAoKTtcblx0fVxuXG5cdHJldHVybiBpc0RvY2tlcjtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5jb25zdCBvcyA9IHJlcXVpcmUoJ29zJyk7XG5jb25zdCBmcyA9IHJlcXVpcmUoJ2ZzJyk7XG5jb25zdCBpc0RvY2tlciA9IHJlcXVpcmUoJ2lzLWRvY2tlcicpO1xuXG5jb25zdCBpc1dzbCA9ICgpID0+IHtcblx0aWYgKHByb2Nlc3MucGxhdGZvcm0gIT09ICdsaW51eCcpIHtcblx0XHRyZXR1cm4gZmFsc2U7XG5cdH1cblxuXHRpZiAob3MucmVsZWFzZSgpLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoJ21pY3Jvc29mdCcpKSB7XG5cdFx0aWYgKGlzRG9ja2VyKCkpIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHRyZXR1cm4gdHJ1ZTtcblx0fVxuXG5cdHRyeSB7XG5cdFx0cmV0dXJuIGZzLnJlYWRGaWxlU3luYygnL3Byb2MvdmVyc2lvbicsICd1dGY4JykudG9Mb3dlckNhc2UoKS5pbmNsdWRlcygnbWljcm9zb2Z0JykgP1xuXHRcdFx0IWlzRG9ja2VyKCkgOiBmYWxzZTtcblx0fSBjYXRjaCAoXykge1xuXHRcdHJldHVybiBmYWxzZTtcblx0fVxufTtcblxuaWYgKHByb2Nlc3MuZW52Ll9fSVNfV1NMX1RFU1RfXykge1xuXHRtb2R1bGUuZXhwb3J0cyA9IGlzV3NsO1xufSBlbHNlIHtcblx0bW9kdWxlLmV4cG9ydHMgPSBpc1dzbCgpO1xufVxuIiwiJ3VzZSBzdHJpY3QnO1xuY29uc3Qge3Byb21pc2lmeX0gPSByZXF1aXJlKCd1dGlsJyk7XG5jb25zdCBwYXRoID0gcmVxdWlyZSgncGF0aCcpO1xuY29uc3QgY2hpbGRQcm9jZXNzID0gcmVxdWlyZSgnY2hpbGRfcHJvY2VzcycpO1xuY29uc3QgZnMgPSByZXF1aXJlKCdmcycpO1xuY29uc3QgaXNXc2wgPSByZXF1aXJlKCdpcy13c2wnKTtcbmNvbnN0IGlzRG9ja2VyID0gcmVxdWlyZSgnaXMtZG9ja2VyJyk7XG5cbmNvbnN0IHBBY2Nlc3MgPSBwcm9taXNpZnkoZnMuYWNjZXNzKTtcblxuLy8gUGF0aCB0byBpbmNsdWRlZCBgeGRnLW9wZW5gLlxuY29uc3QgbG9jYWxYZGdPcGVuUGF0aCA9IHBhdGguam9pbihfX2Rpcm5hbWUsICd4ZGctb3BlbicpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGFzeW5jICh0YXJnZXQsIG9wdGlvbnMpID0+IHtcblx0aWYgKHR5cGVvZiB0YXJnZXQgIT09ICdzdHJpbmcnKSB7XG5cdFx0dGhyb3cgbmV3IFR5cGVFcnJvcignRXhwZWN0ZWQgYSBgdGFyZ2V0YCcpO1xuXHR9XG5cblx0b3B0aW9ucyA9IHtcblx0XHR3YWl0OiBmYWxzZSxcblx0XHRiYWNrZ3JvdW5kOiBmYWxzZSxcblx0XHRhbGxvd05vbnplcm9FeGl0Q29kZTogZmFsc2UsXG5cdFx0Li4ub3B0aW9uc1xuXHR9O1xuXG5cdGxldCBjb21tYW5kO1xuXHRsZXQge2FwcH0gPSBvcHRpb25zO1xuXHRsZXQgYXBwQXJndW1lbnRzID0gW107XG5cdGNvbnN0IGNsaUFyZ3VtZW50cyA9IFtdO1xuXHRjb25zdCBjaGlsZFByb2Nlc3NPcHRpb25zID0ge307XG5cblx0aWYgKEFycmF5LmlzQXJyYXkoYXBwKSkge1xuXHRcdGFwcEFyZ3VtZW50cyA9IGFwcC5zbGljZSgxKTtcblx0XHRhcHAgPSBhcHBbMF07XG5cdH1cblxuXHRpZiAocHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ2RhcndpbicpIHtcblx0XHRjb21tYW5kID0gJ29wZW4nO1xuXG5cdFx0aWYgKG9wdGlvbnMud2FpdCkge1xuXHRcdFx0Y2xpQXJndW1lbnRzLnB1c2goJy0td2FpdC1hcHBzJyk7XG5cdFx0fVxuXG5cdFx0aWYgKG9wdGlvbnMuYmFja2dyb3VuZCkge1xuXHRcdFx0Y2xpQXJndW1lbnRzLnB1c2goJy0tYmFja2dyb3VuZCcpO1xuXHRcdH1cblxuXHRcdGlmIChhcHApIHtcblx0XHRcdGNsaUFyZ3VtZW50cy5wdXNoKCctYScsIGFwcCk7XG5cdFx0fVxuXHR9IGVsc2UgaWYgKHByb2Nlc3MucGxhdGZvcm0gPT09ICd3aW4zMicgfHwgKGlzV3NsICYmICFpc0RvY2tlcigpKSkge1xuXHRcdGNvbW1hbmQgPSBpc1dzbCA/XG5cdFx0XHQnL21udC9jL1dpbmRvd3MvU3lzdGVtMzIvV2luZG93c1Bvd2VyU2hlbGwvdjEuMC9wb3dlcnNoZWxsLmV4ZScgOlxuXHRcdFx0YCR7cHJvY2Vzcy5lbnYuU1lTVEVNUk9PVH1cXFxcU3lzdGVtMzJcXFxcV2luZG93c1Bvd2VyU2hlbGxcXFxcdjEuMFxcXFxwb3dlcnNoZWxsYDtcblxuXHRcdGNsaUFyZ3VtZW50cy5wdXNoKFxuXHRcdFx0Jy1Ob1Byb2ZpbGUnLFxuXHRcdFx0Jy1Ob25JbnRlcmFjdGl2ZScsXG5cdFx0XHQn4oCTRXhlY3V0aW9uUG9saWN5Jyxcblx0XHRcdCdCeXBhc3MnLFxuXHRcdFx0Jy1FbmNvZGVkQ29tbWFuZCdcblx0XHQpO1xuXG5cdFx0aWYgKCFpc1dzbCkge1xuXHRcdFx0Y2hpbGRQcm9jZXNzT3B0aW9ucy53aW5kb3dzVmVyYmF0aW1Bcmd1bWVudHMgPSB0cnVlO1xuXHRcdH1cblxuXHRcdGNvbnN0IGVuY29kZWRBcmd1bWVudHMgPSBbJ1N0YXJ0J107XG5cblx0XHRpZiAob3B0aW9ucy53YWl0KSB7XG5cdFx0XHRlbmNvZGVkQXJndW1lbnRzLnB1c2goJy1XYWl0Jyk7XG5cdFx0fVxuXG5cdFx0aWYgKGFwcCkge1xuXHRcdFx0Ly8gRG91YmxlIHF1b3RlIHdpdGggZG91YmxlIHF1b3RlcyB0byBlbnN1cmUgdGhlIGlubmVyIHF1b3RlcyBhcmUgcGFzc2VkIHRocm91Z2guXG5cdFx0XHQvLyBJbm5lciBxdW90ZXMgYXJlIGRlbGltaXRlZCBmb3IgUG93ZXJTaGVsbCBpbnRlcnByZXRhdGlvbiB3aXRoIGJhY2t0aWNrcy5cblx0XHRcdGVuY29kZWRBcmd1bWVudHMucHVzaChgXCJcXGBcIiR7YXBwfVxcYFwiXCJgLCAnLUFyZ3VtZW50TGlzdCcpO1xuXHRcdFx0YXBwQXJndW1lbnRzLnVuc2hpZnQodGFyZ2V0KTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0ZW5jb2RlZEFyZ3VtZW50cy5wdXNoKGBcIlxcYFwiJHt0YXJnZXR9XFxgXCJcImApO1xuXHRcdH1cblxuXHRcdGlmIChhcHBBcmd1bWVudHMubGVuZ3RoID4gMCkge1xuXHRcdFx0YXBwQXJndW1lbnRzID0gYXBwQXJndW1lbnRzLm1hcChhcmcgPT4gYFwiXFxgXCIke2FyZ31cXGBcIlwiYCk7XG5cdFx0XHRlbmNvZGVkQXJndW1lbnRzLnB1c2goYXBwQXJndW1lbnRzLmpvaW4oJywnKSk7XG5cdFx0fVxuXG5cdFx0Ly8gVXNpbmcgQmFzZTY0LWVuY29kZWQgY29tbWFuZCwgYWNjZXB0ZWQgYnkgUG93ZXJTaGVsbCwgdG8gYWxsb3cgc3BlY2lhbCBjaGFyYWN0ZXJzLlxuXHRcdHRhcmdldCA9IEJ1ZmZlci5mcm9tKGVuY29kZWRBcmd1bWVudHMuam9pbignICcpLCAndXRmMTZsZScpLnRvU3RyaW5nKCdiYXNlNjQnKTtcblx0fSBlbHNlIHtcblx0XHRpZiAoYXBwKSB7XG5cdFx0XHRjb21tYW5kID0gYXBwO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHQvLyBXaGVuIGJ1bmRsZWQgYnkgV2VicGFjaywgdGhlcmUncyBubyBhY3R1YWwgcGFja2FnZSBmaWxlIHBhdGggYW5kIG5vIGxvY2FsIGB4ZGctb3BlbmAuXG5cdFx0XHRjb25zdCBpc0J1bmRsZWQgPSAhX19kaXJuYW1lIHx8IF9fZGlybmFtZSA9PT0gJy8nO1xuXG5cdFx0XHQvLyBDaGVjayBpZiBsb2NhbCBgeGRnLW9wZW5gIGV4aXN0cyBhbmQgaXMgZXhlY3V0YWJsZS5cblx0XHRcdGxldCBleGVMb2NhbFhkZ09wZW4gPSBmYWxzZTtcblx0XHRcdHRyeSB7XG5cdFx0XHRcdGF3YWl0IHBBY2Nlc3MobG9jYWxYZGdPcGVuUGF0aCwgZnMuY29uc3RhbnRzLlhfT0spO1xuXHRcdFx0XHRleGVMb2NhbFhkZ09wZW4gPSB0cnVlO1xuXHRcdFx0fSBjYXRjaCAoXykge31cblxuXHRcdFx0Y29uc3QgdXNlU3lzdGVtWGRnT3BlbiA9IHByb2Nlc3MudmVyc2lvbnMuZWxlY3Ryb24gfHxcblx0XHRcdFx0cHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ2FuZHJvaWQnIHx8IGlzQnVuZGxlZCB8fCAhZXhlTG9jYWxYZGdPcGVuO1xuXHRcdFx0Y29tbWFuZCA9IHVzZVN5c3RlbVhkZ09wZW4gPyAneGRnLW9wZW4nIDogbG9jYWxYZGdPcGVuUGF0aDtcblx0XHR9XG5cblx0XHRpZiAoYXBwQXJndW1lbnRzLmxlbmd0aCA+IDApIHtcblx0XHRcdGNsaUFyZ3VtZW50cy5wdXNoKC4uLmFwcEFyZ3VtZW50cyk7XG5cdFx0fVxuXG5cdFx0aWYgKCFvcHRpb25zLndhaXQpIHtcblx0XHRcdC8vIGB4ZGctb3BlbmAgd2lsbCBibG9jayB0aGUgcHJvY2VzcyB1bmxlc3Mgc3RkaW8gaXMgaWdub3JlZFxuXHRcdFx0Ly8gYW5kIGl0J3MgZGV0YWNoZWQgZnJvbSB0aGUgcGFyZW50IGV2ZW4gaWYgaXQncyB1bnJlZidkLlxuXHRcdFx0Y2hpbGRQcm9jZXNzT3B0aW9ucy5zdGRpbyA9ICdpZ25vcmUnO1xuXHRcdFx0Y2hpbGRQcm9jZXNzT3B0aW9ucy5kZXRhY2hlZCA9IHRydWU7XG5cdFx0fVxuXHR9XG5cblx0Y2xpQXJndW1lbnRzLnB1c2godGFyZ2V0KTtcblxuXHRpZiAocHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ2RhcndpbicgJiYgYXBwQXJndW1lbnRzLmxlbmd0aCA+IDApIHtcblx0XHRjbGlBcmd1bWVudHMucHVzaCgnLS1hcmdzJywgLi4uYXBwQXJndW1lbnRzKTtcblx0fVxuXG5cdGNvbnN0IHN1YnByb2Nlc3MgPSBjaGlsZFByb2Nlc3Muc3Bhd24oY29tbWFuZCwgY2xpQXJndW1lbnRzLCBjaGlsZFByb2Nlc3NPcHRpb25zKTtcblxuXHRpZiAob3B0aW9ucy53YWl0KSB7XG5cdFx0cmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblx0XHRcdHN1YnByb2Nlc3Mub25jZSgnZXJyb3InLCByZWplY3QpO1xuXG5cdFx0XHRzdWJwcm9jZXNzLm9uY2UoJ2Nsb3NlJywgZXhpdENvZGUgPT4ge1xuXHRcdFx0XHRpZiAob3B0aW9ucy5hbGxvd05vbnplcm9FeGl0Q29kZSAmJiBleGl0Q29kZSA+IDApIHtcblx0XHRcdFx0XHRyZWplY3QobmV3IEVycm9yKGBFeGl0ZWQgd2l0aCBjb2RlICR7ZXhpdENvZGV9YCkpO1xuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHJlc29sdmUoc3VicHJvY2Vzcyk7XG5cdFx0XHR9KTtcblx0XHR9KTtcblx0fVxuXG5cdHN1YnByb2Nlc3MudW5yZWYoKTtcblxuXHRyZXR1cm4gc3VicHJvY2Vzcztcbn07XG4iLCJpbXBvcnQge0FwcCwgRnV6enlNYXRjaCwgRnV6enlTdWdnZXN0TW9kYWwsIE1vZGFsfSBmcm9tICdvYnNpZGlhbic7XG5pbXBvcnQge1NlYXJjaFNldHRpbmd9IGZyb20gJy4vc2V0dGluZ3MnO1xuaW1wb3J0IFNlYXJjaE9uSW50ZXJuZXRQbHVnaW4gZnJvbSAnLi9tYWluJztcblxuXG5leHBvcnQgY2xhc3MgU2VhcmNoTW9kYWwgZXh0ZW5kcyBGdXp6eVN1Z2dlc3RNb2RhbDxTZWFyY2hTZXR0aW5nPiB7XG4gIHBsdWdpbjogU2VhcmNoT25JbnRlcm5ldFBsdWdpbjtcbiAgcXVlcnk6IHN0cmluZztcbiAgY29uc3RydWN0b3IoYXBwOiBBcHAsIHBsdWdpbjogU2VhcmNoT25JbnRlcm5ldFBsdWdpbiwgcXVlcnk6IHN0cmluZykge1xuICAgIHN1cGVyKGFwcCk7XG4gICAgdGhpcy5wbHVnaW4gPSBwbHVnaW47XG4gICAgdGhpcy5zZXRQbGFjZWhvbGRlcignJyk7XG4gICAgdGhpcy5xdWVyeSA9IHF1ZXJ5O1xuICAgICcke3RoaXMucXVlcnl9JztcbiAgICB0aGlzLnNldEluc3RydWN0aW9ucyhbe2NvbW1hbmQ6ICfihpHihpMnLCBwdXJwb3NlOiAndG8gbmF2aWdhdGUnfSxcbiAgICAgIHtjb21tYW5kOiAn4oa1JywgcHVycG9zZTogYHRvIHNlYXJjaCAke3RoaXMucXVlcnl9YH0sXG4gICAgICB7Y29tbWFuZDogJ2VzYycsIHB1cnBvc2U6ICd0byBkaXNtaXNzJ31dKTtcbiAgfVxuXG4gIG9uT3BlbigpIHtcbiAgICBzdXBlci5vbk9wZW4oKTtcbiAgICAvLyBjb25zdCB7Y29udGVudEVsfSA9IHRoaXM7XG4gICAgdGhpcy5pbnB1dEVsLmZvY3VzKCk7XG4gIH1cblxuICBvbkNsb3NlKCkge1xuICAgIHN1cGVyLm9uQ2xvc2UoKTtcbiAgICBjb25zdCB7Y29udGVudEVsfSA9IHRoaXM7XG4gICAgY29udGVudEVsLmVtcHR5KCk7XG4gIH1cblxuXG4gIGdldEl0ZW1UZXh0KGl0ZW06IFNlYXJjaFNldHRpbmcpOiBzdHJpbmcge1xuICAgIHJldHVybiBpdGVtLm5hbWU7XG4gIH1cblxuICByZW5kZXJTdWdnZXN0aW9uKGl0ZW06IEZ1enp5TWF0Y2g8U2VhcmNoU2V0dGluZz4sIGVsOiBIVE1MRWxlbWVudCkge1xuICAgIHN1cGVyLnJlbmRlclN1Z2dlc3Rpb24oaXRlbSwgZWwpO1xuICAgIGVsLmlubmVySFRNTCA9IGBTZWFyY2ggb246IGAgKyBlbC5pbm5lckhUTUw7XG4gIH1cblxuICBnZXRJdGVtcygpOiBTZWFyY2hTZXR0aW5nW10ge1xuICAgIHJldHVybiB0aGlzLnBsdWdpbi5zZXR0aW5ncy5zZWFyY2hlcztcbiAgfVxuXG4gIG9uQ2hvb3NlSXRlbShpdGVtOiBTZWFyY2hTZXR0aW5nLCBldnQ6IE1vdXNlRXZlbnQgfCBLZXlib2FyZEV2ZW50KTogdm9pZCB7XG4gICAgdGhpcy5wbHVnaW4ub3BlblNlYXJjaChpdGVtLCB0aGlzLnF1ZXJ5KTtcbiAgfVxufVxuIiwiaW1wb3J0IHtJdGVtVmlldywgV29ya3NwYWNlTGVhZn0gZnJvbSAnb2JzaWRpYW4nO1xuaW1wb3J0IFNlYXJjaE9uSW50ZXJuZXRQbHVnaW4gZnJvbSAnLi9tYWluJztcblxuZXhwb3J0IGNsYXNzIFNlYXJjaFZpZXcgZXh0ZW5kcyBJdGVtVmlldyB7XG4gICAgcXVlcnk6IHN0cmluZztcbiAgICBzaXRlOiBzdHJpbmc7XG4gICAgdXJsOiBzdHJpbmc7XG4gICAgcGx1Z2luOiBTZWFyY2hPbkludGVybmV0UGx1Z2luO1xuXG4gICAgZnJhbWU6IEhUTUxFbGVtZW50O1xuXG4gICAgY29uc3RydWN0b3IocGx1Z2luOiBTZWFyY2hPbkludGVybmV0UGx1Z2luLCBsZWFmOiBXb3Jrc3BhY2VMZWFmLCBxdWVyeTogc3RyaW5nLCBzaXRlOiBzdHJpbmcsIHVybDogc3RyaW5nKSB7XG4gICAgICBzdXBlcihsZWFmKTtcbiAgICAgIHRoaXMucXVlcnk9IHF1ZXJ5O1xuICAgICAgdGhpcy5zaXRlID0gc2l0ZTtcbiAgICAgIHRoaXMudXJsID0gdXJsO1xuICAgICAgdGhpcy5wbHVnaW4gPSBwbHVnaW47XG4gICAgfVxuXG4gICAgYXN5bmMgb25PcGVuKCkge1xuICAgICAgdGhpcy5mcmFtZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lmcmFtZScpO1xuICAgICAgdGhpcy5mcmFtZS5hZGRDbGFzcyhgc29pLXNpdGVgKTtcbiAgICAgIHRoaXMuZnJhbWUuc2V0QXR0cignc3R5bGUnLCAnaGVpZ2h0OiAxMDAlOyB3aWR0aDoxMDAlJyk7XG4gICAgICB0aGlzLmZyYW1lLnNldEF0dHIoJ3NyYycsIHRoaXMudXJsKTtcbiAgICAgIHRoaXMuZnJhbWUuc2V0QXR0cigndGFiaW5kZXgnLCAnMCcpO1xuICAgICAgdGhpcy5jb250YWluZXJFbC5jaGlsZHJlblsxXS5hcHBlbmRDaGlsZCh0aGlzLmZyYW1lKTtcblxuXG4gICAgICAvLyBUdXJucyBvdXQgSUZyYW1lcyBhcmUgdmVyeSBoYXJkIHRvIGNvbnRyb2wgdGhlIGNvbnRleHRtZW51IG9mLiBTbyBsZWF2aW5nIHRoaXMgZm9yIG5vdyFcbiAgICAgIC8vIHRoaXMuZnJhbWUuYWRkRXZlbnRMaXN0ZW5lcignY29udGV4dG1lbnUnLCAoZSkgPT4ge1xuICAgICAgLy8gICBjb25zb2xlLmxvZygnYXNkZicpO1xuICAgICAgLy8gICB0aGlzLnBsdWdpbi5oYW5kbGVDb250ZXh0KGUsIHRoaXMpO1xuICAgICAgLy8gfSk7XG4gICAgfVxuXG4gICAgZ2V0RGlzcGxheVRleHQoKTogc3RyaW5nIHtcbiAgICAgIHJldHVybiBgJHt0aGlzLnNpdGV9OiAke3RoaXMucXVlcnl9YDtcbiAgICB9XG5cbiAgICBnZXRWaWV3VHlwZSgpOiBzdHJpbmcge1xuICAgICAgcmV0dXJuICdTZWFyY2ggb24gSW50ZXJuZXQnO1xuICAgIH1cbn1cbiIsImltcG9ydCB7RXZlbnRSZWYsIE1hcmtkb3duUHJldmlld1ZpZXcsIE1hcmtkb3duVmlldywgTWVudSwgUGx1Z2luLCBURmlsZX0gZnJvbSAnb2JzaWRpYW4nO1xuaW1wb3J0IHtTT0lTZXR0aW5nVGFiLCBTT0lTZXR0aW5ncywgREVGQVVMVF9TRVRUSU5HLCBTZWFyY2hTZXR0aW5nLCBERUZBVUxUX1FVRVJZfSBmcm9tICcuL3NldHRpbmdzJztcbmltcG9ydCBvcGVuIGZyb20gJ29wZW4nO1xuaW1wb3J0IHtTZWFyY2hNb2RhbH0gZnJvbSAnLi9tb2RhbCc7XG5pbXBvcnQge1NlYXJjaFZpZXd9IGZyb20gJy4vdmlldyc7XG5cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgU2VhcmNoT25JbnRlcm5ldFBsdWdpbiBleHRlbmRzIFBsdWdpbiB7XG4gICAgc2V0dGluZ3M6IFNPSVNldHRpbmdzO1xuICAgIG9uRG9tOiBhbnk7XG4gICAgb25Eb21TZXR0aW5nczogYW55O1xuXG4gICAgYXN5bmMgb25sb2FkKCkge1xuICAgICAgY29uc29sZS5sb2coJ2xvYWRpbmcgc2VhcmNoLW9uLWludGVybmV0Jyk7XG5cbiAgICAgIGF3YWl0IHRoaXMubG9hZFNldHRpbmdzKCk7XG5cbiAgICAgIHRoaXMuYWRkU2V0dGluZ1RhYihuZXcgU09JU2V0dGluZ1RhYih0aGlzLmFwcCwgdGhpcykpO1xuICAgICAgY29uc3QgcGx1Z2luID0gdGhpcztcbiAgICAgIHRoaXMucmVnaXN0ZXJFdmVudChcbiAgICAgICAgICB0aGlzLmFwcC53b3Jrc3BhY2Uub24oJ2ZpbGUtbWVudScsIChtZW51LCBmaWxlOiBURmlsZSwgc291cmNlOnN0cmluZykgPT4ge1xuICAgICAgICAgICAgaWYgKGZpbGUgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgZmlsZVRhZ3MgPSB0aGlzLmFwcC5tZXRhZGF0YUNhY2hlLmdldEZpbGVDYWNoZShmaWxlKVxuICAgICAgICAgICAgICAgID8udGFncz8ubWFwKCh0KSA9PiB0LnRhZyk7XG4gICAgICAgICAgICB0aGlzLnNldHRpbmdzLnNlYXJjaGVzLmZvckVhY2goKHNlYXJjaCkgPT4ge1xuICAgICAgICAgICAgICBpZiAoc2VhcmNoLnRhZ3MubGVuZ3RoID09PSAwIHx8XG4gICAgICAgICAgICAgIGZpbGVUYWdzPy5zb21lKCh0KSA9PiBzZWFyY2gudGFncy5jb250YWlucyh0KSkpIHtcbiAgICAgICAgICAgICAgICBtZW51LmFkZEl0ZW0oKGl0ZW0pID0+IHtcbiAgICAgICAgICAgICAgICAgIGl0ZW0uc2V0VGl0bGUoYFNlYXJjaCAke3NlYXJjaC5uYW1lfWApLnNldEljb24oJ3NlYXJjaCcpXG4gICAgICAgICAgICAgICAgICAgICAgLm9uQ2xpY2soKGV2dCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgcGx1Z2luLm9wZW5TZWFyY2goc2VhcmNoLCBmaWxlLmJhc2VuYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSkpO1xuXG4gICAgICB0aGlzLmFkZENvbW1hbmQoe1xuICAgICAgICBpZDogJ3NlYXJjaC1vbi1pbnRlcm5ldCcsXG4gICAgICAgIG5hbWU6ICdQZXJmb3JtIHNlYXJjaCcsXG4gICAgICAgIGNhbGxiYWNrOiAoKSA9PiB7XG4gICAgICAgICAgbGV0IHF1ZXJ5ID0gdGhpcy5nZXRTZWxlY3RlZFRleHQoKTtcblxuICAgICAgICAgIGlmIChxdWVyeSA9PT0gbnVsbCB8fCBxdWVyeSA9PT0gJycpIHtcbiAgICAgICAgICAgIGNvbnN0IGFjdGl2ZVZpZXcgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlVmlld09mVHlwZShNYXJrZG93blZpZXcpO1xuICAgICAgICAgICAgaWYgKGFjdGl2ZVZpZXcgPT0gbnVsbCkge1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBxdWVyeSA9IGFjdGl2ZVZpZXcuZ2V0RGlzcGxheVRleHQoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29uc3QgbW9kYWwgPSBuZXcgU2VhcmNoTW9kYWwocGx1Z2luLmFwcCwgcGx1Z2luLCBxdWVyeSk7XG4gICAgICAgICAgbW9kYWwub3BlbigpO1xuICAgICAgICB9LFxuICAgICAgfSk7XG5cbiAgICAgIC8vIENoYW5naW5nIHRoZSBjb250ZXh0IG1lbnUgaXMgYSBiaXQgcHJvYmxlbWF0aWM6XG4gICAgICAvLyBPYnNpZGlhbiBzb21ldGltZXMgdXNlcyBpdHMgb3duIGNvbnRleHQgbWVudSwgZWcgd2hlbiByaWdodC1jbGlja2luZ1xuICAgICAgLy8gb24gaW50ZXJuYWwgbGluay4gQnV0IG90aGVyIHRpbWVzLCBpdCdzIGEgY29udGV4dCBtZW51IHRoYXRcbiAgICAgIC8vIGNhbm5vdCByZWFsbHkgYmUgZWRpdGVkIGVhc2lseS4gSXQgd291bGQgYmUgbmljZSBpZiBPYnNpZGlhblxuICAgICAgLy8gcHJvdmlkZWQgaXRzIG93biBjb250ZXh0IG1lbnUgZXZlcnl3aGVyZSB0byBob29rIGludG8uXG4gICAgICB0aGlzLnJlZ2lzdGVyQ29kZU1pcnJvcigoY20pID0+IHtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBjbS5yZXNldFNlbGVjdGlvbk9uQ29udGV4dE1lbnU9ZmFsc2U7XG4gICAgICAgIGNtLm9uKCdjb250ZXh0bWVudScsIChlZGl0b3IsIGV2ZW50KT0+e1xuICAgICAgICAgIHBsdWdpbi5oYW5kbGVDb250ZXh0KGV2ZW50KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICAgIHRoaXMub25Eb20gPSBmdW5jdGlvbihldmVudDogTW91c2VFdmVudCkge1xuICAgICAgICBwbHVnaW4uaGFuZGxlQ29udGV4dChldmVudCk7XG4gICAgICB9O1xuICAgICAgdGhpcy5vbkRvbVNldHRpbmdzID0ge307XG4gICAgICBkb2N1bWVudC5vbignY29udGV4dG1lbnUnLCAnLm1hcmtkb3duLXByZXZpZXctdmlldycsIHRoaXMub25Eb20sIHRoaXMub25Eb21TZXR0aW5ncyk7XG4gICAgfVxuXG4gICAgZ2V0U2VsZWN0ZWRUZXh0KCk6IHN0cmluZyB7XG4gICAgICBjb25zdCB3U2VsZWN0aW9uID0gd2luZG93LmdldFNlbGVjdGlvbigpO1xuICAgICAgY29uc3QgZG9jU2VsZWN0aW9uID0gZG9jdW1lbnQ/LmdldFNlbGVjdGlvbigpO1xuICAgICAgaWYgKHdTZWxlY3Rpb24pIHtcbiAgICAgICAgcmV0dXJuIHdTZWxlY3Rpb24udG9TdHJpbmcoKTtcbiAgICAgIH0gZWxzZSBpZiAoZG9jdW1lbnQgJiYgZG9jU2VsZWN0aW9uLnR5cGUgIT0gJ0NvbnRyb2wnKSB7XG4gICAgICAgIHJldHVybiBkb2NTZWxlY3Rpb24udG9TdHJpbmcoKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGFzeW5jIGhhbmRsZUNvbnRleHQoZTogTW91c2VFdmVudCwgYWN0aXZlVmlldzogU2VhcmNoVmlldz1udWxsKSB7XG4gICAgICBjb25zdCBmaWxlTWVudSA9IG5ldyBNZW51KCk7XG4gICAgICBsZXQgb25VcmwgPSBmYWxzZTtcbiAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgIGZpbGVNZW51LmRvbS5jbGFzc0xpc3QuYWRkKCdzb2ktZmlsZS1tZW51Jyk7XG4gICAgICBpZiAoZS50YXJnZXQpIHtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBjb25zdCBjbGFzc2VzOiBET01Ub2tlbkxpc3QgPSBlLnRhcmdldC5jbGFzc0xpc3Q7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgaWYgKGNsYXNzZXMuY29udGFpbnMoJ2NtLXVybCcpIHx8IGNsYXNzZXMuY29udGFpbnMoJ2V4dGVybmFsLWxpbmsnKSkge1xuICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICBjb25zdCB1cmwgPSBjbGFzc2VzLmNvbnRhaW5zKCdjbS11cmwnKSA/IGUudGFyZ2V0LnRleHRDb250ZW50IDogZS50YXJnZXQuaHJlZjtcbiAgICAgICAgICBvblVybCA9IHRydWU7XG4gICAgICAgICAgZmlsZU1lbnUuYWRkSXRlbSgoaXRlbSkgPT4ge1xuICAgICAgICAgICAgaXRlbS5zZXRUaXRsZShgT3BlbiBpbiBpZnJhbWVgKS5zZXRJY29uKCdsaW5rJylcbiAgICAgICAgICAgICAgICAub25DbGljaygoZXZ0KSA9PiB7XG4gICAgICAgICAgICAgICAgICB0aGlzLm9wZW5TZWFyY2goe1xuICAgICAgICAgICAgICAgICAgICB0YWdzOiBbXSxcbiAgICAgICAgICAgICAgICAgICAgcXVlcnk6ICd7e3F1ZXJ5fX0nLFxuICAgICAgICAgICAgICAgICAgICBuYW1lOiAnJyxcbiAgICAgICAgICAgICAgICAgICAgZW5jb2RlOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgICAgICAgIH0sIHVybCwgYWN0aXZlVmlldyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGNvbnN0IHF1ZXJ5ID0gdGhpcy5nZXRTZWxlY3RlZFRleHQoKTtcbiAgICAgIGNvbnN0IGhhc1NlbGVjdGlvbiA9ICEocXVlcnkgPT09IG51bGwgfHwgcXVlcnkgPT09ICcnKTtcbiAgICAgIGlmICghb25VcmwgJiYgIWhhc1NlbGVjdGlvbikge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBpZiAoaGFzU2VsZWN0aW9uKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKHF1ZXJ5KTtcbiAgICAgICAgZm9yIChjb25zdCBzZXR0aW5nIG9mIHRoaXMuc2V0dGluZ3Muc2VhcmNoZXMpIHtcbiAgICAgICAgICBmaWxlTWVudS5hZGRJdGVtKChpdGVtKSA9PiB7XG4gICAgICAgICAgICBpdGVtLnNldFRpdGxlKGBTZWFyY2ggJHtzZXR0aW5nLm5hbWV9YCkuc2V0SWNvbignc2VhcmNoJylcbiAgICAgICAgICAgICAgICAub25DbGljaygoZXZ0KSA9PiB7XG4gICAgICAgICAgICAgICAgICB0aGlzLm9wZW5TZWFyY2goc2V0dGluZywgcXVlcnksIGFjdGl2ZVZpZXcpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBmaWxlTWVudS5zaG93QXRQb3NpdGlvbih7eDogZS54LCB5OiBlLnl9KTtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICB9XG5cbiAgICBhc3luYyBvcGVuU2VhcmNoKHNlYXJjaDogU2VhcmNoU2V0dGluZywgcXVlcnk6IHN0cmluZywgYWN0aXZlVmlldzogU2VhcmNoVmlldz1udWxsKSB7XG4gICAgICBsZXQgZW5jb2RlZFF1ZXJ5ID1xdWVyeTtcbiAgICAgIGlmIChzZWFyY2guZW5jb2RlKSB7XG4gICAgICAgIGVuY29kZWRRdWVyeT0gZW5jb2RlVVJJQ29tcG9uZW50KHF1ZXJ5KTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHVybCA9IHNlYXJjaC5xdWVyeS5yZXBsYWNlKCd7e3RpdGxlfX0nLCBlbmNvZGVkUXVlcnkpXG4gICAgICAgICAgLnJlcGxhY2UoJ3t7cXVlcnl9fScsIGVuY29kZWRRdWVyeSk7XG4gICAgICBjb25zb2xlLmxvZyhgU09JOiBPcGVuaW5nIFVSTCAke3VybH1gKTtcbiAgICAgIGlmICh0aGlzLnNldHRpbmdzLnVzZUlmcmFtZSkge1xuICAgICAgICBpZiAoYWN0aXZlVmlldykge1xuICAgICAgICAgIGFjdGl2ZVZpZXcuZnJhbWUuc2V0QXR0cignc3JjJywgdXJsKTtcbiAgICAgICAgICBhY3RpdmVWaWV3LnVybCA9IHVybDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb25zdCBsZWFmID0gdGhpcy5hcHAud29ya3NwYWNlLmdldExlYWYoISh0aGlzLmFwcC53b3Jrc3BhY2UuYWN0aXZlTGVhZi52aWV3LmdldFZpZXdUeXBlKCkgPT09ICdlbXB0eScpKTtcbiAgICAgICAgICAvLyBjb25zdCBsZWFmID0gdGhpcy5hcHAud29ya3NwYWNlLnNwbGl0QWN0aXZlTGVhZih0aGlzLnNldHRpbmdzLnNwbGl0RGlyZWN0aW9uKTtcbiAgICAgICAgICBjb25zdCB2aWV3ID0gbmV3IFNlYXJjaFZpZXcodGhpcywgbGVhZiwgcXVlcnksIHNlYXJjaC5uYW1lLCB1cmwpO1xuICAgICAgICAgIGF3YWl0IGxlYWYub3Blbih2aWV3KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYXdhaXQgb3Blbih1cmwpO1xuICAgICAgfVxuICAgIH1cblxuICAgIG9udW5sb2FkKCkge1xuICAgICAgY29uc29sZS5sb2coJ3VubG9hZGluZyBzZWFyY2gtb24taW50ZXJuZXQnKTtcbiAgICAgIGRvY3VtZW50Lm9mZignY29udGV4dG1lbnUnLCAnLm1hcmtkb3duLXByZXZpZXctdmlldycsIHRoaXMub25Eb20sIHRoaXMub25Eb21TZXR0aW5ncyk7XG4gICAgfVxuXG4gICAgYXN5bmMgbG9hZFNldHRpbmdzKCkge1xuICAgICAgY29uc3QgbG9hZGVkU2V0dGluZ3MgPSBhd2FpdCB0aGlzLmxvYWREYXRhKCkgYXMgYW55O1xuICAgICAgaWYgKGxvYWRlZFNldHRpbmdzICYmIGxvYWRlZFNldHRpbmdzLmhhc093blByb3BlcnR5KCdzZWFyY2hlcycpKSB7XG4gICAgICAgIGxvYWRlZFNldHRpbmdzLnNlYXJjaGVzID0gQXJyYXkuZnJvbShcbiAgICAgICAgICAgIGxvYWRlZFNldHRpbmdzLnNlYXJjaGVzLm1hcChcbiAgICAgICAgICAgICAgICAoczogU2VhcmNoU2V0dGluZykgPT4gT2JqZWN0LmFzc2lnbih7fSwgREVGQVVMVF9RVUVSWSwgcykpKTtcbiAgICAgICAgdGhpcy5zZXR0aW5ncyA9IGxvYWRlZFNldHRpbmdzO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5zZXR0aW5ncyA9IERFRkFVTFRfU0VUVElORztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBhc3luYyBzYXZlU2V0dGluZ3MoKSB7XG4gICAgICBhd2FpdCB0aGlzLnNhdmVEYXRhKHRoaXMuc2V0dGluZ3MpO1xuICAgIH1cbn1cblxuXG4iXSwibmFtZXMiOlsiU2V0dGluZyIsIlBsdWdpblNldHRpbmdUYWIiLCJmcyIsIm9zIiwiaXNEb2NrZXIiLCJyZXF1aXJlJCQwIiwicGF0aCIsImlzV3NsIiwiY2hpbGRQcm9jZXNzIiwiRnV6enlTdWdnZXN0TW9kYWwiLCJJdGVtVmlldyIsIk1hcmtkb3duVmlldyIsIk1lbnUiLCJQbHVnaW4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLGFBQWEsR0FBRyxTQUFTLENBQUMsRUFBRSxDQUFDLEVBQUU7QUFDbkMsSUFBSSxhQUFhLEdBQUcsTUFBTSxDQUFDLGNBQWM7QUFDekMsU0FBUyxFQUFFLFNBQVMsRUFBRSxFQUFFLEVBQUUsWUFBWSxLQUFLLElBQUksVUFBVSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDO0FBQ3BGLFFBQVEsVUFBVSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsS0FBSyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxNQUFNLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO0FBQzFHLElBQUksT0FBTyxhQUFhLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQy9CLENBQUMsQ0FBQztBQUNGO0FBQ08sU0FBUyxTQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRTtBQUNoQyxJQUFJLElBQUksT0FBTyxDQUFDLEtBQUssVUFBVSxJQUFJLENBQUMsS0FBSyxJQUFJO0FBQzdDLFFBQVEsTUFBTSxJQUFJLFNBQVMsQ0FBQyxzQkFBc0IsR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsK0JBQStCLENBQUMsQ0FBQztBQUNsRyxJQUFJLGFBQWEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDeEIsSUFBSSxTQUFTLEVBQUUsR0FBRyxFQUFFLElBQUksQ0FBQyxXQUFXLEdBQUcsQ0FBQyxDQUFDLEVBQUU7QUFDM0MsSUFBSSxDQUFDLENBQUMsU0FBUyxHQUFHLENBQUMsS0FBSyxJQUFJLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQyxTQUFTLEVBQUUsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDO0FBQ3pGLENBQUM7QUF1Q0Q7QUFDTyxTQUFTLFNBQVMsQ0FBQyxPQUFPLEVBQUUsVUFBVSxFQUFFLENBQUMsRUFBRSxTQUFTLEVBQUU7QUFDN0QsSUFBSSxTQUFTLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxPQUFPLEtBQUssWUFBWSxDQUFDLEdBQUcsS0FBSyxHQUFHLElBQUksQ0FBQyxDQUFDLFVBQVUsT0FBTyxFQUFFLEVBQUUsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUU7QUFDaEgsSUFBSSxPQUFPLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxPQUFPLENBQUMsRUFBRSxVQUFVLE9BQU8sRUFBRSxNQUFNLEVBQUU7QUFDL0QsUUFBUSxTQUFTLFNBQVMsQ0FBQyxLQUFLLEVBQUUsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLEVBQUUsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFO0FBQ25HLFFBQVEsU0FBUyxRQUFRLENBQUMsS0FBSyxFQUFFLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLEVBQUUsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFO0FBQ3RHLFFBQVEsU0FBUyxJQUFJLENBQUMsTUFBTSxFQUFFLEVBQUUsTUFBTSxDQUFDLElBQUksR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxRQUFRLENBQUMsQ0FBQyxFQUFFO0FBQ3RILFFBQVEsSUFBSSxDQUFDLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLFVBQVUsSUFBSSxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO0FBQzlFLEtBQUssQ0FBQyxDQUFDO0FBQ1AsQ0FBQztBQUNEO0FBQ08sU0FBUyxXQUFXLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRTtBQUMzQyxJQUFJLElBQUksQ0FBQyxHQUFHLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDckgsSUFBSSxPQUFPLENBQUMsR0FBRyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsT0FBTyxNQUFNLEtBQUssVUFBVSxLQUFLLENBQUMsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLEdBQUcsV0FBVyxFQUFFLE9BQU8sSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUM3SixJQUFJLFNBQVMsSUFBSSxDQUFDLENBQUMsRUFBRSxFQUFFLE9BQU8sVUFBVSxDQUFDLEVBQUUsRUFBRSxPQUFPLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFO0FBQ3RFLElBQUksU0FBUyxJQUFJLENBQUMsRUFBRSxFQUFFO0FBQ3RCLFFBQVEsSUFBSSxDQUFDLEVBQUUsTUFBTSxJQUFJLFNBQVMsQ0FBQyxpQ0FBaUMsQ0FBQyxDQUFDO0FBQ3RFLFFBQVEsT0FBTyxDQUFDLEVBQUUsSUFBSTtBQUN0QixZQUFZLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLFFBQVEsQ0FB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
