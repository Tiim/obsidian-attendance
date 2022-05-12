<script lang="ts">
	import type { Attendance, AttendanceCodeblock } from "src/AttendanceData";
	import Footer from "./Footer.svelte";
	import ListView from "./ListView.svelte";
	import Searchbar from "./Searchbar.svelte";
	import { filterCodeblocks, type Search } from "../../util/filter-codeblocks";
	import type { QueryResolver } from "../../resolver/query-resolver";
	import { exportAttendance } from "../../util/export";
	import { TFile, type App } from "obsidian";
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

	function open(a: CustomEvent<Attendance>) {
		const tFile = app.vault.getAbstractFileByPath(a.detail.path);
		if (tFile instanceof TFile) {
			app.workspace.getUnpinnedLeaf().openFile(tFile, {active: true});
		}
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
		on:openFile={open}
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
