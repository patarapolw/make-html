package makehtml

import java.net.URI
import kotlin.test.Test

class AppTest {
    @Test fun testAppHasAGreeting() {
        val uri = URI("https://google.com/hello/no")
        println(uri.resolve("/goodbye").toString())
        println(uri.resolve("ok").toString())
        println(uri.resolve("https://yahoo.com").toString())
        println(uri.toString())
    }
}
