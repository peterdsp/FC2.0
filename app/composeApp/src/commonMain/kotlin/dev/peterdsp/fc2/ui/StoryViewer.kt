package dev.peterdsp.fc2.ui

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Close
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.peterdsp.fc2.Brand
import dev.peterdsp.fc2.model.FcStory
import dev.peterdsp.fc2.platform.YoutubePlayer

/**
 * Full-screen Instagram-style story viewer.
 * Tap left/right half to navigate; top-right ✕ to close.
 * Progress segments at the top show current position.
 */
@Composable
fun StoryViewer(
    stories: List<FcStory>,
    startIndex: Int = 0,
    onDismiss: () -> Unit,
) {
    var index by remember { mutableIntStateOf(startIndex.coerceIn(0, stories.lastIndex)) }
    val story = stories[index]

    Box(Modifier.fillMaxSize().background(Color.Black)) {
        // YouTube player fills the whole screen
        AnimatedContent(
            targetState = story,
            modifier = Modifier.fillMaxSize(),
            transitionSpec = {
                val dir = if (targetState.id > initialState.id) 1 else -1
                (slideInHorizontally(tween(220)) { it / 5 * dir } + fadeIn(tween(160))) togetherWith
                    (slideOutHorizontally(tween(220)) { -it / 5 * dir } + fadeOut(tween(120)))
            },
            label = "story-transition",
        ) { s ->
            YoutubePlayer(videoId = s.youtubeId, modifier = Modifier.fillMaxSize())
        }

        // Tap zones — left half = prev, right half = next (placed above player, below chrome)
        Row(
            Modifier
                .fillMaxSize()
                .statusBarsPadding()
                .padding(top = 80.dp),
        ) {
            val noRipple = remember { MutableInteractionSource() }
            Box(
                Modifier
                    .weight(1f)
                    .fillMaxHeight()
                    .clickable(interactionSource = noRipple, indication = null) {
                        if (index > 0) index-- else onDismiss()
                    }
            )
            Box(
                Modifier
                    .weight(1f)
                    .fillMaxHeight()
                    .clickable(interactionSource = remember { MutableInteractionSource() }, indication = null) {
                        if (index < stories.lastIndex) index++ else onDismiss()
                    }
            )
        }

        // Chrome overlay: progress + title + close — always on top
        Column(
            Modifier
                .fillMaxWidth()
                .align(Alignment.TopStart)
                .background(
                    androidx.compose.ui.graphics.Brush.verticalGradient(
                        listOf(Color.Black.copy(alpha = 0.65f), Color.Transparent)
                    )
                )
                .statusBarsPadding()
                .padding(horizontal = 14.dp, vertical = 10.dp),
        ) {
            // Segment progress bar
            Row(
                Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(3.dp),
            ) {
                stories.forEachIndexed { i, _ ->
                    Box(
                        Modifier
                            .weight(1f)
                            .height(3.dp)
                            .clip(RoundedCornerShape(2.dp))
                            .background(
                                when {
                                    i < index -> Color.White
                                    i == index -> Color.White.copy(alpha = 0.9f)
                                    else -> Color.White.copy(alpha = 0.35f)
                                }
                            )
                    )
                }
            }

            Spacer(Modifier.height(12.dp))

            Row(
                Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                    Text(
                        Brand.NAME,
                        color = Color.White,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.ExtraBold,
                    )
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(4.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Text(story.emoji, fontSize = 12.sp)
                        Text(
                            story.label,
                            color = Color.White.copy(0.85f),
                            fontSize = 12.sp,
                        )
                        Text(
                            "· ${index + 1}/${stories.size}",
                            color = Color.White.copy(0.5f),
                            fontSize = 11.sp,
                        )
                    }
                }

                // Close button
                Box(
                    Modifier
                        .size(36.dp)
                        .clip(CircleShape)
                        .background(Color.White.copy(alpha = 0.18f))
                        .clickable(onClick = onDismiss),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(
                        Icons.Rounded.Close,
                        contentDescription = "Close",
                        tint = Color.White,
                        modifier = Modifier.size(18.dp),
                    )
                }
            }
        }

        // Hint arrows for first view — appear briefly then fade
        Row(
            Modifier
                .fillMaxWidth()
                .align(Alignment.CenterStart)
                .padding(horizontal = 20.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            if (index > 0) {
                Text("‹", color = Color.White.copy(0.35f), fontSize = 32.sp, fontWeight = FontWeight.Thin)
            } else {
                Spacer(Modifier.width(1.dp))
            }
            if (index < stories.lastIndex) {
                Text("›", color = Color.White.copy(0.35f), fontSize = 32.sp, fontWeight = FontWeight.Thin)
            }
        }
    }
}
