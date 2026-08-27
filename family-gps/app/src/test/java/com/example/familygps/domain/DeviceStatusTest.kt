package com.example.familygps.domain

import org.junit.Assert.assertEquals
import org.junit.Test

class DeviceStatusTest {
    private val now = 1_000_000L

    @Test
    fun freshLocationIsOnline() {
        val status = status(lastSeen = now - 60_000L)
        assertEquals(Freshness.Online, status.freshness(now))
    }

    @Test
    fun fiveMinuteLocationIsStillUpdatingSlowly() {
        val status = status(lastSeen = now - 5 * 60_000L)
        assertEquals(Freshness.UpdatingSlowly, status.freshness(now))
    }

    @Test
    fun fifteenMinuteLocationIsLastSeen() {
        val status = status(lastSeen = now - 15 * 60_000L)
        assertEquals(Freshness.LastSeen(15), status.freshness(now))
    }

    @Test
    fun missingLocationIsOffline() {
        assertEquals(Freshness.Offline, status(lastSeen = null).freshness(now))
    }

    private fun status(lastSeen: Long?): DeviceStatus = DeviceStatus(
        isOnline = true,
        batteryLevel = 78,
        isCharging = false,
        gpsAvailable = true,
        networkStatus = NetworkStatus.WIFI,
        sharingEnabled = true,
        lastSeenEpochMillis = lastSeen,
    )
}
