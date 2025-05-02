declare namespace NodeJS {
  interface ProcessEnv {
    // for firebase client SDK
    readonly NEXT_PUBLIC_API_KEY: string;
    readonly NEXT_PUBLIC_AUTH_DOMAIN: string;
    readonly NEXT_PUBLIC_PROJECT_ID: string;
    readonly NEXT_PUBLIC_STORAGE_BUCKET: string;
    readonly NEXT_PUBLIC_MESSAGING_SENDER_ID: string;
    readonly NEXT_PUBLIC_APP_ID: string;
    readonly NEXT_PUBLIC_MEASUREMENT_ID: string;

    // for firebase functions
    readonly NEXT_PUBLIC_FUNCTION_URL: string;
    readonly NEXT_PUBLIC_DEV_FUNCTION_URL: string;

    // for firebase admin SDK
    readonly FB_SERVICE_ACCOUNT_KEY: string;

    // for Drizzle
    readonly POSTGRES_URL: string;
  }
}