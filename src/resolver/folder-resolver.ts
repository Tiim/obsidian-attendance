import { TFolder, Vault } from "obsidian";

/** Indexes files by their full prefix - essentially a simple prefix tree. */
export class FolderResolver {
	private readonly vault: Vault;

	constructor(vault: Vault) {
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
		const folder = this.vault.getAbstractFileByPath(prefix || "/");
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
