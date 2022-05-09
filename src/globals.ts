import type moment from "moment";
export const CODE_BLOCK = "attendance";
export const VIEW_TYPE_ATTENDANCE = "attendance";



declare global {
	interface Window {
		moment: typeof moment;
	}
}