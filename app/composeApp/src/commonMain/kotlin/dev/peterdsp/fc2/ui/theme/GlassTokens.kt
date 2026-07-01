package dev.peterdsp.fc2.ui.theme

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

/**
 * One token source for radii, tints and brand colors, so iOS Liquid Glass,
 * the Android frosted equivalent, and the web app stay visually identical.
 * Values mirror `web/styles/liquid-glass.css` and `app.css`.
 */
object GlassTokens {
    // Brand accents, used equally (red + green), gold for history.
    val Red = Color(0xFFD4262E)
    val RedBright = Color(0xFFFF1C17)  // Figma story ring: #FF1C17
    val Green = Color(0xFF19C37D)
    val GreenDeep = Color(0xFF0A8A4A)
    val Gold = Color(0xFFC9A227)

    // Ink (text) ramp on the dark glass.
    val Ink = Color(0xFFF4F4F6)
    val InkDim = Color(0xFFB7B7C2)
    val InkFaint = Color(0xFF6E6E7A)

    // Backdrop.
    val Bg = Color(0xFF0A0716)
    val BgDeep = Color(0xFF070509)

    // Glass fill + stroke.
    val GlassFill = Color(0x14FFFFFF)        // rgba(255,255,255,0.08)
    val GlassFillStrong = Color(0x1FFFFFFF)  // rgba(255,255,255,0.12)
    val GlassStroke = Color(0x29FFFFFF)      // rgba(255,255,255,0.16)
    val GlassStrokeSoft = Color(0x14FFFFFF)
    val Specular = Color(0x0FFFFFFF)

    // Modals: an OPAQUE panel + heavy scrim so overlaid content stays readable
    // (translucent glass over the scrolling home was unreadable).
    val Panel = Color(0xFF161019)            // solid dark card for dialogs/sheets
    val PanelRaised = Color(0xFF1E1726)
    val Scrim = Color(0xF2070509)            // ~95% backdrop dim

    val Radius = 22.dp
    val RadiusSmall = 14.dp
    val RadiusLarge = 30.dp
    val BlurRadius = 24.dp
}
