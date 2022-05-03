import { BinaryQuery, FolderQuery, TagQuery } from "../src/Query";
import {
	QueryParser,
	ParensToken,
	KeywordToken,
	SrcToken,
} from "../src/parse/query";

test("parsing tag", () => {
	const parser = new QueryParser("#tag");
	const tokens = parser.parseTag("#tag", 0);
	const expected = { token: new SrcToken("tag", "tag"), newPos: 4 };
	expect(tokens).toEqual(expected);
});

test("parsing tokens tag", () => {
	const query = "#test-tag";
	const parser = new QueryParser(query);
	const tokens = parser.tokenize(query);
	const expected = [new SrcToken("tag", "test-tag")];
	expect(tokens).toEqual(expected);
});

test("parsing tokens folder", () => {
	const query = `"test-folder"`;
	const parser = new QueryParser(query);
	const tokens = parser.tokenize(query);
	const expected = [new SrcToken("folder", "test-folder")];
	expect(tokens).toEqual(expected);
});

test("parsing tokens link", () => {
	const query = `[[test-file]]`;
	const parser = new QueryParser(query);
	const tokens = parser.tokenize(query);
	const expected = [new SrcToken("link", "test-file")];
	expect(tokens).toEqual(expected);
});

test("parsing tokens expression", () => {
	const query = `("test-folder" and #tag)`;
	const parser = new QueryParser(query);
	const tokens = parser.tokenize(query);
	expect(tokens).toEqual([
		new ParensToken(true),
		new SrcToken("folder", "test-folder"),
		new KeywordToken("and"),
		new SrcToken("tag", "tag"),
		new ParensToken(false),
	]);
});

test("AST", () => {
	const tokens = [
		new ParensToken(true),
		new SrcToken("folder", "test-folder"),
		new KeywordToken("and"),
		new SrcToken("tag", "tag"),
		new ParensToken(false),
	];
	const parser = new QueryParser("");
	const ast = parser.parse(tokens);

	const expected = new BinaryQuery(
		"and",
		new FolderQuery("test-folder"),
		new TagQuery("tag")
	);
	expect(ast).toEqual(expected);
});

test("Full parsing", () => {
	const query = `("test-folder" and #tag) or ("test-folder2" and #tag2)`;
	const parser = new QueryParser(query);
	const tokens = parser.tokenize(query);
	expect(tokens).toEqual([
		new ParensToken(true),
		new SrcToken("folder", "test-folder"),
		new KeywordToken("and"),
		new SrcToken("tag", "tag"),
		new ParensToken(false),
		new KeywordToken("or"),
		new ParensToken(true),
		new SrcToken("folder", "test-folder2"),
		new KeywordToken("and"),
		new SrcToken("tag", "tag2"),
		new ParensToken(false),
	]);
	const ast = parser.parse(tokens);

	const expected: BinaryQuery = new BinaryQuery(
		"or",
		new BinaryQuery(
			"and",
			new FolderQuery("test-folder"),
			new TagQuery("tag")
		),
		new BinaryQuery(
			"and",
			new FolderQuery("test-folder2"),
			new TagQuery("tag2")
		)
	);

	expect(ast).toEqual(expected);
});

test("Full parsing flat", () => {
	const query = `"test-folder" and #tag or "test-folder2" and #tag2`;
	const parser = new QueryParser(query);
	const tokens = parser.tokenize(query);
	expect(tokens).toEqual([
		new SrcToken("folder", "test-folder"),
		new KeywordToken("and"),
		new SrcToken("tag", "tag"),
		new KeywordToken("or"),
		new SrcToken("folder", "test-folder2"),
		new KeywordToken("and"),
		new SrcToken("tag", "tag2"),
	]);
	const ast = parser.parse(tokens);

	const expected: BinaryQuery = new BinaryQuery(
		"and",
		new FolderQuery("test-folder"),
		new BinaryQuery(
			"or",
			new TagQuery("tag"),
			new BinaryQuery(
				"and",
				new FolderQuery("test-folder2"),
				new TagQuery("tag2")
			)
		)
	);

	expect(ast).toEqual(expected);
});

test("AST with and without parens", () => {
	const query1 = `"test-folder" and #tag or "test-folder2" and #tag2`;
	const parser1 = new QueryParser(query1);
	const tokens1 = parser1.tokenize(query1);
	const ast1 = parser1.parse(tokens1);

	const query2 = `"test-folder" and (#tag or ("test-folder2" and #tag2))`;
	const parser2 = new QueryParser(query2);
	const tokens2 = parser2.tokenize(query2);
	const ast2 = parser2.parse(tokens2);

	expect(ast1).toEqual(ast2);
});

test("invalid query", () => {
	debugger;
	const query1 = `person`;
	const parser1 = new QueryParser(query1);
	expect(() => parser1.tokenize(query1)).toThrow();
});
