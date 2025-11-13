<script lang="ts">
	import { goto } from '$app/navigation';
	import { createEvent } from './create.remote';
	import { listEvents } from '../list.remote';
	import EventForm from '$lib/components/events/EventForm.svelte';
	import Breadcrumb from '$lib/components/ui/Breadcrumb.svelte';
	import { toast } from '$lib/stores/toast.svelte';

	const createForm = createEvent;

	async function handleCreate(data: any) {
		// Navigate immediately for better UX
		const navigationPromise = goto('/events');
		toast.success('Creating event...');
		
		try {
			// Execute the create operation in the background
			await createForm(data).updates(listEvents());
			await navigationPromise;
			toast.success('Event created successfully!');
		} catch (error: any) {
			console.error('Failed to create event:', error);
			toast.error(error.message || 'Failed to create event');
			// Don't throw - user already navigated away
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
