<script lang="ts">
	import { toast } from '$lib/stores/toast.svelte';
	import { CheckCircle, XCircle, Info, AlertTriangle, X } from '@lucide/svelte';
	import { fly } from 'svelte/transition';

	const typeConfig = {
		success: {
			icon: CheckCircle,
			bgColor: 'bg-green-50',
			borderColor: 'border-green-500',
			textColor: 'text-green-800',
			iconColor: 'text-green-500'
		},
		error: {
			icon: XCircle,
			bgColor: 'bg-red-50',
			borderColor: 'border-red-500',
			textColor: 'text-red-800',
			iconColor: 'text-red-500'
		},
		info: {
			icon: Info,
			bgColor: 'bg-blue-50',
			borderColor: 'border-blue-500',
			textColor: 'text-blue-800',
			iconColor: 'text-blue-500'
		},
		warning: {
			icon: AlertTriangle,
			bgColor: 'bg-yellow-50',
			borderColor: 'border-yellow-500',
			textColor: 'text-yellow-800',
			iconColor: 'text-yellow-500'
		}
	};
</script>

<div class="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md pointer-events-none">
	{#each toast.toasts as t (t.id)}
		{@const config = typeConfig[t.type]}
		{@const Icon = config.icon}
		<div
			transition:fly={{ y: -20, duration: 300 }}
			class="pointer-events-auto {config.bgColor} {config.borderColor} border-l-4 rounded-lg shadow-lg p-4 flex items-start gap-3"
			role="alert"
		>
			<Icon class="h-5 w-5 {config.iconColor} flex-shrink-0 mt-0.5" />
			<p class="{config.textColor} flex-1 text-sm font-medium">{t.message}</p>
			<button
				onclick={() => toast.dismiss(t.id)}
				class="{config.textColor} hover:opacity-70 transition-opacity"
				aria-label="Dismiss"
			>
				<X class="h-4 w-4" />
			</button>
		</div>
	{/each}
</div>
