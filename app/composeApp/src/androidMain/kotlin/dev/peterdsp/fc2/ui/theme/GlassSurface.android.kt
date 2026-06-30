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
 * Android "equivalent of Liquid Glass": a translucent Material tint, a soft
 * gradient stroke and a top specular wash on a rounded panel. For a true
 * backdrop blur, drop in the `haze` library (`Modifier.hazeChild`) or
 * `RenderEffect.createBlurEffect` (API 31+) — the shape/tints already match
 * [GlassTokens] so only the blur source changes.
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
    Box(
        modifier
            .clip(shape)
            .background(fill)
            .background(Brush.verticalGradient(listOf(GlassTokens.Specular, Color.Transparent)))
            .border(1.dp, GlassTokens.GlassStroke, shape)
    ) { content() }
}
