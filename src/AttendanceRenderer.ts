import {
	App,
	Component,
	MarkdownPostProcessorContext,
	MarkdownRenderChild,
	MarkdownRenderer,
} from "obsidian";
import {CODE_BLOCK} from "./globals";
import AttendancePlugin, { AttendanceStateSetting } from "./main";
import { AttendanceEntry, AttendanceCodeblock } from "./AttendanceData";
import { EVENT_CACHE_UPDATE, SourceCache } from "./SourceCache";
import { Link } from "./util/link";

export class AttendanceRenderer {
	private readonly app: App;
	private readonly cache: SourceCache;
	private readonly states: AttendanceStateSetting[];

	constructor({
		plugin,
		cache,
		states,
	}: {
		plugin: AttendancePlugin;
		cache: SourceCache;
		states: AttendanceStateSetting[];
	}) {
		this.app = plugin.app;
		this.cache = cache;
		this.states = states;

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
		const attendance = new AttendanceCodeblock(source, context.sourcePath, this.app.vault);

		const renderChild = new AttendanceRenderChild({
			context,
			container: element,
			attendance,
			app: this.app,
			states: this.states,
			cache: this.cache,
		});

		context.addChild(renderChild);
	}
}

class AttendanceRenderChild extends MarkdownRenderChild {
	private readonly context: MarkdownPostProcessorContext;
	private readonly states: AttendanceStateSetting[];
	private readonly cache: SourceCache;

	constructor(args: {
		context: MarkdownPostProcessorContext;
		container: HTMLElement;
		attendance: AttendanceCodeblock;
		app: App;
		states: AttendanceStateSetting[];
		cache: SourceCache;
	}) {
		super(args.container);
		this.context = args.context;
		this.states = args.states;
		this.cache = args.cache;

		this.render(args.attendance);
		this.registerEvent(
			args.app.workspace.on(EVENT_CACHE_UPDATE, () =>
				this.render(args.attendance)
			)
		);
	}

	private render(a: AttendanceCodeblock) {
		this.containerEl.innerHTML = "";
		const content = this.containerEl.createDiv({
			cls: "attendance-content",
		});
		if (a.error) {
			this.renderError("Parsing", a.error.message);
			return;
		}
		const ul = content.createEl("ul");
		try {
			a.attendance
				.getAttendances(this.cache)
				.forEach((at) => this.renderListItem(at, ul, a));
		} catch (e) {
			this.renderError("Execution", e.message);
		}
	}

	private renderError(type: string, errorMessage: string) {
		this.containerEl.innerHTML = "";
		this.containerEl.createEl("pre", {
			cls: "error",
			text: `${type} error: ${errorMessage}`,
		});
	}

	private renderListItem(
		a: AttendanceEntry,
		ul: HTMLElement,
		source: AttendanceCodeblock
	) {
		const itemState = a.state;

		const li = ul.createEl("li", {
			cls: itemState === "" ? "inactive" : itemState,
		});
		renderCompactMarkdown(
			new Link(a.link).markdown(),
			li,
			this.context.sourcePath,
			this
		);
		const c = li.createEl("span", { cls: "btn-list" });

		const getClass = (btn: string, state: string) =>
			`${btn} ${state === btn ? "active" : ""}`;

		this.states.forEach((state) => {
			const btn = c.createEl("button", {
				cls: getClass(state.name, itemState),
				text: state.icon,
				attr: {
					"data-print-name": state.name,
					"aria-label": state.name,
					style: `--bg-color: ${state.color}`,
				},
			});
			btn.onclick = () => source.setState(a.link, state.name, "");
		});
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
