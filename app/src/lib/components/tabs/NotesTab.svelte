<script lang="ts">
	import { untrack } from 'svelte';
	import { getSheet } from '$lib/state/sheet.svelte';
	import { loadNoteBody } from '$lib/notes/html';

	const sheet = getSheet();

	/** Which note is open. Not persisted — it wasn't in the static sheet either,
	 *  and it is a view concern, not part of the character. */
	let activeNote = $state(0);

	const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

	/**
	 * `notes` can shrink under us (delete) or shift (add), so the index is
	 * clamped on read rather than trusted. Deriving it keeps the sidebar
	 * highlight and the editor pointed at the same note by construction.
	 */
	const index = $derived(Math.min(Math.max(activeNote, 0), sheet.data.notes.length - 1));
	const current = $derived(sheet.data.notes[index]);

	const TOOLS: ReadonlyArray<[string, string | null, string, string]> = [
		['bold', null, 'B', 'Bold'],
		['italic', null, 'I', 'Italic'],
		['insertUnorderedList', null, '• List', 'Bulleted list'],
		['insertOrderedList', null, '1. List', 'Numbered list'],
		['formatBlock', 'H2', 'H', 'Heading'],
		['removeFormat', null, '⤬', 'Clear formatting']
	];

	let editor: HTMLDivElement | undefined = $state();

	/**
	 * ⚠ `execCommand` is deprecated and has been for years. Ported as-is because
	 * replacing it means writing a selection-aware formatting layer, which is a
	 * feature, not a port. It still works in every current browser. Replace it
	 * when the notes editor is next opened up — probably alongside sanitising.
	 */
	function fmt(cmd: string, arg: string | null) {
		document.execCommand(cmd, false, arg ?? undefined);
		if (!editor || !current) return;
		editor.focus();
		current.body = editor.innerHTML;
		sheet.save();
	}

	function onEditorInput() {
		if (!editor || !current) return;
		current.body = editor.innerHTML;
		sheet.save();
	}

	function addNote() {
		sheet.addNote();
		activeNote = 0;
	}

	function removeNote(i: number) {
		sheet.removeNote(i);
		if (activeNote >= sheet.data.notes.length) activeNote = sheet.data.notes.length - 1;
	}
</script>

<div class="card">
	<h2>Session Notes</h2>
	<div class="notes-wrap">
		<div class="notes-side">
			{#each sheet.data.notes as note, i (i)}
				{@const isDate = ISO_DATE.test(note.title || '')}
				<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
				<div class="nrow" class:active={i === index} onclick={() => (activeNote = i)}>
					<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
					<span
						class="ndel"
						title="remove"
						onclick={(e) => {
							e.stopPropagation();
							removeNote(i);
						}}>✕</span
					>
					<span class="ndate">{isDate ? note.title : ''}</span>
					<span>{isDate ? 'Untitled' : note.title || 'Untitled'}</span>
				</div>
			{/each}
		</div>

		<div class="notes-main">
			{#if !sheet.data.notes.length}
				<p class="note-empty">No notes yet — hit “+ Add session note”.</p>
			{:else if current}
				<!--
					Keyed on the note object, not the index. Switching or deleting notes
					swaps the object, so the editor is rebuilt and reloaded; typing
					mutates `body` on the same object, so it is left alone and the caret
					survives.
				-->
				{#key current}
					<input
						class="note-title"
						placeholder="Session title / date"
						aria-label="Note title"
						bind:value={current.title}
						oninput={() => sheet.save()}
					/>

					<div class="wysiwig-bar" role="toolbar" aria-label="Formatting">
						{#each TOOLS as [cmd, arg, text, title] (cmd)}
							<button type="button" {title} aria-label={title} onclick={() => fmt(cmd, arg)}>
								{text}
							</button>
						{/each}
					</div>

					<div
						class="note-editor"
						contenteditable="true"
						role="textbox"
						aria-multiline="true"
						aria-label="Note body"
						bind:this={editor}
						{@attach (node) => loadNoteBody(node, untrack(() => current?.body))}
						oninput={onEditorInput}
					></div>
				{/key}
			{/if}
		</div>
	</div>

	<div class="btn-row">
		<button class="btn" type="button" onclick={addNote}>+ Add session note</button>
		<button class="btn ghost" type="button" onclick={() => sheet.copyNotes()}>Copy all notes</button>
	</div>
	<p class="note">Notes auto-save · tap a title to read/edit · ✕ removes</p>
</div>
