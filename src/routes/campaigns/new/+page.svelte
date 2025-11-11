<script lang="ts">
	import { goto } from '$app/navigation';
	import { createCampaign } from './create.remote';

	const createForm = createCampaign;

	async function handleSubmit() {
		// Wait for form submission to complete, then redirect
		await goto('/campaigns');
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
			<li>
				<a href="/campaigns" class="hover:text-blue-600 hover:underline">Campaigns</a>
			</li>
			<li>
				<span class="text-gray-400">/</span>
			</li>
			<li class="text-gray-900 font-medium">New Campaign</li>
		</ol>
	</nav>

	<div class="max-w-2xl">
		<h1 class="text-3xl font-bold mb-6">Create New Campaign</h1>

		<form {...createForm} onsubmit={handleSubmit} class="space-y-6">
			<div>
				<label for="name" class="block text-sm font-medium text-gray-700 mb-2">
					Campaign Name
				</label>
				<input
					id="name"
					{...createForm.fields.name.as('text')}
					class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					placeholder="Enter campaign name"
				/>
			</div>

			<div>
				<label for="content" class="block text-sm font-medium text-gray-700 mb-2">
					Content (JSON)
				</label>
				<textarea
					id="content"
					name="content"
					rows="12"
					class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
					placeholder="{'{}'}"
				></textarea>
				<p class="mt-1 text-sm text-gray-500">Enter campaign content as JSON</p>
			</div>

			<div class="flex gap-3">
				<button
					type="submit"
					class="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
				>
					Create Campaign
				</button>
				<a
					href="/campaigns"
					class="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
				>
					Cancel
				</a>
			</div>
		</form>
	</div>
</div>
