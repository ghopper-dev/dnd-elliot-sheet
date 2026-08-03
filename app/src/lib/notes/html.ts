/**
 * Note bodies are rich text, stored as HTML because `contenteditable`
 * round-trips as HTML.
 *
 * ⚠ THE OPEN SECURITY ITEM (ROADMAP §6). Nothing here sanitises. That is
 * correct *only* while a note never leaves the browser that typed it, which is
 * true today and stops being true the moment v1's sync or campaign sharing
 * lands. Both directions need an allowlist sanitiser (DOMPurify or equivalent)
 * before the first note crosses a network boundary, or this becomes stored XSS
 * between players.
 *
 * Sanitising is deliberately NOT done in this port: applied to bodies that
 * already exist, an allowlist would silently rewrite real session notes, and a
 * port is the wrong change to hide data loss inside. It belongs in the PR that
 * adds sync, where it can be tested against the payloads it is actually
 * defending. Everything routes through this module so that fix is one function,
 * not a hunt through components.
 */

/**
 * Read the text out of a note body without ever putting it in the document.
 *
 * `DOMParser` builds an inert document: no scripts run, no subresources are
 * fetched, and nothing is attached to the live DOM. That makes it the right tool
 * even for content we currently trust — the alternative (assigning `innerHTML`
 * to a scratch element) works, but earns a second look from every reviewer and
 * every scanner, forever.
 */
export function htmlToPlainText(html: string | undefined | null): string {
	if (!html) return '';
	if (typeof DOMParser === 'undefined') return html;
	const doc = new DOMParser().parseFromString(html, 'text/html');
	return doc.body.textContent ?? '';
}

/**
 * Load a saved note body into the editor.
 *
 * Parses inertly and adopts the resulting nodes rather than assigning
 * `innerHTML`. The two are equivalent for well-formed content — neither runs
 * scripts — but this form keeps the parse step visible, which is where the
 * sanitiser goes:
 *
 *     const clean = DOMPurify.sanitize(html);        // ← the future line
 *     const doc = new DOMParser().parseFromString(clean, 'text/html');
 *
 * Called once per note when the editor mounts, never on keystrokes: rewriting
 * the DOM under a `contenteditable` collapses the selection and drops the caret
 * to the start of the field on every character typed.
 */
export function loadNoteBody(node: HTMLElement, html: string | undefined | null): void {
	if (!html) {
		node.replaceChildren();
		return;
	}
	const doc = new DOMParser().parseFromString(html, 'text/html');
	node.replaceChildren(...Array.from(doc.body.childNodes));
}
