import { Plugin } from "obsidian";
import { AttendanceRenderer } from "./ui/AttendanceRenderer";
import { SourceCache } from "./cache/cache";
import { AttendanceSettingsTab } from "./SettingsTab";
import { AttendanceOverviewView } from "./ui/AttendanceOverviewView";
import { VIEW_TYPE_ATTENDANCE } from "./globals";

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
	private sourceCache: SourceCache;
	private view: AttendanceOverviewView;

	async onload() {
		await this.loadSettings();
		
		
		this.addSettingTab(new AttendanceSettingsTab(this.app, this));
		this.registerView(VIEW_TYPE_ATTENDANCE, 
			(leaf) => (this.view = new AttendanceOverviewView(leaf)));


		this.addCommand({
			id: "attendance:show-view",
			name: "Show Attendance View",
			callback: () => {
				this.showView();
			}
		})

		this.sourceCache = new SourceCache(this.app, this);

		new AttendanceRenderer({
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
