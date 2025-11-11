<script lang="ts">
  const props = $props<{ initial?: any; submitLabel?: string; onSubmit?: (data: any) => Promise<void> | void; onCancel?: (() => void) | null }>();
  const initial = props.initial || {};
  const submitLabel = props.submitLabel || 'Save';
  const onSubmit = props.onSubmit;
  const onCancel = props.onCancel || null;

  let isAllDay = $state(!!initial.startDate && !initial.startDateTime);
  let hasEndTime = $state(!!initial.endDate || !!initial.endDateTime);
  let useDefaultReminders = $state(initial.reminders?.useDefault ?? true);
  let reminders = $state(
    initial.reminders?.overrides?.length ? initial.reminders.overrides : [{ method: 'popup', minutes: 10 }]
  );

  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toTimeString().slice(0, 5);

  function addReminder() {
    reminders = [...reminders, { method: 'popup', minutes: 10 }];
  }
  function removeReminder(index: number) {
    reminders = reminders.filter((item: { method: string; minutes: number }, i: number) => i !== index);
  }

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);

    const data: any = {
      summary: formData.get('summary'),
      description: formData.get('description') || undefined,
      location: formData.get('location') || undefined,
      eventType: formData.get('eventType') || 'default',
      visibility: formData.get('visibility') || 'default',
      transparency: formData.get('transparency') || 'opaque',
      colorId: formData.get('colorId') || undefined,
    };

    if (isAllDay) {
      data.startDate = formData.get('startDate');
      if (hasEndTime) {
        data.endDate = formData.get('endDate');
      }
    } else {
      const startDate = formData.get('startDate') as string;
      const startTime = formData.get('startTime') as string;
      if (startDate && startTime) {
        data.startDateTime = `${startDate}T${startTime}:00`;
      }
      data.startTimeZone = formData.get('startTimeZone') || undefined;

      if (hasEndTime) {
        const endDate = formData.get('endDate') as string;
        const endTime = formData.get('endTime') as string;
        if (endDate && endTime) {
          data.endDateTime = `${endDate}T${endTime}:00`;
        }
        data.endTimeZone = formData.get('endTimeZone') || undefined;
      }
    }

    data.reminders = {
      useDefault: useDefaultReminders,
      overrides: useDefaultReminders ? undefined : reminders,
    };

    data.guestsCanInviteOthers = formData.get('guestsCanInviteOthers') === 'on';
    data.guestsCanModify = formData.get('guestsCanModify') === 'on';
    data.guestsCanSeeOtherGuests = formData.get('guestsCanSeeOtherGuests') === 'on';

    await onSubmit?.(data);
  }

  // Helpers to prefill inputs from initial
  function toDatePart(value: any, fallback: string = '') {
    if (!value) return fallback;
    try {
      return new Date(value).toISOString().slice(0, 10);
    } catch {
      return fallback;
    }
  }
  function toTimePart(value: any, fallback: string = '') {
    if (!value) return fallback;
    try {
      return new Date(value).toISOString().slice(11, 16);
    } catch {
      return fallback;
    }
  }
  const initialStartDate = initial.startDate || toDatePart(initial.startDateTime, today);
  const initialStartTime = toTimePart(initial.startDateTime, now);
  const initialEndDate = initial.endDate || toDatePart(initial.endDateTime, today);
  const initialEndTime = toTimePart(initial.endDateTime, '');
</script>

<form onsubmit={handleSubmit} class="space-y-6">
  <!-- Basic Information -->
  <div class="bg-white shadow rounded-lg p-6 space-y-4">
    <h2 class="text-xl font-semibold mb-4">Basic Information</h2>
    <div>
      <label for="summary" class="block text-sm font-medium text-gray-700 mb-1">
        Title <span class="text-red-500">*</span>
      </label>
      <input
        id="summary"
        name="summary"
        type="text"
        required
        value={initial.summary || ''}
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        placeholder="Event title"
      />
    </div>

    <div>
      <label for="description" class="block text-sm font-medium text-gray-700 mb-1">Description</label>
      <textarea
        id="description"
        name="description"
        rows="4"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        placeholder="Event description"
      >{initial.description || ''}</textarea>
    </div>

    <div>
      <label for="location" class="block text-sm font-medium text-gray-700 mb-1">Location</label>
      <input
        id="location"
        name="location"
        type="text"
        value={initial.location || ''}
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        placeholder="Event location"
      />
    </div>
  </div>

  <!-- Date and Time -->
  <div class="bg-white shadow rounded-lg p-6 space-y-4">
    <h2 class="text-xl font-semibold mb-4">Date and Time</h2>
    <div class="flex items-center gap-2">
      <input id="isAllDay" type="checkbox" bind:checked={isAllDay} class="w-4 h-4 text-blue-600" />
      <label for="isAllDay" class="text-sm font-medium text-gray-700">All-day event</label>
    </div>
    <div class="grid grid-cols-2 gap-4">
      <div>
        <label for="startDate" class="block text-sm font-medium text-gray-700 mb-1">Start Date <span class="text-red-500">*</span></label>
        <input id="startDate" name="startDate" type="date" required value={initialStartDate} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
      </div>
      {#if !isAllDay}
        <div>
          <label for="startTime" class="block text-sm font-medium text-gray-700 mb-1">Start Time <span class="text-red-500">*</span></label>
          <input id="startTime" name="startTime" type="time" required value={initialStartTime} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
        </div>
      {/if}
    </div>

    <div class="flex items-center gap-2">
      <input id="hasEndTime" type="checkbox" bind:checked={hasEndTime} class="w-4 h-4 text-blue-600" />
      <label for="hasEndTime" class="text-sm font-medium text-gray-700">Add end time</label>
    </div>

    {#if hasEndTime}
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label for="endDate" class="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <input id="endDate" name="endDate" type="date" value={initialEndDate} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
        </div>
        {#if !isAllDay}
          <div>
            <label for="endTime" class="block text-sm font-medium text-gray-700 mb-1">End Time</label>
            <input id="endTime" name="endTime" type="time" value={initialEndTime} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
        {/if}
      </div>
    {/if}

    {#if !isAllDay}
      <div>
        <label for="startTimeZone" class="block text-sm font-medium text-gray-700 mb-1">Time Zone</label>
        <input id="startTimeZone" name="startTimeZone" type="text" value={initial.startTimeZone || ''} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="e.g., America/New_York" />
        <input type="hidden" name="endTimeZone" value={initial.endTimeZone || ''} />
      </div>
    {/if}
  </div>

  <!-- Event Options -->
  <div class="bg-white shadow rounded-lg p-6 space-y-4">
    <h2 class="text-xl font-semibold mb-4">Event Options</h2>
    <div class="grid grid-cols-2 gap-4">
      <div>
        <label for="eventType" class="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
        <select id="eventType" name="eventType" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
          <option value="default" selected={initial.eventType === 'default'}>Default</option>
          <option value="outOfOffice" selected={initial.eventType === 'outOfOffice'}>Out of Office</option>
          <option value="focusTime" selected={initial.eventType === 'focusTime'}>Focus Time</option>
          <option value="workingLocation" selected={initial.eventType === 'workingLocation'}>Working Location</option>
        </select>
      </div>
      <div>
        <label for="visibility" class="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
        <select id="visibility" name="visibility" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
          <option value="default" selected={initial.visibility === 'default'}>Default</option>
          <option value="public" selected={initial.visibility === 'public'}>Public</option>
          <option value="private" selected={initial.visibility === 'private'}>Private</option>
          <option value="confidential" selected={initial.visibility === 'confidential'}>Confidential</option>
        </select>
      </div>
      <div>
        <label for="transparency" class="block text-sm font-medium text-gray-700 mb-1">Show as</label>
        <select id="transparency" name="transparency" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
          <option value="opaque" selected={initial.transparency === 'opaque'}>Busy</option>
          <option value="transparent" selected={initial.transparency === 'transparent'}>Available</option>
        </select>
      </div>
      <div>
        <label for="colorId" class="block text-sm font-medium text-gray-700 mb-1">Color</label>
        <select id="colorId" name="colorId" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
          <option value="" selected={!initial.colorId}>Default</option>
          <option value="1" selected={initial.colorId === '1'}>Lavender</option>
          <option value="2" selected={initial.colorId === '2'}>Sage</option>
          <option value="3" selected={initial.colorId === '3'}>Grape</option>
          <option value="4" selected={initial.colorId === '4'}>Flamingo</option>
          <option value="5" selected={initial.colorId === '5'}>Banana</option>
          <option value="6" selected={initial.colorId === '6'}>Tangerine</option>
          <option value="7" selected={initial.colorId === '7'}>Peacock</option>
          <option value="8" selected={initial.colorId === '8'}>Graphite</option>
          <option value="9" selected={initial.colorId === '9'}>Blueberry</option>
          <option value="10" selected={initial.colorId === '10'}>Basil</option>
          <option value="11" selected={initial.colorId === '11'}>Tomato</option>
        </select>
      </div>
    </div>
  </div>

  <!-- Reminders -->
  <div class="bg-white shadow rounded-lg p-6 space-y-4">
    <h2 class="text-xl font-semibold mb-4">Reminders</h2>
    <div class="flex items-center gap-2">
      <input id="useDefaultReminders" type="checkbox" bind:checked={useDefaultReminders} class="w-4 h-4 text-blue-600" />
      <label for="useDefaultReminders" class="text-sm font-medium text-gray-700">Use default reminders</label>
    </div>
    {#if !useDefaultReminders}
      <div class="space-y-3">
        {#each reminders as reminder, i}
          <div class="flex gap-2">
            <select bind:value={reminder.method} class="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="popup">Popup</option>
              <option value="email">Email</option>
            </select>
            <input bind:value={reminder.minutes} type="number" min="0" max="40320" class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            <span class="flex items-center text-sm text-gray-700">minutes before</span>
            <button type="button" onclick={() => removeReminder(i)} class="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600">Remove</button>
          </div>
        {/each}
        <button type="button" onclick={addReminder} class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">+ Add Reminder</button>
      </div>
    {/if}
  </div>

  <!-- Guest Permissions -->
  <div class="bg-white shadow rounded-lg p-6 space-y-4">
    <h2 class="text-xl font-semibold mb-4">Guest Permissions</h2>
    <div class="space-y-2">
      <div class="flex items-center gap-2">
        <input id="guestsCanInviteOthers" name="guestsCanInviteOthers" type="checkbox" checked={initial.guestsCanInviteOthers ?? true} class="w-4 h-4 text-blue-600" />
        <label for="guestsCanInviteOthers" class="text-sm text-gray-700">Guests can invite others</label>
      </div>
      <div class="flex items-center gap-2">
        <input id="guestsCanModify" name="guestsCanModify" type="checkbox" checked={initial.guestsCanModify ?? false} class="w-4 h-4 text-blue-600" />
        <label for="guestsCanModify" class="text-sm text-gray-700">Guests can modify event</label>
      </div>
      <div class="flex items-center gap-2">
        <input id="guestsCanSeeOtherGuests" name="guestsCanSeeOtherGuests" type="checkbox" checked={initial.guestsCanSeeOtherGuests ?? true} class="w-4 h-4 text-blue-600" />
        <label for="guestsCanSeeOtherGuests" class="text-sm text-gray-700">Guests can see other guests</label>
      </div>
    </div>
  </div>

  <!-- Actions -->
  <div class="flex gap-2 justify-end">
    {#if onCancel}
      <button type="button" onclick={onCancel} class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">Cancel</button>
    {:else}
      <a href="/events" class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">Cancel</a>
    {/if}
    <button type="submit" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">{submitLabel}</button>
  </div>
</form>

<style>
/* component-scoped if needed */
</style>
