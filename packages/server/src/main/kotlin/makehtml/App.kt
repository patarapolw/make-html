package makehtml

import makehtml.api.Api

fun main() {
    val port = System.getenv("PORT")?.toInt() ?: 24000
    val app = Api.server()
    app.start(port)
}
