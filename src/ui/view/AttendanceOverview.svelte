<script lang="ts">
	import type { AttendanceCodeblock } from "src/AttendanceData";
	import Footer from "./Footer.svelte";
	import ListView from "./ListView.svelte";
	import Searchbar from "./Searchbar.svelte";
	import { filterCodeblocks, type Search } from "src/util/filter-codeblocks";

	export function update (cb: AttendanceCodeblock[]) {
		codeblocks = cb;
	};

	let codeblocks: AttendanceCodeblock[] = [];
	let search: Search = {};
</script>

<div>
	<Searchbar bind:search />
	<ListView attendance={filterCodeblocks(codeblocks, search)}/>
	<Footer />
</div>
