<script lang="ts">
	import { RefreshCw } from '@lucide/svelte';
	
	interface Props {
		size?: 'sm' | 'md' | 'lg';
		message?: string;
	}
	
	let { size = 'md', message }: Props = $props();
	
	const sizeClasses = {
		sm: 'h-4 w-4',
		md: 'h-8 w-8',
		lg: 'h-12 w-12'
	};
</script>

<div class="flex flex-col items-center justify-center py-12">
	<RefreshCw class="{sizeClasses[size]} animate-spin text-gray-400" />
	{#if message}
		<p class="mt-3 text-gray-500 text-sm">{message}</p>
	{/if}
</div>
