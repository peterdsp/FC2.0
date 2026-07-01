package dev.peterdsp.fc2.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.peterdsp.fc2.About
import dev.peterdsp.fc2.Brand
import dev.peterdsp.fc2.model.Episode
import dev.peterdsp.fc2.model.FcStory
import dev.peterdsp.fc2.model.LegacySegment
import dev.peterdsp.fc2.model.NewsItem
import dev.peterdsp.fc2.model.QuizPack
import dev.peterdsp.fc2.store.GamificationView
import dev.peterdsp.fc2.ui.theme.GlassCard
import dev.peterdsp.fc2.ui.theme.GlassSurface
import dev.peterdsp.fc2.ui.theme.GlassTokens
import dev.peterdsp.fc2.ui.theme.ModalPanel

@Composable
private fun Modifier.tabScroll() = this
    .fillMaxSize()
    .verticalScroll(rememberScrollState())
    .padding(horizontal = 16.dp)
    .padding(top = 8.dp, bottom = 20.dp)

/* ============================ Top bar (brand + HUD) ============================ */

@Composable
fun TopBar(game: GamificationView, modifier: Modifier = Modifier) {
    GlassSurface(modifier.fillMaxWidth().padding(horizontal = 16.dp), strong = true) {
        Row(
            Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column {
                Text(Brand.NAME, color = GlassTokens.Ink, fontSize = 20.sp, fontWeight = FontWeight.ExtraBold)
                Text(Brand.TAGLINE, color = GlassTokens.InkDim, fontSize = 10.5.sp, maxLines = 1)
            }
            Row(horizontalArrangement = Arrangement.spacedBy(7.dp), verticalAlignment = Alignment.CenterVertically) {
                Pill("🔥 ${game.streak}")
                Pill("★ ${game.xp}", GlassTokens.Gold)
                Pill("Lv ${game.level}", GlassTokens.Green)
            }
        }
    }
}

/* ================================ HOME tab ================================ */

@Composable
fun HomeScreen(
    home: HomeState,
    onLiveToggle: () -> Unit,
    onPlayEpisode: (Episode) -> Unit,
    onDaily: () -> Unit,
    dailyDone: Boolean,
    onOpenStory: (Int, List<FcStory>) -> Unit = { _, _ -> },
) {
    Column(Modifier.tabScroll(), verticalArrangement = Arrangement.spacedBy(20.dp)) {
        LiveBar(home.nowOnAir.title, onLiveToggle)

        // Instagram-style stories strip
        StoriesStrip(
            onLive = onLiveToggle,
            onOpenStory = onOpenStory,
            modifier = Modifier.fillMaxWidth(),
        )

        Hero(onDaily, dailyDone)

        SectionHead("Πρόσφατα Επεισόδια", GlassTokens.Red)
        if (home.episodes.isEmpty()) {
            EmptyHint(if (home.loading) "Φόρτωση αρχείου…" else "Το αρχείο θα εμφανιστεί εδώ.")
        } else {
            LazyRow(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                items(home.episodes.take(14)) { ep -> EpisodeCard(ep, onPlayEpisode) }
            }
        }

        if (home.news.isNotEmpty()) {
            SectionHead("Άρθρα & Νέα", GlassTokens.Red)
            LazyRow(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                items(home.news.take(16)) { n -> NewsCard(n) }
            }
        }
        Spacer(Modifier.height(4.dp))
    }
}

/* ================================ QUIZ tab ================================ */

@Composable
fun QuizScreen(
    home: HomeState,
    game: GamificationView,
    onOpenPack: (QuizPack) -> Unit,
    onDaily: () -> Unit,
) {
    Column(Modifier.tabScroll(), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        SectionHead("Quiz, πόσο FC είσαι;", GlassTokens.Green)
        StatStrip(game)
        Button(
            onClick = onDaily,
            modifier = Modifier.fillMaxWidth(),
            colors = ButtonDefaults.buttonColors(containerColor = if (game.dailyDone) GlassTokens.GreenDeep else GlassTokens.Green),
        ) {
            Text(
                if (game.dailyDone) "✅ Daily ολοκληρώθηκε σήμερα" else "🎯 Daily Challenge",
                color = GlassTokens.Ink, fontWeight = FontWeight.Bold,
            )
        }
        if (home.quizzes.isEmpty()) EmptyHint("Φόρτωση quiz…")
        else home.quizzes.forEach { pack -> QuizPackCard(pack, game) { onOpenPack(pack) } }
        Spacer(Modifier.height(4.dp))
    }
}

@Composable
private fun StatStrip(game: GamificationView) {
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        StatCard("${game.xp}", "XP", GlassTokens.Gold, Modifier.weight(1f))
        StatCard("Lv ${game.level}", game.title, GlassTokens.Green, Modifier.weight(1f))
        StatCard("🔥 ${game.streak}", "σερί", GlassTokens.Red, Modifier.weight(1f))
    }
}

@Composable
private fun StatCard(value: String, label: String, accent: Color, modifier: Modifier) {
    GlassCard(modifier) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(value, color = accent, fontSize = 20.sp, fontWeight = FontWeight.ExtraBold, maxLines = 1)
            Text(label, color = GlassTokens.InkDim, fontSize = 11.sp, maxLines = 1)
        }
    }
}

/* =============================== LEGACY tab =============================== */

@Composable
fun LegacyScreen(home: HomeState) {
    var openSeg by remember { mutableStateOf<LegacySegment?>(null) }
    Column(Modifier.tabScroll(), verticalArrangement = Arrangement.spacedBy(14.dp)) {
        if (home.legacy.isNotEmpty()) {
            SectionHead("FC Legacy", GlassTokens.Gold)
            home.legacy.forEach { seg -> LegacyTile(seg) { openSeg = seg } }
        }
        SectionHead("25 χρόνια ιστορίας", GlassTokens.Gold)
        HISTORY.forEach { h -> HistoryCard(h) }
        Spacer(Modifier.height(4.dp))
    }
    openSeg?.let { LegacyOverlay(it) { openSeg = null } }
}

/* ================================ INFO tab ================================ */

@Composable
fun InfoScreen() {
    Column(Modifier.tabScroll(), verticalArrangement = Arrangement.spacedBy(14.dp)) {
        SectionHead(About.TITLE, GlassTokens.RedBright)
        Text(About.LEAD, color = GlassTokens.Gold, fontSize = 14.sp, fontWeight = FontWeight.Bold)
        About.PARAGRAPHS.forEach { p ->
            GlassCard(Modifier.fillMaxWidth()) {
                Text(p, color = GlassTokens.Ink, fontSize = 14.sp, lineHeight = 20.sp)
            }
        }
        SectionHead("Οι παραγωγοί", GlassTokens.Green)
        About.HOSTS.forEach { h -> HostCard(h) }
        Text(
            "Ανεπίσημο fan project. Όλο το περιεχόμενο ανήκει στους δημιουργούς της εκπομπής.",
            color = GlassTokens.InkFaint, fontSize = 12.sp, modifier = Modifier.padding(top = 6.dp),
        )
        Spacer(Modifier.height(4.dp))
    }
}

@Composable
private fun HostCard(h: About.Host) {
    GlassCard(Modifier.fillMaxWidth()) {
        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Row(verticalAlignment = Alignment.Bottom, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(h.name, color = GlassTokens.Ink, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                Text(h.role, color = GlassTokens.Gold, fontSize = 12.sp)
            }
            Text(h.bio, color = GlassTokens.InkDim, fontSize = 13.5.sp, lineHeight = 19.sp)
        }
    }
}

/* ============================ shared components ============================ */

@Composable
private fun LiveBar(nowTitle: String?, onToggle: () -> Unit) {
    GlassSurface(Modifier.fillMaxWidth(), strong = true) {
        Row(
            Modifier.fillMaxWidth().padding(14.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            RoundIcon("▶", GlassTokens.Red, onToggle)
            Column(Modifier.weight(1f)) {
                Text(Brand.LIVE_LABEL, color = GlassTokens.Red, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                Text(nowTitle ?: Brand.NAME, color = GlassTokens.Ink, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                Text(Brand.LIVE_SUBTITLE, color = GlassTokens.InkDim, fontSize = 12.sp)
            }
        }
    }
}

@Composable
private fun Hero(onDaily: () -> Unit, dailyDone: Boolean) {
    GlassCard(Modifier.fillMaxWidth()) {
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text(Brand.SINCE + " · REMASTERED", color = GlassTokens.Gold, fontSize = 11.sp, fontWeight = FontWeight.Bold)
            Text(Brand.HERO, color = GlassTokens.Ink, fontSize = 30.sp, fontWeight = FontWeight.ExtraBold)
            Text(Brand.TAGLINE, color = GlassTokens.InkDim, fontSize = 15.sp)
            Button(
                onClick = onDaily,
                colors = ButtonDefaults.buttonColors(containerColor = if (dailyDone) GlassTokens.GreenDeep else GlassTokens.Ink),
            ) {
                Text(
                    if (dailyDone) "✅ Ολοκληρώθηκε σήμερα" else "Daily Challenge",
                    color = if (dailyDone) GlassTokens.Ink else GlassTokens.Bg,
                    fontWeight = FontWeight.Bold,
                )
            }
        }
    }
}

@Composable
private fun EpisodeCard(ep: Episode, onPlay: (Episode) -> Unit) {
    GlassCard(Modifier.width(240.dp).clickable { onPlay(ep) }) {
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(ep.category ?: Brand.NAME, color = GlassTokens.Red, fontSize = 11.sp, fontWeight = FontWeight.Bold)
            Text(ep.title, color = GlassTokens.Ink, fontSize = 16.sp, fontWeight = FontWeight.Bold, maxLines = 2)
            Text(ep.description ?: "", color = GlassTokens.InkDim, fontSize = 13.sp, maxLines = 2)
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Text(ep.date ?: "", color = GlassTokens.InkFaint, fontSize = 12.sp)
                RoundIcon("▶", GlassTokens.Green) { onPlay(ep) }
            }
        }
    }
}

@Composable
private fun QuizPackCard(pack: QuizPack, game: GamificationView, onOpen: () -> Unit) {
    GlassCard(Modifier.fillMaxWidth().clickable(onClick = onOpen)) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(14.dp)) {
            Text(pack.emoji, fontSize = 26.sp)
            Column(Modifier.weight(1f)) {
                Text(pack.name, color = GlassTokens.Ink, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                Text(
                    "${pack.questions.size} ερωτήσεις · best ${game.bestScores[pack.id] ?: 0}%",
                    color = GlassTokens.InkDim, fontSize = 12.sp,
                )
            }
            Text("▶", color = GlassTokens.Green, fontSize = 18.sp)
        }
    }
}

@Composable
private fun NewsCard(n: NewsItem) {
    GlassCard(Modifier.width(220.dp)) {
        Text(n.title, color = GlassTokens.Ink, fontSize = 14.sp, fontWeight = FontWeight.Medium, maxLines = 3)
    }
}

@Composable
private fun LegacyTile(seg: LegacySegment, onClick: () -> Unit) {
    GlassCard(Modifier.fillMaxWidth().clickable(onClick = onClick)) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(14.dp)) {
            Text(seg.emoji, fontSize = 24.sp)
            Text(seg.name, color = GlassTokens.Ink, fontSize = 15.sp, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
            if (seg.count > 0) Text("${seg.count}", color = GlassTokens.Gold, fontSize = 13.sp, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
private fun HistoryCard(h: HistoryEntry) {
    GlassCard(Modifier.fillMaxWidth()) {
        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text(h.year, color = GlassTokens.Gold, fontSize = 13.sp, fontWeight = FontWeight.Bold)
            Text(h.text, color = GlassTokens.Ink, fontSize = 14.sp, lineHeight = 20.sp)
        }
    }
}

@Composable
private fun LegacyOverlay(seg: LegacySegment, onClose: () -> Unit) {
    ModalPanel(onDismiss = onClose, modifier = Modifier.fillMaxWidth().padding(16.dp)) {
        Column(Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Text("${seg.emoji} ${seg.name}", color = GlassTokens.Ink, fontSize = 18.sp, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
                Text("✕", color = GlassTokens.InkDim, fontSize = 18.sp, modifier = Modifier.clickable(onClick = onClose))
            }
            LazyColumn(
                Modifier.fillMaxWidth().height(420.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                items(seg.entries) { e ->
                    Column(
                        Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(GlassTokens.PanelRaised).padding(13.dp),
                        verticalArrangement = Arrangement.spacedBy(4.dp),
                    ) {
                        if (e.term != null) Text(e.term, color = GlassTokens.Gold, fontSize = 15.sp, fontWeight = FontWeight.Bold)
                        Text(e.def ?: e.text ?: "", color = GlassTokens.Ink, fontSize = 14.sp, lineHeight = 20.sp)
                    }
                }
            }
        }
    }
}

@Composable
private fun SectionHead(title: String, accent: Color) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Text(title, color = GlassTokens.Ink, fontSize = 20.sp, fontWeight = FontWeight.ExtraBold)
        Spacer(Modifier.width(8.dp))
        Spacer(Modifier.size(6.dp).clip(CircleShape).background(accent))
    }
}

@Composable
private fun Pill(text: String, color: Color = GlassTokens.Ink) {
    Box(
        Modifier.clip(RoundedCornerShape(50)).background(GlassTokens.GlassFillStrong).padding(horizontal = 10.dp, vertical = 6.dp),
    ) { Text(text, color = color, fontSize = 12.sp, fontWeight = FontWeight.Bold) }
}

@Composable
private fun RoundIcon(symbol: String, tint: Color, onClick: () -> Unit) {
    Box(
        Modifier.size(44.dp).clip(CircleShape).background(GlassTokens.GlassFillStrong).clickable(onClick = onClick),
        contentAlignment = Alignment.Center,
    ) { Text(symbol, color = tint, fontSize = 18.sp) }
}

@Composable
private fun EmptyHint(text: String) {
    GlassCard(Modifier.fillMaxWidth()) { Text(text, color = GlassTokens.InkDim, fontSize = 14.sp) }
}
