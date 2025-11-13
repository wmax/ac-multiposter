/**
 * Reusable create page logic for new item forms
 * Handles: optimistic navigation, toast notifications, error recovery
 */
import { goto } from '$app/navigation';
import { toast } from '$lib/stores/toast.svelte';

export interface CreatePageConfig<T> {
	/** Function to create the item */
	createItem: (data: T) => Promise<any>;
	/** URL to redirect to after creation (e.g., "/events") */
	listUrl: string;
	/** Singular name of the item (e.g., "event", "campaign") */
	itemName: string;
}

export function createCreatePage<T>(config: CreatePageConfig<T>) {
	const { createItem, listUrl, itemName } = config;
	
	let isSubmitting = $state(false);
	
	/** Handle creation with optimistic navigation and toast notifications */
	async function handleCreate(data: T) {
		if (isSubmitting) return;
		
		try {
			isSubmitting = true;
			
			// Navigate immediately for better UX
			const navigationPromise = goto(listUrl);
			toast.success(`Creating ${itemName}...`);
			
			// Execute the create operation in the background
			await createItem(data);
			await navigationPromise;
			
			toast.success(`${itemName.charAt(0).toUpperCase() + itemName.slice(1)} created successfully!`);
		} catch (error: any) {
			console.error(`Failed to create ${itemName}:`, error);
			toast.error(error.message || `Failed to create ${itemName}`);
			// Don't throw - user already navigated away
		} finally {
			isSubmitting = false;
		}
	}
	
	return {
		isSubmitting,
		handleCreate,
	};
}
