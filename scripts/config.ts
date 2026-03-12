// The display name of the extension
export const EXTENSION_DISPLAY_NAME = 'Smart Fake Form Fill';
// Define the default AI model to use
export const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini';
// The maximum number of times to retry establishing a connection to the OpenAI
// API (note that this will be in addition to a guaranteed first attempt)
export const OPENAI_REQUEST_MAX_RETRIES = 1;
// The number of seconds to wait before timing out the OpenAI request
export const DEFAULT_OPENAI_REQUEST_TIMEOUT = 90;

// The default provider to use
export const DEFAULT_PROVIDER = 'openai';

// Placeholder API key for custom providers that don't require authentication
export const CUSTOM_API_KEY_PLACEHOLDER = 'not-required';

// Gemini OpenAI-compatible API base URL
export const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/';
// The default Gemini model to use
export const DEFAULT_GEMINI_MODEL = 'gemini-2.0-flash';
// The list of available Gemini models
export const GEMINI_MODELS = [
	'gemini-2.5-pro-preview-03-25',
	'gemini-2.0-flash',
	'gemini-2.0-flash-lite',
	'gemini-1.5-flash',
	'gemini-1.5-flash-8b',
	'gemini-1.5-pro'
];

// The possible messages to show within the UI based on the state of the
// extension
export const UI_MESSAGES = {
	PROCESSING: 'Generating smart fake values with AI…',
	SUCCESS: 'Success!',
	ERROR: 'An error occurred.',
	CANCELED: 'Canceled.'
} as const;
