package africa.kivu.ui.features

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
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
import africa.kivu.ui.theme.KivuSecondary

private data class Feature(val icon: String, val title: String, val tag: String, val color: Color)

private val features = listOf(
    Feature("🎙️", "Traduction temps réel", "Offline", KivuPrimary),
    Feature("🎮", "Apprentissage gamifié", "Gratuit", Color(0xFF8B5CF6)),
    Feature("🛡️", "Préservation culturelle", "2B+ sauvés", Color(0xFF2E8B57)),
    Feature("💼", "Business & commerce", "B2B", KivuAccent),
    Feature("🤝", "Multi-parties", "Temps réel", Color(0xFF06B6D4)),
    Feature("📚", "AI Tutor", "Personnel", Color(0xFFEC4899)),
    Feature("💙", "Diaspora", "Familles", Color(0xFF40B3BF)),
    Feature("♿", "Accessibilité", "100%", Color(0xFF99734D)),
)

@Composable
fun HomeScreen() {
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp)) {
        // Hero
        Box(
            Modifier.fillMaxWidth()
                .clip(RoundedCornerShape(24.dp))
                .background(Brush.linearGradient(listOf(KivuPrimary, KivuSecondary, KivuAccent)))
                .padding(24.dp)
        ) {
            Column {
                Text("🌍 KIVU", color = Color.White, fontSize = 32.sp, fontWeight = FontWeight.ExtraBold)
                Spacer(Modifier.height(4.dp))
                Text(
                    "Unir l'Afrique par la langue.\n2000+ langues, 7 milliards de personnes.",
                    color = Color.White, fontSize = 14.sp
                )
                Spacer(Modifier.height(16.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Stat("🔥", "12", "jours")
                    Stat("⭐", "2 450", "XP")
                    Stat("🏅", "8", "badges")
                }
            }
        }
        Spacer(Modifier.height(20.dp))

        Text("Les 8 fonctionnalités révolutionnaires",
            fontWeight = FontWeight.Bold, fontSize = 18.sp)
        Spacer(Modifier.height(12.dp))

        LazyVerticalGrid(
            columns = GridCells.Fixed(2),
            modifier = Modifier.fillMaxWidth().heightIn(max = 600.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            items(features) { FeatureTile(it) }
        }
    }
}

@Composable
private fun Stat(icon: String, value: String, label: String) {
    Column(Modifier.clip(RoundedCornerShape(14.dp))
        .background(Color.White.copy(alpha = 0.18f)).padding(horizontal = 12.dp, vertical = 8.dp)) {
        Text("$icon $value", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 13.sp)
        Text(label, color = Color.White.copy(alpha = 0.9f), fontSize = 11.sp)
    }
}

@Composable
private fun FeatureTile(f: Feature) {
    Card(
        colors = CardDefaults.cardColors(containerColor = Color.White),
        shape = RoundedCornerShape(20.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        modifier = Modifier.fillMaxWidth().height(138.dp)
    ) {
        Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Box(
                Modifier.size(42.dp).clip(RoundedCornerShape(12.dp))
                    .background(f.color.copy(alpha = 0.15f)),
                contentAlignment = androidx.compose.ui.Alignment.Center
            ) { Text(f.icon, fontSize = 22.sp) }
            Text(f.title, fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
            Surface(color = f.color.copy(alpha = 0.12f), shape = RoundedCornerShape(999.dp)) {
                Text(f.tag, color = f.color, fontSize = 10.sp, fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp))
            }
        }
    }
}
