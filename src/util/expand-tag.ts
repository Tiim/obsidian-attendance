/**
 * Turns a tag with the format `#taga/tagb`
 * into an array of tags without the preceding `#`.
 */
export function expandTag(tag: string): string[] {
	if (!tag.startsWith("#")) {
		throw new Error("Tag '"+ tag + "' must start with #");
	}
	tag = tag.substring(1);
	const parts = tag.split("/");
	return parts.reduce(
		(tl, part) => [
			...tl,
			tl.length ? `${tl[tl.length - 1]}/${part}` : part,
		],
		[]
	);
}
