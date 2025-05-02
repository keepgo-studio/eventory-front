
/**
 * @description
 * 
 * This variable defines the cookie name used for session persistence.
 */
export const FB_TOKEN_KEY = "firebase_token";

/**
 * @description
 * 
 * This variable is defined to enforce consistent URL parameter naming across the application.
 */
export const REDIRECT_TO_KEY = "redirectTo";

export const IS_DEV = process.env.NODE_ENV === "development";

export const MAX_IMAGE_SIZE = 3 * 1024 * 1024; // 3MiB
