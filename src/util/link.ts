import { TFile } from "obsidian";

export class Link {
	public readonly path: string;
	public readonly display?: string;

	constructor(path: string | TFile, display?: string) {
		this.display = display;
		if (typeof path === "string") {
			this.path = path;
		} else {
			this.path = path.path;
		}
	}

	public markdown() {
		const display = this.display ? this.display : this.fileName();
		return `[[${this.path}|${display}]]`;
	}

	public fileName(): string {
		let p = this.path;
    if (p.includes("/"))
			p = p.substring(p.lastIndexOf("/") + 1);
		if (p.endsWith(".md")) {
			p = p.substring(0, p.length - 3);
		}
		return p;
	}
}
