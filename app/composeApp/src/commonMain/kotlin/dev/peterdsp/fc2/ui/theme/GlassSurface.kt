package dev.peterdsp.fc2.ui.theme

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

/**
 * The Liquid Glass panel — the design hook. Platform actuals decide HOW the
 * frosted material is produced:
 *  • iOS: `.ultraThinMaterial` / iOS 26 `glassEffect()` via SwiftUI interop.
 *  • Android: `RenderEffect` blur (API 31+) + Material-3 tint + gradient stroke.
 * Both pull radii / tints from [GlassTokens] so the look matches the web app.
 */
@Composable
expect fun GlassSurface(
    modifier: Modifier = Modifier,
    cornerRadius: Dp = GlassTokens.Radius,
    strong: Boolean = false,
    content: @Composable () -> Unit,
)

/**
 * A readable modal: an OPAQUE panel centered over a heavy scrim. Use this for
 * dialogs/sheets — translucent glass over scrolling content is unreadable.
 * Tapping the scrim dismisses; taps on the panel are swallowed.
 */
@Composable
fun ModalPanel(
    onDismiss: () -> Unit,
    modifier: Modifier = Modifier,
    cornerRadius: Dp = GlassTokens.RadiusLarge,
    content: @Composable () -> Unit,
) {
    val noRipple = remember { MutableInteractionSource() }
    Box(
        Modifier
            .fillMaxSize()
            .background(GlassTokens.Scrim)
            .clickable(interactionSource = noRipple, indication = null, onClick = onDismiss),
        contentAlignment = Alignment.Center,
    ) {
        val shape = RoundedCornerShape(cornerRadius)
        Box(
            modifier
                .clip(shape)
                .background(GlassTokens.Panel)
                .border(1.dp, GlassTokens.GlassStroke, shape)
                .clickable(interactionSource = noRipple, indication = null, onClick = {}),
        ) { content() }
    }
}

/** Convenience: a glass card with inner padding. */
@Composable
fun GlassCard(
    modifier: Modifier = Modifier,
    cornerRadius: Dp = GlassTokens.Radius,
    strong: Boolean = false,
    contentPadding: Dp = GlassTokens.RadiusSmall,
    content: @Composable () -> Unit,
) {
    GlassSurface(modifier = modifier, cornerRadius = cornerRadius, strong = strong) {
        Box(Modifier.padding(contentPadding)) { content() }
    }
}
