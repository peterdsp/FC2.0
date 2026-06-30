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
 * iOS Liquid Glass panel. This Compose actual paints the translucent fill +
 * specular wash + hairline stroke from [GlassTokens]; the genuine
 * `.ultraThinMaterial` / iOS 26 `glassEffect()` refraction is layered by the
 * SwiftUI host (iosApp) behind the Compose canvas via a `UIVisualEffectView`,
 * so the chrome reads as real frosted glass on device.
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
