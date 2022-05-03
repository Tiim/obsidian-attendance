import { TFile } from "obsidian";
import { CODE_BLOCK } from "./AttendanceRenderer";
import { QueryParser } from "./parse/query";
import { Query } from "./Query";
import { SourceCache } from "./SourceCache";

/**
 * Data structure holding attendance data for a single codeblock.
 */
export class Attendance {
	public readonly date: string;
	public readonly title: string;
	public readonly query: Query;
	public readonly attendances: Attendances;

	constructor(
		date: string,
		title: string,
		query: Query,
		attendances: AttendanceEntry[]
	) {
		this.date = date;
		this.title = title;
		this.query = query;
		this.attendances = new Attendances(attendances);
	}

	public getAttendances(cache: SourceCache): AttendanceEntry[] {
		return this.attendances.getAttendancesAll(
			Array.from(cache.getMatchingFiles(this.query))
		);
	}

	public toString(): string {
		return (
			`date: ${this.date}\ntitle: ${this.title}\nquery: ${this.query}\n` +
			this.attendances.toString()
		);
	}

	public static equalsIgnoreAttendance(a: Attendance, b: Attendance): boolean {
		if ((a == null || b == null)  && a !== b) {
			return false;
		} else if (a === b) {
			return true
		}
		return (
			a.date === b.date &&
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
				.map((l) => new AttendanceEntry(l, "", "")),
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
		return this.attendanceList.map((a) => `* ${a.toString()}`).join("\n");
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
	public readonly path: string;
	public readonly error: Error;

	constructor(sourceString: string, path: string) {
		this.path = path;

		try {
			const { date, title, query, attendances } =
				this.parse(sourceString);
			if (!date || !title || !query) {
				throw new Error(
					"The elements 'date:' and 'title:' and 'query:' are required."
				);
			}
			this.attendance = new Attendance(date, title, query, attendances);
		} catch (e) {
			this.error = e;
		}
	}

	private parse(sourceString: string) {
		let date: string;
		let title: string;
		let query: Query;
		const attendances: AttendanceEntry[] = [];
		sourceString.split("\n").forEach((line) => {
			line = line.trim();
			if (line.startsWith("date:")) {
				date = line.substring(5).trim();
			} else if (line.startsWith("title:")) {
				title = line.substring(6).trim();
			} else if (line.startsWith("query:")) {
				const qp = new QueryParser(line.substring(6).trim());
				query = qp.parseQuery();
			} else if (line.startsWith("*")) {
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
		const tfile = app.vault.getAbstractFileByPath(this.path);
		if (!(tfile instanceof TFile)) {
			throw new Error(`${this.path} is not an existing file.`);
		}

		const fileContent = await app.vault.read(tfile);

		let idxStart = 0,
			idxEnd = 0;

		// find codeblock manually
		while (idxStart < fileContent.length - 1) {
			const cb: ParsedCodeblock =
				await AttendanceCodeblock.parseNextCodeblockInFile(
					tfile,
					idxEnd
				);
			idxStart = cb.range.start;
			idxEnd = cb.range.end;
					
			if (Attendance.equalsIgnoreAttendance(cb.attendance.attendance, this.attendance)) {
				break;
			}
		}

		

		const content = this.attendance.toString();
		const startContent = fileContent.substring(0, idxStart);
		const endContent = fileContent.substring(idxEnd + 1);
		const endBrackets = endContent.startsWith("```") ? "" : "```";
		const newContent =
			startContent +
			"```" +
			CODE_BLOCK +
			"\n" +
			content +
			"\n" +
			endBrackets +
			endContent;
		await app.vault.modify(tfile, newContent);
	}

	public static async parseAllCodeblocksInFile(
		file: TFile
	): Promise<Set<AttendanceCodeblock>> {
		const set = new Set<AttendanceCodeblock>();
		let lastCB = await this.parseNextCodeblockInFile(file, 0);
		while (lastCB.range.start < lastCB.fileSize - 1) {
			set.add(lastCB.attendance);
			lastCB = await this.parseNextCodeblockInFile(
				file,
				lastCB.range.end
			);
		}
		return set;
	}

	private static async parseNextCodeblockInFile(
		file: TFile,
		start: number
	): Promise<ParsedCodeblock> {
		const fileContent = await app.vault.read(file);

		let idx = fileContent.indexOf("```" + CODE_BLOCK, start + 1);
		start = idx >= 0 ? idx : fileContent.length - 1;
		idx = fileContent.indexOf("```", start + 3);
		const end = idx >= 0 ? idx+3 : fileContent.length - 1;

		const code = fileContent.substring(start + CODE_BLOCK.length + 3, end);
		const attendance = new AttendanceCodeblock(code, file.path);
		return {
			attendance,
			range: { start, end },
			fileSize: fileContent.length,
		};
	}
}

type ParsedCodeblock = {
	attendance: AttendanceCodeblock;
	range: { start: number; end: number };
	fileSize: number;
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
		const parts = source.split(",").map((part) => part.trim());
		if (!parts[0].startsWith("[[") || !parts[0].endsWith("]]")) {
			throw new Error("Invalid link format " + parts[0]);
		}
		if (!parts[1].startsWith('"') || !parts[1].endsWith('"')) {
			throw new Error("Invalid state format " + parts[1]);
		}
		if (!parts[2].startsWith('"') || !parts[2].endsWith('"')) {
			throw new Error("Invalid note format " + parts[2]);
		}
		const link = parts[0].substring(2, parts[0].length - 2);
		const state = parts[1].substring(1, parts[1].length - 1);
		const note = parts[2].substring(1, parts[2].length - 1);
		return new AttendanceEntry(link, state, note);
	}

	public toString(): string {
		return `[[${this.link}]], "${this.state}", "${this.note}"`;
	}

	public static equals(a: AttendanceEntry, b: AttendanceEntry) {
		return a.link === b.link && a.state === b.state && a.note === b.note;
	}
}
