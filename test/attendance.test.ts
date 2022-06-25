import { Vault, TFile } from 'obsidian';
import { BinaryQuery, FolderQuery, TagQuery } from '../src/Query';
import {
  AttendanceCodeblock,
  Attendance,
  AttendanceEntry,
} from '../src/AttendanceData';
import moment from 'moment';

const CB_START = '```attendance';
const CB_END = '```';

test('parsing attendance code block', () => {
  const codeblock = `
    date: 2020-01-01
    title: Test
    query: "test-folder" or #tag2
  `;
  const attendance = new AttendanceCodeblock(
    codeblock,
    'test.md',
    new Vault()
  );

  expect(attendance.attendance.date.format('YYYY-MM-DD')).toBe('2020-01-01');
  expect(attendance.attendance.title).toBe('Test');
  expect(attendance.attendance.query).toEqual(
    new BinaryQuery(
      'or',
      new FolderQuery('test-folder'),
      new TagQuery('tag2')
    )
  );
});

test('Attendance toString', () => {
  const attendance = new Attendance(
    moment('2022-01-01'),
    'Test Title',
    new FolderQuery('test-folder'),
    [
      new AttendanceEntry('test1.md', 'present', ''),
      new AttendanceEntry('test2.md', 'present', ''),
      new AttendanceEntry('test3.md', 'present', ''),
      new AttendanceEntry('test4.md', 'present', ''),
    ],
    'test.md'
  );
  expect(attendance.toString()).toBe(
    'date: 2022-01-01\ntitle: Test Title\nquery: "test-folder"\n' +
      '- [[test1.md]], "present", ""\n- [[test2.md]], "present", ""\n' +
      '- [[test3.md]], "present", ""\n- [[test4.md]], "present", ""\n'
  );
});

test('Writing attendance to string', async () => {
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

  const acb = new AttendanceCodeblock(codeblock, 'test/file.md', vault);
  await acb.write();

  expect(JSON.stringify(modify.mock.calls[0][1])).toBe(JSON.stringify(src));
});

test('Writing attendance first char in file', async () => {
  const fileContent = `\`\`\`attendance
date: 2022-01-01
title: Links Test
query: [[Winona Philpott]]
\`\`\`

`;
  const vault = new Vault();
  vault.read = jest.fn(() => Promise.resolve(fileContent));
  const modify = jest.fn((f: TFile, s: string) => Promise.resolve());
  vault.modify = modify;

  const attendanceCodeblock = new AttendanceCodeblock(fileContent.replace(/```/g, ''), 'test/file.md', vault);
  await attendanceCodeblock.write();

  expect(JSON.stringify(modify.mock.calls[0][1])).toBe(
    JSON.stringify(fileContent)
  );
});

test('Writing attendance with changes to string', async () => {
  const attendance = '- [[test/file.md]], "done", "test"';

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

  const acb = new AttendanceCodeblock(codeblock, 'test/file.md', vault);
  await acb.setState('test/file.md', 'done', 'test');

  expect(JSON.stringify(modify.mock.calls[0][1])).toBe(JSON.stringify(dest));
});

test('parse all codeblocks in file', async () => {
  const src = `
# My Test File

${CB_START}
date: 2020-01-01
title: Test 1
query: #tag
${CB_END}

${CB_START}
date: 2020-01-02
title: Test 2
query: "folder"
${CB_END}

${CB_START}
date: 2020-01-03
title: Test 3
query: #tag2
${CB_END}

`;
  const vault = new Vault();
  vault.read = jest.fn(() => Promise.resolve(src));
  const file = new TFile();
  const cbs = await AttendanceCodeblock.parseAllCodeblocksInFile(file, vault);

  expect(cbs.size).toBe(3);
  const list = [...cbs.values()];
  expect(
    list.find(
      (p) =>
        p.attendance.title === 'Test 1' &&
        p.attendance.date.format('YYYY-MM-DD') === '2020-01-01' &&
        p.attendance.query.toString() === '#tag'
    )
  ).toBeDefined();
  expect(
    list.find(
      (p) =>
        p.attendance.title === 'Test 2' &&
        p.attendance.date.format('YYYY-MM-DD') === '2020-01-02' &&
        p.attendance.query.toString() === '"folder"'
    )
  ).toBeDefined();
  expect(
    list.find(
      (p) =>
        p.attendance.title === 'Test 3' &&
        p.attendance.date.format('YYYY-MM-DD') === '2020-01-03' &&
        p.attendance.query.toString() === '#tag2'
    )
  ).toBeDefined();
});

test('parse attendance entry', () => {
  const entry = '[[test.md]], "present", ""';
  const attendance = AttendanceEntry.parse(entry);
  expect(attendance.link).toBe('test.md');
  expect(attendance.state).toBe('present');
  expect(attendance.note).toBe('');
});
