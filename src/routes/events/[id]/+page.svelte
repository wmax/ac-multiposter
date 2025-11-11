<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { getEvent } from './view.remote';
	import { updateEvent } from './update.remote';
	import { deleteEvents } from './delete.remote';
	import type { Event } from '../list.remote';
    import EventForm from '$lib/components/events/EventForm.svelte';

	// Shape expected by updateEvent command
	type UpdateEventInput = {
		id: string;
		summary?: string;
		description?: string;
		location?: string;
		startDate?: string;
		startDateTime?: string;
		startTimeZone?: string;
		endDate?: string;
		endDateTime?: string;
		endTimeZone?: string;
		eventType?: string;
		status?: string;
		visibility?: string;
		transparency?: string;
		colorId?: string;
		recurrence?: string[];
		attendees?: Array<{
			email: string;
			displayName?: string;
			optional?: boolean;
			responseStatus?: string;
		}>;
		reminders?: {
			useDefault: boolean;
			overrides?: Array<{ method: string; minutes: number }>;
		};
		guestsCanInviteOthers?: boolean;
		guestsCanModify?: boolean;
		guestsCanSeeOtherGuests?: boolean;
	};

	const eventId = $derived($page.params.id || '');

	let isEditing = $state(false);
	let editData = $state<Partial<UpdateEventInput>>({});

	$effect(() => {
		const shouldEdit = $page.url.searchParams.get('edit') === '1';
		if (shouldEdit && !isEditing) {
			// Entering edit mode: populate editData from latest event data
			getEvent(eventId).then((event) => {
				if (!event) return;
				editData = {
					summary: event.summary,
					description: event.description || undefined,
					location: event.location || undefined,
					startDate: event.startDate || undefined,
					startDateTime: event.startDateTime ? new Date(event.startDateTime).toISOString() : undefined,
					startTimeZone: event.startTimeZone || undefined,
					endDate: event.endDate || undefined,
					endDateTime: event.endDateTime ? new Date(event.endDateTime).toISOString() : undefined,
					endTimeZone: event.endTimeZone || undefined,
					eventType: event.eventType,
					status: event.status,
					visibility: event.visibility || undefined,
					transparency: event.transparency || undefined,
					colorId: event.colorId || undefined,
					guestsCanInviteOthers: event.guestsCanInviteOthers || undefined,
					guestsCanModify: event.guestsCanModify || undefined,
					guestsCanSeeOtherGuests: event.guestsCanSeeOtherGuests || undefined,
					reminders: event.reminders || undefined,
				};
				isEditing = true;
			});
		} else if (!shouldEdit && isEditing) {
			isEditing = false;
		}
	});

	function startEditing(event: Event) {
		isEditing = true;
		editData = {
			summary: event.summary,
			description: event.description || undefined,
			location: event.location || undefined,
			startDate: event.startDate || undefined,
			startDateTime: event.startDateTime ? new Date(event.startDateTime).toISOString().slice(0, 16) : undefined,
			startTimeZone: event.startTimeZone || undefined,
			endDate: event.endDate || undefined,
			endDateTime: event.endDateTime ? new Date(event.endDateTime).toISOString().slice(0, 16) : undefined,
			endTimeZone: event.endTimeZone || undefined,
			eventType: event.eventType,
			status: event.status,
			visibility: event.visibility || undefined,
			transparency: event.transparency || undefined,
			colorId: event.colorId || undefined,
		};
	}

	async function handleUpdate() {
		try {
			await updateEvent({ id: eventId, ...editData });
			isEditing = false;
		} catch (error) {
			alert('Failed to update event');
		}
	}

	async function handleDelete() {
		if (!confirm('Are you sure you want to delete this event?')) return;
		
		try {
			await deleteEvents([eventId]);
			goto('/events');
		} catch (error) {
			alert('Failed to delete event');
		}
	}

	function formatEventTime(event: Event): string {
		if (event.startDate) {
			const end = event.endDate ? ` to ${event.endDate}` : '';
			return `All day: ${event.startDate}${end}`;
		}
		
		if (event.startDateTime) {
			const start = new Date(event.startDateTime);
			const end = event.endDateTime ? new Date(event.endDateTime) : null;
			const dateStr = start.toLocaleDateString();
			const startTime = start.toLocaleTimeString();
			
			if (end) {
				const endTime = end.toLocaleTimeString();
				return `${dateStr}, ${startTime} - ${endTime}`;
			}
			
			return `${dateStr}, ${startTime}`;
		}
		
		return 'Time not specified';
	}
</script>

{#await getEvent(eventId)}
	<div class="container mx-auto px-4 py-8">
		<p>Loading event...</p>
	</div>
{:then event}
	{#if !event}
		<div class="container mx-auto px-4 py-8">
			<p>Event not found</p>
			<button onclick={() => goto('/events')} class="text-blue-500 hover:underline">Back to Events</button>
		</div>
	{:else}
		<div class="container mx-auto px-4 py-8 max-w-4xl">
			<!-- Breadcrumb Navigation -->
			<nav class="mb-4 text-sm">
				<ol class="flex items-center space-x-2 text-gray-600">
					<li>
						<button onclick={() => goto('/')} class="hover:text-blue-600 hover:underline">Home</button>
					</li>
					<li>
						<span class="text-gray-400">/</span>
					</li>
					<li>
						<button onclick={() => goto('/events')} class="hover:text-blue-600 hover:underline">Events</button>
					</li>
					<li>
						<span class="text-gray-400">/</span>
					</li>
					<li class="text-gray-900 font-medium truncate max-w-xs">
						{event.summary}
					</li>
				</ol>
			</nav>

			<div class="flex justify-between items-start mb-6">
				<h1 class="text-3xl font-bold">{event.summary}</h1>
				<div class="flex gap-2">
					{#if !isEditing}
						<a
							href={`?edit=1`}
							class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
						>
							Edit
						</a>
						<button
							onclick={handleDelete}
							class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
						>
							Delete
						</button>
					{/if}
				</div>
			</div>

			{#if isEditing}
				<EventForm
					initial={editData}
					submitLabel="Save Changes"
					onSubmit={async (data) => {
						await updateEvent({ id: eventId, ...data });
						isEditing = false;
						goto(`/events/${eventId}`);
					}}
					onCancel={() => goto(`/events/${eventId}`)}
				/>
			{:else}
				<!-- View Mode -->
				<div class="space-y-6">
					<!-- Event Details -->
					<div class="bg-white shadow rounded-lg p-6 space-y-4">
						<div class="flex items-start gap-3">
							<div class="flex-1">
								<h2 class="text-xl font-semibold mb-2">Event Details</h2>
								
								<div class="space-y-3">
									<div>
										<span class="text-sm font-medium text-gray-600">When:</span>
										<p class="text-gray-900">{formatEventTime(event)}</p>
										{#if event.startTimeZone}
											<p class="text-sm text-gray-600">Time zone: {event.startTimeZone}</p>
										{/if}
									</div>

									{#if event.location}
										<div>
											<span class="text-sm font-medium text-gray-600">Where:</span>
											<p class="text-gray-900">📍 {event.location}</p>
										</div>
									{/if}

									{#if event.description}
										<div>
											<span class="text-sm font-medium text-gray-600">Description:</span>
											<p class="text-gray-900 whitespace-pre-wrap">{event.description}</p>
										</div>
									{/if}
								</div>
							</div>
							
							{#if event.colorId}
								<div
									class="w-6 h-6 rounded-full"
									style="background-color: hsl({parseInt(event.colorId) * 30}, 70%, 60%)"
								></div>
							{/if}
						</div>

						<div class="flex gap-2 flex-wrap pt-4 border-t">
							<span class="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded">
								Type: {event.eventType}
							</span>
							<span class="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded">
								Status: {event.status}
							</span>
							<span class="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded">
								Visibility: {event.visibility}
							</span>
							<span class="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded">
								Show as: {event.transparency}
							</span>
						</div>
					</div>

					<!-- Attendees -->
					{#if event.attendees && event.attendees.length > 0}
						<div class="bg-white shadow rounded-lg p-6">
							<h2 class="text-xl font-semibold mb-4">Attendees ({event.attendees.length})</h2>
							<div class="space-y-2">
								{#each event.attendees as attendee}
									<div class="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
										<div class="flex-1">
											<p class="font-medium text-gray-900">
												{attendee.displayName || attendee.email}
												{#if attendee.organizer}
													<span class="text-xs text-blue-600">(Organizer)</span>
												{/if}
												{#if attendee.optional}
													<span class="text-xs text-gray-500">(Optional)</span>
												{/if}
											</p>
											{#if attendee.displayName}
												<p class="text-sm text-gray-600">{attendee.email}</p>
											{/if}
										</div>
										{#if attendee.responseStatus}
											<span class="text-xs px-2 py-1 rounded
												{attendee.responseStatus === 'accepted' ? 'bg-green-100 text-green-700' :
												attendee.responseStatus === 'declined' ? 'bg-red-100 text-red-700' :
												attendee.responseStatus === 'tentative' ? 'bg-yellow-100 text-yellow-700' :
												'bg-gray-100 text-gray-700'}">
												{attendee.responseStatus}
											</span>
										{/if}
									</div>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Reminders -->
					{#if event.reminders}
						<div class="bg-white shadow rounded-lg p-6">
							<h2 class="text-xl font-semibold mb-4">Reminders</h2>
							{#if event.reminders.useDefault}
								<p class="text-gray-700">Using default calendar reminders</p>
							{:else if event.reminders.overrides && event.reminders.overrides.length > 0}
								<div class="space-y-2">
									{#each event.reminders.overrides as reminder}
										<div class="flex items-center gap-2">
											<span class="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded">
												{reminder.method}
											</span>
											<span class="text-gray-700">
												{reminder.minutes} minutes before
											</span>
										</div>
									{/each}
								</div>
							{:else}
								<p class="text-gray-500">No reminders set</p>
							{/if}
						</div>
					{/if}

					<!-- Recurrence -->
					{#if event.recurrence && event.recurrence.length > 0}
						<div class="bg-white shadow rounded-lg p-6">
							<h2 class="text-xl font-semibold mb-4">Recurrence</h2>
							<div class="space-y-1">
								{#each event.recurrence as rule}
									<code class="block text-sm bg-gray-50 p-2 rounded font-mono">
										{rule}
									</code>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Conference Data -->
					{#if event.conferenceData}
						<div class="bg-white shadow rounded-lg p-6">
							<h2 class="text-xl font-semibold mb-4">Conference Details</h2>
							{#if event.conferenceData.entryPoints}
								<div class="space-y-2">
									{#each event.conferenceData.entryPoints as entryPoint}
										<div class="p-3 bg-gray-50 rounded">
											<p class="font-medium text-gray-900">
												{entryPoint.entryPointType}
											</p>
											<a
												href={entryPoint.uri}
												target="_blank"
												rel="noopener noreferrer"
												class="text-blue-500 hover:underline break-all"
											>
												{entryPoint.label || entryPoint.uri}
											</a>
										</div>
									{/each}
								</div>
							{/if}
						</div>
					{/if}

					<!-- Metadata -->
					<div class="bg-white shadow rounded-lg p-6">
						<h2 class="text-xl font-semibold mb-4">Metadata</h2>
						<div class="space-y-2 text-sm">
							<div>
								<span class="font-medium text-gray-600">Created:</span>
								<span class="text-gray-900">{new Date(event.createdAt).toLocaleString()}</span>
							</div>
							<div>
								<span class="font-medium text-gray-600">Last Updated:</span>
								<span class="text-gray-900">{new Date(event.updatedAt).toLocaleString()}</span>
							</div>
							{#if event.googleEventId}
								<div>
									<span class="font-medium text-gray-600">Google Event ID:</span>
									<span class="text-gray-900 font-mono text-xs">{event.googleEventId}</span>
								</div>
							{/if}
							{#if event.iCalUID}
								<div>
									<span class="font-medium text-gray-600">iCal UID:</span>
									<span class="text-gray-900 font-mono text-xs">{event.iCalUID}</span>
								</div>
							{/if}
						</div>
					</div>
				</div>
			{/if}
		</div>
	{/if}
{:catch error}
	<div class="container mx-auto px-4 py-8">
		<p class="text-red-500">Error loading event: {error.message}</p>
		<a href="/events" class="text-blue-500 hover:underline">Back to Events</a>
	</div>
{/await}
