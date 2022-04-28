import { Plugin } from 'obsidian';
import { AttendanceRenderer } from './AttendanceRenderer';

interface AttendancePluginSettings {
}

const DEFAULT_SETTINGS: AttendancePluginSettings = {
}

export default class AttendancePlugin extends Plugin {
	settings: AttendancePluginSettings;

	async onload() {
		await this.loadSettings();

		new AttendanceRenderer({plugin: this});
		
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