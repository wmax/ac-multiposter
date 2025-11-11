<script lang="ts">
	import { listEvents } from './list.remote';
	import { deleteEvents } from './[id]/delete.remote';
	import type { Event } from './list.remote';

	// Form state
	let selectedIds: Set<string> = $state(new Set());

	async function handleDelete() {
		if (selectedIds.size === 0) return;
		if (!confirm(`Delete ${selectedIds.size} event(s)?`)) return;

		try {
			await deleteEvents(Array.from(selectedIds)).updates(listEvents());
			selectedIds = new Set(); // Clear and trigger reactivity
		} catch (error) {
			alert('Failed to delete events');
		}
	}

	function toggleSelection(id: string) {
		if (selectedIds.has(id)) {
			selectedIds = new Set([...selectedIds].filter(sid => sid !== id));
		} else {
			selectedIds = new Set([...selectedIds, id]);
		}
	}

	async function toggleSelectAll() {
		const events = await listEvents();
		if (selectedIds.size === events.length) {
			selectedIds = new Set();
		} else {
			selectedIds = new Set(events.map((e) => e.id));
		}
	}

	function formatEventTime(event: Event): string {
		// Handle all-day events
		if (event.startDate) {
			return `All day on ${event.startDate}`;
		}
		
		// Handle timed events
		if (event.startDateTime) {
			const start = new Date(event.startDateTime);
			const end = event.endDateTime ? new Date(event.endDateTime) : null;
			const dateStr = start.toLocaleDateString();
			const startTime = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
			
			if (end) {
				const endTime = end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
				return `${dateStr}, ${startTime} - ${endTime}`;
			}
			
			return `${dateStr}, ${startTime}`;
		}
		
		return 'Time not specified';
	}
</script>

<div class="container mx-auto px-4 py-8">
	<!-- Breadcrumb Navigation -->
	<nav class="mb-4 text-sm">
		<ol class="flex items-center space-x-2 text-gray-600">
			<li>
				<a href="/" class="hover:text-blue-600 hover:underline">Home</a>
			</li>
			<li>
				<span class="text-gray-400">/</span>
			</li>
			<li class="text-gray-900 font-medium">Events</li>
		</ol>
	</nav>

	<div class="flex justify-between items-center mb-6">
		<h1 class="text-3xl font-bold">Calendar Events</h1>
		<div class="flex gap-2">
			{#if selectedIds.size > 0}
				<button
					onclick={toggleSelectAll}
					class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
				>
					{#await listEvents() then events}
						{selectedIds.size === events.length ? 'Deselect All' : 'Select All'}
					{/await}
				</button>
				<button
					onclick={handleDelete}
					class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
				>
					Delete Selected ({selectedIds.size})
				</button>
			{/if}
			<a
				href="/events/new"
				class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
			>
				+ New Event
			</a>
		</div>
	</div>

	<div class="grid gap-4">
		{#await listEvents()}
			<div class="text-center py-12 text-gray-500">Loading events...</div>
		{:then events}
			{#each events as event (event.id)}
			<div class="bg-white shadow rounded-lg p-6 flex items-start gap-4">
				<input
					type="checkbox"
					checked={selectedIds.has(event.id)}
					onchange={() => toggleSelection(event.id)}
					class="mt-1 w-4 h-4 text-blue-600"
				/>
				<div class="flex-1">
					<div class="flex items-start gap-3 mb-2">
						<div class="flex-1">
							<h2 class="text-xl font-semibold">
								<a href={`/events/${event.id}`} class="hover:underline text-blue-600">{event.summary}</a>
							</h2>
							<p class="text-sm text-gray-600 mt-1">{formatEventTime(event)}</p>
						</div>
						{#if event.colorId}
							<div
								class="w-4 h-4 rounded-full"
								style="background-color: hsl({parseInt(event.colorId) * 30}, 70%, 60%)"
							></div>
						{/if}
					</div>
					
					{#if event.location}
						<p class="text-sm text-gray-600 mb-2">
							📍 {event.location}
						</p>
					{/if}
					
					{#if event.description}
						<p class="text-gray-700 mb-2 line-clamp-2">{event.description}</p>
					{/if}
					
					<div class="flex gap-2 flex-wrap mt-3">
						<span class="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
							{event.eventType}
						</span>
						<span class="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
							{event.status}
						</span>
						{#if event.attendees && event.attendees.length > 0}
							<span class="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
								{event.attendees.length} attendee{event.attendees.length > 1 ? 's' : ''}
							</span>
						{/if}
						{#if event.recurrence}
							<span class="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
								Recurring
							</span>
						{/if}
					</div>
					
					<p class="text-xs text-gray-500 mt-3">
						Created: {new Date(event.createdAt).toLocaleString()}
					</p>
				</div>
				<div class="flex flex-col gap-2">
					<a
						href={`/events/${event.id}?edit=1`}
						class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-center"
					>
						Edit
					</a>
					<button
						onclick={async () => {
							if (confirm(`Delete event "${event.summary}"?`)) {
								try {
									await deleteEvents([event.id]).updates(listEvents());
								} catch (error) {
									alert('Failed to delete event');
								}
							}
						}}
						class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
					>
						Delete
					</button>
				</div>
			</div>
			{:else}
				<div class="text-center py-12 text-gray-500">
					<p class="text-lg mb-4">No events yet</p>
					<a
						href="/events/new"
						class="inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
					>
						Create your first event
					</a>
				</div>
			{/each}
		{:catch error}
			<div class="text-center py-12">
				<p class="text-red-600 mb-3">{error?.message || 'Failed to load events'}</p>
				<a href="/api/auth/signin" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Sign in</a>
			</div>
		{/await}
	</div>
</div>
