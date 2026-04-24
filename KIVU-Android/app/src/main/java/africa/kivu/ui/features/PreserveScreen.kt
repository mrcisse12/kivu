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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import africa.kivu.ui.theme.KivuEndangered

@Composable
fun PreserveScreen() {
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp)) {
        Text("Préservation culturelle", fontSize = 26.sp, fontWeight = FontWeight.ExtraBold)
        Text("Sauvez les langues avant qu'il ne soit trop tard.", color = Color.Gray)
        Spacer(Modifier.height(16.dp))

        Card(
            colors = CardDefaults.cardColors(containerColor = KivuEndangered.copy(alpha = 0.08f)),
            shape = RoundedCornerShape(20.dp)
        ) {
            Column(Modifier.padding(16.dp)) {
                Text("🚨 Langues en danger", color = KivuEndangered, fontWeight = FontWeight.Bold)
                listOf(
                    Triple("Bissa", "🇧🇫", "50k locuteurs"),
                    Triple("Kru", "🇱🇷", "30k locuteurs"),
                    Triple("Dangme", "🇬🇭", "20k locuteurs")
                ).forEach { (name, flag, cnt) ->
                    Spacer(Modifier.height(8.dp))
                    Row(verticalAlignment = androidx.compose.ui.Alignment.CenterVertically) {
                        Text(flag, fontSize = 22.sp)
                        Spacer(Modifier.width(10.dp))
                        Column(Modifier.weight(1f)) {
                            Text(name, fontWeight = FontWeight.SemiBold)
                            Text(cnt, color = Color.Gray, fontSize = 12.sp)
                        }
                        FilledTonalButton(onClick = {}) { Text("Contribuer") }
                    }
                }
            }
        }
        Spacer(Modifier.height(16.dp))
        Button(onClick = {}, modifier = Modifier.fillMaxWidth().height(56.dp),
            shape = RoundedCornerShape(16.dp)) {
            Text("🎙️ Enregistrer un conte", fontSize = 16.sp, fontWeight = FontWeight.Bold)
        }
    }
}
