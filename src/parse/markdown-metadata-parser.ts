import type { TFile, Vault } from "obsidian";
import { AttendanceCodeblock } from "../AttendanceData";

type MarkdownFileMetadata = {
	codeblocks: Set<AttendanceCodeblock>;
};
export class MarkdownMetadataParser {
	constructor(
		private readonly vault: Vault
	) {}

	public async getMetadata(file: TFile): Promise<MarkdownFileMetadata> {
		const codeblocks = await AttendanceCodeblock.parseAllCodeblocksInFile(
			file,
			this.vault
		);

		return {
			codeblocks,
		};
	}
}
