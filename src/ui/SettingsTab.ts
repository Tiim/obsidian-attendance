import { PluginSettingTab, App, Setting } from "obsidian";
import type AttendancePlugin from "../main";
import type { AttendanceStateSetting } from '../main';
import { EVENT_CACHE_UPDATE } from "../resolver/query-resolver";

export class AttendanceSettingsTab extends PluginSettingTab {
	plugin: AttendancePlugin;

	constructor(app: App, plugin: AttendancePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display() {
		const container = this.containerEl;
		container.empty();
		container.classList.add("attendance-setting");

		container.createEl("h1", { text: "Attendance Plugin Settings" });
		container.createEl("h2", { text: "Plugin Settings" });
		container.createEl("h3", { text: "Attendance States" });
		this.plugin.settings.states.forEach((state, index) => {
			this.renderState(index, state, container);
		});
		new Setting(container).addButton((b) => {
			b.setButtonText("Add State");
			b.onClick(() => {
				this.plugin.settings.states.push({
					name: "Present",
					icon: "✓",
					color: "#e50000",
				});
				this.settingChange(true);
			});
		});
		this.renderCredits(container);
	}

	private renderCredits(container: HTMLElement) {
		const div = container.createDiv({
			cls: "credits",
		});
		const span = div.createSpan({
			text: "Created with ❤️ by ",
			attr: {
				style: "color: var(--text-muted);",
			}
		});
		span.createEl("a", {
			text: "@Tiim",
			href: "https://twitter.com/Tiim",
		});

		div.createEl("a", {
			href: "https://www.buymeacoffee.com/Tiim",
		}).createEl("img", {
			attr: {
				src: "https://cdn.buymeacoffee.com/buttons/default-violet.png",
				alt: "Buy Me A Coffee",
				style: "height: 60px !important;width: 217px !important;",
			},
		});
	}

	private settingChange(rerender = false) {
		this.app.workspace.trigger(EVENT_CACHE_UPDATE);
		this.plugin.saveSettings();
		if (rerender) {
			this.display();
		}
	}

	private renderState(
		index: number,
		state: AttendanceStateSetting,
		container: HTMLElement
	) {
		const setting = new Setting(container)
			.setClass("title-setting")
			.setName("State: " + state.name)
			.setDesc("Move the state up or down, or delete this state.");
		if (index > 0) {
			setting.addExtraButton((b) => {
				b.setIcon("arrow-up");
				b.setTooltip("Move Up");
				b.onClick(() => {
					this.plugin.settings.states.splice(index, 1);
					this.plugin.settings.states.splice(index - 1, 0, state);
					this.settingChange(true);
				});
			});
		}
		if (index < this.plugin.settings.states.length - 1) {
			setting.addExtraButton((b) => {
				b.setIcon("arrow-down");
				b.setTooltip("Move Down");
				b.onClick(() => {
					this.plugin.settings.states.splice(index, 1);
					this.plugin.settings.states.splice(index + 1, 0, state);
					this.settingChange(true);
				});
			});
		}
		setting.addExtraButton((b) => {
			b.setIcon("trash");
			b.setTooltip("Delete");
			b.onClick(() => {
				this.plugin.settings.states.splice(index, 1);
				this.settingChange(true);
			});
		});

		new Setting(container)
			.setClass("sub-setting")
			.setName("Name")
			.setDesc("The name of this state.")
			.addText((t) => {
				t.setValue(state.name);
				t.setPlaceholder("Present");
				t.onChange((value) => {
					this.plugin.settings.states[index].name = value;
					this.settingChange();
				});
			});

		new Setting(container)
			.setClass("sub-setting")
			.setName("Icon")
			.setDesc("The icon of this state, such as a letter or emoji.")
			.addText((t) => {
				t.setValue(state.icon);
				t.setPlaceholder("✓");
				t.onChange((value) => {
					this.plugin.settings.states[index].icon = value;
					this.settingChange();
				});
			});

		const colorSetting = new Setting(container)
			.setClass("sub-setting")
			.setName("Color")
			.setDesc(
				"The color of this state, as a css color. Examples: red, #ff0000, rgb(255, 0, 0)."
			);
		colorSetting.controlEl.style.setProperty(
			"--preview-color",
			state.color
		);
		colorSetting.controlEl.createSpan({
			cls: "color-preview",
		});
		colorSetting.addText((t) => {
			t.setValue(state.color);
			t.setPlaceholder("#ff9911");
			t.onChange((value) => {
				this.plugin.settings.states[index].color = value;
				this.settingChange();
				colorSetting.controlEl.style.setProperty(
					"--preview-color",
					value
				);
			});
		});
	}
}
