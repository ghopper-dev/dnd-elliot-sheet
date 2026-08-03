<script lang="ts">
	import { getSheet } from '$lib/state/sheet.svelte';

	const sheet = getSheet();
	const save = () => sheet.save();

	let newItemName = $state('');
	let newItemQty = $state('');
	let nameInput: HTMLInputElement | undefined = $state();

	const GOLD_STEPS = [-10, -1, 1, 10, 100];

	function addItem() {
		if (!sheet.addItem(newItemName, newItemQty)) return;
		newItemName = '';
		newItemQty = '';
		nameInput?.focus();
	}

	function submitOnEnter(event: KeyboardEvent) {
		if (event.key === 'Enter') addItem();
	}
</script>

<div class="grid cols-3">
	<div class="card">
		<h2>Coin</h2>
		<div class="grid cols-3">
			<div class="bigstat">
				<label for="Gold">Gold</label><input id="Gold" bind:value={sheet.data.Gold} oninput={save} />
			</div>
			<div class="bigstat">
				<label for="Silver">Silver</label><input
					id="Silver"
					bind:value={sheet.data.Silver}
					oninput={save}
				/>
			</div>
			<div class="bigstat">
				<label for="Copper">Copper</label><input
					id="Copper"
					bind:value={sheet.data.Copper}
					oninput={save}
				/>
			</div>
		</div>
		<!-- svelte-ignore a11y_label_has_associated_control -->
		<label>Quick add / remove gold</label>
		<div class="btn-row">
			{#each GOLD_STEPS as step (step)}
				<button class="btn ghost" type="button" onclick={() => sheet.adjustGold(step)}>
					{step > 0 ? `+${step}` : `−${Math.abs(step)}`}
				</button>
			{/each}
		</div>
	</div>

	<div class="card" style="grid-column:span 2">
		<h2>Equipment</h2>
		<table>
			<tbody>
				<tr>
					<th>Item</th>
					<th style="width:76px">Qty</th>
					<th style="width:56px"></th>
				</tr>
				{#each sheet.data.items as item, i (i)}
					<tr>
						<td><input aria-label="Item name" bind:value={item.name} oninput={save} /></td>
						<td style="text-align:center">
							<input
								style="text-align:center"
								aria-label="Quantity of {item.name}"
								bind:value={item.qty}
								oninput={save}
							/>
						</td>
						<td style="text-align:center">
							<button
								class="btn ghost"
								type="button"
								style="padding:4px 10px"
								title="Remove {item.name}"
								aria-label="Remove {item.name}"
								onclick={() => sheet.removeItem(i)}>✕</button
							>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
		<div class="btn-row">
			<input
				placeholder="Add an item…"
				aria-label="New item name"
				style="flex:1;min-width:160px"
				bind:this={nameInput}
				bind:value={newItemName}
				onkeydown={submitOnEnter}
			/>
			<input
				placeholder="Qty"
				aria-label="New item quantity"
				style="width:76px"
				bind:value={newItemQty}
				onkeydown={submitOnEnter}
			/>
			<button class="btn" type="button" onclick={addItem}>+ Add</button>
		</div>
		<p class="note">Items auto-save · click ✕ to remove</p>
	</div>
</div>

<div class="card" style="margin-top:16px">
	<h2>Explorer's Pack (standard gear)</h2>
	<p class="spell-meta">
		Backpack · bedroll · mess kit · tinderbox · 10 torches · 10 days rations · waterskin · 50 ft
		hempen rope — plus: Whisper · Longbow +1 · Shortsword · quiver of 20 arrows · leather armor
	</p>
</div>
