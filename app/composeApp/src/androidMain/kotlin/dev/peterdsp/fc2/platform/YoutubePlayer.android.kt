package dev.peterdsp.fc2.platform

import android.annotation.SuppressLint
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView

@SuppressLint("SetJavaScriptEnabled")
@Composable
actual fun YoutubePlayer(videoId: String, modifier: Modifier) {
    AndroidView(
        factory = { ctx ->
            WebView(ctx).apply {
                settings.javaScriptEnabled = true
                settings.mediaPlaybackRequiresUserGesture = false
                settings.domStorageEnabled = true
                webViewClient = WebViewClient()
                loadData(youtubeHtml(videoId), "text/html", "UTF-8")
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
