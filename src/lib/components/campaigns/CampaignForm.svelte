<script lang="ts">
	import type { HTMLFormAttributes } from 'svelte/elements';
	import type { RemoteForm } from '@sveltejs/kit';
	import { createCampaignSchema, updateCampaignSchema } from '$lib/validations/campaign';
	import { toast } from '$lib/stores/toast.svelte';

	type Mode = 'create' | 'edit';

	interface Props extends Omit<HTMLFormAttributes, 'action' | 'method'> {
		form: RemoteForm<any, any>;
		mode?: Mode;
		submitLabel?: string;
		pendingLabel?: string;
		includeIdField?: boolean;
		cancelHref?: string;
		onCancel?: () => void;
		onFormSuccess?: () => void;
		onFormError?: () => void;
		initialValues?: Record<string, unknown>;
	}

	let {
		form,
		mode = 'create',
		submitLabel = mode === 'create' ? 'Create Campaign' : 'Save Changes',
		pendingLabel = mode === 'create' ? 'Creating...' : 'Saving...',
		includeIdField = false,
		cancelHref,
		onCancel,
		onFormSuccess,
		onFormError,
		initialValues,
		class: className = '',
		...rest
	}: Props = $props();

	const showCancelLink = typeof cancelHref === 'string';
	const showCancelButton = !showCancelLink && typeof onCancel === 'function';

	// Use preflight schema for client-side validation
	const schema = mode === 'create' ? createCampaignSchema : updateCampaignSchema;
	const formWithValidation = form.preflight(schema);

	// If initial values provided, set them once
	if (initialValues) {
		try {
			formWithValidation.fields.set(initialValues);
		} catch (e) {
			// ignore invalid shapes
		}
	}

	// Apply enhance if callbacks provided, but keep formWithValidation for state checks
	const formAttributes = onFormSuccess || onFormError 
		? formWithValidation.enhance(async ({ submit }) => {
			try {
				await submit();
				onFormSuccess?.();
			} catch (error) {
				onFormError?.();
			}
		})
		: formWithValidation;

	// Show toast on form submit attempt with validation errors
	function handleSubmit(event: SubmitEvent) {
		// Validate explicitly before showing toast
		formWithValidation.validate({ includeUntouched: true });
		
		const allIssues = formWithValidation.fields.allIssues();
		if (allIssues && allIssues.length > 0) {
			const firstError = allIssues[0]?.message;
			toast.error(
				allIssues.length === 1
					? firstError || 'Please fix the validation error'
					: `Please fix ${allIssues.length} validation errors`
			);
		}
	}
</script>

<form {...formAttributes} {...rest} class={className || 'space-y-6'} onsubmit={handleSubmit}>
	{#if includeIdField}
		<input {...formWithValidation.fields.id.as('text')} class="hidden" />
	{/if}

	<label class="block text-sm font-medium text-gray-700 mb-2">
		<span>Campaign Name</span>
		<input
			{...formWithValidation.fields.name.as('text')}
			class="mt-2 w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 {(formWithValidation.fields.name.issues()?.length ?? 0) > 0
				? 'border-red-500'
				: 'border-gray-300'}"
			placeholder="Enter campaign name"
			onchange={() => formWithValidation.validate()}
		/>
		{#each formWithValidation.fields.name.issues() ?? [] as issue}
			<p class="mt-1 text-sm text-red-600">{issue.message}</p>
		{/each}
	</label>

	<label class="block text-sm font-medium text-gray-700 mb-2">
		<span>Content (JSON)</span>
		<textarea
			{...formWithValidation.fields.content.as('text')}
			rows="12"
			class="mt-2 w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm {(formWithValidation.fields.content.issues()?.length ?? 0) > 0
				? 'border-red-500'
				: 'border-gray-300'}"
			placeholder="{'{}'}"
			onchange={() => formWithValidation.validate()}
		></textarea>
		{#each formWithValidation.fields.content.issues() ?? [] as issue}
			<p class="mt-1 text-sm text-red-600">{issue.message}</p>
		{/each}
		<p class="mt-1 text-sm text-gray-500">Enter campaign content as JSON</p>
	</label>

	<div class="flex gap-3">
		<button
			type="submit"
			disabled={formWithValidation.pending > 0}
			class="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
		>
			{formWithValidation.pending > 0 ? pendingLabel : submitLabel}
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
