import { ItemView, WorkspaceLeaf } from "obsidian";
import { EVENT_CACHE_UPDATE } from "src/globals";
import {VIEW_TYPE_ATTENDANCE} from "src/globals";
import AttendanceOverview from "./AttendanceOverview.svelte";
import type AttendancePlugin from "src/main";

export class AttendanceOverviewView extends ItemView {
	private attendanceOverview: AttendanceOverview;

	constructor(leaf: WorkspaceLeaf, private readonly plugin: AttendancePlugin) {
		super(leaf);

    plugin.events.on(EVENT_CACHE_UPDATE, () => {
			if (this.attendanceOverview) {
        this.attendanceOverview.update([...this.plugin.queryResolver.getCodeblocks()])
      }
    })
	}

	getViewType(): string {
		return VIEW_TYPE_ATTENDANCE;
	}
	getDisplayText(): string {
		return "Attendance";
	}

	override getIcon(): string {
		return "user-check";
	}

	protected onOpen(): Promise<void> {
		this.attendanceOverview = new AttendanceOverview({
			target: this.contentEl,
			props: {
				plugin: this.plugin,
				app: this.plugin.app,
			},
		});

		this.attendanceOverview.update([
			...this.plugin.queryResolver.getCodeblocks(),
		]);
		return Promise.resolve();
	}

	onClose(): Promise<void> {
		if (this.attendanceOverview) {
			this.attendanceOverview.$destroy();
			this.attendanceOverview = null;
		}
		return Promise.resolve();
	}
}