import {
	App,
	Component,
	getAllTags,
	MetadataCache,
	TAbstractFile,
	TFile,
} from "obsidian";
import { AttendanceQuery } from "./AttendanceData";
import AttendancePlugin from "./main";
import {expandTag} from "./util/expand-tag";

export const EVENT_CACHE_UPDATE = "obsidian-attendance:cache-update";


export class SourceCache extends Component {
	/** Map paths to tags */
	private readonly tags = new IndexMap();
	private readonly cache: MetadataCache;
	private readonly trigger: (name: string, reason: string) => void;

	constructor(app: App, plugin: AttendancePlugin) {
		super();
		plugin.addChild(this);

		this.cache = app.metadataCache;
		this.trigger = app.workspace.trigger.bind(app.workspace);
		this.registerEvent(
			this.cache.on("changed", (file) => this.reloadFile(file))
		);
		this.registerEvent(app.vault.on("rename", (f, o) => this.rename(f, o)));
		this.registerEvent(app.vault.on("delete", (file) => this.delete(file)));


		app.vault.getMarkdownFiles().forEach((file) => this.reloadFile(file));

	}

	private rename(file: TAbstractFile, oldPath: string) {
		if (file instanceof TFile) {
			this.tags.rename(oldPath, file.path);
		}
		this.touch("rename");
	}

	private delete(file: TAbstractFile) {
		if (file instanceof TFile) {
			this.tags.delete(file.path);
		}
		this.touch("delete")
	}

	private reloadFile(file: TFile) {
		const fc = this.cache.getFileCache(file);
		const tags = new Set<string>();
		if (fc) {
			getAllTags(fc)
				.flatMap(expandTag)
				.forEach((tag) => tags.add(tag));
		}
		this.tags.set(file.path, tags);
		this.touch("reload");
	}

	private touch(reason : string) {
		console.log("Update source cache [%s] ", reason , this.tags);
		this.trigger(EVENT_CACHE_UPDATE, reason);
	}

	public getFiles(source: AttendanceQuery): Set<string> {
		if (source.type === "tag") {
			return this.tags.getInverse(source.value);
		}
	}
}

/** A generic index which indexes variables of the form key -> value[], allowing both forward and reverse lookups. */
export class IndexMap {
	/** Maps key -> values for that key. */
	map: Map<string, Set<string>>;
	/** Cached inverse map; maps value -> keys that reference that value. */
	invMap: Map<string, Set<string>>;

	/** Create a new, empty index map. */
	public constructor() {
		this.map = new Map();
		this.invMap = new Map();
	}

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
