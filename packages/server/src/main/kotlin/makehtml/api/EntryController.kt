package makehtml.api

import com.github.guepardoapps.kulid.ULID
import io.javalin.apibuilder.ApiBuilder.*
import io.javalin.apibuilder.EndpointGroup
import io.javalin.http.Context
import org.sql2o.Sql2oException
import java.sql.Connection

object EntryController {
    val router = EndpointGroup {
        get(this::getOne)
        get("q", this::query)
        put(this::create)
        patch(this::updateOne)
        patch("title", this::updateTitle)
        delete(this::deleteOne)
    }

    private data class GetResult(
            val title: String,
            val markdown: String
    )

    private fun getOne(ctx: Context) {
        val id = ctx.queryParam<String>("id").get()
        val result = Api.db.sql2o.open().createQuery("""
            SELECT `title`, `markdown`
            FROM `entry`
            WHERE `id` = :id
        """.trimIndent())
                .addParameter("id", id)
                .executeAndFetchFirst(GetResult::class.java)

        ctx.json(result ?: mapOf<String, Any>())
    }

    private data class QueryEntry(
            val id: String,
            val title: String
    )

    private fun query(ctx: Context) {
        val q = ctx.queryParam<String>("q").getOrNull() ?: ""
        val after = ctx.queryParam<String>("after").getOrNull()
        val limit = ctx.queryParam<Int>("limit").getOrNull() ?: 20

        var sql = Api.db.sql2o.open().createQuery("""
            SELECT `id`, `title`
            FROM `entry`
            WHERE
                ${after?.let { "`id` < :after AND" } ?: ""}
                ${if (q.isNotBlank()) { "`entry` MATCH :q AND" } else ""}
                TRUE
            ORDER BY `id` DESC
            LIMIT $limit
        """.trimIndent())

        var countSql = Api.db.sql2o.open().createQuery("""
            SELECT COUNT(*) FROM `entry`
            WHERE
                ${if (q.isNotBlank()) { "`entry` MATCH :q AND" } else ""}
                TRUE
        """.trimIndent())

        after?.let {
            sql = sql.addParameter("after", after)
        }

        if (q.isNotBlank()) {
            sql = sql.addParameter("q", q)
            countSql = countSql.addParameter("q", q)
        }

        try {
            ctx.json(mapOf(
                    "result" to sql.executeAndFetch(QueryEntry::class.java),
                    "count" to countSql.executeScalar(Int::class.java)
            ))
            return
        } catch (e: Sql2oException) {}

        ctx.json(mapOf(
                "result" to listOf<Any>(),
                "count" to 0
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

        Api.db.sql2o.beginTransaction(Connection.TRANSACTION_SERIALIZABLE)
                .let { connection ->
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
                    connection.commit()
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

        Api.db.sql2o.beginTransaction(Connection.TRANSACTION_SERIALIZABLE)
                .let { connection ->
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
                        `media_id` IN (${obsoleteMedia
                        .mapIndexed { i, _ -> ":m$i" }
                        .joinToString(",")})
                """.trimIndent())
                        .addParameter("entryId", id)
                obsoleteMedia.forEachIndexed { i, el ->
                    q = q.addParameter(":m$i", el)
                }
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

                    connection.commit()
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