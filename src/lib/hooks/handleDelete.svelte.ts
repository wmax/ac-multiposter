// src/lib/hooks/handleDelete.svelte.ts
// Shared delete handler for all list pages (Svelte 5 idiom)
import { toast } from 'svelte-sonner';

/**
 * Shared delete handler for list pages.
 * @param opts - Options for deletion
 * @param opts.ids - Array of item IDs to delete
 * @param opts.deleteFn - Function to call to perform the delete (should return a promise)
 * @param opts.itemName - Name of the item (singular, e.g. "campaign")
 */
export async function handleDelete({
    ids,
    deleteFn,
    itemName,
    }: {
    ids: string[];
    deleteFn: (ids: string[]) => Promise<any>;
    itemName: string;
    }): Promise<void> {
    if (!ids?.length) return;
    const plural = ids.length === 1 ? '' : 's';
    if (!confirm(`Delete ${ids.length} ${itemName}${plural}?`)) return;
    try {
        await deleteFn(ids);
        toast.success(`${ids.length} ${itemName}${plural} deleted successfully!`);
    } catch (e) {
        toast.error(`Failed to delete ${itemName}${plural}`);
    }
}
