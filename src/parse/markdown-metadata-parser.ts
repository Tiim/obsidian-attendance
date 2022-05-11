import { getAllTags, MetadataCache, TFile, Vault } from "obsidian";
import { expandTag } from "../util/expand-tag";
import { AttendanceCodeblock } from "../AttendanceData";

type MarkdownFileMetadata = {
	tags: Set<string>;
	codeblocks: Set<AttendanceCodeblock>;
	links: Set<string>;
};
export class MarkdownMetadataParser {
	constructor(
		private readonly cache: MetadataCache,
		private readonly vault: Vault
	) {}

	public async getMetadata(file: TFile): Promise<MarkdownFileMetadata> {
		const fc = this.cache.getFileCache(file);
		const tags = new Set<string>();
		// files that are not in the cache yet, will be handled by the "resolve" event
		if (fc) {
			const allTags = getAllTags(fc) || [];

			allTags.flatMap(expandTag).forEach((tag) => tags.add(tag));
		}

		const links = new Set<string>(
			Object.keys(this.cache.resolvedLinks[file.path])
		);

		const codeblocks = await AttendanceCodeblock.parseAllCodeblocksInFile(
			file,
			this.vault
		);

		return {
			tags,
			codeblocks,
			links,
		};
	}
}
