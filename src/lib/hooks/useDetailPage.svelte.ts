/**
 * Reusable detail page logic for view/edit pages
 * Handles: loading, edit mode, URL params, update, delete
 */
import { page } from '$app/stores';
import { goto } from '$app/navigation';
import { toast } from '$lib/stores/toast.svelte';
import { get } from 'svelte/store';

export interface DetailPageConfig<T, U = Partial<T>> {
	/** Function to fetch the item by ID */
	fetchItem: (id: string) => Promise<T | null>;
	/** Function to update the item */
	updateItem: (data: U & { id: string }) => Promise<any>;
	/** Function to delete the item */
	deleteItem: (id: string) => Promise<any>;
	/** URL to redirect to after delete (e.g., "/events") */
	listUrl: string;
	/** Singular name of the item (e.g., "event", "campaign") */
	itemName: string;
	/** Function to convert item to edit form data */
	toEditData: (item: T) => U;
}

export function createDetailPage<T, U = Partial<T>>(config: DetailPageConfig<T, U>) {
	const { fetchItem, updateItem, deleteItem, listUrl, itemName, toEditData } = config;
	
	let isEditing = $state(false);
	let editData = $state<U>({} as U);
	let itemId = $state('');
	
	/** Initialize from URL params and handle edit mode toggle */
	function initialize(id: string, checkEditParam: boolean = true) {
		itemId = id;
		
		if (checkEditParam) {
			const pageStore = get(page);
			const shouldEdit = pageStore.url.searchParams.get('edit') === '1';
			
			if (shouldEdit && !isEditing) {
				// Enter edit mode and load data
				fetchItem(id).then((item) => {
					if (item) {
						editData = toEditData(item);
						isEditing = true;
					}
				});
			} else if (!shouldEdit && isEditing) {
				isEditing = false;
			}
		}
	}
	
	/** Start editing with current item data */
	function startEditing(item: T) {
		editData = toEditData(item);
		isEditing = true;
	}
	
	/** Cancel editing */
	function cancelEditing() {
		isEditing = false;
		editData = {} as U;
	}
	
	/** Handle update with toast notifications */
	async function handleUpdate() {
		try {
			await updateItem({ ...editData, id: itemId } as U & { id: string });
			toast.success(`${itemName.charAt(0).toUpperCase() + itemName.slice(1)} updated successfully!`);
			isEditing = false;
		} catch (error: any) {
			toast.error(error.message || `Failed to update ${itemName}`);
		}
	}
	
	/** Handle delete with confirmation and navigation */
	async function handleDelete() {
		if (!confirm(`Are you sure you want to delete this ${itemName}?`)) return;
		
		try {
			await deleteItem(itemId);
			toast.success(`${itemName.charAt(0).toUpperCase() + itemName.slice(1)} deleted successfully!`);
			await goto(listUrl);
		} catch (error: any) {
			toast.error(error.message || `Failed to delete ${itemName}`);
		}
	}
	
	return {
		isEditing,
		editData,
		initialize,
		startEditing,
		cancelEditing,
		handleUpdate,
		handleDelete,
	};
}
