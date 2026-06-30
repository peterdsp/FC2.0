package dev.peterdsp.fc2.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Pause
import androidx.compose.material.icons.rounded.PlayArrow
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.peterdsp.fc2.Brand
import dev.peterdsp.fc2.audio.PlaybackKind
import dev.peterdsp.fc2.audio.PlaybackState
import dev.peterdsp.fc2.ui.theme.GlassTokens

/**
 * Persistent mini-player. Solid (opaque) panel so it stays readable above the
 * scrolling content; a single clear play/pause button and, for episodes, a thin
 * progress line along the bottom edge.
 */
@Composable
fun NowPlayingDock(
    state: PlaybackState,
    onToggle: () -> Unit,
    onSeek: (Long) -> Unit,
    modifier: Modifier = Modifier,
) {
    val isLive = state.kind == PlaybackKind.LIVE
    val accent = if (isLive) GlassTokens.Red else GlassTokens.Green
    val shape = RoundedCornerShape(20.dp)
    val noRipple = remember { MutableInteractionSource() }

    Column(
        modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp)
            .clip(shape)
            .background(GlassTokens.PanelRaised)
            .border(1.dp, GlassTokens.GlassStroke, shape),
    ) {
        Row(
            Modifier.fillMaxWidth().padding(horizontal = 10.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            // Big, unambiguous play/pause with its own hit area.
            Box(
                Modifier.size(46.dp).clip(CircleShape).background(accent)
                    .clickable(interactionSource = noRipple, indication = null, onClick = onToggle),
                contentAlignment = Alignment.Center,
            ) {
                Icon(
                    if (state.isPlaying) Icons.Rounded.Pause else Icons.Rounded.PlayArrow,
                    contentDescription = if (state.isPlaying) "Παύση" else "Αναπαραγωγή",
                    tint = Color.White,
                    modifier = Modifier.size(26.dp),
                )
            }
            Column(Modifier.weight(1f)) {
                Text(
                    if (isLive) Brand.LIVE_LABEL else (state.episode?.title ?: "Επεισόδιο"),
                    color = GlassTokens.Ink, fontSize = 14.5.sp, fontWeight = FontWeight.Bold, maxLines = 1,
                )
                Text(
                    if (isLive) Brand.LIVE_SUBTITLE else (state.episode?.category ?: ""),
                    color = GlassTokens.InkDim, fontSize = 12.sp, maxLines = 1,
                )
            }
            if (isLive) {
                Box(
                    Modifier.clip(RoundedCornerShape(50)).background(GlassTokens.Red.copy(alpha = 0.18f))
                        .padding(horizontal = 10.dp, vertical = 5.dp),
                ) { Text("LIVE", color = GlassTokens.Red, fontSize = 11.sp, fontWeight = FontWeight.Bold) }
            }
        }

        // Episode progress line (full-bleed, thin) — only when we have a duration.
        if (!isLive && state.durationMs > 0) {
            val frac = (state.positionMs.toFloat() / state.durationMs).coerceIn(0f, 1f)
            Box(Modifier.fillMaxWidth().height(3.dp).background(GlassTokens.GlassFill)) {
                Box(Modifier.fillMaxWidth(frac).height(3.dp).background(accent))
            }
        }
    }
}
