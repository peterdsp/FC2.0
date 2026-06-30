package dev.peterdsp.fc2.ui

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.AutoStories
import androidx.compose.material.icons.rounded.Bolt
import androidx.compose.material.icons.rounded.Info
import androidx.compose.material.icons.rounded.Radio
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.peterdsp.fc2.ui.theme.GlassSurface
import dev.peterdsp.fc2.ui.theme.GlassTokens

enum class Tab(val label: String, val icon: ImageVector, val accent: androidx.compose.ui.graphics.Color) {
    HOME("Αρχική", Icons.Rounded.Radio, GlassTokens.Red),
    QUIZ("Quiz", Icons.Rounded.Bolt, GlassTokens.Green),
    LEGACY("Legacy", Icons.Rounded.AutoStories, GlassTokens.Gold),
    INFO("Info", Icons.Rounded.Info, GlassTokens.RedBright),
}

/**
 * Floating glass bottom navigation. On iOS the [GlassSurface] actual reads as
 * real Liquid Glass; on Android it's the frosted Material equivalent. The
 * selected item animates a colored pill + an icon "lift" with a spring.
 */
@Composable
fun BottomNav(selected: Tab, onSelect: (Tab) -> Unit, modifier: Modifier = Modifier) {
    GlassSurface(
        modifier = modifier.fillMaxWidth().padding(horizontal = 16.dp),
        cornerRadius = 28.dp,
        strong = true,
    ) {
        Row(
            Modifier.fillMaxWidth().padding(horizontal = 8.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Tab.entries.forEach { tab -> NavItem(tab, tab == selected) { onSelect(tab) } }
        }
    }
}

@Composable
private fun NavItem(tab: Tab, active: Boolean, onClick: () -> Unit) {
    val noRipple = remember { MutableInteractionSource() }
    val lift by animateFloatAsState(
        targetValue = if (active) 1f else 0f,
        animationSpec = spring(dampingRatio = Spring.DampingRatioMediumBouncy, stiffness = Spring.StiffnessLow),
        label = "lift",
    )
    val tint by animateColorAsState(
        if (active) tab.accent else GlassTokens.InkFaint, label = "tint",
    )
    Column(
        Modifier
            .clip(RoundedCornerShape(20.dp))
            .clickable(interactionSource = noRipple, indication = null, onClick = onClick)
            .padding(horizontal = 14.dp, vertical = 6.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(3.dp),
    ) {
        Box(contentAlignment = Alignment.Center) {
            // pill glow behind the active icon
            Box(
                Modifier
                    .size(width = 46.dp, height = 30.dp)
                    .clip(RoundedCornerShape(50))
                    .background(tab.accent.copy(alpha = 0.18f * lift)),
            )
            Icon(
                tab.icon,
                contentDescription = tab.label,
                tint = tint,
                modifier = Modifier.size(24.dp).scale(1f + 0.12f * lift),
            )
        }
        Text(
            tab.label,
            color = tint,
            fontSize = 11.sp,
            fontWeight = if (active) FontWeight.Bold else FontWeight.Medium,
        )
    }
}
