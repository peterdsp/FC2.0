package dev.peterdsp.fc2.platform

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier

/** Embeds a YouTube video inline. Platform actuals use WebView (Android) / WKWebView (iOS). */
@Composable
expect fun YoutubePlayer(videoId: String, modifier: Modifier = Modifier)
