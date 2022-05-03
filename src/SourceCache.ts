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
import { AttendanceQuery } from "./Query";
import AttendancePlugin from "./main";
import { expandTag } from "./util/expand-tag";
import { AttendanceCodeblock } from "./AttendanceData";

export const EVENT_CACHE_UPDATE = "obsidian-attendance:cache-update";

export class SourceCache extends Component {
	/** Map paths to tags */
	private readonly app: App;
	private readonly tags = new IndexMap();
	private readonly folders;
	private readonly codeblocks = new CodeBlockCache();
	private readonly cache: MetadataCache;
	private readonly trigger: (name: string, reason: string) => void;

	constructor(app: App, plugin: AttendancePlugin) {
		super();
		this.app = app;
		this.folders = new PrefixIndex(app.vault);
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

	public getMatchingFiles(source: AttendanceQuery): Set<string> {
		switch (source.query.type) {
			case "tag":
				return this.tags.getInverse(source.query.tag);
			case "folder":
				if (this.folders.nodeExists(source.query.folder)) {
					return this.folders.get(source.query.folder);
				}
				throw new Error(`Folder "${source.query.folder}" not found`);
		}
	}
}

export class CodeBlockCache {
	private static readonly EMPTY_SET: Readonly<Set<AttendanceCodeblock>> =
		Object.freeze(new Set<AttendanceCodeblock>());
	/** Maps files to codeblocks in that file */
	private readonly map = new Map<string, Set<AttendanceCodeblock>>();

	public getAll(): Set<AttendanceCodeblock> {
		return new Set([...this.map.values()].flatMap((set) => [...set]));
	}

	public set(file: string, codeblocks: Set<AttendanceCodeblock>) {
		this.map.set(file, codeblocks);
	}

	public delete(file: string) {
		this.map.delete(file);
	}

	public rename(oldPath: string, newPath: string) {
		const codeblocks = this.map.get(oldPath);
		if (codeblocks) {
			this.map.set(newPath, codeblocks);
			this.map.delete(oldPath);
		}
	}

	public get(file: string): Set<AttendanceCodeblock> {
		const result = this.map.get(file);
		if (result) {
			return new Set(result);
		} else {
			return CodeBlockCache.EMPTY_SET;
		}
	}
}

/** A generic index which indexes variables of the form key -> value[], allowing both forward and reverse lookups. */
export class IndexMap {
	/** Maps key -> values for that key. */
	private readonly map: Map<string, Set<string>> = new Map();
	/** Cached inverse map; maps value -> keys that reference that value. */
	private readonly invMap: Map<string, Set<string>> = new Map();

	/** Returns all values for the given key. */
	public get(key: string): Set<string> {
		const result = this.map.get(key);
		if (result) {
			return new Set(result);
		} else {
			return IndexMap.EMPTY_SET;
		}
	}

	/** Returns all keys that reference the given key. Mutating the returned set is not allowed. */
	public getInverse(value: string): Readonly<Set<string>> {
		return this.invMap.get(value) || IndexMap.EMPTY_SET;
	}

	public set(key: string, values: Set<string>): this {
		if (!values.size) {
			// no need to store if no values
			this.delete(key);
			return this;
		}
		const oldValues = this.map.get(key);
		if (oldValues) {
			for (const value of oldValues) {
				// Only delete the ones we're not adding back
				if (!values.has(key)) this.invMap.get(value)?.delete(key);
				if (!this.invMap.get(value).size) {
					this.invMap.delete(value);
				}
			}
		}
		this.map.set(key, values);
		for (const value of values) {
			if (!this.invMap.has(value)) this.invMap.set(value, new Set([key]));
			else this.invMap.get(value)?.add(key);
		}
		return this;
	}

	/** Clears all values for the given key so they can be re-added. */
	public delete(key: string): boolean {
		const oldValues = this.map.get(key);
		if (!oldValues) return false;

		this.map.delete(key);
		for (const value of oldValues) {
			this.invMap.get(value)?.delete(key);
		}

		return true;
	}

	/** Rename all references to the given key to a new value. */
	public rename(oldKey: string, newKey: string): boolean {
		const oldValues = this.map.get(oldKey);
		if (!oldValues) return false;

		this.delete(oldKey);
		this.set(newKey, oldValues);
		return true;
	}

	/** Clear the entire index. */
	public clear() {
		this.map.clear();
		this.invMap.clear();
	}

	static EMPTY_SET: Readonly<Set<string>> = Object.freeze(new Set<string>());
}

/** Indexes files by their full prefix - essentially a simple prefix tree. */
export class PrefixIndex extends Component {
	private readonly vault: Vault;

	constructor(vault: Vault) {
		super();
		this.vault = vault;
	}

	private *walk(
		folder: TFolder,
		filter?: (path: string) => boolean
	): Generator<string> {
		for (const file of folder.children) {
			if (file instanceof TFolder) {
				yield* this.walk(file, filter);
			} else if (filter ? filter(file.path) : true) {
				yield file.path;
			}
		}
	}

	/** Get the list of all files under the given path. */
	public get(
		prefix: string,
		filter?: (path: string) => boolean
	): Set<string> {
		let folder = this.vault.getAbstractFileByPath(prefix || "/");
		return new Set(
			folder instanceof TFolder ? this.walk(folder, filter) : []
		);
	}

	/** Determines if the given path exists in the prefix index. */
	public pathExists(path: string): boolean {
		return this.vault.getAbstractFileByPath(path || "/") != null;
	}

	/** Determines if the given prefix exists in the prefix index. */
	public nodeExists(prefix: string): boolean {
		return (
			this.vault.getAbstractFileByPath(prefix || "/") instanceof TFolder
		);
	}
}
