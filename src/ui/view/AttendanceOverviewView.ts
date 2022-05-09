import { ItemView, WorkspaceLeaf } from "obsidian";
import type { SourceCache } from "src/cache/cache";
import {VIEW_TYPE_ATTENDANCE} from "src/globals";
import AttendanceOverview from "./AttendanceOverview.svelte";

export class AttendanceOverviewView extends ItemView {
	private attendanceOverview: AttendanceOverview;

	constructor(leaf: WorkspaceLeaf, private readonly cache: SourceCache) {
		super(leaf);

    this.app.workspace.on("obsidian-attendance:cache-update", () => {
			if (this.attendanceOverview) {
        this.attendanceOverview.update([...this.cache.getCodeblocks()])
      }
    })
	}

	getViewType(): string {
		return VIEW_TYPE_ATTENDANCE;
	}
	getDisplayText(): string {
		return "Attendance";
	}

	protected onOpen(): Promise<void> {
		this.attendanceOverview = new AttendanceOverview({
			target: this.contentEl,
			props: {
			},
		});

		this.attendanceOverview.update([...this.cache.getCodeblocks()]);
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