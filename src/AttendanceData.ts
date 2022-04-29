import { MarkdownSectionInformation } from "obsidian";
import { CODE_BLOCK } from "./AttendanceRenderer";
import { SourceCache } from "./SourceCache";

export class Attendance {
	public readonly date: string;
	public readonly title: string;
	public readonly query: AttendanceQuery;
	public readonly attendances: AttendanceEntry[] = [];
	readonly cache: SourceCache;

	constructor(
		date: string,
		title: string,
		query: AttendanceQuery,
		attendances: AttendanceEntry[],
		cache: SourceCache
	) {
		this.date = date;
		this.title = title;
		this.query = query;
		this.attendances = attendances.slice();
		this.cache = cache;
	}

	public getAttendances(): AttendanceEntry[] {
		return [
			...this.attendances,
			...Array.from(this.cache.getFiles(this.query)).map(
				(file) => new AttendanceEntry(file, "", "")
			),
		];
	}

	public toString(): string {
		return (
			`date: ${this.date}\ntitle: ${this.title}\nquery: ${this.query}\n` +
			this.attendances.map((a) => `* ${a.toString()}`).join("\n")
		);
	}
}

export class AttendanceSource {
	public attendance: Attendance;
	public readonly path: string;
	public readonly error: Error;

	constructor(sourceString: string, cache: SourceCache, path: string) {
		this.path = path;

		try {
			const { date, title, query, attendances } =
				this.parse(sourceString);
			if (!date || !title || !query) {
				throw new Error(
					"The elements 'date:' and 'title:' and 'query:' are required."
				);
			}
			this.attendance = new Attendance(
				date,
				title,
				query,
				attendances,
				cache
			);
		} catch (e) {
			this.error = e;
		}
	}

	private parse(sourceString: string) {
		let date: string;
		let title: string;
		let query: AttendanceQuery;
		let attendances: AttendanceEntry[] = [];
		sourceString.split("\n").forEach((line) => {
			line = line.trim();
			 if (line.startsWith("date:")) {
				date = line.substring(5).trim();
			} else if (line.startsWith("title:")) {
				title = line.substring(6).trim();
			} else if (line.startsWith("query:")) {
				query = AttendanceQuery.parse(line.substring(6).trim());
			} else if (line.startsWith("*")) {
				attendances.push(
					AttendanceEntry.parse(line.substring(1).trim())
				);
			}
		});
		return { date, title, query, attendances };
	}

	public async setState(link: string, state: string, note: string) {
		const i = this.attendance.attendances.findIndex((a) => a.link === link);
		if (i < 0) {
			this.attendance.attendances.push(new AttendanceEntry(link, state, note));
		} else {
			this.attendance.attendances[i] = new AttendanceEntry(link, state, note);
		}
		console.log(this.attendance.attendances);
		
		
		await this.write();
	}

	public async write() {
		const fileContent = await app.vault.adapter.read(this.path);
		
		let idxStart, idxEnd
		let i = 0
		// find codeblock
		while(i++ < 100) {
			console.log("start loop")
			let idx = fileContent.indexOf("```" + CODE_BLOCK, idxStart + 1);
			idxStart = idx >= 0 ? idx : fileContent.length - 1;
			idx = fileContent.indexOf("```", idxStart + 3);
			idxEnd = idx >= 0 ? idx : fileContent.length - 1;
			
			const codeBlock = fileContent.substring(
				idxStart + CODE_BLOCK.length + 3,
				idxEnd
				);
			const p = this.parse(codeBlock);
				
			if (idxStart >= fileContent.length -1) {
				break;
			}
			if (p.date === this.attendance.date && p.title === this.attendance.title && p.query.value === this.attendance.query.value) {
				break;
			}
		}		
		
		const content = this.attendance.toString();
		const startContent = fileContent.substring(0, idxStart);
		const endContent = fileContent.substring(idxEnd+1);
		const endBrackets = endContent.startsWith("```") ? "" : "```";
		const newContent = startContent + "```" + CODE_BLOCK + "\n"+ content + "\n" + endBrackets+ endContent;
		await app.vault.adapter.write(this.path, newContent);
	}
}

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
}

export class AttendanceQuery {
	public readonly type: "tag";
	public readonly value: string;

	constructor(type: "tag", value: string) {
		this.type = type;
		this.value = value;
	}

	static parse(query: string): AttendanceQuery {
		return new AttendanceQuery("tag", query);
	}

	toString(): string {
		return this.value;
	}
}
