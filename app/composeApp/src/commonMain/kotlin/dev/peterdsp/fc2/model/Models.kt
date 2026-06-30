package dev.peterdsp.fc2.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

/**
 * Wire models. Field names mirror the JSON in `api/data` exactly so the same
 * backend feeds web, Android and iOS without per-platform mapping.
 */

@Serializable
data class Episode(
    val id: String,
    val title: String,
    val date: String? = null,
    val category: String? = null,
    val description: String? = null,
    val file: String? = null,
    val tags: List<String> = emptyList(),
    val plays: Int = 0,
    val duration: Int? = null,
    val image: String? = null,
    val year: String? = null,
    val mixcloud: String? = null,
    val youtube: String? = null,
)

@Serializable
data class QuizPack(
    val id: String,
    val name: String,
    val emoji: String = "🎯",
    val color: String = "#d4262e",
    val questions: List<Question> = emptyList(),
)

@Serializable
data class Question(
    val q: String,
    val a: List<String>,
    val correct: Int,
    val fact: String = "",
)

@Serializable
data class LegacySegment(
    val id: String,
    val name: String,
    val emoji: String = "📁",
    val type: String = "messages",
    val count: Int = 0,
    val entries: List<LegacyEntry> = emptyList(),
)

@Serializable
data class LegacyEntry(
    val term: String? = null,
    val def: String? = null,
    val text: String? = null,
)

@Serializable
data class NewsItem(
    val title: String,
    val url: String,
    val image: String? = null,
)

@Serializable
data class ScheduleSlot(
    val start: Int,
    val end: Int,
    val title: String,
    val flagship: Boolean = false,
)

@Serializable
data class NowOnAir(
    val title: String? = null,
    val flagship: Boolean = false,
    @SerialName("nextTitle") val nextTitle: String? = null,
)

@Serializable
data class ScheduleResponse(
    val schedule: List<ScheduleSlot> = emptyList(),
    val now: NowOnAir = NowOnAir(),
)
