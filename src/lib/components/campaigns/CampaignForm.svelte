<script lang="ts">
	import type { HTMLFormAttributes } from 'svelte/elements';
	import type { RemoteForm } from '@sveltejs/kit';

	type Mode = 'create' | 'edit';

	interface Props extends Omit<HTMLFormAttributes, 'action' | 'method'> {
		form: RemoteForm<any, any>;
		mode?: Mode;
		submitLabel?: string;
		pendingLabel?: string;
		includeIdField?: boolean;
		cancelHref?: string;
		onCancel?: () => void;
	}

	let {
		form,
		mode = 'create',
		submitLabel = mode === 'create' ? 'Create Campaign' : 'Save Changes',
		pendingLabel = mode === 'create' ? 'Creating...' : 'Saving...',
		includeIdField = false,
		cancelHref,
		onCancel,
		class: className = '',
		...rest
	}: Props = $props();

	const showCancelLink = typeof cancelHref === 'string';
	const showCancelButton = !showCancelLink && typeof onCancel === 'function';
</script>

<form {...form} {...rest} class={className || 'space-y-6'}>
	{#if includeIdField}
		<input {...form.fields.id.as('text')} class="hidden" />
	{/if}

	<label class="block text-sm font-medium text-gray-700 mb-2">
		<span>Campaign Name</span>
		<input
			{...form.fields.name.as('text')}
			class="mt-2 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
			placeholder="Enter campaign name"
		/>
	</label>

	<label class="block text-sm font-medium text-gray-700 mb-2">
		<span>Content (JSON)</span>
		<textarea
			{...form.fields.content.as('text')}
			rows="12"
			class="mt-2 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
			placeholder="{'{}'}"
		></textarea>
		<p class="mt-1 text-sm text-gray-500">Enter campaign content as JSON</p>
	</label>

	<div class="flex gap-3">
		<button
			type="submit"
			disabled={form.pending > 0}
			class="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
		>
			{form.pending > 0 ? pendingLabel : submitLabel}
		</button>

		{#if showCancelLink}
			<a
				href={cancelHref}
				class="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
			>
				Cancel
			</a>
		{:else if showCancelButton}
			<button
				type="button"
				onclick={onCancel}
				class="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
			>
				Cancel
			</button>
		{/if}
	</div>
</form>
