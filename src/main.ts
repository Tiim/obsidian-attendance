import { Plugin, Events } from "obsidian";
import { AttendanceCodeblockRenderer } from "./ui/AttendanceCodeblockRenderer";
import { SourceCache } from "./cache/cache";
import { AttendanceSettingsTab } from "./SettingsTab";
import { AttendanceOverviewView } from "./ui/view/AttendanceOverviewView";
import { VIEW_TYPE_ATTENDANCE } from "./globals";
import "./styles.css";

declare module "obsidian" {
	interface Workspace {
		/** Sent to rendered attendance components to refresh */
		on(
			name: "obsidian-attendance:cache-update",
			callback: () => void
		): EventRef;
	}
}

export type AttendanceStateSetting = {
	name: string;
	icon: string;
	color: string;
};

interface AttendancePluginSettings {
	_version: 1;
	states: AttendanceStateSetting[];
}

const DEFAULT_SETTINGS: AttendancePluginSettings = {
	_version: 1,
	states: [
		{ name: "Present", icon: "✓", color: "#007e91" },
		{ name: "Absent", icon: "✗", color: "#e50000" },
		{ name: "Excused", icon: "!", color: "#a35c00" },
	],
};

export default class AttendancePlugin extends Plugin {
	settings: AttendancePluginSettings;
	events: Events = new Events();
	private sourceCache: SourceCache;


	async onload() {
		await this.loadSettings();
		this.sourceCache = new SourceCache(this.app, this);
		
		this.addChild(this.sourceCache);
		
		this.addSettingTab(new AttendanceSettingsTab(this.app, this));
		this.registerView(VIEW_TYPE_ATTENDANCE, 
			(leaf) => new AttendanceOverviewView(leaf, this.sourceCache));


		this.addCommand({
			id: "attendance:show-view",
			name: "Show Attendance View",
			callback: () => {
				this.showView();
			}
		})


		new AttendanceCodeblockRenderer({
			plugin: this,
			cache: this.sourceCache,
			states: this.settings.states,
		});
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}


	showView() {
		if (this.app.workspace.getLeavesOfType(VIEW_TYPE_ATTENDANCE).length) {
			return;
		}
		this.app.workspace.getRightLeaf(false).setViewState({
			type: VIEW_TYPE_ATTENDANCE,
			active: true,

		})
	}
}
