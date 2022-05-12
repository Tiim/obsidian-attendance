<script lang="ts">
  import {moment} from "obsidian";
  import { createEventDispatcher } from "svelte";
	import Flatpickr from "svelte-flatpickr";
	import "flatpickr/dist/flatpickr.css";
	
  let dispatch = createEventDispatcher();
  let selected = false;

  const options = {
    mode: "range" as "range",
    inline: true,
    weekNumbers: true,
		onChange(dates: (Date|undefined)[]) {
			if (dates.length === 2 && dates[0] && dates[1]) {
        dispatch("value", {
          startDate: moment(dates[0]),
          endDate: moment(dates[1])
        });
        selected = true;
      } else {
        selected = false;
      }
		},
	};

  function close() {
    dispatch("close");
  }
</script>

<div class="flatpickr-container">
  <Flatpickr {options} />
  {#if selected}
  <button on:click={close}>Ok</button>
  {/if}
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
</style>