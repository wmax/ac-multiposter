<script lang="ts" generics="T extends { id: string }">
	/**
	 * Generic list page layout with all common patterns
	 * Reduces duplication across events, campaigns, and synchronizations
	 */
	import Breadcrumb from './Breadcrumb.svelte';
	import BulkActionToolbar from './BulkActionToolbar.svelte';
	import EmptyState from './EmptyState.svelte';
	import Spinner from './Spinner.svelte';
	import type { Component, Snippet } from 'svelte';
	import type { IconProps } from '@lucide/svelte';
	
	interface Props {
		/** Feature name for breadcrumb (e.g., "events") */
		feature: 'events' | 'campaigns' | 'synchronizations';
		/** Page title (e.g., "Calendar Events") */
		title: string;
		/** Promise that resolves to the list of items */
		itemsPromise: Promise<T[]>;
		/** Multi-select selection object */
		selection: {
			count: number;
			isSelected: (id: string) => boolean;
			selectAll: (items: T[]) => void;
			deselectAll: () => void;
			toggleSelection: (id: string) => void;
			getSelectedArray: () => string[];
		};
		/** Version used to force re-render when selection changes */
		selectionVersion?: number;
		/** Callback for bulk delete */
		onBulkDelete: () => Promise<void>;
		/** URL for creating new item (e.g., "/events/new") */
		newItemHref: string;
		/** Label for new item button (e.g., "+ New Event") */
		newItemLabel: string;
		/** Icon for empty state */
		emptyIcon: Component<IconProps>;
		/** Empty state title */
		emptyTitle: string;
		/** Empty state description */
		emptyDescription: string;
		/** Empty state action label */
		emptyActionLabel: string;
		/** Loading message (optional) */
		loadingMessage?: string;
		/** Subtitle for page (optional) */
		subtitle?: string;
		/** Snippet for rendering each item */
		children: Snippet<[T]>;
	}
	
	let {
		feature,
		title,
		itemsPromise,
		selection,
		selectionVersion = 0,
		onBulkDelete,
		newItemHref,
		newItemLabel,
		emptyIcon,
		emptyTitle,
		emptyDescription,
		emptyActionLabel,
		loadingMessage = 'Loading...',
		subtitle,
		children,
	}: Props = $props();
</script>

<div class="container mx-auto px-4 py-8">
	<Breadcrumb {feature} />

	{#await itemsPromise}
		<div class="flex justify-between items-center mb-6">
			<div>
				<h1 class="text-3xl font-bold">{title}</h1>
				{#if subtitle}
					<p class="text-gray-600 mt-2">{subtitle}</p>
				{/if}
			</div>
		</div>
		<Spinner message={loadingMessage} />
	{:then items}
		<div class="flex justify-between items-center mb-6">
			<div>
				<h1 class="text-3xl font-bold">{title}</h1>
				{#if subtitle}
					<p class="text-gray-600 mt-2">{subtitle}</p>
				{/if}
			</div>
			{#key selectionVersion}
				<BulkActionToolbar
					selectedCount={selection.count}
					totalCount={items.length}
					onSelectAll={() => selection.selectAll(items)}
					onDeselectAll={() => selection.deselectAll()}
					onDelete={onBulkDelete}
					{newItemHref}
					{newItemLabel}
				/>
			{/key}
		</div>

		<div class="grid gap-4">
			{#if items.length === 0}
				<EmptyState
					icon={emptyIcon}
					title={emptyTitle}
					description={emptyDescription}
					actionLabel={emptyActionLabel}
					actionHref={newItemHref}
				/>
			{:else}
				{#each items as item (item.id)}
					{@render children(item)}
				{/each}
			{/if}
		</div>
	{:catch error}
		<div class="text-center py-12">
			<p class="text-red-600 mb-3">{error?.message || 'Failed to load ' + feature}</p>
			<button 
				onclick={() => itemsPromise = itemsPromise}
				class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
			>
				Retry
			</button>
		</div>
	{/await}
</div>
