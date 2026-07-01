package dev.peterdsp.fc2.ui.theme

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

/**
 * iOS Liquid Glass panel.
 *
 * The three-layer stack that produces the signature look seen in the Figma:
 *   1. Translucent fill (very low opacity white)
 *   2. Top-specular wash (vertical gradient, bright → transparent)
 *   3. Bevel border: top-left bright (0.50 α) → middle fade → bottom-right dim (0.25 α)
 *      — mirrors the CSS `inset 1px 1px 2px rgba(255,255,255,0.5),
 *                          inset -1px -1px 1px rgba(255,255,255,0.25)` from the Figma.
 *
 * The genuine `.ultraThinMaterial` refraction is layered by the SwiftUI host
 * (iosApp) behind the Compose canvas via a `UIVisualEffectView`.
 */
@Composable
actual fun GlassSurface(
    modifier: Modifier,
    cornerRadius: Dp,
    strong: Boolean,
    content: @Composable () -> Unit,
) {
    val shape = RoundedCornerShape(cornerRadius)
    val fill = if (strong) GlassTokens.GlassFillStrong else GlassTokens.GlassFill
    // Diagonal bevel: top-left bright → bottom-right dim (matches Figma inset shadow)
    val bevelBrush = Brush.linearGradient(
        0f to Color.White.copy(alpha = 0.50f),
        0.40f to Color.White.copy(alpha = 0.14f),
        1f to Color.White.copy(alpha = 0.25f),
        start = androidx.compose.ui.geometry.Offset(0f, 0f),
        end = androidx.compose.ui.geometry.Offset(1000f, 1000f),
    )
    Box(
        modifier
            .clip(shape)
            .background(fill)
            .background(Brush.verticalGradient(listOf(GlassTokens.Specular, Color.Transparent)))
            .border(1.dp, bevelBrush, shape)
    ) { content() }
}
