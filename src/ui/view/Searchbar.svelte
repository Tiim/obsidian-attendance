<script lang="ts">
	import type { Search } from "src/util/filter-codeblocks";

	export let search: Search;
</script>

<div class="searchbar">
	<span class="searchinput">
		<input type="text" bind:value={search.title} />
		<input type="date" bind:value={search.from} />
		<input type="date" bind:value={search.to} />
	</span>
	<button>Export</button>
</div>

<style>
  .searchinput {
    display: flex;
  }
	.searchbar {
		display: flex;
		flex-direction: column;
	}
</style>
