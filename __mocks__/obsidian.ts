import moment_2 from "moment";

/** Basic obsidian abstraction for any file or folder in a vault. */
export abstract class TAbstractFile {
	/**
	 * @public
	 */
	vault: Vault;
	/**
	 * @public
	 */
	path: string;
	/**
	 * @public
	 */
	name: string;
	/**
	 * @public
	 */
	parent: TFolder;
}

/** Tracks file created/modified time as well as file system size. */
export interface FileStats {
	/** @public */
	ctime: number;
	/** @public */
	mtime: number;
	/** @public */
	size: number;
}

/** A regular file in the vault. */
export class TFile extends TAbstractFile {
	stat: FileStats;
	basename: string;
	extension: string;
}

/** A folder in the vault. */
export class TFolder extends TAbstractFile {
	children: TAbstractFile[];

	isRoot(): boolean {
		return false;
	}
}

export class Vault {
	modify(f: TFile, data: string): Promise<void> {
		return Promise.resolve();
	}

	read(f: TFile): Promise<string> {
		return Promise.resolve("");
	}

	getAbstractFileByPath(path: string): TAbstractFile {
		return new TFile();
	}
}

export const moment = moment_2;