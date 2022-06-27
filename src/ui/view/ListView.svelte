<script lang="ts">
	import type { Attendance } from "src/AttendanceData";
	import type { QueryResolver } from "src/resolver/query-resolver";
  import { createEventDispatcher } from "svelte";
	
	
	let dispatch = createEventDispatcher();
	
	export let attendance: Attendance[];
	export let resolver: QueryResolver;

  let summaries: string[] = [];
  $: attendance, resolver, summaries = [];

  export function refreshSummaries() {
    summaries = attendance.map(a => summary(a));
  }

	function summary(attendance: Attendance): string {    
    const counts = attendance.getAttendances(resolver.resolveQuery(attendance.query)).reduce((acc, cur) => ({
			...acc,
			[cur.state]: (acc[cur.state] || 0) + 1,
		}), {} as Record<string, number>)
		const countsArray2 = Object.entries(counts);
		countsArray2.sort((a, b) => b[1] - a[1]);
		return countsArray2.filter(([s,_]) => s).map(([state, count]) => `${state||"Default"}: ${count}`).join(", ");
	}

	function openFile(attendance: Attendance) {
		dispatch("openFile", attendance);
	}
	
</script>

<div class="list-view">
	{#each attendance as a, i}
		<article on:click={()=>openFile(a)}>
			<div>
				<span class="date">{a.date.format("YYYY-MM-DD")}</span>
				<span class="title">{a.title}</span>
			</div>
      <div class="summary">
				{summaries[i] ?? "summary not calculated!"}
      </div>
		</article>
  {:else}
    <p class="summary">No attendance blocks loaded, try refreshing.</p>
  {/each}
</div>
<style>
	.list-view {
		display: flex;
		flex-direction: column;
		height: 100%;
		gap: 2px;
	}
	article {
		padding: 4px;
		border-radius: 4px;
		background-color: var(--background-primary);
	}
	article:hover {
		padding: 4px;
		border-radius: 4px;
		background-color: var(--background-primary-alt);
	}
	.date {
		color: var(--text-muted);
	}
	.summary {
		color: var(--text-faint);
	}
</style>
