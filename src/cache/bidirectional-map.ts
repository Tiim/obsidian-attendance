/** A generic index which indexes variables of the form key -> value[], allowing both forward and reverse lookups. */
export class BidirectionalMap {
	/** Maps key -> values for that key. */
	private readonly map: Map<string, Set<string>> = new Map();
	/** Cached inverse map; maps value -> keys that reference that value. */
	private readonly invMap: Map<string, Set<string>> = new Map();

	/** Returns all values for the given key. */
	public get(key: string): Set<string> {
		const result = this.map.get(key);
		if (result) {
			return new Set(result);
		} else {
			return BidirectionalMap.EMPTY_SET;
		}
	}

	/** Returns all keys that reference the given key. Mutating the returned set is not allowed. */
	public getInverse(value: string): Readonly<Set<string>> {
		return this.invMap.get(value) || BidirectionalMap.EMPTY_SET;
	}

	public set(key: string, values: Set<string>): this {
		if (!values.size) {
			// no need to store if no values
			this.delete(key);
			return this;
		}
		const oldValues = this.map.get(key);
		if (oldValues) {
			for (const value of oldValues) {
				// Only delete the ones we're not adding back
				if (!values.has(key)) this.invMap.get(value)?.delete(key);
				if (!this.invMap.get(value).size) {
					this.invMap.delete(value);
				}
			}
		}
		this.map.set(key, values);
		for (const value of values) {
			if (!this.invMap.has(value)) this.invMap.set(value, new Set([key]));
			else this.invMap.get(value)?.add(key);
		}
		return this;
	}

	/** Clears all values for the given key so they can be re-added. */
	public delete(key: string): boolean {
		const oldValues = this.map.get(key);
		if (!oldValues) return false;

		this.map.delete(key);
		for (const value of oldValues) {
			this.invMap.get(value)?.delete(key);
		}

		return true;
	}

	/** Rename all references to the given key to a new value. */
	public rename(oldKey: string, newKey: string): boolean {
		const oldValues = this.map.get(oldKey);
		if (!oldValues) return false;

		this.delete(oldKey);
		this.set(newKey, oldValues);
		return true;
	}

	/** Clear the entire index. */
	public clear() {
		this.map.clear();
		this.invMap.clear();
	}

	static EMPTY_SET: Readonly<Set<string>> = Object.freeze(new Set<string>());
}
