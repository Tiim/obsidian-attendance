<script lang="ts">
	import type { Attendance } from "src/AttendanceData";

	export let attendance: Attendance[];
</script>

<div>
	{#each attendance as a}
		<article>
			<div>
				<span>{a.date.format("YYYY-MM-DD")}</span>
				<span>{a.title}</span>
			</div>
      <div>
        <span>Summary: ...</span>
      </div>
		</article>
	{/each}
</div>
