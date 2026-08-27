package com.example.familygps.presentation.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val Blue = Color(0xFF2563EB)
private val Background = Color(0xFFF8FAFC)
private val Surface = Color(0xFFFFFFFF)
private val PrimaryText = Color(0xFF0F172A)
private val SecondaryText = Color(0xFF64748B)
private val Success = Color(0xFF22C55E)
private val Warning = Color(0xFFF59E0B)
private val Error = Color(0xFFEF4444)

private val LightColors = lightColorScheme(
    primary = Blue,
    onPrimary = Color.White,
    primaryContainer = Color(0xFFDCE8FF),
    onPrimaryContainer = PrimaryText,
    background = Background,
    onBackground = PrimaryText,
    surface = Surface,
    onSurface = PrimaryText,
    onSurfaceVariant = SecondaryText,
    secondary = SecondaryText,
    tertiary = Success,
    error = Error,
)

private val DarkColors = darkColorScheme(
    primary = Color(0xFF8EB4FF),
    onPrimary = Color(0xFF002E6A),
    primaryContainer = Color(0xFF174A9B),
    onPrimaryContainer = Color.White,
    background = Color(0xFF0F172A),
    onBackground = Color(0xFFE2E8F0),
    surface = Color(0xFF111827),
    onSurface = Color(0xFFE2E8F0),
    onSurfaceVariant = Color(0xFF94A3B8),
    secondary = Color(0xFF94A3B8),
    tertiary = Color(0xFF86EFAC),
    error = Color(0xFFFCA5A5),
)

@Composable
fun FamilyGpsTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    MaterialTheme(
        colorScheme = if (darkTheme) DarkColors else LightColors,
        content = content,
    )
}
