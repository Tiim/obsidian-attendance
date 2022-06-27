<script lang="ts">
  import type { Attendance, AttendanceCodeblock } from "src/AttendanceData";
  import Footer from "./Footer.svelte";
  import ListView from "./ListView.svelte";
  import Searchbar from "./Searchbar.svelte";
  import { filterCodeblocks, type Search } from "../../util/filter-codeblocks";
  import { exportAttendance } from "../../util/export";
  import { TFile, type App } from "obsidian";
  import type AttendancePlugin from "../../main";
  import type { QueryResolver } from "src/resolver/query-resolver";

  export let plugin: AttendancePlugin;
  let resolver = plugin.queryResolver;
  export let app: App;
  export let queryResolver: QueryResolver;

  let codeblocks: AttendanceCodeblock[] = [];
  let search: Search = {};
  let listview: ListView;

  async function update() {
    codeblocks = [...(await queryResolver.getCodeblocks())];
    setTimeout(() => listview.refreshSummaries(), 400);
  }

  async function onExport() {
    const cb = filterCodeblocks(codeblocks, search);
    await exportAttendance(cb, plugin);
  }

  function open(a: CustomEvent<Attendance>) {
    const tFile = app.vault.getAbstractFileByPath(a.detail.path);
    if (tFile instanceof TFile) {
      app.workspace.getUnpinnedLeaf().openFile(tFile, { active: true });
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
  <div>
    <button on:click={update}>Refresh</button>
  </div>
  <div class="content">
    <ListView
      bind:this={listview}
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
