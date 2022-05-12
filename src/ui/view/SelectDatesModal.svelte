<script lang="ts">
	import { moment } from "obsidian";
	import { createEventDispatcher } from "svelte";
	import Flatpickr from "svelte-flatpickr";
	import "flatpickr/dist/flatpickr.css";

	export let startDate: moment.Moment | undefined;
	export let endDate: moment.Moment | undefined;
	let dispatch = createEventDispatcher();

	const options = {
		mode: "range" as "range",
		inline: true,
		weekNumbers: true,
		defaultDate: [startDate?.toDate(), endDate?.toDate()],
		onChange(dates: [Date | undefined, Date | undefined]) {
			startDate = moment(dates[0]);
			endDate = moment(dates[1]);
		},
	};

	function close() {
		dispatch("close", {
			startDate,
			endDate,
		});
	}

	function reset() {
		startDate = undefined;
		endDate = undefined;
		dispatch("close", {});
	}
</script>

<div class="flatpickr-container">
	<Flatpickr {options} />
	<div class="btns">
		<button on:click={reset}>Reset</button>
		<button on:click={close}>Ok</button>
	</div>
</div>

<style>
	.flatpickr-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 10px;
		padding: 2rem;
	}
	.flatpickr-container :global(.flatpickr-input) {
		display: none;
	}
	.btns {
		display: flex;
		flex-direction: row;
		gap: 10px;
		margin-top: 1rem;
	}
</style>
