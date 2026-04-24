package africa.kivu

import android.app.Application

class KivuApp : Application() {
    override fun onCreate() {
        super.onCreate()
        // Initialisation : cache Room, client Ktor, TTS etc.
    }
}
