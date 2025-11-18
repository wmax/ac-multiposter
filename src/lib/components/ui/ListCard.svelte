<script lang="ts">
import { Button } from '$lib/components/ui/button';
import AsyncButton from '$lib/components/ui/AsyncButton.svelte';
import { toast } from 'svelte-sonner';
	import { goto } from '$app/navigation';
	import type { Snippet } from 'svelte';

	interface Props {
		id: string;
		href?: string;
		selected?: boolean;
		onToggle?: (id: string) => void;
		title: string | Snippet;
		subtitle?: string | Snippet;
		content?: Snippet;
		metadata?: Snippet;
		actions?: Snippet;
		badge?: Snippet;
		// Standard action handlers
		editHref?: string;
		onDelete?: (id: string) => Promise<void>;
		deleteLabel?: string;
		highlight?: boolean;
	}

	let { 
		id, 
		href, 
		selected = false, 
		onToggle, 
		title, 
		subtitle, 
		content, 
		metadata,
		actions,
		badge,
		editHref,
		onDelete,
		deleteLabel = 'Delete',
		highlight = false
	}: Props = $props();
	
	let deleting = $state(false);

	async function handleDelete(e: MouseEvent) {
		e.stopPropagation();
		if (!onDelete) return;
		if (!confirm(`Delete this item?`)) return;
		deleting = true;
		try {
			await onDelete(id);
			toast.success('Item deleted successfully!');
		} catch (error) {
			toast.error('Failed to delete item');
		} finally {
			deleting = false;
		}
	}
	function handleCardClick(event?: MouseEvent) {
		if (!href) return;

		if (event?.defaultPrevented) return;

		const target = event?.target;
		if (target instanceof HTMLElement) {
			const interactive = target.closest('button, a, input, textarea, select, label, [role="button"], [role="link"]');
			if (interactive && interactive !== event?.currentTarget) {
				return;
			}
		}

		goto(href);
	}
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
	class={`bg-white shadow rounded-lg p-6 flex items-start gap-4 transition-shadow ${highlight ? 'ring-2 ring-blue-400 ring-offset-2' : ''} ${href ? 'cursor-pointer hover:bg-gray-50' : ''}`}
	onclick={handleCardClick}
	role={href ? 'button' : undefined}
	aria-label={href ? 'Open details' : undefined}
	tabindex={href ? 0 : undefined}
	onkeydown={(e) => {
		if (href && (e.key === 'Enter' || e.key === ' ')) {
			e.preventDefault();
			handleCardClick();
		}
	}}
>
	{#if onToggle}
		<input
			type="checkbox"
			checked={selected}
			onchange={() => onToggle?.(id)}
			onclick={(e) => e.stopPropagation()}
			class="mt-1 w-4 h-4 text-blue-600"
		/>
	{/if}
	
	<div class="flex-1">
		<div class="flex items-start gap-3 mb-2">
			<div class="flex-1">
				<h2 class="text-xl font-semibold">
					{#if typeof title === 'string'}
						{title}
					{:else}
						{@render title()}
					{/if}
				</h2>
				{#if subtitle}
					<div class="text-sm text-gray-600 mt-1">
						{#if typeof subtitle === 'string'}
							{subtitle}
						{:else}
							{@render subtitle()}
						{/if}
					</div>
				{/if}
			</div>
			{#if badge}
				<div class="shrink-0">
					{@render badge()}
				</div>
			{/if}
		</div>
		
		{#if content}
			<div class="mt-2">
				{@render content()}
			</div>
		{/if}
		
		{#if metadata}
			<div class="mt-3">
				{@render metadata()}
			</div>
		{/if}
	</div>
	
	{#if actions}
		<div class="flex flex-col gap-2 shrink-0">
			{@render actions()}
		</div>
	{:else if editHref || onDelete}
		<div class="flex flex-col gap-2 shrink-0">
			{#if editHref}
				<Button
					href={editHref}
					variant="default"
					size="default"
					class="text-center"
					onclick={(e) => e.stopPropagation()}
				>
					Edit
				</Button>
			{/if}
			{#if onDelete}
				<AsyncButton
					variant="destructive"
					size="default"
					onclick={handleDelete}
					loading={deleting}
					loadingLabel="Deleting..."
				>
					{deleteLabel}
				</AsyncButton>
			{/if}
		</div>
	{/if}
</div>
