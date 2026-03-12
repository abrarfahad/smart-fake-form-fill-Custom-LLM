<script lang="ts">
	import { debounce } from 'es-toolkit';
	import {
		DEFAULT_GEMINI_MODEL,
		DEFAULT_OPENAI_MODEL,
		DEFAULT_OPENAI_REQUEST_TIMEOUT,
		DEFAULT_PROVIDER,
		GEMINI_MODELS
	} from '../config';
	import type { OpenAiModelListResponse, ProviderType } from '../types';
	import LoadingIndicator from './LoadingIndicator.svelte';

	const requestTimeoutOptions: Record<string, number> = {
		'15 seconds': 15,
		'30 seconds': 30,
		'60 seconds': 60,
		'90 seconds': 90,
		'2 minutes': 120,
		'5 minutes': 300
	};

	type SavedOptions = {
		provider: ProviderType;
		openai_api_key: string;
		gemini_api_key: string;
		custom_api_key: string;
		custom_base_url: string;
		openai_model: string;
		openai_request_timeout_seconds: number;
		custom_instructions: string;
	};

	let savedOptionsPromise: Promise<SavedOptions> = $state(
		new Promise((resolve, reject) => {
			(async () => {
				try {
					const syncData = await chrome.storage.sync.get<{
						provider: ProviderType;
						openai_model: string;
						openai_request_timeout_seconds: number;
						custom_instructions: string;
						custom_base_url: string;
					}>([
						'provider',
						'openai_model',
						'openai_request_timeout_seconds',
						'custom_instructions',
						'custom_base_url'
					]);
					const localData = await chrome.storage.local.get<{
						openai_api_key: string;
						gemini_api_key: string;
						custom_api_key: string;
					}>(['openai_api_key', 'gemini_api_key', 'custom_api_key']);
					const providerType: ProviderType = syncData?.provider || DEFAULT_PROVIDER;
					const defaultModel =
						providerType === 'gemini' ? DEFAULT_GEMINI_MODEL : DEFAULT_OPENAI_MODEL;
					resolve({
						provider: providerType,
						openai_api_key: (localData?.openai_api_key as string | null) || '',
						gemini_api_key: (localData?.gemini_api_key as string | null) || '',
						custom_api_key: (localData?.custom_api_key as string | null) || '',
						custom_base_url: (syncData?.custom_base_url as string | null) || '',
						openai_model: (syncData?.openai_model as string | null) || defaultModel,
						openai_request_timeout_seconds: Number(
							syncData?.openai_request_timeout_seconds ?? DEFAULT_OPENAI_REQUEST_TIMEOUT
						),
						custom_instructions: (syncData?.custom_instructions as string | null) || ''
					});
				} catch (error) {
					reject(error);
				}
			})();
		})
	);

	async function getFallbackModelList(provider: ProviderType): Promise<string[]> {
		if (provider === 'gemini') {
			return GEMINI_MODELS;
		}
		if (provider === 'custom') {
			return [];
		}
		try {
			const storedModel =
				(await chrome.storage.sync.get<{ openai_model: string }>(['openai_model']))?.openai_model ||
				DEFAULT_OPENAI_MODEL;
			return Array.from(new Set([storedModel, DEFAULT_OPENAI_MODEL])).sort();
		} catch (error) {
			console.error(error);
			return [DEFAULT_OPENAI_MODEL];
		}
	}

	const modelListPromise: Promise<string[]> = $state(
		new Promise((resolve) => {
			chrome.runtime.sendMessage(
				{ action: 'getModels' },
				async (response: OpenAiModelListResponse | undefined) => {
					if (chrome.runtime.lastError) {
						const opts = await savedOptionsPromise;
						getFallbackModelList(opts.provider).then(resolve);
						return;
					}
					if (response?.status.code === 'SUCCESS' && response.models?.length) {
						resolve(response.models);
						return;
					}
					const opts = await savedOptionsPromise;
					getFallbackModelList(opts.provider).then(resolve);
				}
			);
		})
	);

	let justSaved = $state(false);
	// The number of milliseconds to wait (after the user stops typing) before
	// saving the option
	const saveDelay = 500;
	// The number of milliseconds to wait to indicate to the user that the API key
	// was successfully changed
	const successDelay = 2000;

	const localKeys = new Set(['openai_api_key', 'gemini_api_key', 'custom_api_key']);
	const syncKeys = new Set([
		'provider',
		'openai_model',
		'openai_request_timeout_seconds',
		'custom_instructions',
		'custom_base_url'
	]);

	const saveOption = debounce(async (event: Event) => {
		const input = event.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
		if (localKeys.has(input.name)) {
			await chrome.storage.local.set({ [input.name]: input.value });
		} else if (syncKeys.has(input.name)) {
			const value =
				input.name === 'openai_request_timeout_seconds' ? Number(input.value) : input.value;
			await chrome.storage.sync.set({ [input.name]: value });
		}
		justSaved = true;
		setTimeout(() => {
			justSaved = false;
		}, successDelay);
	}, saveDelay);

	async function changeOption(event: Event) {
		event.preventDefault();
		saveOption(event);
	}
</script>

<svelte:head>
	<title>Options | Smart Fake Form Fill</title>
</svelte:head>

<h1>Options | Smart Fake Form Fill</h1>

{#await savedOptionsPromise}
	<LoadingIndicator />
{:then savedOptions}
	<form oninput={changeOption}>
		<p>
			<label for="provider">AI Provider</label>
			<select name="provider" id="provider" bind:value={savedOptions.provider} required>
				<option value="openai">OpenAI</option>
				<option value="gemini">Google Gemini</option>
				<option value="custom">Custom / Local Model</option>
			</select>
		</p>

		{#if savedOptions.provider === 'openai'}
			<p>
				<label for="openai_api_key">OpenAI API Key</label>
				<input
					type="password"
					name="openai_api_key"
					id="openai_api_key"
					required
					bind:value={savedOptions.openai_api_key}
					onfocus={(event) => event.currentTarget.select()}
				/>
				<span class="hint">
					<a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer"
						>Visit the OpenAI API Dashboard</a
					> to generate an API key.
				</span>
			</p>
		{:else if savedOptions.provider === 'gemini'}
			<p>
				<label for="gemini_api_key">Gemini API Key</label>
				<input
					type="password"
					name="gemini_api_key"
					id="gemini_api_key"
					required
					bind:value={savedOptions.gemini_api_key}
					onfocus={(event) => event.currentTarget.select()}
				/>
				<span class="hint">
					<a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer"
						>Visit Google AI Studio</a
					> to generate a Gemini API key.
				</span>
			</p>
		{:else if savedOptions.provider === 'custom'}
			<p>
				<label for="custom_base_url">API Base URL</label>
				<input
					type="text"
					name="custom_base_url"
					id="custom_base_url"
					placeholder="e.g. http://localhost:11434/v1"
					required
					bind:value={savedOptions.custom_base_url}
				/>
				<span class="hint">
					Base URL for any OpenAI-compatible API (e.g. Ollama, LM Studio, or a custom endpoint).
				</span>
			</p>
			<p>
				<label for="custom_api_key">API Key <span class="hint">(optional)</span></label>
				<input
					type="password"
					name="custom_api_key"
					id="custom_api_key"
					bind:value={savedOptions.custom_api_key}
					onfocus={(event) => event.currentTarget.select()}
				/>
				<span class="hint">Leave blank if your local model does not require an API key.</span>
			</p>
		{/if}

		<p>
			<label for="openai_model">
				{#if savedOptions.provider === 'custom'}
					Model Name
				{:else}
					AI Model
				{/if}
			</label>
			{#if savedOptions.provider === 'custom'}
				<input
					type="text"
					name="openai_model"
					id="openai_model"
					placeholder="e.g. llama3, mistral, phi3"
					bind:value={savedOptions.openai_model}
				/>
				<span class="hint">Enter the model name as required by your API endpoint.</span>
			{:else if savedOptions.provider === 'gemini'}
				<select
					name="openai_model"
					id="openai_model"
					bind:value={savedOptions.openai_model}
					required
				>
					{#each GEMINI_MODELS as modelId (modelId)}
						<option value={modelId}>{modelId}</option>
					{/each}
				</select>
			{:else}
				<select
					name="openai_model"
					id="openai_model"
					bind:value={savedOptions.openai_model}
					required
				>
					{#await modelListPromise}
						<option disabled value={savedOptions.openai_model || ''}
							>{savedOptions.openai_model || 'Loading model list...'}</option
						>
					{:then modelList}
						{#each modelList as modelId (modelId)}
							<option value={modelId}>{modelId}</option>
						{/each}
					{:catch}
						<option disabled value={savedOptions.openai_model || DEFAULT_OPENAI_MODEL}>
							Failed to load model list; defaulting to {savedOptions.openai_model ||
								DEFAULT_OPENAI_MODEL}
						</option>
					{/await}
				</select>
			{/if}
		</p>
		<p>
			<label for="openai_request_timeout_seconds">Request Timeout</label>
			<select
				name="openai_request_timeout_seconds"
				id="openai_request_timeout_seconds"
				bind:value={savedOptions.openai_request_timeout_seconds}
				required
			>
				{#each Object.entries(requestTimeoutOptions) as [label, timeoutSeconds] (timeoutSeconds)}
					<option value={timeoutSeconds}>{label}</option>
				{/each}
			</select>
		</p>
		<p>
			<label for="custom_instructions">Custom Instructions</label>
			<textarea
				name="custom_instructions"
				id="custom_instructions"
				bind:value={savedOptions.custom_instructions}
			></textarea>
		</p>
		<p class="hint">
			{#if justSaved}
				Saved!
			{:else}
				Changes are automatically saved.
			{/if}
		</p>
	</form>
{/await}
