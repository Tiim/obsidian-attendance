import { Notice, TFile, type MarkdownPostProcessorContext } from "obsidian";
import { MarkdownRenderChild, MarkdownRenderer } from "obsidian";
import { CODE_BLOCK } from "../globals";
import type AttendancePlugin from "../main";
import type { AttendanceStateSetting } from "../main";
import {
	AttendanceEntry,
	AttendanceCodeblock,
	Attendance,
} from "../AttendanceData";
import type { QueryResolver } from "../resolver/query-resolver";
import { EVENT_CACHE_UPDATE } from "../globals";

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

	private async render(attendanceCodeblock: AttendanceCodeblock) {
		this.containerEl.empty();
		const content = this.containerEl.createDiv({
			cls: "attendance-content",
		});
		const header = content.createEl("span", { cls: "header" });
		const table = content.createEl("table");
		if (attendanceCodeblock.error) {
			this.renderError("Parsing", attendanceCodeblock.error.message);
			return;
		}
		const body = table.createEl("tbody");
		this.renderHeader(header, attendanceCodeblock.attendance);
		try {
			await Promise.all(
				attendanceCodeblock.attendance
					.getAttendances(
						this.resolver.resolveQuery(
							attendanceCodeblock.attendance.query
						)
					)
					.map((at) =>
						this.renderListItem(at, body, attendanceCodeblock)
					)
			);
		} catch (e) {
			this.renderError("Execution", e.message);
		}
	}

	private renderHeader(header: HTMLElement, attendance: Attendance) {
		header.createSpan({
			text: attendance.title,
			cls: "title",
		});
		header.createSpan({
			text: attendance.date.format("dddd, DD. MMM YYYY"),
			cls: "date",
		});
	}

	private renderError(type: string, errorMessage: string) {
		this.containerEl.empty();
		this.containerEl.createEl("pre", {
			cls: "error",
			text: `${type} error: ${errorMessage}`,
		});
	}

	private async renderListItem(
		attendanceEntry: AttendanceEntry,
		body: HTMLElement,
		source: AttendanceCodeblock
	) {
		const itemState = attendanceEntry.state;

		const row = body.createEl("tr", {
			cls: itemState === "" ? "inactive" : itemState,
		});

		const name = row.createEl("td");
		await MarkdownRenderer.renderMarkdown(
			this.markdownLink(attendanceEntry.link),
			name,
			this.context.sourcePath,
			this
		);
		const btnList = row.createEl("td", { cls: "btn-list" });

		const getClass = (btn: string, state: string) =>
			`${btn} ${state === btn ? "active" : ""}`;

		this.states.forEach((state) => {
			const btn = btnList.createEl("button", {
				cls: getClass(state.name, itemState),
				text: state.icon,
				attr: {
					"data-print-name": state.name,
					"aria-label": `${linkToLabel(attendanceEntry.link)}: ${
						state.name
					}`,
					style: `--bg-color: ${state.color}`,
				},
			});
			btn.onclick = async () => {
				try {
					await source.setState(attendanceEntry.link, state.name, "");
				} catch (e) {
					new Notice("Error: " + e.message);
				}
			};
		});
	}
}

function linkToLabel(link: string): string {
	return link.match(/([^/]+)$/)[1].replace(".md", "");
}
