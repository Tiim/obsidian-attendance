import { Vault } from "obsidian";
import { AttendanceCodeblock } from "../src/AttendanceData";
import { TFile } from "../__mocks__/obsidian";

const CB_START = "```attendance";
const CB_END = "```";

test("Writing attendance to string", async () => {
	const codeblock = `
date: 2020-01-01
title: Test
query: #tag
`.trim();

	const src = `
# My Test File

${CB_START}
${codeblock}
${CB_END}

other notes
`;
	const vault = new Vault();
	vault.read = jest.fn(() => Promise.resolve(src));

	const modify = jest.fn((f: TFile, s: string) => Promise.resolve());
	vault.modify = modify;

	const acb = new AttendanceCodeblock(codeblock, "test/file.md", vault);
	await acb.write();

	expect(JSON.stringify(modify.mock.calls[0][1])).toBe(JSON.stringify(src));
});

test("Writing attendance with changes to string", async () => {

  const attendance = '* [[test/file.md]], "done", "test"'

  const codeblock = `
date: 2020-01-01
title: Test
query: #tag
`.trim();

  const src = `
# header

${CB_START}
${codeblock}
${CB_END}

other notes
`.trim();

  const dest = `
# header

${CB_START}
${codeblock}
${attendance}
${CB_END}

other notes
`.trim();

	const vault = new Vault();
	vault.read = jest.fn(() => Promise.resolve(src));

	const modify = jest.fn((f: TFile, s: string) => Promise.resolve());
	vault.modify = modify;

	const acb = new AttendanceCodeblock(codeblock, "test/file.md", vault);
	await acb.setState("test/file.md", "done", "test");

	expect(JSON.stringify(modify.mock.calls[0][1])).toBe(JSON.stringify(dest));

});
