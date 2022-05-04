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
		const links = new Set<string>();
		// files that are not in the cache yet, will be handled by the "resolve" event
		if (fc) {
			getAllTags(fc)
				.flatMap(expandTag)
				.forEach((tag) => tags.add(tag));

      const allLinks = [...fc.links || [], ...fc.embeds||[]];
      allLinks.forEach((link) => links.add(this.cache.getFirstLinkpathDest(link.link,file.path)?.path));
		}

		// use promises, this is not an async function
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
