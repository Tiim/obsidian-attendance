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
	__dummy: null
}

const DEFAULT_SETTINGS: AttendancePluginSettings = {
	__dummy: null
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