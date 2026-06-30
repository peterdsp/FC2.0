package dev.peterdsp.fc2.data

import dev.peterdsp.fc2.model.Episode
import dev.peterdsp.fc2.model.LegacySegment
import dev.peterdsp.fc2.model.NewsItem
import dev.peterdsp.fc2.model.QuizPack
import dev.peterdsp.fc2.model.ScheduleResponse
import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.request.get
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.client.statement.HttpResponse
import io.ktor.http.ContentType
import io.ktor.http.contentType
import io.ktor.http.isSuccess
import io.ktor.serialization.kotlinx.json.json
import kotlinx.serialization.json.Json

/**
 * fc-api client. One source of truth for episodes, quizzes, legacy, news and
 * the live message wall — the same endpoints the web `js` modules call.
 *
 *   BASE = https://fc-api.peterdsp.dev
 *   /episodes /quizzes /legacy /news /schedule  (reads)
 *   /messages (read + post)  /onair-message (post → live24)
 *   /stream/:id /download/:id (audio, handled by the AudioPlayer)
 */
class FcApi(
    private val baseUrl: String = DEFAULT_BASE,
    engineClient: HttpClient = defaultClient(),
) {
    private val client = engineClient

    suspend fun episodes(): List<Episode> = getOrEmpty("$baseUrl/episodes")
    suspend fun quizzes(): List<QuizPack> = getOrEmpty("$baseUrl/quizzes")
    suspend fun legacy(): List<LegacySegment> = getOrEmpty("$baseUrl/legacy")
    suspend fun news(): List<NewsItem> = getOrEmpty("$baseUrl/news")

    suspend fun schedule(): ScheduleResponse? = runCatchingNull {
        client.get("$baseUrl/schedule").body()
    }

    /** Streamed audio URL for an episode (range-served by fc-api). */
    fun streamUrl(id: String): String = "$baseUrl/stream/$id"
    fun downloadUrl(id: String): String = "$baseUrl/download/$id"

    /** Send an on-air shout straight to the show via the live24 relay. */
    suspend fun sendOnAir(name: String, text: String): Boolean = runCatching {
        val res: HttpResponse = client.post("$baseUrl/onair-message") {
            contentType(ContentType.Application.Json)
            setBody(MessageBody(name, text))
        }
        res.status.isSuccess()
    }.getOrDefault(false)

    private suspend inline fun <reified T> getOrEmpty(url: String): List<T> =
        runCatching { client.get(url).body<List<T>>() }.getOrDefault(emptyList())

    private inline fun <T> runCatchingNull(block: () -> T): T? =
        runCatching(block).getOrNull()

    companion object {
        const val DEFAULT_BASE = "https://fc-api.peterdsp.dev"
        const val LIVE_STREAM = "https://sportfm.live24.gr/sportfm7712"

        val json = Json {
            ignoreUnknownKeys = true
            isLenient = true
            explicitNulls = false
        }

        fun defaultClient(): HttpClient = HttpClient {
            install(ContentNegotiation) { json(json) }
        }
    }
}

@kotlinx.serialization.Serializable
private data class MessageBody(val name: String, val text: String)
