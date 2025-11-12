<script lang="ts">
	import { goto } from '$app/navigation';
	import { createEvent } from './create.remote';
	import { listEvents } from '../list.remote';
	import EventForm from '$lib/components/events/EventForm.svelte';
	import { toast } from '$lib/stores/toast.svelte';

	const createForm = createEvent;

	async function handleCreate(data: any) {
		try {
			await createForm(data).updates(listEvents());
			toast.success('Event created successfully!');
			await goto('/events');
		} catch (error: any) {
			console.error('Failed to create event:', error);
			toast.error(error.message || 'Failed to create event');
			throw error; // Re-throw so the form can handle it
		}
	}
</script>

<div class="container mx-auto px-4 py-8 max-w-3xl">
	<!-- Breadcrumb Navigation -->
	<nav class="mb-4 text-sm">
		<ol class="flex items-center space-x-2 text-gray-600">
			<li>
				<a href="/" class="hover:text-blue-600 hover:underline">Home</a>
			</li>
			<li>
				<span class="text-gray-400">/</span>
			</li>
			<li>
				<a href="/events" class="hover:text-blue-600 hover:underline">Events</a>
			</li>
			<li>
				<span class="text-gray-400">/</span>
			</li>
			<li class="text-gray-900 font-medium">New Event</li>
		</ol>
	</nav>

	<h1 class="text-3xl font-bold mb-6">Create New Event</h1>
	<EventForm submitLabel="Create Event" onSubmit={handleCreate} />
</div>
