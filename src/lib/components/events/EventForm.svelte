<script lang="ts">
  // Component now only provides form contents, not the form tag itself
  const props = $props<{ 
    initial?: any; 
    submitLabel?: string; 
    onCancel?: (() => void) | null 
  }>();
  
  const initial = props.initial || {};
  const submitLabel = props.submitLabel || 'Save';
  const onCancel = props.onCancel || null;

  let isAllDay = $state(!!initial.startDate && !initial.startDateTime);
  let hasEndTime = $state(!!initial.endDate || !!initial.endDateTime);
  let useDefaultReminders = $state(initial.reminders?.useDefault ?? true);
  let reminders = $state(
    initial.reminders?.overrides?.length ? initial.reminders.overrides : [{ method: 'popup', minutes: 10 }]
  );

  // Calculate smart defaults
  const now = new Date();
  const defaultStartDate = now.toISOString().split('T')[0];
  const defaultStartTime = now.toTimeString().slice(0, 5);
  
  // Calculate event duration from initial data (for edit mode)
  let initialDurationMinutes = 60; // default 1 hour for new events
  if (initial.startDateTime && initial.endDateTime) {
    const start = new Date(initial.startDateTime);
    const end = new Date(initial.endDateTime);
    initialDurationMinutes = Math.max(1, Math.round((end.getTime() - start.getTime()) / 60000));
  }

  // Form field values with smart defaults
  let startDate = $state(initial.startDate || initial.startDateTime?.split('T')[0] || defaultStartDate);
  let startTime = $state(initial.startDateTime?.split('T')[1]?.slice(0, 5) || defaultStartTime);
  let endDate = $state(initial.endDate || initial.endDateTime?.split('T')[0] || '');
  let endTime = $state(initial.endDateTime?.split('T')[1]?.slice(0, 5) || '');

  // Compute end date/time based on start (maintains duration for edits, 1 hour for new)
  const defaultEndDate = $derived(startDate);
  const defaultEndTime = $derived(() => {
    if (!startDate || !startTime) return '';
    const start = new Date(`${startDate}T${startTime}:00`);
    const end = new Date(start.getTime() + initialDurationMinutes * 60000);
    return end.toTimeString().slice(0, 5);
  });

  // Use user value if set, otherwise use computed default
  const effectiveEndDate = $derived(endDate || defaultEndDate);
  const effectiveEndTime = $derived(endTime || defaultEndTime());
  
  const today = new Date().toISOString().split('T')[0];
  
  // Get user's browser timezone
  const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Compute datetime values reactively
  const computedStartDateTime = $derived(
    !isAllDay && startDate && startTime ? `${startDate}T${startTime}:00` : null
  );
  const computedEndDateTime = $derived(
    !isAllDay && hasEndTime && effectiveEndDate && effectiveEndTime 
      ? `${effectiveEndDate}T${effectiveEndTime}:00` 
      : null
  );
  const computedReminders = $derived(
    JSON.stringify(
      useDefaultReminders 
        ? { useDefault: true } 
        : { useDefault: false, overrides: reminders }
    )
  );

  function addReminder() {
    reminders = [...reminders, { method: 'popup', minutes: 10 }];
  }
  
  function removeReminder(index: number) {
    reminders = reminders.filter((item: { method: string; minutes: number}, i: number) => i !== index);
  }
</script>

<!-- Hidden ID field for updates -->
{#if initial.id}
  <input type="hidden" name="id" value={initial.id} />
{/if}

  <!-- Hidden computed fields -->
  {#if computedStartDateTime}
    <input type="hidden" name="startDateTime" value={computedStartDateTime} />
  {/if}
  {#if computedEndDateTime}
    <input type="hidden" name="endDateTime" value={computedEndDateTime} />
  {/if}
  <input type="hidden" name="reminders" value={computedReminders} />

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
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        placeholder="Event title"
        value={initial.summary || ''}
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
        <input 
          id="startDate" 
          name="startDate" 
          type="date" 
          required 
          bind:value={startDate}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
        />
      </div>
      {#if !isAllDay}
        <div>
          <label for="startTime" class="block text-sm font-medium text-gray-700 mb-1">Start Time <span class="text-red-500">*</span></label>
          <input 
            id="startTime" 
            name="startTime" 
            type="time" 
            required 
            bind:value={startTime}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
          />
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
          <label for="endDate" class="block text-sm font-medium text-gray-700 mb-1">
            End Date
          </label>
          <input 
            id="endDate" 
            name="endDate" 
            type="date" 
            value={effectiveEndDate}
            oninput={(e) => endDate = e.currentTarget.value}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        {#if !isAllDay}
          <div>
            <label for="endTime" class="block text-sm font-medium text-gray-700 mb-1">
              End Time
            </label>
            <input 
              id="endTime" 
              name="endTime" 
              type="time" 
              value={effectiveEndTime}
              oninput={(e) => endTime = e.currentTarget.value}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        {/if}
      </div>
    {/if}

    {#if !isAllDay}
      <div>
        <label for="startTimeZone" class="block text-sm font-medium text-gray-700 mb-1">Time Zone</label>
        <input id="startTimeZone" name="startTimeZone" type="text" value={initial.startTimeZone || browserTimezone} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="e.g., America/New_York" />
        <input type="hidden" name="endTimeZone" value={initial.endTimeZone || browserTimezone} />
        <p class="text-xs text-gray-500 mt-1">Detected timezone: {browserTimezone}</p>
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
          {#each reminders as reminder, i (i)}
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
    <button 
      type="submit" 
      class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
    >
      {submitLabel}
    </button>
  </div>

<style>
/* component-scoped if needed */
</style>
