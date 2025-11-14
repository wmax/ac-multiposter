/**
 * Creates a reactive multi-select state manager
 */
export function createMultiSelect<T extends { id: string }>() {
	let selectedIds: Set<string> = $state(new Set());
	let version = $state(0);

	function touch() {
		version = version + 1;
	}

	return {
		get version() {
			return version;
		},
		get selectedIds() {
			version;
			return selectedIds;
		},
		get count() {
			version;
			return selectedIds.size;
		},
		toggleSelection(id: string) {
			if (selectedIds.has(id)) {
				selectedIds = new Set([...selectedIds].filter(sid => sid !== id));
			} else {
				selectedIds = new Set([...selectedIds, id]);
			}
			touch();
		},
		selectAll(items: T[]) {
			selectedIds = new Set(items.map((item) => item.id));
			touch();
		},
		deselectAll() {
			selectedIds = new Set();
			touch();
		},
		remove(id: string) {
			if (!selectedIds.has(id)) return;
			selectedIds = new Set([...selectedIds].filter((sid) => sid !== id));
			touch();
		},
		isSelected(id: string) {
			version;
			return selectedIds.has(id);
		},
		getSelectedArray() {
			version;
			return Array.from(selectedIds);
		}
	};
}
