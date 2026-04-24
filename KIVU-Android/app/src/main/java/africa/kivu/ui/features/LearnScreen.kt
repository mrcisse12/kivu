package africa.kivu.ui.features

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import africa.kivu.ui.theme.KivuAccent
import africa.kivu.ui.theme.KivuPrimary

private data class Quest(val icon: String, val title: String, val lang: String, val xp: Int)

private val demoQuests = listOf(
    Quest("🛒", "Salutations au marché de Dakar", "Wolof", 100),
    Quest("🥭", "Négocier une mangue", "Bambara", 200),
    Quest("📖", "L'histoire du village", "Bissa (menacé)", 300),
    Quest("🎵", "Chanson du soleil", "Swahili", 150),
)

@Composable
fun LearnScreen() {
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp)) {
        // XP Ring card
        Box(
            Modifier.fillMaxWidth().clip(RoundedCornerShape(24.dp))
                .background(Brush.linearGradient(listOf(KivuPrimary, KivuAccent)))
                .padding(20.dp)
        ) {
            Column {
                Text("Progression", color = Color.White, fontSize = 13.sp)
                Text("2 450 XP", color = Color.White, fontSize = 32.sp, fontWeight = FontWeight.ExtraBold)
                Text("Niveau 5 · 550 XP vers niv. 6", color = Color.White.copy(alpha = 0.9f))
                Spacer(Modifier.height(8.dp))
                LinearProgressIndicator(
                    progress = { 0.82f },
                    color = Color.White,
                    trackColor = Color.White.copy(alpha = 0.25f),
                    modifier = Modifier.fillMaxWidth().height(6.dp).clip(RoundedCornerShape(999.dp))
                )
            }
        }
        Spacer(Modifier.height(20.dp))
        Text("Quêtes recommandées", fontWeight = FontWeight.Bold, fontSize = 18.sp)
        Spacer(Modifier.height(12.dp))
        demoQuests.forEach { QuestCard(it); Spacer(Modifier.height(10.dp)) }
    }
}

@Composable
private fun QuestCard(q: Quest) {
    Card(Modifier.fillMaxWidth(), shape = RoundedCornerShape(16.dp)) {
        Row(Modifier.padding(14.dp), verticalAlignment = androidx.compose.ui.Alignment.CenterVertically) {
            Box(
                Modifier.size(48.dp).clip(RoundedCornerShape(12.dp))
                    .background(KivuPrimary.copy(alpha = 0.12f)),
                contentAlignment = androidx.compose.ui.Alignment.Center
            ) { Text(q.icon, fontSize = 24.sp) }
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                Text(q.title, fontWeight = FontWeight.SemiBold)
                Text(q.lang, color = Color.Gray, fontSize = 12.sp)
            }
            Surface(color = KivuAccent.copy(alpha = 0.15f), shape = RoundedCornerShape(999.dp)) {
                Text("+${q.xp} XP", color = KivuAccent, fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp), fontSize = 12.sp)
            }
        }
    }
}
