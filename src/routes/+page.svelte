<script lang="ts">
	import { base } from '$app/paths';
	import { DEFAULT_PACK_ID } from '$lib/packs';
</script>

<!-- +page.ts redirects; this renders only if a client lands here with JS disabled. -->
<p><a href="{base}/{DEFAULT_PACK_ID}/">Continue to the questionnaire</a></p>
