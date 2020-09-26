package makehtml.api

import com.google.gson.Gson
import io.javalin.apibuilder.ApiBuilder.get
import io.javalin.apibuilder.ApiBuilder.path
import io.javalin.apibuilder.EndpointGroup
import makehtml.db.Db
import org.apache.http.client.methods.HttpGet
import org.apache.http.impl.client.HttpClients

object Api {
    val db = Db(System.getenv("DB") ?: "data.db")
    val gson = Gson()
    val httpClient = HttpClients.createDefault()!!

    val router = EndpointGroup {
        path("entry", EntryController.router)
        path("media", MediaController.router)

        get("scrape") { ctx ->
            ctx.result(httpClient.execute(
                    HttpGet(ctx.queryParam<String>("url").get())
            ).entity.content)
        }
    }
}