<script lang="ts">
	import { goto } from "$app/navigation";
	import { createEvent } from "./create.remote";
	import { listEvents } from "../list.remote";
	import Breadcrumb from "$lib/components/ui/Breadcrumb.svelte";
	import { toast } from "svelte-sonner";
	import { createEventSchema } from "$lib/validations/event";
	import AsyncButton from "$lib/components/ui/AsyncButton.svelte";
	import { Button } from "$lib/components/ui/button";

	// Form state
	let isAllDay = $state(false);
	let hasEndTime = $state(false);
	let useDefaultReminders = $state(true);
	let reminders = $state([{ method: "popup", minutes: 10 }]);
	let guestsCanInviteOthers = $state(true);
	let guestsCanModify = $state(false);
	let guestsCanSeeOtherGuests = $state(true);

	// Calculate smart defaults
	const now = new Date();
	const defaultStartDate = now.toISOString().split("T")[0];
	const defaultStartTime = now.toTimeString().slice(0, 5);

	let startDate = $state(defaultStartDate);
	let startTime = $state(defaultStartTime);

	// Compute end date/time based on start (1 hour later)
	const defaultEndDate = $derived(startDate);
	const defaultEndTime = $derived(() => {
		if (!startDate || !startTime) return "";
		const start = new Date(`${startDate}T${startTime}:00`);
		const end = new Date(start.getTime() + 60 * 60000); // 1 hour later
		return end.toTimeString().slice(0, 5);
	});

	// User can override the defaults by typing
	let endDate = $state("");
	let endTime = $state("");

	// Use user value if set, otherwise use computed default
	const effectiveEndDate = $derived(endDate || defaultEndDate);
	const effectiveEndTime = $derived(endTime || defaultEndTime());

	// Compute datetime values reactively for hidden remote fields
	const computedStartDateTime = $derived(
		!isAllDay && startDate && startTime
			? `${startDate}T${startTime}:00`
			: "",
	);
	const computedEndDateTime = $derived(
		!isAllDay && hasEndTime && effectiveEndDate && effectiveEndTime
			? `${effectiveEndDate}T${effectiveEndTime}:00`
			: "",
	);

	const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

	function addReminder() {
		reminders = [...reminders, { method: "popup", minutes: 10 }];
	}

	function removeReminder(index: number) {
		reminders = reminders.filter((_, i) => i !== index);
	}
</script>

<div class="container mx-auto px-4 py-8 max-w-3xl">
	<Breadcrumb feature="events" current="New Event" />

	<h1 class="text-3xl font-bold mb-6">Create New Event</h1>

	<!-- Form with form object spread for remote function -->
	<form
		{...createEvent
			.preflight(createEventSchema)
			.enhance(async ({ submit, form }) => {
				try {
					const result: any = await submit();
					if (result?.error) {
						toast.error(
							result.error.message ||
								"Oh no! Something went wrong",
						);
						return;
					}
					toast.success("Successfully Saved!");
					await goto("/events");
				} catch (error: unknown) {
					const err = error as { message?: string };
					toast.error(err?.message || "Oh no! Something went wrong");
				}
			})}
		class="space-y-4"
	>
		<!-- Hidden computed fields -->
		{#if computedStartDateTime}
			<input
				{...createEvent.fields.startDateTime.as(
					"hidden",
					computedStartDateTime,
				)}
			/>
			{@html `<script>console.log('startDateTime:', ${JSON.stringify(computedStartDateTime)});<\/script>`}
		{/if}
		{#if computedEndDateTime}
			<input
				{...createEvent.fields.endDateTime.as(
					"hidden",
					computedEndDateTime,
				)}
			/>
			{@html `<script>console.log('endDateTime:', ${JSON.stringify(computedEndDateTime)});<\/script>`}
		{/if}

		<input
			{...createEvent.fields.guestsCanInviteOthers.as("checkbox")}
			checked={guestsCanInviteOthers}
			class="sr-only"
			aria-hidden="true"
			tabindex="-1"
		/>
		<input
			{...createEvent.fields.guestsCanModify.as("checkbox")}
			checked={guestsCanModify}
			class="sr-only"
			aria-hidden="true"
			tabindex="-1"
		/>
		<input
			{...createEvent.fields.guestsCanSeeOtherGuests.as("checkbox")}
			checked={guestsCanSeeOtherGuests}
			class="sr-only"
			aria-hidden="true"
			tabindex="-1"
		/>

		<!-- Basic Information -->
		<div class="bg-white shadow rounded-lg p-6 space-y-4">
			<h2 class="text-xl font-semibold mb-4">Basic Information</h2>

			<div>
				<label
					for="summary"
					class="block text-sm font-medium text-gray-700 mb-1"
				>
					Title <span class="text-red-500">*</span>
				</label>
				<input
					id="summary"
					{...createEvent.fields.summary.as("text")}
					required
					class="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 {(createEvent.fields.summary.issues()
						?.length ?? 0) > 0
						? 'border-red-500'
						: 'border-gray-300'}"
					placeholder="Event title"
					onblur={() => createEvent.validate()}
				/>
				{#each createEvent.fields.summary.issues() ?? [] as issue}
					<p class="mt-1 text-sm text-red-600">{issue.message}</p>
				{/each}
			</div>

			<div>
				<label
					for="description"
					class="block text-sm font-medium text-gray-700 mb-1"
					>Description</label
				>
				<textarea
					id="description"
					{...createEvent.fields.description.as("text")}
					rows="4"
					class="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 {(createEvent.fields.description.issues()
						?.length ?? 0) > 0
						? 'border-red-500'
						: 'border-gray-300'}"
					placeholder="Event description"
					onblur={() => createEvent.validate()}
				></textarea>
				{#each createEvent.fields.description.issues() ?? [] as issue}
					<p class="mt-1 text-sm text-red-600">{issue.message}</p>
				{/each}
			</div>

			<div>
				<label
					for="location"
					class="block text-sm font-medium text-gray-700 mb-1"
					>Location</label
				>
				<input
					id="location"
					{...createEvent.fields.location.as("text")}
					class="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 {(createEvent.fields.location.issues()
						?.length ?? 0) > 0
						? 'border-red-500'
						: 'border-gray-300'}"
					placeholder="Event location"
					onblur={() => createEvent.validate()}
				/>
				{#each createEvent.fields.location.issues() ?? [] as issue}
					<p class="mt-1 text-sm text-red-600">{issue.message}</p>
				{/each}
			</div>
		</div>

		<!-- Date & Time -->
		<div class="bg-white shadow rounded-lg p-6 space-y-4">
			<h2 class="text-xl font-semibold mb-4">Date & Time</h2>

			<div class="flex items-center gap-2">
				<input
					id="isAllDay"
					type="checkbox"
					checked={isAllDay}
					onclick={() => (isAllDay = !isAllDay)}
					class="w-4 h-4 text-blue-600"
				/>
				<label for="isAllDay" class="text-sm font-medium text-gray-700"
					>All-day event</label
				>
			</div>

			<div class="grid grid-cols-2 gap-4">
				<div>
					<label
						for="startDate"
						class="block text-sm font-medium text-gray-700 mb-1"
					>
						Start Date <span class="text-red-500">*</span>
					</label>
					<input
						id="startDate"
						{...createEvent.fields.startDate.as("date")}
						required
						value={startDate}
						oninput={(e) => (startDate = e.currentTarget.value)}
						class="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 {(createEvent.fields.startDate.issues()
							?.length ?? 0) > 0
							? 'border-red-500'
							: 'border-gray-300'}"
						onblur={() => createEvent.validate()}
					/>
					{#each createEvent.fields.startDate.issues() ?? [] as issue}
						<p class="mt-1 text-sm text-red-600">{issue.message}</p>
					{/each}
				</div>
				{#if !isAllDay}
					<div>
						<label
							for="startTime"
							class="block text-sm font-medium text-gray-700 mb-1"
						>
							Start Time <span class="text-red-500">*</span>
						</label>
						<input
							id="startTime"
							name="startTime"
							type="time"
							required
							value={startTime}
							oninput={(e) => (startTime = e.currentTarget.value)}
							class="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 border-gray-300"
							onblur={() => createEvent.validate()}
						/>
					</div>
				{/if}
			</div>

			<div class="flex items-center gap-2">
				<input
					id="hasEndTime"
					type="checkbox"
					checked={hasEndTime}
					onclick={() => (hasEndTime = !hasEndTime)}
					class="w-4 h-4 text-blue-600"
				/>
				<label
					for="hasEndTime"
					class="text-sm font-medium text-gray-700"
					>Add end time</label
				>
			</div>

			{#if hasEndTime}
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label
							for="endDate"
							class="block text-sm font-medium text-gray-700 mb-1"
							>End Date</label
						>
						<input
							id="endDate"
							{...createEvent.fields.endDate.as("date")}
							value={effectiveEndDate}
							oninput={(e) => (endDate = e.currentTarget.value)}
							class="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 {(createEvent.fields.endDate.issues()
								?.length ?? 0) > 0
								? 'border-red-500'
								: 'border-gray-300'}"
							onblur={() => createEvent.validate()}
						/>
						{#each createEvent.fields.endDate.issues() ?? [] as issue}
							<p class="mt-1 text-sm text-red-600">
								{issue.message}
							</p>
						{/each}
					</div>
					{#if !isAllDay}
						<div>
							<label
								for="endTime"
								class="block text-sm font-medium text-gray-700 mb-1"
								>End Time</label
							>
							<input
								id="endTime"
								name="endTime"
								type="time"
								value={effectiveEndTime}
								oninput={(e) =>
									(endTime = e.currentTarget.value)}
								class="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 border-gray-300"
								onblur={() => createEvent.validate()}
							/>
						</div>
					{/if}
				</div>
			{/if}

			{#if !isAllDay}
				<div>
					<label
						for="startTimeZone"
						class="block text-sm font-medium text-gray-700 mb-1"
						>Time Zone</label
					>
					<input
						id="startTimeZone"
						{...createEvent.fields.startTimeZone.as("text")}
						value={browserTimezone}
						class="w-full px-3 py-2 border rounded-md bg-gray-50 focus:ring-2 focus:ring-blue-500 {(createEvent.fields.startTimeZone.issues()
							?.length ?? 0) > 0
							? 'border-red-500'
							: 'border-gray-300'}"
						readonly
						onblur={() => createEvent.validate()}
					/>
					{#each createEvent.fields.startTimeZone.issues() ?? [] as issue}
						<p class="mt-1 text-sm text-red-600">{issue.message}</p>
					{/each}
					<input
						{...createEvent.fields.endTimeZone.as(
							"hidden",
							browserTimezone,
						)}
					/>
				</div>
			{/if}
		</div>

		<!-- Reminders -->
		<div class="bg-white shadow rounded-lg p-6 space-y-4">
			<h2 class="text-xl font-semibold mb-4">Reminders</h2>

			<input
				{...createEvent.fields.reminders.useDefault.as("checkbox")}
				type="hidden"
				value={useDefaultReminders.toString()}
			/>

			<div class="flex items-center gap-2">
				<input
					id="useDefaultReminders"
					type="checkbox"
					checked={useDefaultReminders}
					onclick={() => (useDefaultReminders = !useDefaultReminders)}
					class="w-4 h-4 text-blue-600"
				/>
				<label
					for="useDefaultReminders"
					class="text-sm font-medium text-gray-700"
					>Use default reminders</label
				>
			</div>
			{#if !useDefaultReminders}
				<div class="space-y-3">
					{#each reminders as reminder, i (i)}
						<div class="flex gap-2">
							<input
								{...createEvent.fields.reminders.overrides[
									i
								].method.as("text")}
								type="hidden"
								value={reminder.method}
							/>
							<input
								{...createEvent.fields.reminders.overrides[
									i
								].minutes.as("number")}
								type="hidden"
								value={reminder.minutes}
							/>

							<select
								value={reminder.method}
								onchange={(e) =>
									(reminder.method = e.currentTarget.value)}
								class="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
								onblur={() => createEvent.validate()}
							>
								<option value="popup">Popup</option>
								<option value="email">Email</option>
							</select>
							<input
								value={reminder.minutes}
								oninput={(e) =>
									(reminder.minutes = Number(
										e.currentTarget.value,
									))}
								type="number"
								min="0"
								max="40320"
								class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
								onblur={() => createEvent.validate()}
							/>
							<span
								class="flex items-center text-sm text-gray-700"
								>minutes before</span
							>
							<button
								type="button"
								onclick={() => removeReminder(i)}
								class="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
								>Remove</button
							>
						</div>
					{/each}
					<button
						type="button"
						onclick={addReminder}
						class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
						>+ Add Reminder</button
					>
				</div>
			{/if}
		</div>

		<!-- Guest Permissions -->
		<div class="bg-white shadow rounded-lg p-6 space-y-4">
			<h2 class="text-xl font-semibold mb-4">Guest Permissions</h2>
			<div class="space-y-2">
				<div class="flex items-center gap-2">
					<input
						id="guestsCanInviteOthers"
						type="checkbox"
						checked={guestsCanInviteOthers}
						onclick={() =>
							(guestsCanInviteOthers = !guestsCanInviteOthers)}
						class="w-4 h-4 text-blue-600"
					/>
					<label
						for="guestsCanInviteOthers"
						class="text-sm text-gray-700"
						>Guests can invite others</label
					>
				</div>
				<div class="flex items-center gap-2">
					<input
						id="guestsCanModify"
						type="checkbox"
						checked={guestsCanModify}
						onclick={() => (guestsCanModify = !guestsCanModify)}
						class="w-4 h-4 text-blue-600"
					/>
					<label for="guestsCanModify" class="text-sm text-gray-700"
						>Guests can modify event</label
					>
				</div>
				<div class="flex items-center gap-2">
					<input
						id="guestsCanSeeOtherGuests"
						type="checkbox"
						checked={guestsCanSeeOtherGuests}
						onclick={() =>
							(guestsCanSeeOtherGuests =
								!guestsCanSeeOtherGuests)}
						class="w-4 h-4 text-blue-600"
					/>
					<label
						for="guestsCanSeeOtherGuests"
						class="text-sm text-gray-700"
						>Guests can see other guests</label
					>
				</div>
			</div>
		</div>

		<!-- Actions -->
		<div class="flex gap-3 mt-6 justify-end">
			<AsyncButton
				type="submit"
				loadingLabel="Creating..."
				loading={createEvent.pending}
			>
				Create Event
			</AsyncButton>
			<Button variant="secondary" href="/events" size="default">
				Cancel
			</Button>
		</div>
	</form>
</div>
