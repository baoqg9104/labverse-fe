import { isAxiosError } from "axios";
import { toast } from "react-toastify";

export interface HandleAxiosErrorOptions {
  /**
   * Map of status code to custom message (e.g. { 404: "Not found" })
   */
  customStatusMessages?: Record<number, string>;
  /**
   * Fallback message for unknown errors
   */
  fallbackMessage?: string;
  /**
   * If true, will not show toast, just return message
   */
  silent?: boolean;
}

export function handleAxiosError(
  err: unknown,
  options: HandleAxiosErrorOptions = {}
): string {
  const {
    customStatusMessages = {},
    fallbackMessage = "An error occurred. Please try again.",
    silent = false,
  } = options;

  let message = fallbackMessage;

  if (isAxiosError(err)) {
    if (err.code === "ERR_NETWORK" || err.message === "Network Error") {
      message = "Cannot connect to server. Please try again later.";
    } else if (
      err.response?.status &&
      customStatusMessages[err.response.status]
    ) {
      message = customStatusMessages[err.response.status]!;
    } else if (err.response) {
      message = fallbackMessage;
    }
  }

  if (!silent) {
    toast.error(message);
  }
  return message;
}
