"use strict";

const electron = require("electron");
const path = require("path");
const url = require("url");

const config_io = require("./modules/config_io");
const stringify = require("./modules/stringify");

config_io.load();
let config = config_io.config;

let menu = menu_build();
let menu_is_set = false;
let win;						// We're supposed to keep global references to every window we make.

if (electron.app.isReady()) {
	startup();
} else {
	electron.app.once("ready", () => {
		startup();
	});
}

// --------------------------------------------------------------------------------------------------------------

const save_dialog = electron.dialog.showSaveDialogSync || electron.dialog.showSaveDialog;
const open_dialog = electron.dialog.showOpenDialogSync || electron.dialog.showOpenDialog;

function alert(msg) {
	electron.dialog.showMessageBox({message: stringify(msg), title: "Alert", buttons: ["OK"]}, () => {});
	// Providing a callback makes the window not block the process.
};

function startup() {

	win = new electron.BrowserWindow({
		width: config.width,
		height: config.height,
		backgroundColor: "#000000",
		resizable: true,
		show: false,
		useContentSize: true,
		webPreferences: {
			backgroundThrottling: false,
			contextIsolation: false,
			nodeIntegration: true,
			spellcheck: false,
			zoomFactor: 1 / electron.screen.getPrimaryDisplay().scaleFactor		// Unreliable, see https://github.com/electron/electron/issues/10572
		}
	});

	win.once("ready-to-show", () => {
		try {
			win.webContents.setZoomFactor(1 / electron.screen.getPrimaryDisplay().scaleFactor);	// This seems to work, note issue 10572 above.
		} catch (err) {
			win.webContents.zoomFactor = 1 / electron.screen.getPrimaryDisplay().scaleFactor;	// The method above "will be removed" in future.
		}
		win.show();
		win.focus();
	});

	electron.app.on("window-all-closed", () => {
		electron.app.quit();
	});

	electron.ipcMain.on("alert", (event, msg) => {
		alert(msg);
	});

	electron.ipcMain.on("set_title", (event, msg) => {
		win.setTitle(msg);
	});

	electron.Menu.setApplicationMenu(menu);
	menu_is_set = true;

	// Actually load the page last, I guess, so the event handlers above are already set up.
	// Send some possibly useful info as a query.

	let query = {};
	query.user_data_path = electron.app.getPath("userData");

	win.loadFile(
		path.join(__dirname, "ogatak.html"),
		{query: query}
	);
}

// --------------------------------------------------------------------------------------------------------------

function menu_build() {
	const template = [
		{
			label: "App",
			submenu: [
				{
					label: "About",
					click: () => {
						alert(`${electron.app.getName()} (${electron.app.getVersion()}) in Electron (${process.versions.electron})`);
					}
				},
				{
					type: "separator",
				},
				{
					label: "Open SGF...",
					accelerator: "CommandOrControl+O",
					click: () => {
						let files = open_dialog();
						if (Array.isArray(files) && files.length > 0) {
							win.webContents.send("call", {
								fn: "load",
								args: [files[0]]
							});
						}
					}
				},
				{
					type: "separator",
				},
				{
					label: "Choose engine...",
					click: () => {
						let files = open_dialog();
						if (Array.isArray(files) && files.length > 0) {
							let file = files[0];
							win.webContents.send("set", {
								key: "engine",
								value: file
							});
							alert("This requires a restart to take effect.");		// FIXME
						}
					},
				},
				{
					label: "Choose engine config...",
					click: () => {
						let files = open_dialog();
						if (Array.isArray(files) && files.length > 0) {
							let file = files[0];
							win.webContents.send("set", {
								key: "engineconfig",
								value: file
							});
							alert("This requires a restart to take effect.");		// FIXME
						}
					},
				},
				{
					label: "Choose weights...",
					click: () => {
						let files = open_dialog();
						if (Array.isArray(files) && files.length > 0) {
							let file = files[0];
							win.webContents.send("set", {
								key: "weights",
								value: file
							});
							alert("This requires a restart to take effect.");		// FIXME
						}
					},
				},
				{
					type: "separator",
				},
				{
					label: "Quit",
					accelerator: "CommandOrControl+Q",
					role: "quit"
				},
			]
		},
		{
			label: "Tree",
			submenu: [
				{
					label: "Root",
					accelerator: "Home",
					click: () => {
						win.webContents.send("call", "go_to_root");
					}
				},
				{
					label: "End",
					accelerator: "End",
					click: () => {
						win.webContents.send("call", "go_to_end");
					}
				},
				{
					label: "Backward",
					accelerator: "Left",
					click: () => {
						win.webContents.send("call", "prev");
					}
				},
				{
					label: "Forward",
					accelerator: "Right",
					click: () => {
						win.webContents.send("call", "next");
					}
				},
				{
					type: "separator",
				},
				{
					label: "Previous sibling",
					accelerator: "Up",
					click: () => {
						win.webContents.send("call", "prev_sibling");
					}
				},
				{
					label: "Next sibling",
					accelerator: "Down",
					click: () => {
						win.webContents.send("call", "next_sibling");
					}
				},
				{
					type: "separator",
				},
				{
					label: "Return to main line",
					accelerator: "CommandOrControl+R",
					click: () => {
						win.webContents.send("call", "return_to_main");
					}
				},
			]
		},
		{
			label: "Analysis",
			submenu: [
				{
					label: "Go",
					accelerator: "CommandOrControl+G",
					click: () => {
						win.webContents.send("call", "go");
					}
				},
				{
					label: "Halt",
					accelerator: "CommandOrControl+H",
					click: () => {
						win.webContents.send("call", "halt");
					}
				},
				{
					type: "separator",
				},
				{
					label: "Numbers",
					submenu: [
						{
							label: "Winrate",
							type: "checkbox",
							checked: config.numbers === "winrate",
							accelerator: "F1",
							click: () => {
								win.webContents.send("set", {
									key: "numbers",
									value: "winrate"
								});
								set_checks("Analysis", "Numbers", "Winrate");
							}
						},
						{
							label: "Score",
							type: "checkbox",
							checked: config.numbers === "score",
							accelerator: "F2",
							click: () => {
								win.webContents.send("set", {
									key: "numbers",
									value: "score"
								});
								set_checks("Analysis", "Numbers", "Score");
							}
						},
						{
							label: "Visits %",
							type: "checkbox",
							checked: config.numbers === "visits_percent",
							accelerator: "F3",
							click: () => {
								win.webContents.send("set", {
									key: "numbers",
									value: "visits_percent"
								});
								set_checks("Analysis", "Numbers", "Visits %");
							}
						},
						{
							label: "Visits",
							type: "checkbox",
							checked: config.numbers === "visits",
							accelerator: "F4",
							click: () => {
								win.webContents.send("set", {
									key: "numbers",
									value: "visits"
								});
								set_checks("Analysis", "Numbers", "Visits");
							}
						},
						{
							label: "Policy",
							type: "checkbox",
							checked: config.numbers === "policy",
							accelerator: "F5",
							click: () => {
								win.webContents.send("set", {
									key: "numbers",
									value: "policy"
								});
								set_checks("Analysis", "Numbers", "Policy");
							}
						},
						{
							label: "Order",
							type: "checkbox",
							checked: config.numbers === "order",
							accelerator: "F6",
							click: () => {
								win.webContents.send("set", {
									key: "numbers",
									value: "order"
								});
								set_checks("Analysis", "Numbers", "Order");
							}
						},
					]
				}
			]
		},
		{
			label: "Dev",
			submenu: [
				{
					role: "toggledevtools"
				},
				{
					label: `Show ${config_io.filename}`,
					click: () => {
						electron.shell.showItemInFolder(config_io.filepath);
					}
				},
			]
		}
	];

	return electron.Menu.buildFromTemplate(template);
}



function set_checks(...menupath) {

	if (!menu_is_set) {
		return;
	}

	// Since I don't know precisely how the menu works behind the scenes,
	// give a little time for the original click to go through first.

	setTimeout(() => {
		let items = get_submenu_items(menupath.slice(0, -1));
		for (let n = 0; n < items.length; n++) {
			if (items[n].checked !== undefined) {
				items[n].checked = items[n].label === menupath[menupath.length - 1];
			}
		}
	}, 50);
}

function get_submenu_items(menupath) {

	// If the path is to a submenu, this returns a list of all items in the submenu.
	// If the path is to a specific menu item, it just returns that item.

	let o = menu.items;
	for (let p of menupath) {
		for (let item of o) {
			if (item.label === p) {
				if (item.submenu) {
					o = item.submenu.items;
					break;
				} else {
					return item;		// No submenu so this must be the end.
				}
			}
		}
	}
	return o;
}
