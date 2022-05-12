import { Plugin, Events } from "obsidian";
import { AttendanceCodeblockRenderer } from "./ui/AttendanceCodeblockRenderer";
import { QueryResolver } from "./resolver/query-resolver";
import { AttendanceSettingsTab } from "./ui/SettingsTab";
import { AttendanceOverviewView } from "./ui/view/AttendanceOverviewView";
import { VIEW_TYPE_ATTENDANCE } from "./globals";
import "./styles.css";
import { registerIcons } from "./ui/icons";

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
	queryResolver: QueryResolver;


	async onload() {
		await this.loadSettings();
		this.queryResolver = new QueryResolver(this.app, this);

		registerIcons();
		
		this.addChild(this.queryResolver);
		
		this.addSettingTab(new AttendanceSettingsTab(this.app, this));
		this.registerView(VIEW_TYPE_ATTENDANCE, 
			(leaf) => new AttendanceOverviewView(leaf, this));


		this.addCommand({
			id: "attendance:show-view",
			name: "Show Attendance View",
			callback: () => {
				this.showView();
			}
		})


		new AttendanceCodeblockRenderer({
			plugin: this,
			resolver: this.queryResolver,
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
		this.app.workspace.getRightLeaf(true).setViewState({
			type: VIEW_TYPE_ATTENDANCE,
			active: true,
		})
	}
}
