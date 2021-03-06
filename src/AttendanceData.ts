import { TFile, Vault, moment } from 'obsidian';
import { CODE_BLOCK } from './globals';
import { QueryParser } from './parse/query';
import { Query } from './Query';

/**
 * Data structure holding attendance data for a single codeblock.
 */
export class Attendance {
  public readonly date: moment.Moment;
  public readonly title: string;
  public readonly query: Query;
  public readonly attendances: Attendances;
  public readonly path: string;

  constructor(
    date: moment.Moment,
    title: string,
    query: Query,
    attendances: AttendanceEntry[],
    path: string
  ) {
    this.date = date;
    this.title = title;
    this.query = query;
    this.attendances = new Attendances(attendances);
    this.path = path;
  }
  public getAttendances(allPaths: Set<string>): AttendanceEntry[] {
    return this.attendances.getAttendancesAll(
      Array.from(allPaths)
    );
  }

  /**
   * Contains a trailing newline
   */
  public toString(): string {
    return (
      `date: ${this.date.format('YYYY-MM-DD')}\ntitle: ${
        this.title
      }\nquery: ${this.query}\n` + this.attendances.toString()
    );
  }

  public static equalsIgnoreAttendance(
    a: Attendance,
    b: Attendance
  ): boolean {
    if ((a == null || b == null) && a !== b) {
      return false;
    } else if (a === b) {
      return true;
    }
    return (
      a.date.isSame(b.date) &&
      a.title === b.title &&
      Query.equals(a.query, b.query)
    );
  }
}

/**
 * Data structure for the list of attendees and their attendance status.
 */
class Attendances {
  public readonly attendanceList: AttendanceEntry[] = [];
  public readonly attendanceSet: Set<string> = new Set();

  constructor(attendanceList: AttendanceEntry[]) {
    this.attendanceList = attendanceList.slice();
    this.attendanceList.forEach((a) => this.attendanceSet.add(a.link));
  }

  public getAttendancesAll(implicitLinks: string[]): AttendanceEntry[] {
    const array = [
      ...this.attendanceList,
      ...implicitLinks
        .filter((l) => !this.attendanceSet.has(l))
        .map((l) => new AttendanceEntry(l, '', '')),
    ];

    array.sort();

    return array;
  }

  public setState(link: string, state: string, note: string) {
    if (this.attendanceSet.has(link)) {
      const index = this.attendanceList.findIndex((a) => a.link === link);
      this.attendanceList[index] = new AttendanceEntry(link, state, note);
    } else {
      this.attendanceList.push(new AttendanceEntry(link, state, note));
      this.attendanceSet.add(link);
    }
  }

  public toString(): string {
    return this.attendanceList.map((a) => `- ${a.toString()}\n`).join('');
  }

  public static equals(a: Attendances, b: Attendances): boolean {
    return (
      a.attendanceList.length === b.attendanceList.length &&
      a.attendanceList.every((a, i) =>
        AttendanceEntry.equals(a, b.attendanceList[i])
      )
    );
  }
}

/**
 * Represents a codeblock with attendance data.
 */
export class AttendanceCodeblock {
  public attendance: Attendance;
  public readonly error: Error;
  private readonly vault: Vault;

  constructor(sourceString: string, path: string, vault: Vault) {
    this.vault = vault;

    try {
      const { date, title, query, attendances } =
      this.parse(sourceString);
      if (!date || !title || !query) {
        throw new Error(
          'The elements \'date:\' and \'title:\' and \'query:\' are required.'
        );
      }
      if (!date.isValid()) {
        throw new Error('The date is not valid.');
      }
      this.attendance = new Attendance(date, title, query, attendances, path);
    } catch (e) {
      this.error = e;
    }
  }

  private parse(sourceString: string) {
    let date: moment.Moment;
    let title: string;
    let query: Query;
    const attendances: AttendanceEntry[] = [];
    sourceString.split('\n').forEach((line) => {
      line = line.trim();
      if (line.startsWith('date:')) {
        date = moment(line.substring(5).trim());
      } else if (line.startsWith('title:')) {
        title = line.substring(6).trim();
      } else if (line.startsWith('query:')) {
        const qp = new QueryParser(line.substring(6).trim());
        query = qp.parseQuery();
      } else if (line.startsWith('*') || line.startsWith('-')) {
        attendances.push(
          AttendanceEntry.parse(line.substring(1).trim())
        );
      }
    });
    return { date, title, query, attendances };
  }

  public async setState(link: string, state: string, note: string) {
    this.attendance.attendances.setState(link, state, note);
    await this.write();
  }

  public async write() {
    const tFile = this.vault.getAbstractFileByPath(this.attendance.path);
    if (!(tFile instanceof TFile)) {
      throw new Error(`${this.attendance.path} is not an existing file.`);
    }

    const fileContent = await this.vault.read(tFile);

    let idxStart = 0;
    let idxEnd = 0;
    let cb: ParsedCodeblock;

    // find codeblock manually
    while (!cb || !cb.eof) {
      cb = AttendanceCodeblock.parseNextCodeblockInFile(
        fileContent,
        tFile,
        idxEnd,
        this.vault
      );
      idxStart = cb.range.start;
      idxEnd = cb.range.end;

      if (
        Attendance.equalsIgnoreAttendance(
          cb.attendance.attendance,
          this.attendance
        )
      ) {
        break;
      }
    }

    if (cb.eof) {
      throw new Error('Could not find codeblock. Is it in a block quote?');
    }

    const content = this.attendance.toString();
    const startContent = fileContent.substring(0, idxStart);
    const endContent = fileContent.substring(idxEnd);
    const startBrackets = idxStart >= fileContent.length ? '\n```' : '```';
    const endBrackets = '```';

    const newContent =
      startContent +
      startBrackets +
      CODE_BLOCK +
      '\n' +
      content +
      endBrackets +
      endContent;
    await this.vault.modify(tFile, newContent);
  }

  public static async parseAllCodeblocksInFile(
    file: TFile,
    vault: Vault
  ): Promise<Set<AttendanceCodeblock>> {
    const set = new Set<AttendanceCodeblock>();
    const fileContent = await vault.read(file);
    let lastCB = await this.parseNextCodeblockInFile(
      fileContent,
      file,
      0,
      vault
    );
    while (!lastCB.eof) {
      set.add(lastCB.attendance);
      lastCB = await this.parseNextCodeblockInFile(
        fileContent,
        file,
        lastCB.range.end,
        vault
      );
    }
    return set;
  }

  private static parseNextCodeblockInFile(
    fileContent: string,
    file: TFile,
    start: number,
    vault: Vault
  ): ParsedCodeblock {
    let idx = fileContent.indexOf('```' + CODE_BLOCK, start);
    start = idx >= 0 ? idx : fileContent.length - 1;
    idx = fileContent.indexOf('```', start + 3);
    const end = idx >= 0 ? idx + 3 : fileContent.length - 1;

    const code = fileContent.substring(start + CODE_BLOCK.length + 3, end);
    const attendance = new AttendanceCodeblock(code, file.path, vault);
    return {
      eof: start === fileContent.length - 1,
      attendance,
      range: { start, end },
    };
  }
}

type ParsedCodeblock = {
  eof: boolean;
  attendance: AttendanceCodeblock;
  range: { start: number; end: number };
};

/**
 * Represents a single attendee and their state
 */
export class AttendanceEntry {
  public readonly link: string;
  public readonly state: string;
  public readonly note: string;

  constructor(link: string, state: string, note: string) {
    this.link = link;
    this.state = state;
    this.note = note;
  }

  public static parse(source: string) {
    const parts = source.split(',').map((part) => part.trim());
    if (parts.length < 1 || parts.length > 3) {
      throw new Error('Invalid attendance entry. Format is: [[link]], "state", "note"');
    }
    if (!parts[0].startsWith('[[') || !parts[0].endsWith(']]')) {
      throw new Error('Invalid link format ' + parts[0]);
    }
    if (parts.length > 1 && (!parts[1].startsWith('"') || !parts[1].endsWith('"'))) {
      throw new Error('Invalid state format ' + parts[1]);
    }
    if (parts.length > 2 && (!parts[2].startsWith('"') || !parts[2].endsWith('"'))) {
      throw new Error('Invalid note format ' + parts[2]);
    }
    const link = parts[0].substring(2, parts[0].length - 2);
    
    let state;
    if (parts.length > 1) {
      state = parts[1].substring(1, parts[1].length - 1);
    } else {
      state = '';
    }

    let note;
    if (parts.length > 2) {
      note = parts[2].substring(1, parts[2].length - 1);
    } else {
      note = '';
    }
    
    return new AttendanceEntry(link, state, note);
  }

  public toString(): string {
    return `[[${this.link}]], "${this.state}", "${this.note}"`;
  }

  public static equals(a: AttendanceEntry, b: AttendanceEntry) {
    return a.link === b.link && a.state === b.state && a.note === b.note;
  }
}
