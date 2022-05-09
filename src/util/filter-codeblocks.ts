import type {Attendance, AttendanceCodeblock} from "./../AttendanceData";
export type Search = {
	from?: moment.Moment;
	to?: moment.Moment;
	title?: string;
};


export function filterCodeblocks(codeblocks: AttendanceCodeblock[], search: Search): Attendance[] {
  return codeblocks.filter(cb => {
    if (cb.error) {
      return false;
    } 
    const a = cb.attendance;
    if (search.title && !a.title?.includes(search.title)) {
      return false;
    } else if (search.to && !a.date.isBefore(search.to)) {
      return false
    } else if (search.from && !a.date.isAfter(search.from)) {
      return false;
    }
    return true;
  }).map(cb => cb.attendance);
}