
<script lang="ts">
import Breadcrumb from './Breadcrumb.svelte';
import Button from './button/button.svelte';
export let headline: string;
export let message: string;
export let href: string = '/';
export let button: string = 'Back';
</script>

<div class="max-w-2xl mx-auto">
	<Breadcrumb feature="campaigns" />
	<div class="text-center py-12">
		<h1 class="text-2xl font-bold text-red-600 mb-4">{headline}</h1>
		<p class="text-gray-600 mb-6">{message}</p>
		<Button href={href} size="default">{button}</Button>
	</div>
</div>
