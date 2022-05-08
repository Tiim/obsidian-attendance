import {Link} from "../../src/util/link";


test("link to markdown", () => {
  const link = new Link("test/file.md");
  expect(link.markdown()).toBe("[[test/file.md|file]]");
})

test("markdown custom display", () => {
  const link = new Link("test/file.md", "cool-file");
  expect(link.markdown()).toBe("[[test/file.md|cool-file]]");
})
