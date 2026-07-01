package dev.peterdsp.fc2.platform

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.UIKitView
import kotlinx.cinterop.ExperimentalForeignApi
import kotlinx.cinterop.cValue
import platform.CoreGraphics.CGRect
import platform.WebKit.WKWebView
import platform.WebKit.WKWebViewConfiguration

@OptIn(ExperimentalForeignApi::class)
@Composable
actual fun YoutubePlayer(videoId: String, modifier: Modifier) {
    UIKitView(
        factory = {
            val config = WKWebViewConfiguration().apply {
                allowsInlineMediaPlayback = true
                // WKAudiovisualMediaTypeNone = 0 — no user gesture needed to autoplay
                mediaTypesRequiringUserActionForPlayback = 0UL
            }
            WKWebView(frame = cValue<CGRect>(), configuration = config).also { wv ->
                wv.loadHTMLString(youtubeHtml(videoId), baseURL = null)
            }
        },
        modifier = modifier,
    )
}

private fun youtubeHtml(id: String) = """
    <!DOCTYPE html><html><head>
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <style>*{margin:0;padding:0}body{background:#000}
    iframe{width:100vw;height:100vh;border:0}</style></head>
    <body><iframe src="https://www.youtube.com/embed/$id?autoplay=1&playsinline=1"
    allow="autoplay;encrypted-media" allowfullscreen></iframe></body></html>
""".trimIndent()
