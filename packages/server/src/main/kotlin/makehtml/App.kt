package makehtml

import io.javalin.Javalin
import io.javalin.apibuilder.ApiBuilder.*
import io.javalin.plugin.json.FromJsonMapper
import io.javalin.plugin.json.JavalinJson
import io.javalin.plugin.json.ToJsonMapper
import makehtml.api.Api
import makehtml.api.MediaController

fun main(args: Array<String>) {
    JavalinJson.fromJsonMapper = object: FromJsonMapper {
        override fun <T> map(json: String, targetClass: Class<T>) =
                Api.gson.fromJson(json, targetClass)
    }

    JavalinJson.toJsonMapper = object: ToJsonMapper {
        override fun map(obj: Any): String = Api.gson.toJson(obj)
    }

    val app = Javalin.create {
        it.enableDevLogging()

        if (Api.db.isJar) {
            it.addStaticFiles("/public")
        } else {
            it.enableCorsForAllOrigins()
        }
    }.start(System.getenv("PORT")?.toInt() ?: 24000)

    app.routes {
        path("api", Api.router)
        get("media/:name", MediaController::getOne)
    }

    if (!Api.db.isJar) {
        app.get("/") { ctx -> ctx.result("Ready") }
    }
}