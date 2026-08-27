package com.example.familygps.domain

import kotlinx.serialization.Serializable

@Serializable
enum class FamilyRole { ADMIN, RECEIVER }

@Serializable
enum class NetworkStatus { WIFI, MOBILE, OFFLINE, UNKNOWN }

@Serializable
data class LocationPoint(
    val latitude: Double,
    val longitude: Double,
    val accuracyMeters: Double,
    val recordedAtEpochMillis: Long,
    val batteryLevel: Int?,
    val isCharging: Boolean,
    val networkStatus: NetworkStatus,
)

@Serializable
data class DeviceStatus(
    val isOnline: Boolean,
    val batteryLevel: Int?,
    val isCharging: Boolean,
    val gpsAvailable: Boolean,
    val networkStatus: NetworkStatus,
    val sharingEnabled: Boolean,
    val lastSeenEpochMillis: Long?,
) {
    fun freshness(nowEpochMillis: Long): Freshness {
        val lastSeen = lastSeenEpochMillis ?: return Freshness.Offline
        val ageSeconds = ((nowEpochMillis - lastSeen).coerceAtLeast(0L)) / 1_000L
        return when {
            ageSeconds <= 60 -> Freshness.Online
            ageSeconds <= 5 * 60 -> Freshness.UpdatingSlowly
            ageSeconds <= 15 * 60 -> Freshness.LastSeen(ageSeconds / 60)
            else -> Freshness.Offline
        }
    }
}

sealed interface Freshness {
    data object Online : Freshness
    data object UpdatingSlowly : Freshness
    data class LastSeen(val minutes: Long) : Freshness
    data object Offline : Freshness
}
