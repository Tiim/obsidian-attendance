export class Attendance {
	public readonly date: string;
	public readonly title: string;
	public readonly source: string;
	public readonly attendances: AttendanceEntry[] = [];

  constructor(date: string, title: string, source: string, attendances: AttendanceEntry[]) {
    this.date = date;
    this.title = title;
    this.source = source;
    this.attendances = attendances;
  }
}

export class AttendanceParser {
	public attendance: Attendance;

	public parse(sourceString: string) {
		let date;
		let title;
		let source;
		let attendances: AttendanceEntry[] = [];

		sourceString.split("\n").forEach((line) => {
			line = line.trim();
			if (line.startsWith("date:")) {
				date = line.substring(5).trim();
			} else if (line.startsWith("title:")) {
				title = line.substring(6).trim();
			} else if (line.startsWith("source:")) {
				source = AttendanceSource.parse(line.substring(7).trim());
			} else if (line.startsWith("*")) {
				attendances.push(
					AttendanceEntry.parse(line.substring(1).trim())
				);
			}
		});

		if (!date || !title || !source) {
			throw new Error(
				"The elements 'date:' and 'title:' and 'source:' are required."
			);
		}

		this.attendance = new Attendance(date, title, source, attendances);
	}
}

class AttendanceEntry {
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
}

class AttendanceSource {
	public readonly type: "tag";
	public readonly value: string;

	constructor(type: "tag", value: string) {
		this.type = type;
		this.value = value;
	}

	static parse(source: string): AttendanceSource {
		return new AttendanceSource("tag", source);
	}
}