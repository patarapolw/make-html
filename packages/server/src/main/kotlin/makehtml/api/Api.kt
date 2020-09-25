package makehtml.api

import com.google.gson.Gson
import io.javalin.apibuilder.ApiBuilder.get
import io.javalin.apibuilder.ApiBuilder.path
import io.javalin.apibuilder.EndpointGroup
import makehtml.db.Db
import java.net.URL

object Api {
    val db = Db(System.getenv("DB") ?: "data.db")
    val gson = Gson()

    val router = EndpointGroup {
        path("entry", EntryController.router)
        path("media", MediaController.router)

        get("scrape") { ctx ->
            val url = URL(ctx.queryParam<String>("url").get())
            ctx.result(url.content as String)
        }
    }
}