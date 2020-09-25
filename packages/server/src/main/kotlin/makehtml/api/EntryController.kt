package makehtml.api

import com.github.guepardoapps.kulid.ULID
import io.javalin.apibuilder.ApiBuilder.*
import io.javalin.apibuilder.EndpointGroup
import io.javalin.http.Context

object EntryController {
    val router = EndpointGroup {
        get(this::getOne)
        put(this::create)
        patch(this::updateOne)
        patch("title", this::updateTitle)
        delete(this::deleteOne)
    }

    private fun getOne(ctx: Context) {
        val id = ctx.queryParam<String>("id").get()
        val markdown = Api.db.sql2o.open().createQuery("""
            SELECT `markdown`
            FROM `entry`
            WHERE `id` = :id
        """.trimIndent())
                .addParameter("id", id)
                .executeScalar(String::class.java)

        ctx.json(mapOf(
                "markdown" to markdown
        ))
    }

    private data class CreateReq (
            val title: String,
            val markdown: String,
            val html: String,
            val date: String?,
            val tag: List<String>?,
            val data: Map<String, Any>?,
            val media: List<String>?
    )

    private fun create(ctx: Context) {
        val body = ctx.bodyValidator(CreateReq::class.java).get()
        val id = ULID.random()

        Api.db.sql2o.beginTransaction().let { connection ->
            connection.createQuery("""
                INSERT INTO `entry` (
                    `id`,
                    `title`, `tag`, `markdown`,
                    `html`, `date`, `data`
                ) VALUES (
                    :id,
                    :title, :tag, :markdown,
                    :html, :date, :data
                )
            """.trimIndent())
                    .addParameter("id", id)
                    .addParameter("title", body.title)
                    .addParameter("tag", (body.tag ?: listOf()).joinToString(" "))
                    .addParameter("markdown", body.markdown)
                    .addParameter("html", body.html)
                    .addParameter("date", body.date)
                    .addParameter("data", Api.gson.toJson(body.data ?: mapOf<String, Any>()))
                    .executeUpdate()

            val newMedia = body.media ?: listOf()
            newMedia.map {
                connection.createQuery("""
                    INSERT INTO `entry_media` (
                        `entry_id`, `media_id`
                    ) VALUES (:entryId, :mediaId)
                """.trimIndent())
                        .addParameter("entryId", id)
                        .addParameter("mediaId", it)
                        .executeUpdate()
            }
        }

        ctx.status(201).json(mapOf(
                "id" to id
        ))
    }

    private data class UpdateReq (
            val markdown: String,
            val html: String,
            val date: String?,
            val tag: List<String>?,
            val data: Map<String, Any>?,
            val media: List<String>?
    )

    private fun updateOne(ctx: Context) {
        val body = ctx.bodyValidator(UpdateReq::class.java).get()
        val id = ctx.queryParam<String>("id").get()

        Api.db.sql2o.beginTransaction().let { connection ->
            connection.createQuery("""
                UPDATE `entry`
                SET
                    `markdown`  = :markdown,
                    `html`      = :html,
                    `date`      = :date,
                    `tag`       = :tag,
                    `data`      = :data
                WHERE `id` = :id
            """.trimIndent())
                    .addParameter("id", id)
                    .addParameter("tag", (body.tag ?: listOf()).joinToString(" "))
                    .addParameter("markdown", body.markdown)
                    .addParameter("html", body.html)
                    .addParameter("date", body.date)
                    .addParameter("data", Api.gson.toJson(body.data ?: mapOf<String, Any>()))
                    .executeUpdate()

            val prevMedia = connection.createQuery("""
                    SELECT `media_id`
                    FROM `entry_media`
                    WHERE `entry_id` = :entryId
                """.trimIndent())
                    .addParameter("entryId", id)
                    .executeScalarList(String::class.java)

            val media = body.media ?: listOf()
            val obsoleteMedia = prevMedia.filter { !media.contains(it) }
            val newMedia = media.filter { !prevMedia.contains(it) }

            if (obsoleteMedia.isNotEmpty()) {
                var q = connection.createQuery("""
                    DELETE FROM `entry_media`
                    WHERE
                        `entry_id` = :entryId AND
                        `media_id` IN (${obsoleteMedia.map { ":$it" }.joinToString(",")})
                """.trimIndent())
                        .addParameter("entryId", id)
                obsoleteMedia.forEach { q = q.addParameter(":$it", it) }
                q.executeUpdate()
            }

            newMedia.map {
                connection.createQuery("""
                    INSERT INTO `entry_media` (
                        `entry_id`, `media_id`
                    ) VALUES (:entryId, :mediaId)
                """.trimIndent())
                        .addParameter("entryId", id)
                        .addParameter("mediaId", it)
                        .executeUpdate()
            }
        }

        ctx.status(201).result("Updated")
    }

    private data class UpdateTitleReq(
            val title: String
    )

    private fun updateTitle(ctx: Context) {
        val body = ctx.bodyValidator(UpdateTitleReq::class.java).get()
        val id = ctx.queryParam<String>("id").get()

        Api.db.sql2o.open().createQuery("""
            UPDATE `entry`
            SET
                `title` = :title
            WHERE `id` = :id
        """.trimIndent())
                .addParameter("id", id)
                .addParameter("title", body.title)
                .executeUpdate()

        ctx.status(201).result("Updated")
    }

    private fun deleteOne(ctx: Context) {
        val id = ctx.queryParam<String>("id").get()

        Api.db.sql2o.open().createQuery("""
            DELETE FROM `entry`
            WHERE `id` = :id
        """.trimIndent())
                .addParameter("id", id)
                .executeUpdate()

        ctx.status(201).result("Deleted")
    }
}