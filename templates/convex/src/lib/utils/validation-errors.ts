// Type definitions for valibot flattened errors
export interface ValidationErrorBody {
	message: string;
	errors: {
		nested: Record<string, string[]>;
	};
}

// Type guard function to check if error body contains validation errors
export function isValidationError(errorBody: unknown): errorBody is ValidationErrorBody {
	return (
		typeof errorBody === 'object' &&
		errorBody !== null &&
		'errors' in errorBody &&
		typeof (errorBody as ValidationErrorBody).errors === 'object' &&
		'nested' in (errorBody as ValidationErrorBody).errors &&
		typeof (errorBody as ValidationErrorBody).errors.nested === 'object'
	);
}

// Helper function to convert nested validation errors to field-specific error messages
export function extractFieldErrors(nested: Record<string, string[]>): Record<string, string> {
	return Object.fromEntries(
		Object.entries(nested).map(([field, messages]) => [
			field,
			messages[0] // Take the first error message for each field
		])
	);
}
