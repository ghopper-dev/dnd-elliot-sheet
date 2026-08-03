<script lang="ts">
	/**
	 * One proficiency row: [toggle dot] [name (ABL)] [value].
	 *
	 * Shared by saving throws and skills so the two lists cannot drift apart,
	 * exactly as `skillRow()` did in the static app.
	 */
	interface Props {
		label: string;
		sub?: string;
		value: string;
		pressed: boolean;
		onToggle: () => void;
	}

	let { label, sub = '', value, pressed, onToggle }: Props = $props();
</script>

<div class="skill">
	<!-- A real button, so it is keyboard-reachable and announces its own
	     pressed state rather than being a div with a click handler. -->
	<button
		class="dot"
		type="button"
		aria-pressed={pressed}
		aria-label="{label} proficiency"
		onclick={onToggle}
	></button>
	<!-- The leading space is inside the expression on purpose: Svelte strips
	     whitespace at the edges of an element, so a literal `<small> {sub}>`
	     renders as "Acrobatics(DEX)". -->
	<span class="name">{label}{#if sub}<small>{' ' + sub}</small>{/if}</span>
	<span class="val">{value}</span>
</div>
