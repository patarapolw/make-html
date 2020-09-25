package makehtml

import io.javalin.Javalin
import io.javalin.apibuilder.ApiBuilder.*
import makehtml.api.Api
import makehtml.api.MediaController

fun main(args: Array<String>) {
    val app = Javalin.create {
        if (Api.db.isJar) {
            it.addStaticFiles("/public")
        } else {
            it.enableCorsForAllOrigins()
        }
    }.start(System.getenv("PORT")?.toInt() ?: 24000)

    app.routes {
        path("api", Api.router)
        get("media/:id.png", MediaController::getOne)
    }

    if (!Api.db.isJar) {
        app.get("/") { ctx -> ctx.result("Ready") }
    }
}
