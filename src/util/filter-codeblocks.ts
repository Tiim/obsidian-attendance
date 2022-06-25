import { moment } from 'obsidian';
import type {Attendance, AttendanceCodeblock} from './../AttendanceData';
export type Search = {
  from?: moment.Moment;
  to?: moment.Moment;
  title?: string;
};


export function filterCodeblocks(codeblocks: AttendanceCodeblock[], search: Search): Attendance[] {
  const cb = codeblocks.filter(cb => {
    if (cb.error) {
      return false;
    } 
    const a = cb.attendance;
    if (search.title && !a.title?.toLowerCase().includes(search.title.toLowerCase())) {
      return false;
    } else if (search.to && !a.date.isSameOrBefore(search.to)) {
      return false;
    } else if (search.from && !a.date.isSameOrAfter(search.from)) {
      return false;
    }
    return true;
  }).map(cb => cb.attendance);
  cb.sort((a, b) => a.date.isAfter(b.date) ? 1 : -1);
  return cb;
}
