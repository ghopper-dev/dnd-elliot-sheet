<script lang="ts">
	/** Tab rail — Figma node 71:6. Implements the ARIA tabs pattern. */
	import { TAB_META, TABS, type TabId } from '$lib/data/defaults';

	interface Props {
		active: TabId;
		onSelect: (id: TabId) => void;
	}

	let { active, onSelect }: Props = $props();

	const buttons: Partial<Record<TabId, HTMLButtonElement>> = $state({});

	/**
	 * Arrow keys move between tabs, per the ARIA tabs pattern: the rail is one
	 * tab stop (roving tabindex, below), and arrows move within it. Without this
	 * a keyboard user has to tab through all five to reach the panel.
	 *
	 * Bound to each tab rather than to the rail. The static sheet listened on
	 * `document` and filtered with `.closest('.tab')`, which is the same idea by
	 * a longer route; putting it on the buttons keeps the handler where focus
	 * actually is, and leaves the tablist a non-interactive container.
	 */
	function onkeydown(event: KeyboardEvent) {
		const index = TABS.indexOf(active);
		let next: number;

		switch (event.key) {
			case 'ArrowLeft':
				next = (index - 1 + TABS.length) % TABS.length;
				break;
			case 'ArrowRight':
				next = (index + 1) % TABS.length;
				break;
			case 'Home':
				next = 0;
				break;
			case 'End':
				next = TABS.length - 1;
				break;
			default:
				return;
		}

		event.preventDefault();
		const id = TABS[next];
		onSelect(id);
		buttons[id]?.focus();
	}
</script>

<!--
	A plain div, not the static sheet's <nav>. `<nav>` carries an implicit
	`navigation` role, so `role="tablist"` was overriding it — two conflicting
	answers to "what is this?". Purely a semantics fix: the CSS hangs off .tabs,
	so nothing moves.
-->
<div class="tabs" role="tablist" aria-label="Character sheet sections">
	{#each TAB_META as tab (tab.id)}
		<button
			class="tab"
			class:active={active === tab.id}
			type="button"
			role="tab"
			id="tabbtn-{tab.id}"
			aria-selected={active === tab.id}
			aria-controls="tab-{tab.id}"
			tabindex={active === tab.id ? 0 : -1}
			bind:this={buttons[tab.id]}
			onclick={() => onSelect(tab.id)}
			{onkeydown}
		>
			<img class="tabicon" src={tab.icon} alt="" width="38" height="38" />
			{tab.label}
		</button>
	{/each}
</div>
