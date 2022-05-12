import {Notice, TFile, type MarkdownPostProcessorContext} from "obsidian"
import {
	Component,
	MarkdownRenderChild,
	MarkdownRenderer,
} from "obsidian";
import {CODE_BLOCK} from "../globals";
import type AttendancePlugin from "../main";
import type { AttendanceStateSetting } from "../main";
import { AttendanceEntry, AttendanceCodeblock } from "../AttendanceData";
import type {  QueryResolver } from "../resolver/query-resolver";
import {EVENT_CACHE_UPDATE} from "../globals";

export class AttendanceCodeblockRenderer {
	private readonly plugin: AttendancePlugin;
	private readonly resolver: QueryResolver;
	private readonly states: AttendanceStateSetting[];

	constructor({
		plugin,
		resolver,
		states,
	}: {
		plugin: AttendancePlugin;
		resolver: QueryResolver;
		states: AttendanceStateSetting[];
	}) {
		this.plugin = plugin;
		this.resolver = resolver;
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
		const attendance = new AttendanceCodeblock(
			source,
			context.sourcePath,
			this.plugin.app.vault
		);

		const renderChild = new AttendanceRenderChild({
			context,
			container: element,
			attendance,
			plugin: this.plugin,
			states: this.states,
			resolver: this.resolver,
		});

		context.addChild(renderChild);
	}
}

class AttendanceRenderChild extends MarkdownRenderChild {
	private readonly context: MarkdownPostProcessorContext;
	private readonly states: AttendanceStateSetting[];
	private readonly resolver: QueryResolver;
	private readonly markdownLink: (file: string) => string;

	constructor(args: {
		context: MarkdownPostProcessorContext;
		container: HTMLElement;
		attendance: AttendanceCodeblock;
		plugin: AttendancePlugin;
		states: AttendanceStateSetting[];
		resolver: QueryResolver;
	}) {
		super(args.container);
		this.context = args.context;
		this.states = args.states;
		this.resolver = args.resolver;

		this.markdownLink = (link: string) => {
			const aFile = args.plugin.app.vault.getAbstractFileByPath(link);
			if (aFile instanceof TFile) {
				return args.plugin.app.fileManager.generateMarkdownLink(
					aFile,
					this.context.sourcePath
				);
			}
			return `[[${link}]]`;
		};

		this.render(args.attendance);
		this.registerEvent(
			args.plugin.events.on(EVENT_CACHE_UPDATE, () =>
				this.render(args.attendance)
			)
		);
	}

	private render(attendanceCodeblock: AttendanceCodeblock) {
		this.containerEl.empty();
		const content = this.containerEl.createDiv({
			cls: "attendance-content",
		});
		if (attendanceCodeblock.error) {
			this.renderError("Parsing", attendanceCodeblock.error.message);
			return;
		}
		const ul = content.createEl("ul");
		try {
			attendanceCodeblock.attendance
				.getAttendances(this.resolver.resolveQuery(attendanceCodeblock.attendance.query))
				.forEach((at) =>
					this.renderListItem(at, ul, attendanceCodeblock)
				);
		} catch (e) {
			this.renderError("Execution", e.message);
		}
	}

	private renderError(type: string, errorMessage: string) {
		this.containerEl.empty();
		this.containerEl.createEl("pre", {
			cls: "error",
			text: `${type} error: ${errorMessage}`,
		});
	}

	private renderListItem(
		attendanceEntry: AttendanceEntry,
		ul: HTMLElement,
		source: AttendanceCodeblock
	) {
		const itemState = attendanceEntry.state;

		const li = ul.createEl("li", {
			cls: itemState === "" ? "inactive" : itemState,
		});
		renderCompactMarkdown(
			this.markdownLink(attendanceEntry.link),
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
			btn.onclick = async () => {
				try {
					await source.setState(attendanceEntry.link, state.name, "");
				} catch (e) {
					new Notice("Error: "+ e.message);
				}
			};
		});
	}
}

export async function renderCompactMarkdown(
	markdown: string,
	container: HTMLElement,
	sourcePath: string,
	component: Component
) {
	const subContainer = container.createSpan({cls: "attendance-compact"});
	await MarkdownRenderer.renderMarkdown(
		markdown,
		subContainer,
		sourcePath,
		component
	);
}
