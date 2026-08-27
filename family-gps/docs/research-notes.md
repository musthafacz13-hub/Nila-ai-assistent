# Family GPS research notes

## Android location and foreground service requirements

Sources reviewed:

1. Android Developers, Request location permissions: https://developer.android.com/develop/sensors-and-location/location/permissions
2. Android Developers, Foreground services overview: https://developer.android.com/develop/background-work/services/fgs

Verified constraints:

- Continuous family location sharing is a background-location use case.
- Android 10/API 29+ requires ACCESS_BACKGROUND_LOCATION in the manifest when the app requests background access.
- A foreground service keeps location access when the app is backgrounded and must show a persistent user-visible notification.
- The location foreground service must declare android:foregroundServiceType="location" on Android 10/API 29+.
- The app should request only the permissions justified by the product and follow runtime permission sequencing; precise versus approximate location remains a user choice.
- The receiver UI and persistent notification should clearly communicate that location sharing is active.

Implication for architecture: start the receiver service only after explicit user consent and permission, use the location service for FusedLocationProviderClient updates, and never hide or bypass Android permission and notification controls.

## Supabase authorization and privileged operations

Sources reviewed:

3. Supabase Docs, Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
4. Supabase Docs, Database Functions: https://supabase.com/docs/guides/database/functions

Verified constraints:

- Location tables exposed through the client must use database-side Row Level Security; frontend checks are not sufficient.
- Pairing should be an atomic server-side operation so validation, membership creation, and code invalidation cannot be separated by a malicious client.
- Prefer security-invoker database functions. If a security-definer function is unavoidable, Supabase’s guidance requires an explicit search_path and schema-qualified relations.

Implication for architecture: use RLS policies keyed to auth.uid() and family membership, and expose narrowly scoped RPC/database functions for create_pairing_code and redeem_pairing_code rather than allowing clients to directly mutate ownership relationships or pairing-code state.

## Mapping and tile-provider constraints

Sources reviewed:

5. OpenStreetMap Foundation, Tile Usage Policy: https://operations.osmfoundation.org/policies/tiles/
6. MapLibre Native Android API: https://maplibre.org/maplibre-native/android/api/

Verified constraints:

- MapLibre Native Android provides the renderer and APIs for map styles, sources, annotations, and attribution; it does not itself supply map or satellite imagery.
- The public OpenStreetMap tile service is donation-funded and capacity-limited, so production apps must not assume unrestricted use; attribution, caching, identification, and usage-policy compliance are required.
- Satellite imagery must come from a separately licensed provider and remain configurable behind a MapProvider abstraction.

Implication for architecture: implement a MapProvider interface with a documented default provider configuration, include visible attribution, and keep satellite mode disabled or explicitly configured until a provider and terms appropriate for the deployment are selected.
