import { BinaryQuery, FolderQuery, LinkQuery, Query, TagQuery } from "../Query";

type KeyWord = "and" | "or";
type ParseTokenOutput<T extends Token> = { token: T; newPos: number };

export class QueryParser {
	public static readonly keywords: KeyWord[] = ["and", "or"];

	constructor(private readonly query: string) {}

  public parseQuery(): Query {
    const tokens = this.tokenize(this.query);
    return this.parse(tokens);
  }

	public parse(tokens: Token[]): Query {
		const {q: query} =  this.parseRecursive(
			[
				new ParensToken(true),
				...tokens,
        new ParensToken(false)
      ],
			0
		);
    return query;
	}

	private parseRecursive(tokens: Token[], pos: number): {consumed: number, q:Query} {
    let currentQuery: Query;
		for (let i = 0; true; i++) {
      if (pos + i >= tokens.length) {
        return {consumed: i + 1, q: currentQuery};
			}
			const token = tokens[pos + i];
      console.log("parseRecursive", token);
			if (token instanceof ParensToken) {
				if (token.isStart()) {
					const {consumed, q: query} = this.parseRecursive(tokens, pos + 1);
          i += consumed;
          currentQuery = query;
				} else {
					return {consumed: i + 1, q: currentQuery};
				}
			} else {
				if (token instanceof KeywordToken) {
          if (token.isBinary()) {
            const left = currentQuery;
            const {consumed, q: right} = this.parseRecursive(tokens, pos + i + 1);
            i += consumed;
            currentQuery = new BinaryQuery(token.getKeyword(), left, right);
          }
        } else if (token instanceof SrcToken) {
          currentQuery = token.toQuery();
        } else {
          throw new Error("Invalid token " + token);
        }
			}
		}
  }

	public tokenize(query: string): Token[] {
		const tokens: Token[] = [];
		let pos = 0;
		while (true) {
			if (pos >= query.length) {
				return;
			} else if (query[pos] === " " || query[pos] === "\t") {
				pos++;
			} else if (query[pos] === "#") {
				let { token, newPos } = this.parseTag(query, pos);
				pos = newPos;
				tokens.push(token);
			} else if (query[pos] === '"') {
				let { token, newPos } = this.parseFolder(query, pos);
				pos = newPos;
				tokens.push(token);
      } else if (query[pos] === "[") {
        let { token, newPos } = this.parseLink(query, pos);
        pos = newPos;
        tokens.push(token);
			} else if (query[pos] === "(") {
				pos++;
				tokens.push(new ParensToken(true));
			} else if (query[pos] === ")") {
				pos++;
				tokens.push(new ParensToken(false));
			} else {
				let { token, newPos } = this.parseKeyword(query, pos);
				pos = newPos;
				tokens.push(token);
			}
			if (pos >= query.length) {
				break;
			}
		}
		return tokens;
	}

	private static readonly LETTERS_REGEX = /[a-zA-Z]/;
	public parseKeyword(
		query: string,
		pos: number
	): ParseTokenOutput<KeywordToken> {
		const oldPos = pos;
		while (QueryParser.LETTERS_REGEX.test(query[pos])) {
			pos++;
		}
		const token = query.substring(oldPos, pos) as KeyWord;
		if (!QueryParser.keywords.includes(token)) {
			throw new Error(
				"Invalid keyword '" + token + "' at position " + oldPos
			);
		}
		return { token: new KeywordToken(token), newPos: pos + 1 };
	}

	public parseFolder(
		query: string,
		pos: number
	): ParseTokenOutput<SrcToken> {
		if (query[pos] !== '"') {
			throw new Error(
				'Expected " at position ' + pos + " got " + query[pos]
			);
		}
		const oldPos = pos;
		pos = query.indexOf('"', pos + 1);
		if (pos < 0) {
			throw new Error("Unterminated folder token at position " + oldPos);
		}
		pos += 1;
		const token = query.substring(oldPos + 1, pos - 1);
		return { token: new SrcToken("folder", token), newPos: pos };
	}

	public parseTag(query: string, pos: number): ParseTokenOutput<SrcToken> {
		if (query[pos] !== "#") {
			throw new Error(
				"Expected tag at position " + pos + " got " + query[pos]
			);
		}
		const oldPos = pos;
		const len =
			query.substring(pos + 1).match(/[a-zA-Z0-9_\-\/]+/)[0].length + 1;
		const token = query.substring(oldPos + 1, oldPos + len);
		return { token: new SrcToken("tag",token), newPos: oldPos + len };
	}

  public parseLink(query: string, pos: number): ParseTokenOutput<SrcToken> {
    if (query[pos] !== "[" && query[pos+1] !== "[") {
      throw new Error(
        "Expected tag at position " + pos + " got " + query[pos]
      );
    }
    const oldPos = pos;
    pos = query.indexOf("]]", pos);
    if (pos < 0) {
      throw new Error("Unterminated link token at position " + oldPos);
    }
    pos += 2;
    const token = query.substring(oldPos + 2, pos - 2);
    return { token: new SrcToken("link",token), newPos: pos };
  }
}


abstract class Token {
  abstract getType(): string;
}

export class SrcToken extends Token {
  constructor(private readonly type: "tag" | "folder" | "link", private readonly value: string) {
		super();
	}
	getValue() {
		return this.value;
	}
	getType() {
		return this.type;
	}
  toString() {
    if (this.type === "tag") {
      return "#" + this.value;
    } else if (this.type === "folder") {
      return '"' + this.value + '"';
    } else if (this.type === "link") {
      return "[[" +this.value + "]]";
    }
  }
  toQuery(): Query {
    if (this.type === "tag") {
      return new TagQuery(this.value);
    } else if (this.type === "folder") {
      return new FolderQuery(this.value);
    } else if (this.type === "link") {
      return new LinkQuery(this.value);
    }
  }
}

export class ParensToken extends Token{
  constructor(private readonly start: boolean) {
    super();
  }
  isStart() {
    return this.start;
  }
  getType() {
    return "parens";
  }
  toString() {
    return this.start ? "(" : ")";
  }
}

export class KeywordToken extends Token {
  constructor(private readonly keyword: KeyWord) {
    super();
    this.keyword = keyword;
  }
  getKeyword() {
    return this.keyword;
  }
  isBinary() {
    return this.keyword === "and" || this.keyword === "or";
  }
  getType() {
    return "keyword";
  }
  toString() {
    return this.keyword;
  }
}