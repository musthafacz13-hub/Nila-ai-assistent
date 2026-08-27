package com.example.familygps.core

import com.example.familygps.BuildConfig

data class AppConfig(
    val supabaseUrl: String,
    val supabaseAnonKey: String,
    val mapStyleUrl: String,
    val mapAttribution: String,
    val satelliteStyleUrl: String,
) {
    val isMapConfigured: Boolean
        get() = mapStyleUrl.isNotBlank() && mapAttribution.isNotBlank()

    val isSatelliteConfigured: Boolean
        get() = satelliteStyleUrl.isNotBlank()

    companion object {
        fun fromBuildConfig(): AppConfig = AppConfig(
            supabaseUrl = BuildConfig.SUPABASE_URL,
            supabaseAnonKey = BuildConfig.SUPABASE_ANON_KEY,
            mapStyleUrl = BuildConfig.MAP_STYLE_URL,
            mapAttribution = BuildConfig.MAP_ATTRIBUTION,
            satelliteStyleUrl = BuildConfig.SATELLITE_STYLE_URL,
        )
    }
}
