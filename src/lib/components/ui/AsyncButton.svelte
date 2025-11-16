<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	//import { LoaderCircle } from '@lucide/svelte';

	interface Props {
		// Loading state - can be a boolean or a number (for remote function pending count)
		loading?: boolean | number;
		
		// Button display text when idle
		label?: string;
		
		// Button text while loading
		loadingLabel?: string;
		
		// Bulk mode - shows count of selected items
		bulkMode?: boolean;
		selectedCount?: number;
		
		// Button styling variants (inherited from shadcn Button)
		variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
		size?: 'default' | 'sm' | 'lg' | 'icon';
		
		// Additional classes
		class?: string;
		
		// Disable button independently of loading state
		disabled?: boolean;
		
		// Form button type
		type?: 'button' | 'submit' | 'reset';
		
		// Click handler
		onclick?: (event: MouseEvent) => void;
	}

	let {
		loading = false,
		label = 'Submit',
		loadingLabel = 'Processing...',
		bulkMode = false,
		selectedCount = 0,
		variant = 'default',
		size = 'default',
		class: className = '',
		disabled = false,
		type = 'button',
		onclick,
	}: Props = $props();

	// Normalize loading state (handle both boolean and number from remote function pending count)
	const isLoading = $derived(typeof loading === 'number' ? loading > 0 : loading);

	// Computed display text
	const displayText = $derived(() => {
		if (isLoading) {
			return loadingLabel;
		}
		
		if (bulkMode && selectedCount > 0) {
			return `${label} (${selectedCount})`;
		}
		
		return label;
	});

	// Determine if button should be disabled
	const isDisabled = $derived(isLoading || disabled || (bulkMode && selectedCount === 0));
</script>

<Button
	{type}
	{variant}
	{size}
	class={className}
	disabled={isDisabled}
	{onclick}
>
	{#if isLoading}
		<!-- <LoaderCircle class="mr-2 h-4 w-4 animate-spin" /> -->
	{/if}
	{displayText()}
</Button>