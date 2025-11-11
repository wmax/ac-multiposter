/**
 * Creates a reactive multi-select state manager
 */
export function createMultiSelect<T extends { id: string }>() {
	let selectedIds: Set<string> = $state(new Set());

	return {
		get selectedIds() {
			return selectedIds;
		},
		get count() {
			return selectedIds.size;
		},
		toggleSelection(id: string) {
			if (selectedIds.has(id)) {
				selectedIds = new Set([...selectedIds].filter(sid => sid !== id));
			} else {
				selectedIds = new Set([...selectedIds, id]);
			}
		},
		selectAll(items: T[]) {
			selectedIds = new Set(items.map((item) => item.id));
		},
		deselectAll() {
			selectedIds = new Set();
		},
		isSelected(id: string) {
			return selectedIds.has(id);
		},
		getSelectedArray() {
			return Array.from(selectedIds);
		}
	};
}
