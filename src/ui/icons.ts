import {addIcon} from "obsidian";
// @ts-ignore
import CalendarFromIcon from "assets/icon-date-from.svg";

export const ICON_DATE_FROM = "attendance:date-from";
export function registerIcons() {
  addIcon(ICON_DATE_FROM, CalendarFromIcon)
}