<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { getEvent } from './view.remote';
	import { updateEvent } from './update.remote';
	import { deleteEvents } from './delete.remote';
	import Breadcrumb from '$lib/components/ui/Breadcrumb.svelte';
	import { toast } from '$lib/stores/toast.svelte';

	const eventId = $derived($page.params.id || '');
	const eventQuery = $derived(getEvent(eventId));

	let isEditing = $state(false);
	
	// Schema fields - these match updateEventSchema
	let summary = $state('');
	let description = $state('');
	let locationField = $state('');
	let startDate = $state('');
	let startDateTime = $state('');
	let startTimeZone = $state('');
	let endDate = $state('');
	let endDateTime = $state('');
	let endTimeZone = $state('');
	let eventType = $state('default');
	let status = $state('confirmed');
	let visibility = $state('default');
	let transparency = $state('opaque');
	let colorId = $state('');
	let remindersJson = $state('{"useDefault":true}');
	let guestsCanInviteOthers = $state(true);
	let guestsCanModify = $state(false);
	let guestsCanSeeOtherGuests = $state(true);
	
	// UI helper state
	let isAllDay = $state(false);
	let hasEndTime = $state(false);
	let useDefaultReminders = $state(true);
	let reminders = $state<Array<{ method: string; minutes: number }>>([{ method: 'popup', minutes: 10 }]);
	
	// Helper fields for date/time input
	let startDateInput = $state('');
	let startTimeInput = $state('');
	let endDateInput = $state('');
	let endTimeInput = $state('');
	let timeZone = $state('');

	const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

	// Use $effect to sync UI state to schema fields
	$effect(() => {
		if (isAllDay) {
			// For all-day events, use date fields and clear datetime
			startDate = startDateInput;
			endDate = hasEndTime ? endDateInput : '';
			startDateTime = '';
			endDateTime = '';
		} else {
			// For timed events, compute datetime and clear date fields
			startDateTime = startDateInput && startTimeInput 
				? `${startDateInput}T${startTimeInput}:00` 
				: '';
			endDateTime = hasEndTime && endDateInput && endTimeInput
				? `${endDateInput}T${endTimeInput}:00` 
				: '';
			startDate = '';
			endDate = '';
		}
	});

	// Sync timezone fields
	$effect(() => {
		if (!isAllDay && timeZone) {
			startTimeZone = timeZone;
			endTimeZone = timeZone;
		}
	});

	// Sync reminders to JSON
	$effect(() => {
		remindersJson = JSON.stringify(
			useDefaultReminders 
				? { useDefault: true } 
				: { useDefault: false, overrides: reminders }
		);
	});

	function addReminder() {
		reminders = [...reminders, { method: 'popup', minutes: 10 }];
	}

	function removeReminder(index: number) {
		reminders = reminders.filter((_, i) => i !== index);
	}

	function startEditing() {
		const event = eventQuery.current;
		if (!event) return;

		isEditing = true;
		
		// Populate schema fields
		summary = event.summary || '';
		description = event.description || '';
		locationField = event.location || '';
		eventType = event.eventType || 'default';
		status = event.status || 'confirmed';
		visibility = event.visibility || 'default';
		transparency = event.transparency || 'opaque';
		colorId = event.colorId || '';
		timeZone = event.startTimeZone || browserTimezone;
		
		// Determine if all-day event
		isAllDay = !event.startDateTime && !!event.startDate;
		hasEndTime = !!event.endDateTime || !!event.endDate;
		
		if (event.startDate) {
			// All-day event
			startDateInput = event.startDate;
			if (event.endDate) {
				endDateInput = event.endDate;
			}
		} else if (event.startDateTime) {
			// Timed event
			const dt = new Date(event.startDateTime);
			startDateInput = dt.toISOString().split('T')[0];
			startTimeInput = dt.toTimeString().slice(0, 5);
			
			if (event.endDateTime) {
				const endDt = new Date(event.endDateTime);
				endDateInput = endDt.toISOString().split('T')[0];
				endTimeInput = endDt.toTimeString().slice(0, 5);
			}
		}
		
		// Set reminders
		if (event.reminders) {
			useDefaultReminders = event.reminders.useDefault ?? true;
			if (event.reminders.overrides?.length) {
				reminders = event.reminders.overrides;
			}
		}
		
		// Set guest permissions
		guestsCanInviteOthers = event.guestsCanInviteOthers ?? true;
		guestsCanModify = event.guestsCanModify ?? false;
		guestsCanSeeOtherGuests = event.guestsCanSeeOtherGuests ?? true;
	}

	async function handleDelete() {
		if (!confirm('Are you sure you want to delete this event?')) return;
		
		try {
			await deleteEvents([eventId]);
			toast.show('Event deleted successfully!', 'success');
			goto('/events');
		} catch (error: any) {
			toast.show(error?.message || 'Failed to delete event', 'error');
		}
	}

	function formatEventTime(event: any): string {
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

{#await eventQuery}
	<div class="container mx-auto px-4 py-8">
		<p>Loading event...</p>
	</div>
{:then event}
	{#if !event}
		<div class="container mx-auto px-4 py-8">
			<p>Event not found</p>
			<button onclick={() => goto('/events')} class="text-blue-500 hover:underline">Back to Events</button>
		</div>
	{:else if !isEditing}
		<!-- View Mode -->
		<div class="container mx-auto px-4 py-8 max-w-4xl">
			<Breadcrumb 
				feature="events"
				current={event.summary}
			/>

			<div class="flex justify-between items-start mb-6">
				<h1 class="text-3xl font-bold">{event.summary}</h1>
				<div class="flex gap-2">
					<button 
						onclick={startEditing}
						class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
					>
						Edit
					</button>
					<button 
						onclick={handleDelete}
						class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
					>
						Delete
					</button>
				</div>
			</div>

			<div class="space-y-6">
				<!-- Event Details -->
				<div class="bg-white shadow rounded-lg p-6">
					<h2 class="text-xl font-semibold mb-4">Event Details</h2>
					<dl class="space-y-3">
						<div>
							<dt class="text-sm font-medium text-gray-500">Time</dt>
							<dd class="mt-1">{formatEventTime(event)}</dd>
						</div>
						{#if event.description}
							<div>
								<dt class="text-sm font-medium text-gray-500">Description</dt>
								<dd class="mt-1">{event.description}</dd>
							</div>
						{/if}
						{#if event.location}
							<div>
								<dt class="text-sm font-medium text-gray-500">Location</dt>
								<dd class="mt-1">{event.location}</dd>
							</div>
						{/if}
					</dl>
				</div>

				<!-- Guest Permissions -->
				<div class="bg-white shadow rounded-lg p-6">
					<h2 class="text-xl font-semibold mb-4">Guest Permissions</h2>
					<ul class="space-y-2">
						<li class="flex items-center gap-2">
							<span class={event.guestsCanInviteOthers ? 'text-green-600' : 'text-gray-400'}>
								{event.guestsCanInviteOthers ? '✓' : '✗'}
							</span>
							Guests can invite others
						</li>
						<li class="flex items-center gap-2">
							<span class={event.guestsCanModify ? 'text-green-600' : 'text-gray-400'}>
								{event.guestsCanModify ? '✓' : '✗'}
							</span>
							Guests can modify event
						</li>
						<li class="flex items-center gap-2">
							<span class={event.guestsCanSeeOtherGuests ? 'text-green-600' : 'text-gray-400'}>
								{event.guestsCanSeeOtherGuests ? '✓' : '✗'}
							</span>
							Guests can see other guests
						</li>
					</ul>
				</div>
			</div>
		</div>
	{:else}
		<!-- Edit Mode -->
		<div class="container mx-auto px-4 py-8 max-w-4xl">
			<Breadcrumb 
				feature="events"
				current="Edit Event"
			/>

			<h1 class="text-3xl font-bold mb-8">Edit Event</h1>

			<form {...updateEvent} class="space-y-6">
				<!-- Hidden schema fields that get synced by $effect -->
				<input {...updateEvent.fields.id.as('hidden', eventId)} />
				<input {...updateEvent.fields.startDate.as('hidden', startDate)} />
				<input {...updateEvent.fields.startDateTime.as('hidden', startDateTime)} />
				<input {...updateEvent.fields.startTimeZone.as('hidden', startTimeZone)} />
				<input {...updateEvent.fields.endDate.as('hidden', endDate)} />
				<input {...updateEvent.fields.endDateTime.as('hidden', endDateTime)} />
				<input {...updateEvent.fields.endTimeZone.as('hidden', endTimeZone)} />
				<!-- Reminders is type 'any' so handle without spread -->
				<input type="hidden" name="reminders" value={remindersJson} />

				<!-- Summary -->
				<div>
					<label for="summary" class="block text-sm font-medium text-gray-700 mb-1">
						Event Title <span class="text-red-500">*</span>
					</label>
					<input
						{...updateEvent.fields.summary.as('text')}
						id="summary"
						value={summary}
						oninput={(e) => summary = e.currentTarget.value}
						placeholder="Team Meeting"
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				</div>

				<!-- Description -->
				<div>
					<label for="description" class="block text-sm font-medium text-gray-700 mb-1">
						Description
					</label>
					<textarea
						{...updateEvent.fields.description.as('text')}
						id="description"
						value={description}
						oninput={(e) => description = e.currentTarget.value}
						placeholder="Discuss project progress..."
						rows="4"
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					></textarea>
				</div>

				<!-- Location -->
				<div>
					<label for="location" class="block text-sm font-medium text-gray-700 mb-1">
						Location
					</label>
					<input
						{...updateEvent.fields.location.as('text')}
						id="location"
						value={locationField}
						oninput={(e) => locationField = e.currentTarget.value}
						placeholder="Conference Room A"
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				</div>

				<!-- All Day Event Toggle (not in schema) -->
				<div class="flex items-center gap-2">
					<input
						type="checkbox"
						id="isAllDay"
						checked={isAllDay}
						onclick={() => isAllDay = !isAllDay}
						class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
					/>
					<label for="isAllDay" class="text-sm font-medium text-gray-700">
						All Day Event
					</label>
				</div>

				{#if isAllDay}
					<!-- Date fields for all-day events -->
					<div class="grid grid-cols-2 gap-4">
						<div>
							<label for="startDateInput" class="block text-sm font-medium text-gray-700 mb-1">
								Start Date <span class="text-red-500">*</span>
							</label>
							<input
								type="date"
								id="startDateInput"
								value={startDateInput}
								oninput={(e) => startDateInput = e.currentTarget.value}
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
						</div>
						<div>
							<label for="endDateInput" class="block text-sm font-medium text-gray-700 mb-1">
								End Date
							</label>
							<input
								type="date"
								id="endDateInput"
								value={endDateInput}
								oninput={(e) => endDateInput = e.currentTarget.value}
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
						</div>
					</div>
				{:else}
					<!-- Start Date/Time (UI helpers, not in schema) -->
					<div class="grid grid-cols-2 gap-4">
						<div>
							<label for="startDateInput" class="block text-sm font-medium text-gray-700 mb-1">
								Start Date <span class="text-red-500">*</span>
							</label>
							<input
								type="date"
								id="startDateInput"
								value={startDateInput}
								oninput={(e) => startDateInput = e.currentTarget.value}
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
						</div>
						<div>
							<label for="startTimeInput" class="block text-sm font-medium text-gray-700 mb-1">
								Start Time <span class="text-red-500">*</span>
							</label>
							<input
								type="time"
								id="startTimeInput"
								value={startTimeInput}
								oninput={(e) => startTimeInput = e.currentTarget.value}
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
						</div>
					</div>

					<!-- End Time Toggle (not in schema) -->
					<div class="flex items-center gap-2">
						<input
							type="checkbox"
							id="hasEndTime"
							checked={hasEndTime}
							onclick={() => hasEndTime = !hasEndTime}
							class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
						/>
						<label for="hasEndTime" class="text-sm font-medium text-gray-700">
							Set End Time
						</label>
					</div>

					{#if hasEndTime}
						<!-- End Date/Time (UI helpers) -->
						<div class="grid grid-cols-2 gap-4">
							<div>
								<label for="endDateInput" class="block text-sm font-medium text-gray-700 mb-1">
									End Date <span class="text-red-500">*</span>
								</label>
								<input
									type="date"
									id="endDateInput"
									value={endDateInput}
									oninput={(e) => endDateInput = e.currentTarget.value}
									class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
								/>
							</div>
							<div>
								<label for="endTimeInput" class="block text-sm font-medium text-gray-700 mb-1">
									End Time <span class="text-red-500">*</span>
								</label>
								<input
									type="time"
									id="endTimeInput"
									value={endTimeInput}
									oninput={(e) => endTimeInput = e.currentTarget.value}
									class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
								/>
							</div>
						</div>
					{/if}

					<!-- Time Zone (UI helper) -->
					<div>
						<label for="timeZone" class="block text-sm font-medium text-gray-700 mb-1">
							Time Zone
						</label>
						<input
							type="text"
							id="timeZone"
							value={timeZone}
							oninput={(e) => timeZone = e.currentTarget.value}
							placeholder="America/New_York"
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>
				{/if}

				<!-- Event Type -->
				<div>
					<label for="eventType" class="block text-sm font-medium text-gray-700 mb-1">
						Event Type <span class="text-red-500">*</span>
					</label>
					<select
						{...updateEvent.fields.eventType.as('select')}
						id="eventType"
						value={eventType}
						oninput={(e) => eventType = e.currentTarget.value}
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						<option value="default">Default</option>
						<option value="outOfOffice">Out of Office</option>
						<option value="focusTime">Focus Time</option>
						<option value="workingLocation">Working Location</option>
					</select>
				</div>

				<!-- Status -->
				<div>
					<label for="status" class="block text-sm font-medium text-gray-700 mb-1">
						Status <span class="text-red-500">*</span>
					</label>
					<select
						{...updateEvent.fields.status.as('select')}
						id="status"
						value={status}
						oninput={(e) => status = e.currentTarget.value}
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						<option value="confirmed">Confirmed</option>
						<option value="tentative">Tentative</option>
						<option value="cancelled">Cancelled</option>
					</select>
				</div>

				<!-- Visibility -->
				<div>
					<label for="visibility" class="block text-sm font-medium text-gray-700 mb-1">
						Visibility
					</label>
					<select
						{...updateEvent.fields.visibility.as('select')}
						id="visibility"
						value={visibility}
						oninput={(e) => visibility = e.currentTarget.value}
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						<option value="default">Default</option>
						<option value="public">Public</option>
						<option value="private">Private</option>
						<option value="confidential">Confidential</option>
					</select>
				</div>

				<!-- Transparency (Show As) -->
				<div>
					<label for="transparency" class="block text-sm font-medium text-gray-700 mb-1">
						Show As
					</label>
					<select
						{...updateEvent.fields.transparency.as('select')}
						id="transparency"
						value={transparency}
						oninput={(e) => transparency = e.currentTarget.value}
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						<option value="opaque">Busy</option>
						<option value="transparent">Free</option>
					</select>
				</div>

				<!-- Color -->
				<div>
					<label for="colorId" class="block text-sm font-medium text-gray-700 mb-1">
						Color
					</label>
					<select
						{...updateEvent.fields.colorId.as('select')}
						id="colorId"
						value={colorId}
						oninput={(e) => colorId = e.currentTarget.value}
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						<option value="">None</option>
						{#each Array.from({ length: 11 }, (_, i) => String(i + 1)) as color}
							<option value={color}>Color {color}</option>
						{/each}
					</select>
				</div>

				<!-- Reminders Section -->
				<div class="border-t pt-6">
					<h2 class="text-lg font-semibold mb-4">Reminders</h2>
					
					<div class="space-y-4">
						{#each reminders as reminder, index}
							<div class="flex gap-2 items-start">
								<select
									value={reminder.method}
									oninput={(e) => {
										reminders[index].method = e.currentTarget.value;
										reminders = reminders; // trigger reactivity
									}}
									class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
								>
									<option value="email">Email</option>
									<option value="popup">Popup</option>
								</select>

								<input
									type="number"
									value={reminder.minutes}
									oninput={(e) => {
										reminders[index].minutes = parseInt(e.currentTarget.value) || 0;
										reminders = reminders; // trigger reactivity
									}}
									min="0"
									placeholder="Minutes"
									class="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
								/>

								<span class="py-2 text-sm text-gray-600">minutes before</span>

								<button
									type="button"
									onclick={() => removeReminder(index)}
									class="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
								>
									Remove
								</button>
							</div>
						{/each}

						<button
							type="button"
							onclick={addReminder}
							class="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-md"
						>
							+ Add Reminder
						</button>
					</div>
				</div>

				<!-- Guest Permissions Section -->
				<div class="border-t pt-6">
					<h2 class="text-lg font-semibold mb-4">Guest Permissions</h2>
					
					<div class="space-y-3">
						<div class="flex items-center gap-2">
							<input
								{...updateEvent.fields.guestsCanInviteOthers.as('checkbox')}
								type="checkbox"
								id="guestsCanInviteOthers"
								checked={guestsCanInviteOthers}
								onclick={() => guestsCanInviteOthers = !guestsCanInviteOthers}
								class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
							/>
							<label for="guestsCanInviteOthers" class="text-sm text-gray-700">
								Guests can invite others
							</label>
						</div>

						<div class="flex items-center gap-2">
							<input
								{...updateEvent.fields.guestsCanModify.as('checkbox')}
								type="checkbox"
								id="guestsCanModify"
								checked={guestsCanModify}
								onclick={() => guestsCanModify = !guestsCanModify}
								class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
							/>
							<label for="guestsCanModify" class="text-sm text-gray-700">
								Guests can modify event
							</label>
						</div>

						<div class="flex items-center gap-2">
							<input
								{...updateEvent.fields.guestsCanSeeOtherGuests.as('checkbox')}
								type="checkbox"
								id="guestsCanSeeOtherGuests"
								checked={guestsCanSeeOtherGuests}
								onclick={() => guestsCanSeeOtherGuests = !guestsCanSeeOtherGuests}
								class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
							/>
							<label for="guestsCanSeeOtherGuests" class="text-sm text-gray-700">
								Guests can see other guests
							</label>
						</div>
					</div>
				</div>

				<!-- Form Actions -->
				<div class="flex gap-4 pt-6 border-t">
					<button
						type="submit"
						class="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						Save Changes
					</button>
					<button
						type="button"
						onclick={() => isEditing = false}
						class="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
					>
						Cancel
					</button>
				</div>
			</form>
		</div>
	{/if}
{:catch error}
	<div class="container mx-auto px-4 py-8">
		<p class="text-red-500">Error loading event: {error.message}</p>
		<a href="/events" class="text-blue-500 hover:underline">Back to Events</a>
	</div>
{/await}
