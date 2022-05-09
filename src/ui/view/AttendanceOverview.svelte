<script lang="ts">
import { log } from "console";

	import type { AttendanceCodeblock } from "src/AttendanceData";

	export const update = (cb: AttendanceCodeblock[]) => {
		codeblocks = cb; 
	};

	let codeblocks:AttendanceCodeblock[] = [];
</script>

<div>
	<ul>
		{#each codeblocks as cb}
			<li>{cb.attendance.date}
			{cb.attendance.title}
			</li>
		{/each}
	</ul>
</div>
