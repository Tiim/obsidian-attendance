export abstract class Query {
  abstract getType(): string;
  abstract equals(other: Query): boolean;
  abstract toString(): string;

  static equals(a: Query, b: Query): boolean {
    if ((a == null || b == null) && a !== b) {
      return false;
    }
    if (a.getType() !== b.getType()) {
      return false;
    }
    return a.equals(b);
  }
}

export class TagQuery extends Query {
  public readonly tag: string;

  constructor(tag: string) {
    super();
    this.tag = tag;
  }

  getType(): string {
    return "tag";
  }

  equals(other: Query): boolean {
    if (other.getType() !== "tag") {
      return false;
    }
    const otherTagQuery = other as TagQuery;
    return this.tag === otherTagQuery.tag;
  }

  toString(): string {
    return "#" +this.tag;
  }
}

export class FolderQuery extends Query {
  public readonly folder: string;

  constructor(folder: string) {
    super();
    this.folder = folder;
  }

  getType(): string {
    return "folder";
  }

  equals(other: Query): boolean {
    if (other.getType() !== "folder") {
      return false;
    }
    const otherFolderQuery = other as FolderQuery;
    return this.folder === otherFolderQuery.folder;
  }

  toString(): string {
    return `"${this.folder}"`;
  }
}

export class LinkQuery extends Query {

  constructor(public readonly link: string) {
    super();
  }

  getType(): string {
    return "link";
  }

  equals(other: Query): boolean {
    if (other.getType() !== "link") {
      return false;
    }
    const otherLinkQuery = other as LinkQuery;
    return this.link === otherLinkQuery.link;
  }

  toString(): string {
    return `[[${this.link}]]`;
  }
}


export class BinaryQuery extends Query {
  public readonly operation: "and" | "or";
  public readonly left: Query;
  public readonly right: Query;

  constructor(operation: "and" | "or", left: Query, right: Query) {
    super();
    this.operation = operation;
    this.left = left;
    this.right = right;
  }

  getType(): string {
    return "binary";
  }

  equals(other: Query): boolean {
    if (other.getType() !== "binary") {
      return false;
    }
    const otherBinaryQuery = other as BinaryQuery;
    return (
      this.operation === otherBinaryQuery.operation &&
      this.left.equals(otherBinaryQuery.left) &&
      this.right.equals(otherBinaryQuery.right)
    );
  }

  toString(): string {
    return `(${this.left.toString()} ${this.operation} ${this.right.toString()})`;
  }
}