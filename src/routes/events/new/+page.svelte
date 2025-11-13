<script lang="ts">
	import { goto } from '$app/navigation';
	import { createEvent } from './create.remote';
	import { listEvents } from '../list.remote';
	import EventForm from '$lib/components/events/EventForm.svelte';
	import Breadcrumb from '$lib/components/ui/Breadcrumb.svelte';
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
	<Breadcrumb 
		feature="events"
		current="New Event"
	/>

	<h1 class="text-3xl font-bold mb-6">Create New Event</h1>
	<EventForm submitLabel="Create Event" onSubmit={handleCreate} />
</div>
