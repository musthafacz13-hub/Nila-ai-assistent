# Family GPS

A consent-based, online-first Android family location-sharing MVP.

## Current foundation

This project contains the native Kotlin/Jetpack Compose foundation, Material 3 theme, explicit location/foreground-service declarations, Supabase schema and RLS migration, atomic pairing functions, and a first-run role-selection screen. It intentionally does not include fake coordinates, simulated realtime updates, or a hard-coded map marker.

## Prerequisites

Use Android Studio with JDK 17, Android SDK Platform 35, and a physical Android test device. The sandbox that generated this foundation does not have Android Studio, the Android SDK, Gradle, or an emulator installed, so compilation and APK generation must be completed in a configured Android development environment.

## Supabase setup

Create a Supabase project and run `supabase/migrations/001_initial.sql` in the SQL Editor or through the Supabase CLI. Enable the authentication method selected for the build (the current design assumes email/password authentication). Create two test accounts and verify that Admin and Receiver access behaves differently.

The migration stores only a SHA-256 hash of each pairing code. The Admin receives a plain six-digit code from the server-side function, while the Receiver redeems it through `redeem_pairing_code`. Do not replace these functions with unrestricted client-side inserts.

## Local configuration

Copy `local.properties.example` to `local.properties` and fill in the values. `local.properties` is ignored by Git and values are exposed to the app only through generated `BuildConfig` constants.

Required values:

- `supabase.url`: Supabase project URL.
- `supabase.anonKey`: Supabase public anonymous key. Never use a service-role key in the APK.
- `map.styleUrl`: Licensed MapLibre style URL. The app should show an actionable configuration error if this is blank before map rendering is enabled.
- `map.attribution`: Provider and data attribution text required by the selected provider.
- `map.satelliteStyleUrl`: Optional licensed satellite style URL. Leave blank to keep satellite mode disabled.

## Android location behavior

The Receiver must first see an explanation, grant location permission, and press **Start Sharing**. The app then starts `LocationForegroundService`, displays a persistent notification, samples location using `FusedLocationProviderClient`, and uploads only when the interval or movement threshold is met. The Receiver can stop sharing at any time, and the service must stop uploading when sharing is disabled.

For Android 10/API 29 and above, background location and the location foreground-service type must be handled according to the official Android permission flow. Test precise versus approximate permission, permission denial, GPS disabled, battery saver, app backgrounding, notification denial, and process restart on physical devices.

## Map provider policy

MapLibre is the renderer abstraction. It is not a free imagery service. Configure a tile/style provider whose terms permit the intended use, display attribution, and respect rate limits and caching rules. Do not scrape Google tiles or use public OpenStreetMap tile servers as an unrestricted production backend. Satellite imagery remains optional until a licensed provider is configured.

## Build commands

From Android Studio, sync the project and run the `app` configuration on a physical device. With a configured command-line Android environment, the usual commands are:

```bash
./gradlew assembleDebug
./gradlew installDebug
```

The repository currently has no Gradle wrapper because the generating sandbox did not include Gradle. Android Studio can create or import the wrapper during project setup.

## End-to-end test gates

The MVP is accepted only when two real phones can authenticate, create and redeem a pairing code, grant permission, start visible sharing, upload actual GPS coordinates over the internet, receive them via Supabase Realtime, and show a timestamped marker on the Admin map. Also verify stale/offline labeling, stop-sharing behavior, code expiry and single-use behavior, RLS rejection of unauthorized queries, and absence of secrets or fake location data.
