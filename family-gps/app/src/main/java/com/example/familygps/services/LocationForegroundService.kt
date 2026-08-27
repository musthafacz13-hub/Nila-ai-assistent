package com.example.familygps.services

import android.Manifest
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.content.pm.PackageManager
import android.os.IBinder
import androidx.core.content.ContextCompat
import com.example.familygps.R
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationCallback
import com.google.android.gms.location.LocationRequest
import com.google.android.gms.location.LocationResult
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority

class LocationForegroundService : Service() {
    private lateinit var fusedLocationClient: FusedLocationProviderClient

    private val locationCallback = object : LocationCallback() {
        override fun onLocationResult(result: LocationResult) {
            result.locations.forEach { location ->
                // TODO: map the actual Android Location into a payload and upload it
                // through the authenticated repository. Never substitute fake coordinates.
                android.util.Log.d(TAG, "Location received: accuracy=${location.accuracy}")
            }
        }
    }

    override fun onCreate() {
        super.onCreate()
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_STOP -> stopSharing()
            ACTION_START, null -> startSharing()
        }
        return START_NOT_STICKY
    }

    private fun startSharing() {
        val hasFine = ContextCompat.checkSelfPermission(
            this,
            Manifest.permission.ACCESS_FINE_LOCATION,
        ) == PackageManager.PERMISSION_GRANTED
        val hasCoarse = ContextCompat.checkSelfPermission(
            this,
            Manifest.permission.ACCESS_COARSE_LOCATION,
        ) == PackageManager.PERMISSION_GRANTED
        if (!hasFine && !hasCoarse) {
            stopSelf()
            return
        }

        startForeground(NOTIFICATION_ID, buildNotification())

        val request = LocationRequest.Builder(
            Priority.PRIORITY_BALANCED_POWER_ACCURACY,
            UPDATE_INTERVAL_MILLIS,
        )
            .setMinUpdateIntervalMillis(MIN_UPDATE_INTERVAL_MILLIS)
            .setMinUpdateDistanceMeters(MIN_MOVEMENT_METERS)
            .build()

        fusedLocationClient.requestLocationUpdates(request, locationCallback, mainLooper)
    }

    private fun stopSharing() {
        fusedLocationClient.removeLocationUpdates(locationCallback)
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    private fun buildNotification(): Notification = Notification.Builder(this, CHANNEL_ID)
        .setContentTitle("Family GPS")
        .setContentText("Location sharing is active.")
        .setSmallIcon(R.drawable.ic_family_gps)
        .setOngoing(true)
        .setCategory(Notification.CATEGORY_SERVICE)
        .build()

    private fun createNotificationChannel() {
        val channel = NotificationChannel(
            CHANNEL_ID,
            "Location sharing",
            NotificationManager.IMPORTANCE_LOW,
        ).apply {
            description = "Shows when this device is sharing its location."
        }
        getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
    }

    override fun onBind(intent: Intent?): IBinder? = null

    companion object {
        const val ACTION_START = "com.example.familygps.action.START_SHARING"
        const val ACTION_STOP = "com.example.familygps.action.STOP_SHARING"
        private const val TAG = "LocationForegroundService"
        private const val CHANNEL_ID = "family_gps_location"
        private const val NOTIFICATION_ID = 1001
        private const val UPDATE_INTERVAL_MILLIS = 30_000L
        private const val MIN_UPDATE_INTERVAL_MILLIS = 15_000L
        private const val MIN_MOVEMENT_METERS = 25f
    }
}
