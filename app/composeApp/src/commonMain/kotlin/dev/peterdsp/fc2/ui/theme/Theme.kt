package dev.peterdsp.fc2.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable

private val FcColors = darkColorScheme(
    primary = GlassTokens.Red,
    secondary = GlassTokens.Green,
    tertiary = GlassTokens.Gold,
    background = GlassTokens.Bg,
    surface = GlassTokens.GlassFill,
    onPrimary = GlassTokens.Ink,
    onSecondary = GlassTokens.Ink,
    onBackground = GlassTokens.Ink,
    onSurface = GlassTokens.Ink,
)

@Composable
fun FcTheme(content: @Composable () -> Unit) {
    @Suppress("UNUSED_EXPRESSION") isSystemInDarkTheme() // app is dark-first by design
    MaterialTheme(
        colorScheme = FcColors,
        typography = Typography(),
        content = content,
    )
}
