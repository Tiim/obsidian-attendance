import { Plugin } from "obsidian";
import { AttendanceRenderer } from "./AttendanceRenderer";
import { SourceCache } from "./cache/cache";
import { AttendanceSettingsTab } from "./SettingsTab";

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

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new AttendanceSettingsTab(this.app, this));

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
}
