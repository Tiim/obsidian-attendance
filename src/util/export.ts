import { Notice } from 'obsidian';
import type { Attendance, AttendanceEntry } from '../AttendanceData';
import type AttendancePlugin from '../main';

const SPLIT = '\t';

export async function exportAttendance(
  attendances: Attendance[],
  plugin: AttendancePlugin,
) {
  const fullAttendances = attendances.map((a) =>
    a.getAttendances(plugin.queryResolver.resolveQuery(a.query))
  );

  let result = 'date' + SPLIT;

  const attendees = getAttendees(fullAttendances);

  result += `${attendees.map(({name}) => name).join(SPLIT)}\n`;

  attendances.forEach((attendance, index) => {
    const fullAttendance = fullAttendances[index];
    const date = attendance.date.format('YYYY-MM-DD');
    result += `${date}${SPLIT}`;
    attendees.forEach((a) => {
      const fa = fullAttendance.find((fa) => fa.link === a.lnk);
      if (fa) {
        result += `${fa.state}${SPLIT}`;
      } else {
        result += SPLIT;
      }
    });
    result += '\n';
  });

  await write(`\`\`\`tsv\n${result}\`\`\``, plugin);
}

async function write(result: string, plugin: AttendancePlugin) {
  const folder = await plugin.app.fileManager.getNewFileParent('');
  const path = `${folder.path}/Attendance-${new Date().toISOString().substring(0, 19).replace(/:/g, '-')}.tsv.md`;
  await plugin.app.vault.create(path, result);

  new Notice('Exported to ' + path);
}

function getAttendees(attendance: AttendanceEntry[][]) {
  const attendeesSet = new Set<string>();
  attendance.forEach((a) => a.forEach((at) => attendeesSet.add(at.link)));
  return Array.from(attendeesSet)
    .sort()
    .map((a) => ({lnk: a, name: a.substring(a.lastIndexOf('/') + 1).replace(/\.md$/, '')}));
}
