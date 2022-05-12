<script lang="ts">
	import type { AttendanceCodeblock } from "src/AttendanceData";
	import Footer from "./Footer.svelte";
	import ListView from "./ListView.svelte";
	import Searchbar from "./Searchbar.svelte";
	import { filterCodeblocks, type Search } from "../../util/filter-codeblocks";
	import type { QueryResolver } from "../../resolver/query-resolver";
	import { exportAttendance } from "../../util/export";
	import type { App } from "obsidian";
	import type AttendancePlugin from "../../main";

	export let plugin: AttendancePlugin;
	let resolver = plugin.queryResolver;
	export function update(cb: AttendanceCodeblock[]) {
		codeblocks = cb;
	}
	export let app: App;
	let codeblocks: AttendanceCodeblock[] = [];
	let search: Search = {};

	async function onExport() {
		const cb = filterCodeblocks(codeblocks, search);
		await exportAttendance(cb, plugin);
	}
</script>

<div class="attendance-overview">
	<Searchbar {app} on:export={onExport} bind:search />
	<span class="search-string">
		{#if search.from}
			from {search.from.format("YYYY-MM-DD")}
		{/if}
		{#if search.to}
			to {search.to.format("YYYY-MM-DD")}
		{/if}
	</span>
	<div class="content">
		<ListView
			{resolver}
			attendance={filterCodeblocks(codeblocks, search)}
		/>
	</div>
	<Footer />
</div>

<style>
	.attendance-overview {
		display: flex;
		flex-direction: column;
		height: 100%;
	}
	.content {
		flex-grow: 1;
		flex-shrink: 1;
		overflow-y: auto;
	}
	.search-string {
		color: var(--text-faint);
		display: block;
		width: 100%;
		text-align: center;
		margin-bottom: 10px;
	}
</style>
