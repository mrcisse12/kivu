package africa.kivu.ui.features

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import africa.kivu.ui.theme.KivuAccent
import africa.kivu.ui.theme.KivuPrimary

@Composable
fun ProfileScreen() {
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp)) {
        Box(
            Modifier.fillMaxWidth().clip(RoundedCornerShape(24.dp))
                .background(Brush.linearGradient(listOf(KivuPrimary, KivuAccent)))
                .padding(24.dp),
            contentAlignment = Alignment.Center
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Box(
                    Modifier.size(96.dp).clip(CircleShape).background(Color.White),
                    contentAlignment = Alignment.Center
                ) { Text("🌍", fontSize = 54.sp) }
                Spacer(Modifier.height(10.dp))
                Text("Koneribaut", color = Color.White, fontSize = 22.sp, fontWeight = FontWeight.ExtraBold)
                Text("🇨🇮 Côte d'Ivoire • Polyglotte KIVU", color = Color.White)
            }
        }
        Spacer(Modifier.height(16.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            StatBox("🔥 12", "jours")
            StatBox("⭐ 2 450", "XP")
            StatBox("🏅 8", "badges")
        }
        Spacer(Modifier.height(16.dp))
        listOf(
            "🔔 Notifications", "🔐 Confidentialité", "♿ Accessibilité",
            "🌐 Langue de l'app", "💾 Stockage & hors-ligne", "ℹ️ À propos de KIVU"
        ).forEach {
            Card(Modifier.fillMaxWidth().padding(vertical = 4.dp), shape = RoundedCornerShape(14.dp)) {
                Text(it, modifier = Modifier.padding(16.dp), fontWeight = FontWeight.Medium)
            }
        }
    }
}

@Composable
private fun RowScope.StatBox(value: String, label: String) {
    Card(Modifier.weight(1f), shape = RoundedCornerShape(14.dp)) {
        Column(Modifier.padding(12.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Text(value, fontWeight = FontWeight.Bold)
            Text(label, color = Color.Gray, fontSize = 12.sp)
        }
    }
}
