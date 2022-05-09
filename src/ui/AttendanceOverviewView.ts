import { ItemView } from "obsidian";
import {VIEW_TYPE_ATTENDANCE} from "../globals";
import AttendanceOverview from "./AttendanceOverview.svelte";

export class AttendanceOverviewView extends ItemView {
  private attendanceOverview: AttendanceOverview;


  getViewType(): string {
    return VIEW_TYPE_ATTENDANCE
  }
  getDisplayText(): string {
    return "Attendance"
  }

  protected onOpen(): Promise<void> {
    this.attendanceOverview = new AttendanceOverview({
      target: this.contentEl,
    });
    return Promise.resolve()
  }

  onClose(): Promise<void> {
    if (this.attendanceOverview) {
      this.attendanceOverview.$destroy();
      this.attendanceOverview = null;
    }
    return Promise.resolve()
  }

}