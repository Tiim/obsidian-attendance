import { App, MarkdownPostProcessorContext, MarkdownRenderChild } from "obsidian";
import AttendancePlugin from "./main";
import {Attendance, AttendanceParser} from "./AttendanceData";

export class AttendanceRenderer {
	private readonly app: App;

	constructor({
		plugin,
	}: {
		plugin: AttendancePlugin;
	}) {
		this.app = plugin.app;

		plugin.registerMarkdownCodeBlockProcessor(
			"attendance",
			this._addQueryRenderChild.bind(this)
		);
	}

	public addQueryRenderChild = this._addQueryRenderChild.bind(this);

	private async _addQueryRenderChild(
		source: string,
		element: HTMLElement,
		context: MarkdownPostProcessorContext
	) {
		context.addChild(
			new AttendanceRenderChild({
				app: this.app,
				container: element,
				source,
			})
		);
	}
}


class AttendanceRenderChild extends MarkdownRenderChild {
	private readonly source: string;

	constructor(args: {app: App, container: HTMLElement, source: string}) {
		super(args.container);
	
		this.source = args.source;
		
		console.log(this.source);
		const parser = new AttendanceParser();
		parser.parse(this.source);

		console.log(parser.attendance);

		this.render(parser.attendance);
	}

	private async render(a: Attendance) {
		const content = this.containerEl.createDiv();
		content.innerHTML = `<pre>${JSON.stringify(a, null, 2)}</pre>`;
	}
}