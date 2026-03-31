/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string = string> extends Record<string, unknown> {
      StaticRoutes: `/` | `/(app)` | `/(app)/cart` | `/(app)/checkout` | `/(app)/home` | `/(app)/profile` | `/(app)/qr-access` | `/(app)/scanner` | `/(auth)` | `/(auth)/login` | `/(auth)/register` | `/(auth)/verify-doc` | `/(auth)/verify-otp` | `/(auth)/verify-selfie` | `/(auth)/welcome` | `/(auth)\welcome` | `/_sitemap` | `/cart` | `/checkout` | `/home` | `/login` | `/profile` | `/qr-access` | `/register` | `/scanner` | `/verify-doc` | `/verify-otp` | `/verify-selfie` | `/welcome`;
      DynamicRoutes: never;
      DynamicRouteTemplate: never;
    }
  }
}
