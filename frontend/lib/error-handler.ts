import { notifyError } from "./utils";

/**
 * Standardized wrapper for executing async operations with error handling.
 * Log errors to the console and optionally notifies the user.
 *
 * @param promise - The promise to execute
 * @param context - Human-readable context for the error message
 * @param options - Optional configuration (defaultValue, silent)
 * @returns The result of the promise or the defaultValue on failure
 */
export async function safeExecute<T>(
  promise: Promise<T>,
  context: string,
  options: { defaultValue?: T; silent?: boolean } = {},
): Promise<T | undefined> {
  try {
    return await promise;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`[${context}] Error:`, error);

    if (!options.silent) {
      notifyError(`Failed to ${context}. Please try again.`);
    }

    return options.defaultValue;
  }
}

/**
 * Standardized wrapper for non-async operations.
 */
export function safeCall<T>(
  fn: () => T,
  context: string,
  options: { defaultValue?: T; silent?: boolean } = {},
): T | undefined {
  try {
    return fn();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`[${context}] Error:`, error);

    if (!options.silent) {
      notifyError(`Failed to ${context}. Please try again.`);
    }

    return options.defaultValue;
  }
}
