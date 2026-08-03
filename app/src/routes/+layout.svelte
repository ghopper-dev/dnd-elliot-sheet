<script lang="ts">
	// One global stylesheet, imported once. The design system is a single token
	// layer in `:root` (app.css) — components carry no <style> blocks, so there
	// is nowhere for a second override layer to grow back.
	import '../app.css';

	let { children } = $props();
</script>

{@render children()}
