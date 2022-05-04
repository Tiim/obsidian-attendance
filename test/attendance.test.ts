import { Vault } from "obsidian";
import { AttendanceCodeblock } from "../src/AttendanceData";
import { TFile } from "../__mocks__/obsidian";
test("Writing attendance to string", async () => {

  const codeblock = `
date: 2020-01-01
title: Test
query: #tag
`.trim();

const cbstart = "```attendance";
const cbend = "```";

const src = `
# My Test File

${cbstart}
${codeblock}
${cbend}

other notes
`;
  const vault = new Vault();
  vault.read = jest.fn(() => Promise.resolve(src));
  
  const modify = jest.fn((f: TFile, s: string) => Promise.resolve());
  vault.modify = modify;


  const acb = new AttendanceCodeblock(codeblock, "test/file.md", vault);
  await acb.write()

  expect(JSON.stringify(modify.mock.calls[0][1])).toBe(JSON.stringify(src));

})