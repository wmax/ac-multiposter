/**
 * Reusable list page logic for feature list views
 * Handles: loading, multi-select, bulk delete, refresh
 */
import { createMultiSelect } from './multiSelect.svelte';
import { toast } from '$lib/stores/toast.svelte';

export interface ListPageConfig<T extends { id: string }> {
	/** Function to fetch the list of items */
	fetchItems: () => Promise<T[]>;
	/** Function to delete items by ID array */
	deleteItems: (ids: string[]) => Promise<any>;
	/** Singular name of the item (e.g., "event", "campaign") */
	itemName: string;
	/** Plural name of the items (e.g., "events", "campaigns") */
	itemNamePlural: string;
}

export function createListPage<T extends { id: string }>(config: ListPageConfig<T>) {
	const { fetchItems, deleteItems, itemName, itemNamePlural } = config;
	
	// Multi-select state
	const selection = createMultiSelect<T>();
	
	// Promise-based loading state
	let itemsPromise = $state<Promise<T[]>>(fetchItems());
	
	/** Refresh the list by creating a new promise */
	function refresh() {
		itemsPromise = fetchItems();
	}
	
	/** Handle bulk delete with confirmation and toast notifications */
	async function handleBulkDelete() {
		if (selection.count === 0) return;

		// Capture selected IDs and count before any async/side-effect
		const selectedIds = selection.getSelectedArray();
		const count = selectedIds.length;
		if (!confirm(`Delete ${count} ${count === 1 ? itemName : itemNamePlural}?`)) return;

		try {
			await deleteItems(selectedIds);
			toast.success(`${count} ${count === 1 ? itemName : itemNamePlural} deleted successfully!`);
			selection.deselectAll();
			refresh();
		} catch (error: any) {
			toast.error(error.message || `Failed to delete ${itemNamePlural}`);
		}
	}
	
	/** Handle single item delete with confirmation */
	async function handleDelete(id: string) {
		try {
			await deleteItems([id]);
			selection.remove?.(id);
			toast.success(`${itemName.charAt(0).toUpperCase() + itemName.slice(1)} deleted successfully!`);
			refresh();
		} catch (error: any) {
			toast.error(error.message || `Failed to delete ${itemName}`);
		}
	}
	
	return {
		selection,
		get itemsPromise() {
			return itemsPromise;
		},
		refresh,
		handleBulkDelete,
		handleDelete,
	};
}
