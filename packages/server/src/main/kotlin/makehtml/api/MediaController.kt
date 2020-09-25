package makehtml.api

import com.github.guepardoapps.kulid.ULID
import io.javalin.apibuilder.ApiBuilder.post
import io.javalin.apibuilder.EndpointGroup
import io.javalin.http.Context
import java.math.BigInteger
import java.security.MessageDigest
import javax.imageio.ImageIO

object MediaController {
    val router = EndpointGroup {
        post(this::upload)
    }

    fun getOne(ctx: Context) {
        val id = ctx.pathParam<String>("id").get()

        val data = Api.db.sql2o.open().createQuery("""
            SELECT `data`
            FROM `media`
            WHERE `id` = :id
        """.trimIndent())
                .addParameter("id", id)
                .executeScalar(ByteArray::class.java)

        ctx.status(200).result(data)
    }

    private fun upload(ctx: Context) {
        val data = ctx.uploadedFile("file")!!

        val b = data.content.readAllBytes()
        val bimg = ImageIO.read(data.content)
        val width = bimg.width
        val height = bimg.height
        val h = let {
            val digest = MessageDigest
                    .getInstance("sha256")
                    .digest(b)
            val hexString: StringBuilder = StringBuilder(BigInteger(1, digest)
                    .toString(16))
            while (hexString.length < 32) {
                hexString.insert(0, '0')
            }
            hexString.toString()
        }

        val id = Api.db.sql2o.open().let { connection ->
            connection.createQuery("""
                SELECT `id`
                FROM `media`
                WHERE
                    `width` = :width AND
                    `height` = :height AND
                    `h` = :h
            """.trimIndent())
                    .addParameter("width", width)
                    .addParameter("height", height)
                    .addParameter("h", h)
                    .executeScalar(String::class.java) ?: let {
                val id = ULID.random()

                connection.createQuery("""
                    INSERT INTO `media` (
                        `id`,
                        `name`, `data`,
                        `width`, `height`, `h`
                    ) VALUES (
                        :id,
                        :title, :tag, :markdown,
                        :html, :date, :data
                    )
                """.trimIndent())
                        .addParameter("id", id)
                        .addParameter("name", data.filename)
                        .addParameter("data", b)
                        .addParameter("width", width)
                        .addParameter("height", height)
                        .addParameter("h", h)
                        .executeUpdate()

                ctx.status(201)
                id
            }
        }

        ctx.json(mapOf(
                "id" to id
        ))
    }
}