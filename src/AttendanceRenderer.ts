import {
	App,
	Component,
	MarkdownPostProcessorContext,
	MarkdownRenderChild,
	MarkdownRenderer,
} from "obsidian";
import AttendancePlugin from "./main";
import {
	AttendanceEntry,
	AttendanceSource,
} from "./AttendanceData";
import { EVENT_CACHE_UPDATE, SourceCache } from "./SourceCache";
import { Link } from "./util/link";

export const CODE_BLOCK = "attendance";

export class AttendanceRenderer {
	private readonly app: App;
	private readonly cache: SourceCache;

	constructor({
		plugin,
		cache,
	}: {
		plugin: AttendancePlugin;
		cache: SourceCache;
	}) {
		this.app = plugin.app;
		this.cache = cache;

		plugin.registerMarkdownCodeBlockProcessor(
			CODE_BLOCK,
			this.addQueryRenderChild.bind(this)
		);
	}

	private async addQueryRenderChild(
		source: string,
		element: HTMLElement,
		context: MarkdownPostProcessorContext
	) {
		const attendance = new AttendanceSource(
			source,
			this.cache,
			context.sourcePath
		);
		const renderChild = new AttendanceRenderChild({
			context,
			container: element,
			attendance,
			app: this.app,
		});

		context.addChild(renderChild);
	}
}

class AttendanceRenderChild extends MarkdownRenderChild {
	private readonly context: MarkdownPostProcessorContext;

	constructor(args: {
		context: MarkdownPostProcessorContext;
		container: HTMLElement;
		attendance: AttendanceSource;
		app: App;
	}) {
		super(args.container);
		this.context = args.context;
		this.render(args.attendance);

		this.registerEvent(
			args.app.workspace.on(EVENT_CACHE_UPDATE, () =>
				this.render(args.attendance)
			)
		);
	}

	private render(a: AttendanceSource) {
		this.containerEl.innerHTML = "";
		const content = this.containerEl.createDiv({
			cls: "attendance-content",
		});
		if (a.error) {
			content.createEl("pre", { cls: "error", text: a.error.message });
		} else {
			const ul = content.createEl("ul");
			a.attendance
				.getAttendances()
				.forEach((at) => this.renderListItem(at, ul, a));
		}
	}

	private renderListItem(
		a: AttendanceEntry,
		ul: HTMLElement,
		source: AttendanceSource
	) {
		const li = ul.createEl("li");
		renderCompactMarkdown(
			new Link(a.link).markdown(),
			li,
			this.context.sourcePath,
			this
		);
		const c = li.createEl("span");

		const getClass = (btn: string, state: string) =>
			`${btn} ${state === btn ? "active" : ""}`;

		const b1 = c.createEl("button", {
			cls: getClass("present", a.state),
			text: "✓",
		});
		b1.onclick = () => source.setState(a.link, "present", a.note);
		const b2 = c.createEl("button", {
			cls: getClass("absent", a.state),
			text: "✗",
		});
		b2.onclick = () => source.setState(a.link, "absent", a.note);
		const b3 = c.createEl("button", {
			cls: getClass("excused", a.state),
			text: "⏲",
		});
		b3.onclick = () => source.setState(a.link, "excused", a.note);
	}
}

export async function renderCompactMarkdown(
	markdown: string,
	container: HTMLElement,
	sourcePath: string,
	component: Component
) {
	const subContainer = container.createSpan();
	await MarkdownRenderer.renderMarkdown(
		markdown,
		subContainer,
		sourcePath,
		component
	);

	const paragraph = subContainer.querySelector("p");
	if (subContainer.children.length == 1 && paragraph) {
		while (paragraph.firstChild) {
			subContainer.appendChild(paragraph.firstChild);
		}
		subContainer.removeChild(paragraph);
	}
}
