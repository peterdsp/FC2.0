package dev.peterdsp.fc2.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.peterdsp.fc2.model.QuizPack
import dev.peterdsp.fc2.ui.theme.GlassTokens
import kotlinx.coroutines.delay

private const val QUESTION_SECONDS = 15

/**
 * Timed quiz player. Scoring mirrors `web/js/quiz.js`: 10 XP per correct answer
 * plus a speed bonus up to 10 (faster = more), 15s per question.
 *
 * Each question is driven by ONE coroutine keyed on [index] — it is the sole
 * owner of advancement, so a question advances exactly once whether it was
 * answered or timed out (no cross-effect races / double-steps).
 */
@Composable
fun QuizFlow(
    pack: QuizPack,
    onFinish: (correct: Int, xp: Int) -> Unit,
    onClose: () -> Unit,
) {
    var index by remember { mutableIntStateOf(0) }
    var correctCount by remember { mutableIntStateOf(0) }
    var xp by remember { mutableIntStateOf(0) }
    var timeLeft by remember { mutableIntStateOf(QUESTION_SECONDS) }
    var answered by remember { mutableStateOf(false) }
    var revealed by remember { mutableStateOf(false) }
    var picked by remember { mutableIntStateOf(-1) }
    var finished by remember { mutableStateOf(false) }

    val total = pack.questions.size

    // The whole lifecycle of one question. Cancelled + restarted when index
    // changes; this is the only place that advances or finishes the quiz.
    LaunchedEffect(index) {
        answered = false
        revealed = false
        picked = -1
        timeLeft = QUESTION_SECONDS
        while (timeLeft > 0 && !answered) {
            delay(1000)
            if (!answered) timeLeft -= 1
        }
        revealed = true          // lock + show the fact (answer OR timeout)
        delay(1600)
        if (index + 1 < total) index += 1 else finished = true
    }

    // Opaque panel over a heavy scrim so the question is fully readable (the
    // old translucent glass let the scrolling home bleed through). Tapping
    // outside does nothing mid-quiz.
    Box(
        Modifier.fillMaxSize().background(GlassTokens.Scrim).clickable(enabled = false) {},
        contentAlignment = Alignment.Center,
    ) {
        Column(
            Modifier
                .fillMaxWidth()
                .padding(20.dp)
                .clip(RoundedCornerShape(GlassTokens.RadiusLarge))
                .background(GlassTokens.Panel)
                .border(1.dp, GlassTokens.GlassStroke, RoundedCornerShape(GlassTokens.RadiusLarge))
                .padding(22.dp),
        ) {
            if (finished) {
                LaunchedEffect(Unit) { onFinish(correctCount, xp) }
                Result(pack, correctCount, total, xp, onRetry = {
                    correctCount = 0; xp = 0; index = 0; finished = false
                }, onDone = onClose)
                return@Column
            }

            val q = pack.questions[index]
            Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    Text("${pack.emoji} ${pack.name} · ${index + 1}/$total", color = GlassTokens.InkDim, fontSize = 13.sp)
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        Text("${timeLeft}s", color = GlassTokens.Gold, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                        Text("✕", color = GlassTokens.InkDim, fontSize = 16.sp, modifier = Modifier.clickable(onClick = onClose))
                    }
                }
                Text(q.q, color = GlassTokens.Ink, fontSize = 20.sp, fontWeight = FontWeight.Bold)

                q.a.forEachIndexed { i, ans ->
                    val bg = when {
                        !revealed -> GlassTokens.GlassFill
                        i == q.correct -> GlassTokens.GreenDeep
                        i == picked -> GlassTokens.Red
                        else -> GlassTokens.GlassFill
                    }
                    Box(
                        Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(bg)
                            .clickable(enabled = !answered && !revealed) {
                                answered = true
                                picked = i
                                if (i == q.correct) {
                                    correctCount += 1
                                    xp += 10 + ((timeLeft.toFloat() / QUESTION_SECONDS) * 10).toInt()
                                }
                            }
                            .padding(14.dp),
                    ) { Text(ans, color = GlassTokens.Ink, fontSize = 15.sp) }
                }

                if (revealed) {
                    Text("💡 ${q.fact}", color = GlassTokens.InkDim, fontSize = 13.sp)
                }
            }
        }
    }
}

@Composable
private fun Result(pack: QuizPack, correct: Int, total: Int, xp: Int, onRetry: () -> Unit, onDone: () -> Unit) {
    val perfect = correct == total
    val emoji = if (perfect) "🏆" else if (correct >= total / 2) "🔥" else "💪"
    val headline = if (perfect) "ΤΕΛΕΙΟ! Γκόντζος Energy!"
        else if (correct >= total / 2) "Δυνατά! Συνέχισε έτσι." else "Καλή αρχή, ξαναπροσπάθησε!"
    Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text(emoji, fontSize = 54.sp)
        Text(headline, color = GlassTokens.Ink, fontSize = 20.sp, fontWeight = FontWeight.Bold)
        Text("$correct/$total σωστά", color = GlassTokens.InkDim, fontSize = 15.sp)
        Text("+$xp XP", color = GlassTokens.Gold, fontSize = 22.sp, fontWeight = FontWeight.ExtraBold)
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            Button(onClick = onRetry, colors = ButtonDefaults.buttonColors(containerColor = GlassTokens.Red)) {
                Text("Ξανά", color = GlassTokens.Ink, fontWeight = FontWeight.Bold)
            }
            Button(onClick = onDone, colors = ButtonDefaults.buttonColors(containerColor = GlassTokens.GlassFillStrong)) {
                Text("Τέλος", color = GlassTokens.Ink, fontWeight = FontWeight.Bold)
            }
        }
    }
}
