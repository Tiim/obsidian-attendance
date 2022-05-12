import { Events, ItemView, WorkspaceLeaf } from "obsidian";
import { EVENT_CACHE_UPDATE, type QueryResolver } from "src/resolver/query-resolver";
import {VIEW_TYPE_ATTENDANCE} from "src/globals";
import AttendanceOverview from "./AttendanceOverview.svelte";

export class AttendanceOverviewView extends ItemView {
	private attendanceOverview: AttendanceOverview;

	constructor(leaf: WorkspaceLeaf, private readonly cache: QueryResolver, eventBus: Events) {
		super(leaf);

    eventBus.on(EVENT_CACHE_UPDATE, () => {
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