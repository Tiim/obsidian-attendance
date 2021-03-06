import { ItemView, WorkspaceLeaf } from 'obsidian';
import {VIEW_TYPE_ATTENDANCE} from 'src/globals';
import AttendanceOverview from './AttendanceOverview.svelte';
import type AttendancePlugin from 'src/main';

export class AttendanceOverviewView extends ItemView {
  private attendanceOverview: AttendanceOverview;

  constructor(leaf: WorkspaceLeaf, private readonly plugin: AttendancePlugin) {
    super(leaf);
  }

  getViewType(): string {
    return VIEW_TYPE_ATTENDANCE;
  }
  getDisplayText(): string {
    return 'Attendance';
  }

  override getIcon(): string {
    return 'user-check';
  }

  protected onOpen(): Promise<void> {
    this.attendanceOverview = new AttendanceOverview({
      target: this.contentEl,
      props: {
        plugin: this.plugin,
        app: this.plugin.app,
        queryResolver: this.plugin.queryResolver,
      },
    });
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
