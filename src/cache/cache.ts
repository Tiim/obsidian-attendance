import { App, Component, getAllTags, MetadataCache, TAbstractFile, TFile } from "obsidian";
import type AttendancePlugin from "../main";
import { BinaryQuery, FolderQuery, LinkQuery, Query, TagQuery } from "../Query";
import { CodeBlockCache } from "./codeblock-cache";
import { FolderCache } from "./folder-cache";
import { MarkdownMetadataParser } from "../parse/markdown-metadata-parser";
import type { AttendanceCodeblock } from "src/AttendanceData";
import { expandTag } from "src/util/expand-tag";

export const EVENT_CACHE_UPDATE = "obsidian-attendance:cache-update";

export class SourceCache extends Component {
	private readonly folders;
	private readonly codeblocks = new CodeBlockCache();
	private readonly cache: MetadataCache;
	private readonly trigger: (name: string, reason: string) => void;
	private readonly markdownParser: MarkdownMetadataParser;

	constructor(app: App, plugin: AttendancePlugin) {
		super();
		this.trigger = plugin.events.trigger.bind(plugin.events);
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

		// Load markdown files after a timeout
		// This is to avoid loading all markdown files on startup
		app.vault
			.getMarkdownFiles()
			.forEach((file, index) =>
				setTimeout(() => this.reloadFile(file), 1000 + index * 50)
			);
	}

	private rename(file: TAbstractFile, oldPath: string) {
		if (file instanceof TFile) {
			this.codeblocks.rename(oldPath, file.path);
		}
		this.touch("rename");
	}

	private delete(file: TAbstractFile) {
		if (file instanceof TFile) {
			this.codeblocks.delete(file.path);
		}
		this.touch("delete");
	}

	private async reloadFile(file: TFile) {
		const data = await this.markdownParser.getMetadata(file)
		this.codeblocks.set(file.path, data.codeblocks);
		this.touch("reload");
	}

	private touch(reason: string) {
		//console.log("Update source cache [%s] ", reason , this.tags);
		this.trigger(EVENT_CACHE_UPDATE, reason);
	}

	public getMatchingFiles(source: Query): Set<string> {
		if (source instanceof TagQuery) {
			return this.filesWithTag(source.tag);
		} else if (source instanceof FolderQuery) {
			if (this.folders.nodeExists(source.folder)) {
				return this.folders.get(source.folder);
			} else {
				throw new Error("Folder " + source.folder + " does not exist");
			}
		} else if (source instanceof LinkQuery) {
			// TODO populate current file
			const file = this.cache.getFirstLinkpathDest(source.link, "")?.path;
			return this.getFilesWithLink(file);
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

	private filesWithTag(tag: string): Set<string> {
		const files = new Set<string>();
		app.vault.getMarkdownFiles().forEach((file) => {
				const fc = this.cache.getFileCache(file);
				if (fc) {
					const tags = getAllTags(fc).flatMap(expandTag);
					if (tags.includes(tag)) {
						files.add(file.path);
					}
				}
		});
		
		return files;
	}

	private getFilesWithLink(link: string): Set<string> {
		const allLinks = this.cache.resolvedLinks;
		const outLinks = Object.keys(allLinks[link] || {});
		const inLinks = Object.entries(allLinks).filter(([_, map]) => map[link]).map(([k, _]) => k);
		return new Set([...outLinks, ...inLinks]);
	}

	getCodeblocks(): Set<AttendanceCodeblock> {
		return this.codeblocks.getAll();
	}
}
