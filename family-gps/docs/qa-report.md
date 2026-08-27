# Family GPS MVP — Foundation QA Report

## Validation scope

This report covers the generated project foundation, not a completed production APK. The sandbox did not contain Android Studio, the Android SDK, Gradle, an emulator, a Supabase project, map credentials, or two physical Android devices. Consequently, static checks were performed here, while compilation, device behavior, Supabase integration, Realtime delivery, and map rendering remain environment-dependent validation steps.

## Results

| PRD acceptance area | Status | Evidence or next action |
|---|---|---|
| Native Kotlin and Jetpack Compose foundation | Foundation present | Root and app Gradle Kotlin DSL files, Compose activity, Material 3 theme |
| Admin and Receiver roles | UI foundation present | Role-selection screen defines both roles; authenticated flows still need implementation |
| Supabase authentication | Configuration present; feature pending | Supabase client dependency and configuration are present; sign-up/sign-in screens and session handling remain |
| Family creation | Backend schema present; client flow pending | `families` table and Admin trigger exist; Compose flow and repository remain |
| Secure six-digit pairing | Backend implementation present; client flow pending | Hash-only code storage, expiry, single-use invalidation, atomic redemption RPC, and rate-limit hook are defined; client invocation and server-side rate limiting require completion |
| Location permission education | Manifest present; UI flow pending | Permission declarations exist; explanation screen and runtime sequencing remain |
| Foreground GPS service | Service skeleton present | `LocationForegroundService` uses `FusedLocationProviderClient`, 30-second interval, movement threshold, visible notification, and stop action; authenticated upload is still a TODO |
| Real location upload | Pending | Must map actual Android `Location` values to an authenticated payload and write through RLS-protected APIs |
| Supabase Realtime updates | Dependency present; feature pending | Realtime module is included; subscription, reconnect, and ViewModel state wiring remain |
| Live Admin map | Pending | MapProvider abstraction and licensed style configuration are documented; MapLibre view and marker rendering remain |
| Timestamp honesty | Logic implemented and unit-tested | `DeviceStatus.freshness()` distinguishes Online, UpdatingSlowly, LastSeen, and Offline; tests cover boundary cases |
| Battery, GPS, and network status | Schema present; client collection pending | Database columns and domain models exist; Android sampling and status uploads remain |
| Stop sharing | Product language present; service stop path present | UI language and service action exist; repository status update and complete flow remain |
| RLS protection | Migration present | All core tables enable RLS; policies restrict Admin reads and Receiver writes; apply and test in the target Supabase project |
| No hidden tracking | Satisfied by design | Sharing is explicit, notification is persistent, and no stealth behavior is included |
| History, directions, settings, notifications | Pending | P1 work after the P0 end-to-end flow works |
| Build and APK generation | Not run | Install Android Studio/SDK/JDK 17, generate/import Gradle wrapper, sync, then run `assembleDebug` |
| Two-phone QA | Not run | Requires two real Android devices with independent internet connections |

## Static checks completed

The following checks passed in the generating environment:

- Required Gradle, manifest, source, resource, SQL, and documentation files exist.
- The manifest declares internet, coarse/fine/background location, notification, foreground service, and location foreground-service type permissions.
- The SQL migration enables RLS for the core tables and defines the atomic pairing function.
- The Receiver service contains an explicit placeholder for actual Android location upload rather than fake coordinates.
- No credential-like Supabase JWT, service-role token, Google API key, or project URL was found in the generated project.

## Blocking next steps for a real MVP

First configure the Supabase project and apply the migration. Then implement the missing client repositories and screens for authentication, family creation, pairing, and sharing consent. Next connect the foreground service to the authenticated repository and implement the Admin Realtime subscription. Finally configure a licensed MapLibre style and validate the map on two physical devices. The project should not be called production-ready until those steps and the PRD’s ten integration tests have passed.
