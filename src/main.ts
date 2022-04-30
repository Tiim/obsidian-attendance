import { Plugin } from 'obsidian';
import { AttendanceRenderer } from './AttendanceRenderer';
import {SourceCache} from "./SourceCache";


declare module "obsidian" {
	interface Workspace {
		/** Sent to rendered attendance components to refresh */
		on(
			name: "obsidian-attendance:cache-update",
			callback: () => void,
		): EventRef;
	}
}


interface AttendancePluginSettings {
	// Just here so eslint won't complain, will be removed when there are some actual settings
	__dummy: undefined;
}

const DEFAULT_SETTINGS: AttendancePluginSettings = {
	__dummy: undefined
}

export default class AttendancePlugin extends Plugin {
	private settings: AttendancePluginSettings;
	private sourceCache: SourceCache;

	async onload() {
		await this.loadSettings();

		this.sourceCache = new SourceCache(this.app, this);

		new AttendanceRenderer({plugin: this, cache: this.sourceCache});
		
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}