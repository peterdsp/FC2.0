package dev.peterdsp.fc2

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import dev.peterdsp.fc2.audio.PlaybackKind
import dev.peterdsp.fc2.model.QuizPack
import dev.peterdsp.fc2.ui.BottomNav
import dev.peterdsp.fc2.ui.FcViewModel
import dev.peterdsp.fc2.ui.HomeScreen
import dev.peterdsp.fc2.ui.InfoScreen
import dev.peterdsp.fc2.ui.LegacyScreen
import dev.peterdsp.fc2.ui.NowPlayingDock
import dev.peterdsp.fc2.ui.QuizFlow
import dev.peterdsp.fc2.ui.QuizScreen
import dev.peterdsp.fc2.ui.Tab
import dev.peterdsp.fc2.ui.TopBar
import dev.peterdsp.fc2.ui.theme.FcTheme
import dev.peterdsp.fc2.ui.theme.GlassTokens

/**
 * Root of the shared app: brand top bar, an animated tab pager, a floating glass
 * bottom nav, the persistent now-playing dock, and the quiz overlay.
 */
@Composable
fun App(deps: AppDependencies) {
    FcTheme {
        val vm: FcViewModel = viewModel { FcViewModel(deps) }
        val home by vm.home.collectAsState()
        val game by vm.gamification.collectAsState()
        val playback by vm.playback.collectAsState()

        var tab by remember { mutableStateOf(Tab.HOME) }
        var activePack by remember { mutableStateOf<QuizPack?>(null) }

        val openPack: (QuizPack) -> Unit = { vm.touchStreak(); activePack = it }
        val daily: () -> Unit = { home.quizzes.randomOrNull()?.let(openPack) }

        Box(
            Modifier.fillMaxSize().background(
                Brush.radialGradient(listOf(GlassTokens.Bg, GlassTokens.BgDeep)),
            )
        ) {
            // Top bar + scrolling tab content + pinned (dock → nav) bottom bar.
            // The content area is weighted so the dock/nav never overlap it.
            Column(Modifier.fillMaxSize().windowInsetsPadding(WindowInsets.safeDrawing)) {
                Spacer(Modifier.height(8.dp))
                TopBar(game)
                Spacer(Modifier.height(12.dp))

                AnimatedContent(
                    targetState = tab,
                    modifier = Modifier.weight(1f).fillMaxWidth(),
                    transitionSpec = {
                        val dir = if (targetState.ordinal > initialState.ordinal) 1 else -1
                        (slideInHorizontally(tween(280)) { it / 8 * dir } + fadeIn(tween(220))) togetherWith
                            (slideOutHorizontally(tween(280)) { -it / 8 * dir } + fadeOut(tween(160)))
                    },
                    label = "tab",
                ) { t ->
                    when (t) {
                        Tab.HOME -> HomeScreen(home, vm::toggleLive, vm::playEpisode, daily, game.dailyDone)
                        Tab.QUIZ -> QuizScreen(home, game, openPack, daily)
                        Tab.LEGACY -> LegacyScreen(home)
                        Tab.INFO -> InfoScreen()
                    }
                }

                if (playback.kind != PlaybackKind.NONE) {
                    NowPlayingDock(state = playback, onToggle = vm::togglePlay, onSeek = vm::seekTo)
                    Spacer(Modifier.height(8.dp))
                }
                BottomNav(selected = tab, onSelect = { tab = it })
                Spacer(Modifier.height(6.dp))
            }

            activePack?.let { pack ->
                QuizFlow(
                    pack = pack,
                    onFinish = { correct, xp ->
                        vm.recordQuiz(pack.id, correct, pack.questions.size, xp)
                        vm.markDailyDone()
                    },
                    onClose = { activePack = null },
                )
            }
        }
    }
}
