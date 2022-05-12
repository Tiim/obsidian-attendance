<script lang="ts">
	import type { AttendanceCodeblock } from "src/AttendanceData";
	import Footer from "./Footer.svelte";
	import ListView from "./ListView.svelte";
	import Searchbar from "./Searchbar.svelte";
	import { filterCodeblocks, type Search } from "src/util/filter-codeblocks";
  import type { QueryResolver } from "src/resolver/query-resolver";

	export let resolver: QueryResolver;
	export function update(cb: AttendanceCodeblock[]) {
		codeblocks = cb;
	}

	let codeblocks: AttendanceCodeblock[] = [];
	let search: Search = {};
</script>

<div>
	<Searchbar bind:search />
	<div class="content">
		<ListView resolver={resolver} attendance={filterCodeblocks(codeblocks, search)} />
	</div>
	<Footer />
</div>
