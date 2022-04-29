export function expandTag(tag: string): string[] {
	const parts = tag.split("/");
	return parts.reduce(
		(tl, part) => [
			...tl,
			tl.length ? `${tl[tl.length - 1]}/${part}` : part,
		],
		[]
	);
}
