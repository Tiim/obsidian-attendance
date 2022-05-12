<script lang="ts">
	import { onMount } from "svelte";
	import { App, setIcon } from "obsidian";
  import { createEventDispatcher } from "svelte";
	import type { Search } from "../../util/filter-codeblocks";
	import { SelectDatesModalView } from "./SelectDatesModalView";
	
	
	export let app: App;
	export let search: Search;
	let btnCalendar: HTMLElement;
	let dispatch = createEventDispatcher();

	onMount(() => {
		setIcon(btnCalendar, "calendar");
	});

	async function openDateModal() {
		const sdmv = new SelectDatesModalView(app, search.from, search.to)
		sdmv.open();
		const dateRange = await sdmv.wait();
		search.from = dateRange.startDate;
		search.to = dateRange.endDate;
	}

	function onExport() {
		dispatch("export");
	}

</script>

<div class="searchbar">
	<span class="searchinput">
		<input placeholder="Search..." type="text" bind:value={search.title} />
		<button
			bind:this={btnCalendar}
			on:click={openDateModal}
			title="Start Date"
		/>
	</span>
	<button class="export-btn" on:click={onExport}>Export</button>
</div>

<style>
	.searchinput {
		display: flex;
		flex-direction: row;
		flex-wrap: nowrap;
		gap: 5px;
	}
	.searchinput input {
		flex-grow: 1;
		flex-shrink: 1;
		min-width: 50px;
	}
	.export-btn {
		width: 100%;
	}
	.searchinput button {
		margin: 0px;
		flex-shrink: 1;
		color: var(--text-faint);
		padding: 6px;
	}
	.searchinput button:hover {
		color: var(--text-accent);
	}
	.searchbar {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 5px;
		margin: 10px 0px;
	}
</style>
