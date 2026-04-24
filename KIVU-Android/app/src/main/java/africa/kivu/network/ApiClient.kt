package africa.kivu.network

import io.ktor.client.HttpClient
import io.ktor.client.engine.okhttp.OkHttp
import io.ktor.client.plugins.DefaultRequest
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.plugins.logging.LogLevel
import io.ktor.client.plugins.logging.Logging
import io.ktor.client.request.header
import io.ktor.http.ContentType
import io.ktor.http.contentType
import io.ktor.serialization.kotlinx.json.json
import kotlinx.serialization.json.Json

object ApiClient {
    // URL unique commutable : Node.js (4000), Python (5000), prod (Render)
    var baseUrl: String = "http://10.0.2.2:5000/api/v1"   // 10.0.2.2 = localhost depuis l'émulateur
    var bearerToken: String? = null

    val http: HttpClient = HttpClient(OkHttp) {
        install(ContentNegotiation) {
            json(Json {
                ignoreUnknownKeys = true
                isLenient = true
            })
        }
        install(Logging) { level = LogLevel.INFO }
        install(DefaultRequest) {
            contentType(ContentType.Application.Json)
            bearerToken?.let { header("Authorization", "Bearer $it") }
        }
    }
}
