export interface TagQuery {
	type: "tag";
	tag: string;
}

export interface FolderQuery {
	type: "folder";
	folder: string;
}

export interface BinaryQuery {
	type: "binary";
	operation: "and" | "or";
	left: Query;
	right: Query;
}

export type Query = TagQuery | FolderQuery;

/** The query field of the attendance code block. */
export class AttendanceQuery {
	public readonly query: Query;

	constructor(query: Query) {
		this.query = query;
	}

	static parse(query: string): AttendanceQuery {
		if (query.startsWith("#")) {
			return new AttendanceQuery({ type: "tag", tag: query });
		} else if (query.startsWith('"') && query.endsWith('"')) {
			return new AttendanceQuery({
				type: "folder",
				folder: query.substring(1, query.length - 1),
			});
		} else {
			throw new Error(
				"Invalid query format: " +
					query +
					". Needs to be a tag or a folder."
			);
		}
	}

	static equals(a: AttendanceQuery, b: AttendanceQuery): boolean {
		if (!a || !b) {
			return false;
		} else if (a.query.type !== b.query.type) {
			return false;
		} else if (a.query.type === "tag" && b.query.type === "tag") {
			return a.query.tag === b.query.tag;
		} else if (a.query.type === "folder" && b.query.type === "folder") {
			return a.query.folder === b.query.folder;
		}
		return false;
	}

	toString(): string {
		if (this.query.type === "tag") {
			return this.query.tag;
		} else if (this.query.type === "folder") {
			return `"${this.query.folder}"`;
		}
	}
}


type TagToken = TagQuery
type FolderToken = FolderQuery
type ParensToken = {
  type: "parens";
  value: "left" | "right";
}
type KeyWord = "and" | "or";
type KeywordToken = {
  type: "keyword";
  value: KeyWord;
}

type Token = TagToken | FolderToken | ParensToken | KeywordToken;

class QueryParser {
  public static readonly keywords: KeyWord[] = ["and", "or"];
  private readonly query: string;
  private readonly tokens: Token[] = [];
  private pos = 0;

  constructor(query: string) {
    this.query = query.trim();
  }

  private tokenize() {
    while(true) {
      if (this.pos >= this.query.length) {
        return;
      } else if (this.query[this.pos] === " ") {
        this.pos++;
      } else if (this.query[this.pos] === "#") {
        this.tokens.push(this.parseTag());
      } else if (this.query[this.pos] === "\"") {
        this.tokens.push(this.parseFolder());
      } else if (this.query[this.pos] === "(") {
        this.tokens.push({ type: "parens", value: "left" });
      } else if (this.query[this.pos] === ")") {
        this.tokens.push({ type: "parens", value: "right" });
      } else {
        this.tokens.push(this.parseKeyword());
      }
    }  
  }

  parseKeyword(): KeywordToken {
    const oldPos = this.pos;
    let c = this.query[this.pos];
    while (c.match(/[a-zA-Z]/)) {
      this.pos++;
    }
    const token = this.query.substring(oldPos, this.pos-1) as KeyWord;
    if (QueryParser.keywords.includes(token)) {
      throw new Error("Invalid keyword " + token + " at position " + oldPos);
    }
    return { type: "keyword", value: token };
  }

  parseFolder(): FolderToken {
    if (this.query[this.pos] !== "\"") {
      throw new Error("Expected \" at position " + this.pos + " got " + this.query[this.pos]);
    }
    const oldPos = this.pos;
    this.pos = this.query.indexOf("\"", this.pos);
    if (this.pos < 0) {
      throw new Error("Unterminated folder token at position " + oldPos);
    }
    this.pos += 1;
    const token = this.query.substring(oldPos + 1, this.pos-1);
    return { type: "folder", folder: token };
  }

  parseTag(): TagToken {
    if (this.query[this.pos] !== "#") {
      throw new Error("Expected tag at position " + this.pos + " got " + this.query[this.pos]);
    }
    const oldPos = this.pos;
    this.pos = this.query.indexOf(" ", this.pos);
    if (this.pos < 0) {
      this.pos = this.query.length;
    }
    const token = this.query.substring(oldPos, this.pos-1);  
    return { type: "tag", tag: token };
  }
}

