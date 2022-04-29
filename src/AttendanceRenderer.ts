import { App, MarkdownPostProcessorContext, MarkdownRenderChild, MarkdownRenderer, TFile } from "obsidian";
import AttendancePlugin from "./main";
import {Attendance, AttendanceEntry, parseAttendanceSource} from "./AttendanceData";
import { EVENT_CACHE_UPDATE, SourceCache } from "./SourceCache";






export class AttendanceRenderer {
	private readonly app: App;
	private readonly cache: SourceCache;

	constructor({
		plugin,
		cache,
	}: {
		plugin: AttendancePlugin;
		cache: SourceCache
	}) {
		this.app = plugin.app;
		this.cache = cache;

		const processor = plugin.registerMarkdownCodeBlockProcessor(
			"attendance",
			this.addQueryRenderChild.bind(this)
		);
	}

	private async addQueryRenderChild(
		source: string,
		element: HTMLElement,
		context: MarkdownPostProcessorContext
	) {

		const attendance = parseAttendanceSource(source, this.cache);
		const renderChild = new AttendanceRenderChild({
			context,
			container: element,
			attendance,
			app: this.app
		});
	
		context.addChild(renderChild);
	}
}


class AttendanceRenderChild extends MarkdownRenderChild {
	private readonly context: MarkdownPostProcessorContext;

	constructor(args: {context: MarkdownPostProcessorContext, container: HTMLElement, attendance: Attendance, app: App}) {
		super(args.container);
		this.context = args.context;
		this.render(args.attendance);
		
		this.registerEvent(args.app.workspace.on(EVENT_CACHE_UPDATE, () => this.render(args.attendance)));
	}


	private render(a: Attendance) {
		this.containerEl.innerHTML = "";
		const content = this.containerEl.firstChild || this.containerEl.createDiv();
		const ul = content.createEl("ul");
		a.getAttendances().forEach((a) => this.renderListItem(a, ul));
	}

	private renderListItem(a: AttendanceEntry, ul: HTMLElement) {
		const li = ul.createEl("li");

		console.log("Render item", a);
		

		MarkdownRenderer.renderMarkdown("[["+ a.link + "]], ", li, this.context.sourcePath, this);
	} 
}