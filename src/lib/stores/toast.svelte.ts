/**
 * Simple toast notification store
 */

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
	id: string;
	message: string;
	type: ToastType;
	duration?: number;
}

class ToastStore {
	toasts = $state<Toast[]>([]);

	show(message: string, type: ToastType = 'info', duration = 5000) {
		const id = crypto.randomUUID();
		const toast: Toast = { id, message, type, duration };
		
		this.toasts.push(toast);

		if (duration > 0) {
			setTimeout(() => {
				this.dismiss(id);
			}, duration);
		}
	}

	success(message: string, duration = 5000) {
		this.show(message, 'success', duration);
	}

	error(message: string, duration = 7000) {
		this.show(message, 'error', duration);
	}

	info(message: string, duration = 5000) {
		this.show(message, 'info', duration);
	}

	warning(message: string, duration = 6000) {
		this.show(message, 'warning', duration);
	}

	dismiss(id: string) {
		this.toasts = this.toasts.filter((t) => t.id !== id);
	}
}

export const toast = new ToastStore();
