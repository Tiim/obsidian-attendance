import {
	App,
	Component,
	getAllTags,
	MetadataCache,
	TAbstractFile,
	TFile,
	TFolder,
	Vault,
} from "obsidian";
import AttendancePlugin from "./main";
import { expandTag } from "./util/expand-tag";
import { AttendanceCodeblock } from "./AttendanceData";
import { FolderQuery, Query, TagQuery } from "./Query";
import { CodeBlockCache } from "./cache/codeblock-cache";
import { BidirectionalMap } from "./cache/bidir-map";
import { FolderCache } from "./cache/folder-cache";

export const EVENT_CACHE_UPDATE = "obsidian-attendance:cache-update";

export class SourceCache extends Component {
	/** Map paths to tags */
	private readonly app: App;
	private readonly tags = new BidirectionalMap();
	private readonly folders;
	private readonly codeblocks = new CodeBlockCache();
	private readonly cache: MetadataCache;
	private readonly trigger: (name: string, reason: string) => void;

	constructor(app: App, plugin: AttendancePlugin) {
		super();
		this.app = app;
		this.folders = new FolderCache(app.vault);
		plugin.addChild(this);

		this.cache = app.metadataCache;
		this.trigger = app.workspace.trigger.bind(app.workspace);
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
		}
		this.touch("rename");
	}

	private delete(file: TAbstractFile) {
		if (file instanceof TFile) {
			this.tags.delete(file.path);
			this.codeblocks.delete(file.path);
		}
		this.touch("delete");
	}

	private reloadFile(file: TFile) {
		const fc = this.cache.getFileCache(file);
		const tags = new Set<string>();
		// files that are not in the cache yet, will be handled by the "resolve" event
		if (fc) {
			getAllTags(fc)
				.flatMap(expandTag)
				.forEach((tag) => tags.add(tag));
		}
		this.tags.set(file.path, tags);

		// use promises, this is not an async function
		AttendanceCodeblock.parseAllCodeblocksInFile(file).then((blocks) => {
			this.codeblocks.set(file.path, blocks);
			this.touch("reload");
		});

		this.touch("reload");
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
		} else {
			throw new Error("Query type not yet supported");
		}
	}
}
