<script lang="ts">
	import SheetHeader from '$lib/components/SheetHeader.svelte';
	import TabRail from '$lib/components/TabRail.svelte';
	import CharacterTab from '$lib/components/tabs/CharacterTab.svelte';
	import DrakeTab from '$lib/components/tabs/DrakeTab.svelte';
	import SpellsTab from '$lib/components/tabs/SpellsTab.svelte';
	import BagTab from '$lib/components/tabs/BagTab.svelte';
	import NotesTab from '$lib/components/tabs/NotesTab.svelte';
	import { onMount } from 'svelte';
	import { TABS, type TabId } from '$lib/data/defaults';
	import { setSheetContext } from '$lib/state/sheet.svelte';

	const sheet = setSheetContext();

	// The saved sheet only exists in the browser, so the first paint is always
	// defaults and the save lands on hydration. `onMount` rather than `$effect`:
	// this must happen exactly once, and an effect that assigns to the state it
	// manages is one careless read away from a loop.
	onMount(() => sheet.hydrate());

	let active = $state<TabId>('char');

	const PANELS = {
		char: CharacterTab,
		drake: DrakeTab,
		spells: SpellsTab,
		bag: BagTab,
		notes: NotesTab
	} as const;
</script>

<svelte:head>
	<title>{sheet.data.CharacterName || 'Character Sheet'} — D&D 5e Character Sheet</title>
</svelte:head>

<div class="wrap">
	<div class="sheet-shell">
		<header class="sheet-top">
			<SheetHeader />
			<TabRail {active} onSelect={(id) => (active = id)} />
		</header>

		<div class="sheet-stage">
			{#each TABS as id (id)}
				{@const Panel = PANELS[id]}
				<!--
					Every panel stays mounted and uses `hidden`, matching the static
					sheet: one source of truth for visibility, hidden panels stay out of
					the accessibility tree, and switching tabs never discards in-progress
					UI state (a half-typed item row, the open note).
				-->
				<div
					id="tab-{id}"
					role="tabpanel"
					aria-labelledby="tabbtn-{id}"
					tabindex="0"
					hidden={active !== id}
				>
					<Panel />
				</div>
			{/each}
		</div>
	</div>
</div>

<div class="saved" id="savedTag" role="status" aria-live="polite" style:opacity={sheet.toast.visible ? 1 : 0}>
	{sheet.toast.text}
</div>
