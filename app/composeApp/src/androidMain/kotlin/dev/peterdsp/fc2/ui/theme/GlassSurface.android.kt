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
 * Android liquid-glass panel: translucent fill + top specular wash + diagonal
 * bevel border (top-left bright, bottom-right dim) matching the Figma design:
 *   inset 1px 1px 2px rgba(255,255,255,0.5)   — top-left highlight
 *   inset -1px -1px 1px rgba(255,255,255,0.25) — bottom-right softer edge
 *
 * For true backdrop blur, add `Modifier.hazeChild` from the haze library or
 * `RenderEffect.createBlurEffect` (API 31+) — tints already match [GlassTokens].
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
