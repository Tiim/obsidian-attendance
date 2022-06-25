import type { AttendanceCodeblock } from '../AttendanceData';

export class CodeBlockCache {
  private static readonly EMPTY_SET: Readonly<Set<AttendanceCodeblock>> =
    Object.freeze(new Set<AttendanceCodeblock>());
  /** Maps files to codeblocks in that file */
  private readonly map = new Map<string, Set<AttendanceCodeblock>>();

  public getAll(): Set<AttendanceCodeblock> {
    return new Set([...this.map.values()].flatMap((set) => [...set]));
  }

  public set(file: string, codeblocks: Set<AttendanceCodeblock>) {
    this.map.set(file, codeblocks);
  }

  public delete(file: string) {
    this.map.delete(file);
  }

  public rename(oldPath: string, newPath: string) {
    const codeblocks = this.map.get(oldPath);
    if (codeblocks) {
      this.map.set(newPath, codeblocks);
      this.map.delete(oldPath);
    }
  }

  public get(file: string): Set<AttendanceCodeblock> {
    const result = this.map.get(file);
    if (result) {
      return new Set(result);
    } else {
      return CodeBlockCache.EMPTY_SET;
    }
  }
}
