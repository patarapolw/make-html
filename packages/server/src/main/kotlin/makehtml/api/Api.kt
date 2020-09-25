package makehtml.api

import com.google.gson.Gson
import io.javalin.apibuilder.ApiBuilder
import io.javalin.apibuilder.EndpointGroup
import makehtml.db.Db

object Api {
    val db = Db(System.getenv("DB") ?: "data.db")
    val gson = Gson()

    val router = EndpointGroup {
    }
}