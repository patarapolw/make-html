package makehtml.api

import com.github.guepardoapps.kulid.ULID
import io.javalin.apibuilder.ApiBuilder.post
import io.javalin.apibuilder.EndpointGroup
import io.javalin.http.Context
import io.javalin.http.UploadedFile
import org.apache.http.client.methods.HttpGet
import java.awt.image.BufferedImage
import java.io.ByteArrayOutputStream
import java.math.BigInteger
import java.security.MessageDigest
import javax.imageio.ImageIO

object MediaController {
    val router = EndpointGroup {
        post("upload", this::upload)
        post("cache", this::cache)
    }

    fun getOne(ctx: Context) {
        val name = ctx.pathParam<String>("name").get()
        val id = name.split('.').first()

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
        ctx.status(201).json(mapOf(
                "id" to parseImg(
                        ImageIO.read(data.content),
                        data.filename
                )
        ))
    }

    data class CacheAttr(
            val maxWidth: Int? = null
    )

    private fun cache(ctx: Context) {
        val url = ctx.queryParam<String>("url").get()
        val attr = ctx.bodyValidator(CacheAttr::class.java).getOrNull()

        ctx.status(201).json(mapOf(
                "id" to parseImg(url, attr)
        ))
    }

    fun parseImg(file: UploadedFile): String {
        return parseImg(
                ImageIO.read(file.content),
                file.filename
        )
    }

    fun parseImg(
            url: String,
            attr: CacheAttr? = null
    ): String {
        var bImg = ImageIO.read(Api.httpClient.execute(
                HttpGet(url)
        ).entity.content)

        attr?.maxWidth?.let { maxWidth ->
            if (maxWidth < bImg.width) {
                val targetHeight = bImg.height * maxWidth / bImg.width
                val resizedImg = BufferedImage(maxWidth, targetHeight,
                        BufferedImage.TYPE_INT_ARGB)
                val graphics2D = resizedImg.createGraphics()
                graphics2D.drawImage(bImg,
                        0, 0, maxWidth, targetHeight, null)
                graphics2D.dispose()

                bImg = resizedImg
            }
        }

        return parseImg(bImg, url)
    }

    fun parseImg(bImg: BufferedImage, url: String): String {
        val filename = url
                .split('?').first()
                .split('/').last()

        val width = bImg.width
        val height = bImg.height

        val stream = ByteArrayOutputStream()
        ImageIO.write(bImg, "png", stream)
        val b = stream.toByteArray()

        val h = let {
            val digest = MessageDigest
                    .getInstance("SHA-256")
                    .digest(b)
            val hexString: StringBuilder = StringBuilder(BigInteger(1, digest)
                    .toString(16))
            while (hexString.length < 32) {
                hexString.insert(0, '0')
            }
            hexString.toString()
        }

        return Api.db.sql2o.open().let { connection ->
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
                        :name, :data,
                        :width, :height, :h
                    )
                """.trimIndent())
                        .addParameter("id", id)
                        .addParameter("name", filename)
                        .addParameter("data", b)
                        .addParameter("width", width)
                        .addParameter("height", height)
                        .addParameter("h", h)
                        .executeUpdate()
                id
            }
        }
    }
}