package dev.peterdsp.fc2.model

/** A curated "story" clip — a verified FC YouTube moment that appears in the stories strip. */
data class FcStory(
    val id: String,
    val label: String,
    val emoji: String,
    val youtubeId: String,
) {
    val thumbUrl get() = "https://img.youtube.com/vi/$youtubeId/hqdefault.jpg"
}

/** Hand-verified FC YouTube episodes — IDs match archive-extra.cjs on the API. */
val CURATED_STORIES = listOf(
    FcStory("s-2001", "Η Πρεμιέρα", "🎙", "GZuhKN0IQ54"),
    FcStory("s-2007", "Αφιέρωμα '07", "🎖", "i8p5kmgCJf4"),
    FcStory("s-2013", "Τελευταία…", "😢", "Pmy2-Wruh8w"),
    FcStory("s-2016r", "Reunion", "🤝", "p8P8KYbDqFo"),
    FcStory("s-2016p", "Πρεμιέρα '16", "🔥", "J9UOt5oT8hg"),
)
