package makehtml

import io.javalin.Javalin
import io.javalin.apibuilder.ApiBuilder
import makehtml.api.Api

fun main(args: Array<String>) {
    val app = Javalin.create {
        if (Api.db.isJar) {
            it.addStaticFiles("/public")
        } else {
            it.enableCorsForAllOrigins()
        }
    }.start(System.getenv("PORT")?.toInt() ?: 8080)

    app.routes {
        ApiBuilder.path("api", Api.router)
    }

    if (!Api.db.isJar) {
        app.get("/") { ctx -> ctx.result("Ready") }
    }
}
