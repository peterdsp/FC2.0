package dev.peterdsp.fc2.ui

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil3.compose.AsyncImage
import dev.peterdsp.fc2.model.CURATED_STORIES
import dev.peterdsp.fc2.model.FcStory
import dev.peterdsp.fc2.ui.theme.GlassTokens

/**
 * Instagram-style horizontal stories strip. A "LIVE" bubble always leads;
 * verified historic FC YouTube clips follow with animated gradient rings.
 */
@Composable
fun StoriesStrip(
    onLive: () -> Unit,
    onOpenStory: (Int, List<FcStory>) -> Unit,
    modifier: Modifier = Modifier,
) {
    var seenIds by remember { mutableStateOf(emptySet<String>()) }

    LazyRow(
        modifier = modifier,
        horizontalArrangement = Arrangement.spacedBy(16.dp),
        contentPadding = PaddingValues(horizontal = 16.dp),
    ) {
        item { LiveBubble(onClick = onLive) }
        itemsIndexed(CURATED_STORIES) { index, story ->
            StoryBubble(
                story = story,
                seen = story.id in seenIds,
                onClick = {
                    seenIds = seenIds + story.id
                    onOpenStory(index, CURATED_STORIES)
                },
            )
        }
    }
}

/* ─── Live bubble ─────────────────────────────────────────────────────── */

@Composable
private fun LiveBubble(onClick: () -> Unit) {
    val pulse by rememberInfiniteTransition(label = "live").animateFloat(
        initialValue = 0.88f, targetValue = 1f,
        animationSpec = infiniteRepeatable(tween(850, easing = FastOutSlowInEasing), RepeatMode.Reverse),
        label = "pulse",
    )
    val interactionSource = remember { MutableInteractionSource() }
    val pressed by interactionSource.collectIsPressedAsState()
    val scale by animateFloatAsState(
        if (pressed) 0.92f else 1f,
        animationSpec = spring(Spring.DampingRatioMediumBouncy),
        label = "press",
    )

    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(5.dp),
        modifier = Modifier
            .scale(scale)
            .clickable(interactionSource = interactionSource, indication = null, onClick = onClick),
    ) {
        Box(Modifier.size(72.dp), contentAlignment = Alignment.Center) {
            // Pulsing red ring
            Box(
                Modifier
                    .fillMaxSize()
                    .scale(pulse)
                    .drawBehind {
                        drawCircle(
                            color = GlassTokens.Red,
                            style = Stroke(width = 3.dp.toPx()),
                        )
                    }
            )
            // Avatar circle
            Box(
                Modifier
                    .size(64.dp)
                    .clip(CircleShape)
                    .background(GlassTokens.BgDeep)
                    .border(1.5.dp, GlassTokens.GlassStroke, CircleShape),
                contentAlignment = Alignment.Center,
            ) { Text("📻", fontSize = 28.sp) }

            // LIVE badge
            Box(
                Modifier
                    .align(Alignment.BottomCenter)
                    .offset(y = 6.dp)
                    .clip(RoundedCornerShape(4.dp))
                    .background(GlassTokens.Red)
                    .padding(horizontal = 7.dp, vertical = 2.dp),
            ) {
                Text("LIVE", color = Color.White, fontSize = 9.sp, fontWeight = FontWeight.ExtraBold)
            }
        }
        Spacer(Modifier.height(4.dp))
        Text("Live Radio", color = GlassTokens.InkDim, fontSize = 11.sp, textAlign = TextAlign.Center)
    }
}

/* ─── Story bubble ────────────────────────────────────────────────────── */

@Composable
private fun StoryBubble(
    story: FcStory,
    seen: Boolean,
    onClick: () -> Unit,
) {
    val rotation by rememberInfiniteTransition(label = "ring-${story.id}").animateFloat(
        initialValue = 0f, targetValue = 360f,
        animationSpec = infiniteRepeatable(tween(2800, easing = LinearEasing)),
        label = "rot",
    )
    val interactionSource = remember { MutableInteractionSource() }
    val pressed by interactionSource.collectIsPressedAsState()
    val scale by animateFloatAsState(
        if (pressed) 0.90f else if (seen) 0.95f else 1f,
        animationSpec = spring(Spring.DampingRatioMediumBouncy),
        label = "press",
    )

    val ringColors = listOf(
        GlassTokens.Red, GlassTokens.Gold, GlassTokens.Green,
        GlassTokens.Green, GlassTokens.Gold, GlassTokens.Red,
    )

    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(5.dp),
        modifier = Modifier
            .scale(scale)
            .clickable(interactionSource = interactionSource, indication = null, onClick = onClick),
    ) {
        Box(Modifier.size(72.dp), contentAlignment = Alignment.Center) {
            // Animated gradient ring (dim when seen)
            Box(
                Modifier
                    .fillMaxSize()
                    .drawBehind {
                        if (!seen) {
                            rotate(rotation) {
                                drawCircle(
                                    brush = Brush.sweepGradient(ringColors),
                                    style = Stroke(width = 3.dp.toPx(), cap = StrokeCap.Round),
                                )
                            }
                        } else {
                            drawCircle(
                                color = GlassTokens.InkFaint,
                                style = Stroke(width = 2.dp.toPx()),
                            )
                        }
                    }
            )

            // YouTube thumbnail + emoji overlay
            Box(Modifier.size(64.dp).clip(CircleShape)) {
                AsyncImage(
                    model = story.thumbUrl,
                    contentDescription = story.label,
                    modifier = Modifier.fillMaxSize(),
                    contentScale = ContentScale.Crop,
                )
                Box(
                    Modifier
                        .fillMaxSize()
                        .background(Color.Black.copy(alpha = if (seen) 0.55f else 0.30f)),
                    contentAlignment = Alignment.Center,
                ) {
                    Text(story.emoji, fontSize = 24.sp)
                }
            }
        }
        Text(
            story.label,
            color = if (seen) GlassTokens.InkFaint else GlassTokens.Ink,
            fontSize = 10.sp,
            fontWeight = FontWeight.Medium,
            textAlign = TextAlign.Center,
            maxLines = 1,
        )
    }
}
