# Family GPS MVP — Implementation Guide

## Scope

This guide turns the supplied PRD into a buildable Android MVP. The product is a consent-based, two-device family location-sharing app: one authenticated user acts as **Admin**, and another authenticated user acts as **Receiver**. The Receiver explicitly enables sharing and can stop it at any time. The Admin can view only authorized family-member locations.

The MVP remains online-first. The Receiver requires GPS and internet access to publish updates; the Admin requires internet access to receive Realtime updates and map data. A stored last-known location may be shown when the Receiver is temporarily offline, but it must always carry a timestamp and must never be labeled as live.

## Architecture options

| Approach | Tradeoffs | Cost | Setup Complexity |
|---|---|---:|---:|
| Native Kotlin + Jetpack Compose + Supabase + MapLibre | Matches the PRD, gives direct control over Android permissions, foreground location service, battery behavior, and a polished native UI. Requires Android Studio, a configured SDK, and careful background-location testing on physical devices. | Supabase free tier plus map-provider usage within its terms; no paid infrastructure assumed | High |
| Cross-platform Expo/React Native app | Faster initial UI development and shared code, but it does not match the requested Kotlin stack and still needs native configuration for background location, notifications, and maps. | Usually free to prototype; provider and build-service limits may apply | Medium |
| Thin proof-of-flow prototype with a hosted map and simulated updates | Fastest way to validate navigation and visual design, but it would violate the PRD’s no-fake-data requirement and cannot prove the real two-phone GPS flow. | Low | Low |

The supplied PRD selects the first approach. The implementation below therefore preserves native Kotlin and treats the other two as alternatives only, not as substitutes for the real MVP.

## Component design

The Android client uses a Clean Architecture/MVVM layout:

| Layer | Responsibility |
|---|---|
| Presentation | Compose screens, navigation, state collection, loading/error/empty states, timestamp and status presentation |
| Domain | Use cases such as CreateFamily, CreatePairingCode, RedeemPairingCode, StartSharing, StopSharing, ObserveReceiver, and LoadHistory |
| Data | Supabase Auth/API/Realtime clients, DataStore preferences, repositories, DTO-to-domain mapping |
| Services | Foreground location service, notification channel, connectivity monitoring, battery sampling |
| Core | App theme, result/error model, clock abstraction, configuration, logging redaction |

The Receiver location path is: `FusedLocationProviderClient → LocationForegroundService → LocationRepository → Supabase locations/device_status`. The Admin path is: `Supabase Realtime → LocationRepository → ViewModel StateFlow → Compose map marker and bottom sheet`.

## Security decisions

The database is the security boundary. Every exposed table containing family membership, device status, or location data has Row Level Security enabled. The client never receives a service-role key. A Receiver can insert or update only its own current location/status, while an Admin can read locations only for members of a family they administer. Ownership columns such as `family_id`, `role`, and `admin_user_id` are not client-editable.

Pairing is treated as an atomic backend operation. The Admin asks the database for a random, short-lived code; only a hash is persisted. The Receiver submits the code to a narrowly scoped RPC that validates authentication, expiry, single-use state, and rate limits before creating membership and marking the code used. The RPC must execute in one transaction. Do not implement pairing as a sequence of unrestricted client-side inserts.

The Receiver’s consent is explicit and visible. The app must request Android permissions through the official runtime permission flow, start the foreground service only after the user enables sharing, show a persistent notification, and expose a prominent **Stop Sharing** control. No hidden mode, stealth icon, permission bypass, or remote activation is permitted.

## Status model

The Admin should derive display status from `last_seen_at` and the current clock rather than trusting a stale boolean alone.

| Age of latest accepted update | Display |
|---:|---|
| 0–60 seconds | Online |
| 1–5 minutes | Updating slowly |
| 5–15 minutes | Last seen X minutes ago |
| Beyond configured offline threshold | Offline |

Every marker and bottom sheet includes an absolute or relative update timestamp. If the Admin device loses internet, the map shows the last rendered position with an offline notice; it does not claim that updates are continuing.

## Location policy

The initial service configuration requests updates about every 30 seconds and can request an update sooner for meaningful movement. It must not upload every second. Each accepted payload includes latitude, longitude, accuracy, recorded timestamp, battery level, charging state, network state, and sharing state. Speed, heading, and altitude remain optional and should be omitted unless a product requirement justifies collecting them.

Continuous family sharing is a background-location use case. Android requires appropriate runtime permissions and, on Android 10/API 29 and above, the background-location declaration when the app requests background access. The foreground service declares the `location` service type and presents a persistent notification. These requirements are reflected in the manifest and setup notes. [1] [2]

## Maps

Map rendering is abstracted behind `MapProvider`. The first implementation can use a MapLibre-compatible renderer, while the style URL, vector/raster sources, satellite source, and attribution remain configuration values. MapLibre supplies the renderer, not imagery. Public OpenStreetMap tiles cannot be treated as an unrestricted production backend; attribution, identification, caching, and usage rules must be respected. Satellite mode therefore remains disabled until a separately licensed imagery provider is configured. [3] [4]

## Build sequence

The recommended implementation order is:

1. Create the Android project, theme, navigation, dependency injection, configuration, and DataStore.
2. Apply the Supabase migration, configure Auth, and verify RLS with two test accounts.
3. Implement family creation and the atomic pairing RPC.
4. Implement permission education, runtime permissions, foreground service, and visible sharing state.
5. Implement real location upload and device status updates.
6. Implement Admin Realtime subscription and timestamp/status derivation.
7. Add MapProvider and the Admin map screen with a real provider configuration.
8. Add device details, directions intent, history, notifications, and settings.
9. Test on two physical phones, including permission denial, GPS disabled, network loss, stale status, pair-code expiry, and unauthorized queries.

## Required manual configuration

The generated foundation cannot create third-party credentials automatically. Before a real build, configure the following in `local.properties` or an equivalent uncommitted local configuration file:

| Setting | Purpose |
|---|---|
| `supabase.url` | Supabase project URL |
| `supabase.anonKey` | Public anonymous client key; never use a service-role key in the APK |
| `map.styleUrl` | Licensed MapLibre style or provider style URL |
| `map.attribution` | Required provider and data attribution |
| `map.satelliteStyleUrl` | Optional licensed satellite style; leave blank to disable satellite mode |

The application should fail closed with a clear configuration message if a required URL or key is absent. No secret should be committed to GitHub.

## Acceptance gates

The MVP is not complete until two real Android devices can authenticate, pair, grant permission, publish actual GPS data over the internet, receive the data through Supabase, and display a timestamped marker on the Admin map. The test suite must also verify that stopping sharing stops uploads, stale data is labeled honestly, RLS blocks unauthorized access, and the foreground notification is visible.

## References

[1]: https://developer.android.com/develop/sensors-and-location/location/permissions "Android Developers — Request location permissions"

[2]: https://developer.android.com/develop/background-work/services/fgs "Android Developers — Foreground services overview"

[3]: https://maplibre.org/maplibre-native/android/api/ "MapLibre Native Android API"

[4]: https://operations.osmfoundation.org/policies/tiles/ "OpenStreetMap Foundation — Tile Usage Policy"
