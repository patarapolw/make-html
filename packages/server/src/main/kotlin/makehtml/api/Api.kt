package makehtml.api

import com.google.gson.Gson
import io.javalin.Javalin
import io.javalin.apibuilder.ApiBuilder.get
import io.javalin.apibuilder.ApiBuilder.path
import io.javalin.apibuilder.EndpointGroup
import io.javalin.plugin.json.FromJsonMapper
import io.javalin.plugin.json.JavalinJson
import io.javalin.plugin.json.ToJsonMapper
import makehtml.db.Db
import org.apache.http.impl.client.HttpClients

object Api {
    val db = Db(System.getenv("DB") ?: "data.db")
    val gson = Gson()
    val httpClient = HttpClients.createDefault()!!

    val router = EndpointGroup {
        path("entry", EntryController.router)
        path("media", MediaController.router)

        get("metadata", UtilController::metadata)
    }

    fun server(): Javalin {
        JavalinJson.fromJsonMapper = object: FromJsonMapper {
            override fun <T> map(json: String, targetClass: Class<T>) =
                    gson.fromJson(json, targetClass)
        }

        JavalinJson.toJsonMapper = object: ToJsonMapper {
            override fun map(obj: Any): String = gson.toJson(obj)
        }

        val app = Javalin.create {
            it.addStaticFiles("/public")

            if (!db.isJar) {
                it.enableCorsForAllOrigins()
            }

            if (System.getenv("DEBUG") == "1") {
                it.enableDevLogging()
            }
        }

        app.routes {
            path("api", router)
            get("media/:name", MediaController::getOne)
        }

        return app
    }
}