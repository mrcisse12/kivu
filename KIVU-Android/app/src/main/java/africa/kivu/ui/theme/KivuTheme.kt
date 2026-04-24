package africa.kivu.ui.theme

import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext

// Palette KIVU — inspirée du Lac Kivu, savane, soleil africain
val KivuPrimary = Color(0xFF174E9C)      // Bleu Lac Kivu
val KivuSecondary = Color(0xFF3395DA)    // Bleu ciel
val KivuAccent = Color(0xFFF2952D)       // Orange savane / soleil
val KivuTertiary = Color(0xFF2E8B57)     // Vert savane
val KivuEndangered = Color(0xFFD32F2F)   // Rouge langues menacées

private val LightColors = lightColorScheme(
    primary = KivuPrimary,
    onPrimary = Color.White,
    secondary = KivuSecondary,
    onSecondary = Color.White,
    tertiary = KivuTertiary,
    background = Color(0xFFF7F9FC),
    surface = Color.White,
    surfaceVariant = Color(0xFFF0F4F8),
    error = KivuEndangered
)

private val DarkColors = darkColorScheme(
    primary = KivuSecondary,
    onPrimary = Color.White,
    secondary = KivuAccent,
    onSecondary = Color.Black,
    tertiary = KivuTertiary,
    background = Color(0xFF0B2447),
    surface = Color(0xFF152B5C),
    error = KivuEndangered
)

@Composable
fun KivuTheme(
    useDarkTheme: Boolean = isSystemInDarkTheme(),
    dynamicColor: Boolean = false,
    content: @Composable () -> Unit
) {
    val colors = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val ctx = LocalContext.current
            if (useDarkTheme) dynamicDarkColorScheme(ctx) else dynamicLightColorScheme(ctx)
        }
        useDarkTheme -> DarkColors
        else -> LightColors
    }
    MaterialTheme(colorScheme = colors, content = content)
}
