package africa.kivu.ui

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import africa.kivu.ui.features.*
import africa.kivu.ui.theme.KivuTheme

sealed class KivuRoute(val route: String, val label: String, val icon: @Composable () -> Unit) {
    data object Home        : KivuRoute("home",      "Accueil",  { IconFor(Icons.Filled.Home) })
    data object Translate   : KivuRoute("translate", "Traduire", { IconFor(Icons.Filled.Translate) })
    data object Learn       : KivuRoute("learn",     "Apprendre",{ IconFor(Icons.Filled.School) })
    data object Preserve    : KivuRoute("preserve",  "Préserver",{ IconFor(Icons.Filled.LibraryBooks) })
    data object Profile     : KivuRoute("profile",   "Profil",   { IconFor(Icons.Filled.Person) })
}

@Composable
private fun IconFor(icon: androidx.compose.ui.graphics.vector.ImageVector) {
    androidx.compose.material3.Icon(icon, contentDescription = null)
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun KivuApp() {
    KivuTheme {
        val navController = rememberNavController()
        val tabs = listOf(
            KivuRoute.Home, KivuRoute.Translate, KivuRoute.Learn,
            KivuRoute.Preserve, KivuRoute.Profile
        )
        val backStack by navController.currentBackStackEntryAsState()
        val currentRoute = backStack?.destination?.route ?: KivuRoute.Home.route

        Scaffold(
            bottomBar = {
                NavigationBar {
                    tabs.forEach { tab ->
                        NavigationBarItem(
                            selected = currentRoute == tab.route,
                            onClick = {
                                navController.navigate(tab.route) {
                                    popUpTo(navController.graph.startDestinationId) { saveState = true }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            },
                            icon = tab.icon,
                            label = { Text(tab.label) }
                        )
                    }
                }
            }
        ) { padding ->
            NavHost(
                navController = navController,
                startDestination = KivuRoute.Home.route,
                modifier = Modifier.padding(padding)
            ) {
                composable(KivuRoute.Home.route)      { HomeScreen() }
                composable(KivuRoute.Translate.route) { TranslateScreen() }
                composable(KivuRoute.Learn.route)     { LearnScreen() }
                composable(KivuRoute.Preserve.route)  { PreserveScreen() }
                composable(KivuRoute.Profile.route)   { ProfileScreen() }
            }
        }
    }
}
