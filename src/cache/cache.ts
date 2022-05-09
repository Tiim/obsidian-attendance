import { App, Component, MetadataCache, TAbstractFile, TFile } from "obsidian";
import type AttendancePlugin from "../main";
import { BinaryQuery, FolderQuery, LinkQuery, Query, TagQuery } from "../Query";
import { CodeBlockCache } from "./codeblock-cache";
import { BidirectionalMap } from "./bidirectional-map";
import { FolderCache } from "./folder-cache";
import { MarkdownMetadataParser } from "../parse/markdown-metadata-parser";
import type { AttendanceCodeblock } from "src/AttendanceData";

export const EVENT_CACHE_UPDATE = "obsidian-attendance:cache-update";

export class SourceCache extends Component {
	private readonly tags = new BidirectionalMap();
	private readonly links = new BidirectionalMap();
	private readonly folders;
	private readonly codeblocks = new CodeBlockCache();
	private readonly cache: MetadataCache;
	private readonly trigger: (name: string, reason: string) => void;
	private readonly markdownParser: MarkdownMetadataParser;

	constructor(app: App, plugin: AttendancePlugin) {
		super();
		this.trigger = app.workspace.trigger.bind(app.workspace);
		this.cache = app.metadataCache;
		this.folders = new FolderCache(app.vault);
		this.markdownParser = new MarkdownMetadataParser(this.cache, app.vault);

		plugin.addChild(this);
		this.registerEvent(
			this.cache.on("changed", (file) => this.reloadFile(file))
		);
		this.registerEvent(app.vault.on("rename", (f, o) => this.rename(f, o)));
		this.registerEvent(app.vault.on("delete", (file) => this.delete(file)));
		this.registerEvent(
			this.cache.on("resolve", (file) => this.reloadFile(file))
		);

		app.vault.getMarkdownFiles().forEach((file) => this.reloadFile(file));
	}

	private rename(file: TAbstractFile, oldPath: string) {
		if (file instanceof TFile) {
			this.tags.rename(oldPath, file.path);
			this.codeblocks.rename(oldPath, file.path);
			this.links.rename(oldPath, file.path);
		}
		this.touch("rename");
	}

	private delete(file: TAbstractFile) {
		if (file instanceof TFile) {
			this.tags.delete(file.path);
			this.codeblocks.delete(file.path);
			this.links.delete(file.path);
		}
		this.touch("delete");
	}

	private reloadFile(file: TFile) {
		this.markdownParser.getMetadata(file).then((data) => {
			this.tags.set(file.path, data.tags);
			this.codeblocks.set(file.path, data.codeblocks);
			this.links.set(file.path, data.links);
			this.touch("reload");
		});
	}

	private touch(reason: string) {
		//console.log("Update source cache [%s] ", reason , this.tags);
		this.trigger(EVENT_CACHE_UPDATE, reason);
	}

	public getMatchingFiles(source: Query): Set<string> {
		if (source instanceof TagQuery) {
			return this.tags.getInverse(source.tag);
		} else if (source instanceof FolderQuery) {
			if (this.folders.nodeExists(source.folder)) {
				return this.folders.get(source.folder);
			} else {
				throw new Error("Folder " + source.folder + " does not exist");
			}
		} else if (source instanceof LinkQuery) {
			// TODO populate current file
			const file = this.cache.getFirstLinkpathDest(source.link, "")?.path;

			const outgoing = this.links.get(file);
			const incomming = this.links.getInverse(file);

			return new Set([...outgoing, ...incomming]);
		} else if (source instanceof BinaryQuery) {
			const left = this.getMatchingFiles(source.left);
			const right = this.getMatchingFiles(source.right);

			if (source.operation === "and") {
				//intersection of sets
				return new Set([...left].filter((x) => right.has(x)));
			} else if (source.operation === "or") {
				//union of sets
				return new Set([...left, ...right]);
			}
			throw new Error("Unknown operation " + source.operation);
		} else {
			throw new Error(
				"Query type '" + source.getType() + "' not yet supported"
			);
		}
	}


	getCodeblocks(): Set<AttendanceCodeblock> {
		return this.codeblocks.getAll();
	}
}
