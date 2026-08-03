<script lang="ts">
	import { ABILITIES } from '$lib/data/defaults';
	import SkillRow from '$lib/components/SkillRow.svelte';
	import { getSheet } from '$lib/state/sheet.svelte';

	const sheet = getSheet();
	const save = () => sheet.save();
</script>

<div class="grid cols-3">
	<div class="card">
		<h2>Character</h2>
		<label for="CharacterName">Character Name</label>
		<input id="CharacterName" bind:value={sheet.data.CharacterName} oninput={save} />
		<label for="PlayerName">Player</label>
		<input id="PlayerName" bind:value={sheet.data.PlayerName} oninput={save} />
		<label for="ProfBonus">Proficiency Bonus</label>
		<input id="ProfBonus" bind:value={sheet.data.ProfBonus} oninput={save} />
		<label for="Inspiration">Inspiration</label>
		<input id="Inspiration" bind:value={sheet.data.Inspiration} oninput={save} />
	</div>

	<div class="card">
		<h2>Combat</h2>
		<div class="grid cols-3">
			<div class="bigstat">
				<label for="AC">AC</label><input id="AC" bind:value={sheet.data.AC} oninput={save} />
			</div>
			<div class="bigstat">
				<label for="Speed">Speed</label><input
					id="Speed"
					bind:value={sheet.data.Speed}
					oninput={save}
				/>
			</div>
			<div class="bigstat">
				<label for="HPTemp">Temp HP</label><input
					id="HPTemp"
					placeholder="0"
					bind:value={sheet.data.HPTemp}
					oninput={save}
				/>
			</div>
			<div class="bigstat">
				<label for="HDTotal">Hit Dice Total</label><input
					id="HDTotal"
					bind:value={sheet.data.HDTotal}
					oninput={save}
				/>
			</div>
			<div class="bigstat">
				<label for="HD">Hit Dice</label><input id="HD" bind:value={sheet.data.HD} oninput={save} />
			</div>
			<div class="bigstat">
				<label for="SpellDC">Spell DC</label><input
					id="SpellDC"
					bind:value={sheet.data.SpellDC}
					oninput={save}
				/>
			</div>
		</div>
	</div>

	<div class="card">
		<h2>Attacks</h2>
		<table>
			<tbody>
				<tr><th>Name</th><th>Atk</th><th>Damage</th></tr>
				<tr>
					<td><input aria-label="Weapon 1 name" bind:value={sheet.data.Wpn1Name} oninput={save} /></td>
					<td><input aria-label="Weapon 1 attack" bind:value={sheet.data.Wpn1Atk} oninput={save} /></td>
					<td><input aria-label="Weapon 1 damage" bind:value={sheet.data.Wpn1Dmg} oninput={save} /></td>
				</tr>
				<tr>
					<td><input aria-label="Weapon 2 name" bind:value={sheet.data.Wpn2Name} oninput={save} /></td>
					<td><input aria-label="Weapon 2 attack" bind:value={sheet.data.Wpn2Atk} oninput={save} /></td>
					<td><input aria-label="Weapon 2 damage" bind:value={sheet.data.Wpn2Dmg} oninput={save} /></td>
				</tr>
				<tr>
					<td><input aria-label="Weapon 3 name" bind:value={sheet.data.Wpn3Name} oninput={save} /></td>
					<td><input aria-label="Weapon 3 attack" bind:value={sheet.data.Wpn3Atk} oninput={save} /></td>
					<td><input aria-label="Weapon 3 damage" bind:value={sheet.data.Wpn3Dmg} oninput={save} /></td>
				</tr>
			</tbody>
		</table>
		<label for="Features">Notes / Features</label>
		<textarea id="Features" rows="8" bind:value={sheet.data.Features} oninput={save}></textarea>
	</div>
</div>

<div class="grid cols-3" style="margin-top:16px">
	<div class="card">
		<h2>Ability Scores</h2>
		<div class="grid cols-6">
			{#each ABILITIES as ability (ability.id)}
				<!-- The big number IS the input, so the value is only ever shown once. -->
				<div class="stat">
					<label for="ab-{ability.id}">{ability.id}</label>
					<input
						id="ab-{ability.id}"
						bind:value={sheet.data.abilities[ability.id]}
						oninput={save}
					/>
				</div>
			{/each}
		</div>

		<h3>Saving Throws</h3>
		<div>
			{#each ABILITIES as ability (ability.id)}
				<SkillRow
					label="{ability.id} save"
					value={sheet.data.saves[ability.id]}
					pressed={sheet.data.saveProf.includes(ability.id)}
					onToggle={() => sheet.toggleSaveProficiency(ability.id)}
				/>
			{/each}
		</div>
	</div>

	<div class="card">
		<h2>Skills <span class="hint">(click a dot to toggle proficiency)</span></h2>
		<div>
			{#each sheet.data.skills as skill, i (skill.name)}
				<SkillRow
					label={skill.name}
					sub="({skill.ab})"
					value={skill.val}
					pressed={skill.prof}
					onToggle={() => sheet.toggleSkillProficiency(i)}
				/>
			{/each}
		</div>
	</div>

	<div class="card">
		<h2>Spellcasting</h2>
		<div class="grid cols-3">
			<div class="bigstat">
				<label for="Slots1">L1 Slots</label><input
					id="Slots1"
					bind:value={sheet.data.Slots1}
					oninput={save}
				/>
			</div>
			<div class="bigstat">
				<label for="Slots1Left">L1 Left</label><input
					id="Slots1Left"
					bind:value={sheet.data.Slots1Left}
					oninput={save}
				/>
			</div>
			<div class="bigstat">
				<label for="PassiveWis">Passive Wis</label><input
					id="PassiveWis"
					bind:value={sheet.data.PassiveWis}
					oninput={save}
				/>
			</div>
			<div class="bigstat">
				<label for="Slots2">L2 Slots</label><input
					id="Slots2"
					bind:value={sheet.data.Slots2}
					oninput={save}
				/>
			</div>
			<div class="bigstat">
				<label for="Slots2Left">L2 Left</label><input
					id="Slots2Left"
					bind:value={sheet.data.Slots2Left}
					oninput={save}
				/>
			</div>
			<div class="bigstat">
				<label for="Slots3">L3 Slots</label><input
					id="Slots3"
					bind:value={sheet.data.Slots3}
					oninput={save}
				/>
			</div>
			<div class="bigstat">
				<label for="Slots3Left">L3 Left</label><input
					id="Slots3Left"
					bind:value={sheet.data.Slots3Left}
					oninput={save}
				/>
			</div>
		</div>
		<label for="Spells">Spells Known / Prepared</label>
		<textarea id="Spells" rows="7" bind:value={sheet.data.Spells} oninput={save}></textarea>
		<p class="note">
			<a href="https://dnd5e.wikidot.com/spells" target="_blank" rel="noopener">spell list ↗</a>
		</p>
	</div>
</div>
