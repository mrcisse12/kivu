package africa.kivu.ui.features

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.SwapHoriz
import androidx.compose.material3.*
import androidx.compose.runtime.*
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
import africa.kivu.ui.theme.KivuSecondary

@Composable
fun TranslateScreen() {
    var source by remember { mutableStateOf("🇫🇷 Français") }
    var target by remember { mutableStateOf("🇹🇿 Swahili") }
    var listening by remember { mutableStateOf(false) }

    Column(Modifier.fillMaxSize().padding(16.dp)) {
        Text("Traduire", fontSize = 26.sp, fontWeight = FontWeight.ExtraBold)
        Text("Même hors-ligne • Voix naturelle • <200ms", fontSize = 13.sp, color = Color.Gray)
        Spacer(Modifier.height(20.dp))

        // Language pills
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically) {
            LangPill(source, Modifier.weight(1f)) {}
            IconButton(onClick = { val tmp = source; source = target; target = tmp }) {
                Icon(Icons.Filled.SwapHoriz, contentDescription = "Inverser")
            }
            LangPill(target, Modifier.weight(1f)) {}
        }
        Spacer(Modifier.weight(1f))

        // Mic button — éclatant
        Box(Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
            Box(
                Modifier.size(156.dp).clip(CircleShape)
                    .background(Brush.radialGradient(listOf(KivuPrimary, KivuSecondary, KivuAccent)))
                    .clickable { listening = !listening },
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Filled.Mic, contentDescription = null,
                    tint = Color.White, modifier = Modifier.size(72.dp))
            }
        }
        Spacer(Modifier.height(16.dp))
        Text(
            if (listening) "🎙️ Écoute en cours…" else "Touchez pour parler",
            fontWeight = FontWeight.SemiBold,
            modifier = Modifier.align(Alignment.CenterHorizontally)
        )
        Spacer(Modifier.weight(1f))

        Card(Modifier.fillMaxWidth(), shape = RoundedCornerShape(16.dp)) {
            Column(Modifier.padding(14.dp)) {
                Text("Jambo, habari yako?", fontWeight = FontWeight.SemiBold)
                Text("Bonjour, comment vas-tu ?", color = Color.Gray, fontSize = 13.sp)
                Text("Swahili → Français • Offline", color = KivuSecondary, fontSize = 11.sp)
            }
        }
    }
}

@Composable
private fun LangPill(label: String, modifier: Modifier = Modifier, onClick: () -> Unit) {
    Surface(
        onClick = onClick,
        modifier = modifier.padding(horizontal = 4.dp),
        shape = RoundedCornerShape(999.dp),
        color = Color(0xFFF0F4F8)
    ) {
        Text(label, modifier = Modifier.padding(14.dp),
            fontWeight = FontWeight.SemiBold)
    }
}

@Composable
private fun Modifier.clickable(onClick: () -> Unit): Modifier = this.then(
    androidx.compose.foundation.clickable(
        enabled = true, onClickLabel = null, role = null, onClick = onClick
    )
)
