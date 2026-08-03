<script lang="ts">
	import { getSheet } from '$lib/state/sheet.svelte';

	const sheet = getSheet();
	const save = () => sheet.save();

	const ESSENCES = ['acid', 'cold', 'fire', 'lightning', 'poison'];
</script>

<div class="grid cols-3">
	<div class="card">
		<h2>Drake Companion</h2>
		<label for="DrakeName">Drake Name</label>
		<input id="DrakeName" bind:value={sheet.data.DrakeName} oninput={save} />
		<label for="DrakeEssence">Draconic Essence (chosen each summon)</label>
		<select id="DrakeEssence" bind:value={sheet.data.DrakeEssence} onchange={save}>
			{#each ESSENCES as essence (essence)}
				<option>{essence}</option>
			{/each}
		</select>
		<div class="grid cols-3" style="margin-top:12px">
			<div class="bigstat">
				<label for="DrakeAC">AC (14+PB)</label><input
					id="DrakeAC"
					bind:value={sheet.data.DrakeAC}
					oninput={save}
				/>
			</div>
			<div class="bigstat">
				<label for="DrakeHP">HP (5 + 5×lvl)</label><input
					id="DrakeHP"
					bind:value={sheet.data.DrakeHP}
					oninput={save}
				/>
			</div>
			<div class="bigstat">
				<label for="DrakeSpeed">Speed</label><input
					id="DrakeSpeed"
					bind:value={sheet.data.DrakeSpeed}
					oninput={save}
				/>
			</div>
		</div>
		<p class="note">
			Small dragon · darkvision 60 ft. · immune to essence damage type · speaks Draconic
		</p>
	</div>

	<div class="card">
		<h2>Ability Scores</h2>
		<table>
			<tbody>
				<tr><th>STR</th><th>DEX</th><th>CON</th><th>INT</th><th>WIS</th><th>CHA</th></tr>
				<tr>
					<td>16 (+3)</td><td>12 (+1)</td><td>15 (+2)</td><td>8 (−1)</td><td>14 (+2)</td><td>8 (−1)</td>
				</tr>
			</tbody>
		</table>
		<label for="DrakeSaves">Saving Throws</label>
		<input id="DrakeSaves" value="Dex +5, Wis +6 (stat + PB)" readonly />
		<h3>Actions &amp; Reactions</h3>
		<table>
			<tbody>
				<tr><th>Name</th><th>Attack</th><th>Damage</th></tr>
				<tr>
					<td>
						<input aria-label="Drake attack name" bind:value={sheet.data.DrakeBiteName} oninput={save} />
					</td>
					<td>
						<input aria-label="Drake attack bonus" bind:value={sheet.data.DrakeBiteAtk} oninput={save} />
					</td>
					<td>
						<input aria-label="Drake attack damage" bind:value={sheet.data.DrakeBiteDmg} oninput={save} />
					</td>
				</tr>
				<tr>
					<td>Infused Strikes</td>
					<td>reaction</td>
					<td>
						<input
							aria-label="Infused Strikes damage"
							bind:value={sheet.data.DrakeInfused}
							oninput={save}
						/>
					</td>
				</tr>
			</tbody>
		</table>
	</div>

	<div class="card">
		<h2>Bond of Fang &amp; Scale (7th lvl)</h2>
		<ul class="list">
			<li>Drake grows wings → <b>fly 40 ft.</b> (can't fly while you ride it)</li>
			<li><b>Drake Mount:</b> grows to Medium; you can ride it</li>
			<li><b>Magic Fang:</b> Bite +1d6 essence damage (included above)</li>
			<li><b>Resistance:</b> you gain resistance to the essence damage type</li>
		</ul>
		<h3>Rules</h3>
		<ul class="list dim">
			<li>Summon: action, within 30 ft. 1/long rest (or spend a spell slot)</li>
			<li>Shares your initiative, acts right after you; Dodge by default — bonus action to command</li>
			<li>
				Infused Strikes: when a creature within 30 ft hits with a weapon attack, drake adds +1d6
				essence damage
			</li>
		</ul>
		<label for="DrakeNotes">Notes</label>
		<textarea id="DrakeNotes" rows="3" bind:value={sheet.data.DrakeNotes} oninput={save}></textarea>
		<p class="note">
			<a href="https://dnd5e.wikidot.com/ranger:drakewarden" target="_blank" rel="noopener"
				>drakewarden rules ↗</a
			>
		</p>
	</div>
</div>
