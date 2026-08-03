<script lang="ts">
	/** Header band — Figma node 11:17. Identity block, toolbar, HP cluster. */
	import { getSheet } from '$lib/state/sheet.svelte';

	const sheet = getSheet();
</script>

<div class="sheet-head">
	<div class="hero">
		<div class="hero-line">
			<h1>{sheet.data.CharacterName || 'Character Sheet'}</h1>
			<span class="hstat">
				<label for="CharLevel">Level:</label>
				<input
					id="CharLevel"
					placeholder="X"
					size="2"
					bind:value={sheet.data.CharLevel}
					oninput={() => sheet.save()}
				/>
			</span>
			<span class="hstat">
				<label for="Initiative">Initiative:</label>
				<input
					id="Initiative"
					placeholder="X"
					size="2"
					bind:value={sheet.data.Initiative}
					oninput={() => sheet.save()}
				/>
			</span>
		</div>
		<div class="hero-meta">
			<!-- `size` is the fallback width for browsers without CSS field-sizing;
			     Chrome shrink-wraps to content. -->
			<span class="hstat">
				<label for="ClassLevel">Class:</label>
				<input
					id="ClassLevel"
					placeholder="XXXXX"
					size="20"
					bind:value={sheet.data.ClassLevel}
					oninput={() => sheet.save()}
				/>
			</span>
			<span class="hstat">
				<label for="Background">Background:</label>
				<input
					id="Background"
					placeholder="XXXXX"
					size="8"
					bind:value={sheet.data.Background}
					oninput={() => sheet.save()}
				/>
			</span>
			<span class="hstat">
				<label for="Race">Race:</label>
				<input
					id="Race"
					placeholder="XXXXX"
					size="8"
					bind:value={sheet.data.Race}
					oninput={() => sheet.save()}
				/>
			</span>
		</div>
	</div>

	<div class="head-side">
		<div class="toolbar">
			<button class="btn-quiet" type="button" onclick={() => sheet.reset()}>Reset</button>
			<button class="btn-quiet" type="button" onclick={() => sheet.exportJSON()}>Export JSON</button>
			<button class="btn-save" type="button" onclick={() => sheet.save(true)}>
				<img class="icon" src="/icons/save.png" alt="" width="48" height="50" />
				Save
			</button>
		</div>

		<!-- HP cluster — Figma nodes 59:9 / 59:10 / 63:90-91 -->
		<div class="hpbar">
			<img class="hp-heart" src="/icons/heart.png" alt="Hit points" width="68" height="68" />
			<button
				class="hpbtn heal"
				type="button"
				aria-label="Add 1 hit point"
				onclick={() => sheet.adjustHP(1)}>+</button
			>
			<input
				class="hp-well"
				id="HPCurrent"
				aria-label="Current hit points"
				inputmode="numeric"
				bind:value={sheet.data.HPCurrent}
				oninput={() => sheet.save()}
			/>
			<span class="hp-slash" aria-hidden="true">/</span>
			<input
				class="hp-well"
				id="HPMax"
				aria-label="Maximum hit points"
				inputmode="numeric"
				bind:value={sheet.data.HPMax}
				oninput={() => sheet.save()}
			/>
			<button class="hpbtn" type="button" aria-label="Remove 1 hit point" onclick={() => sheet.adjustHP(-1)}
				>−</button
			>
		</div>
	</div>
</div>
