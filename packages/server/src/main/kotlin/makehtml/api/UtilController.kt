package makehtml.api

import com.github.salomonbrys.kotson.fromJson
import io.javalin.http.Context
import org.jsoup.Jsoup
import java.net.URI

object UtilController {
    private data class FetchMetadata(
            val mediaId: String,
            val meta: String
    )

    private data class MetadataResult(
            var mediaId: String? = null,
            val title: String?,
            val description: String?,
            val image: String?
    )

    fun metadata(ctx: Context) {
        val uri = URI(ctx.queryParam<String>("url").get())
        val url = uri.toString()

        val fm = Api.db.sql2o.open().createQuery("""
            SELECT
                `media_id` AS `mediaId`, `meta`
            FROM `metadata`
            WHERE `url` = :url
        """.trimIndent())
                .addParameter("url", url)
                .executeAndFetchFirst(FetchMetadata::class.java)

        if (fm != null) {
            val metadata = Api.gson.fromJson<MetadataResult>(fm.meta)
            metadata.mediaId = fm.mediaId

            ctx.json(metadata)
            return
        }

        val doc = Jsoup.connect(url).get()

        /**
         * @link https://github.com/mozilla/page-metadata-parser/blob/master/parser.js
         */

        val description = (
                doc.selectFirst("meta[property=\"og:description\"]") ?:
                        doc.selectFirst("meta[name=\"description\" i]")
                )?.attr("content")

        val image = (
                doc.selectFirst("meta[property=\"og:image:secure_url\"]") ?:
                        doc.selectFirst("meta[property=\"og:image:url\"]") ?:
                        doc.selectFirst("meta[property=\"og:image\"]") ?:
                        doc.selectFirst("meta[name=\"twitter:image\"]") ?:
                        doc.selectFirst("meta[property=\"twitter:image\"]") ?:
                        doc.selectFirst("meta[name=\"thumbnail\"]")
                )?.attr("content")?.let {
                    uri.resolve(it).toString()
                }

        val title = (
                doc.selectFirst("meta[property=\"og:title\"]") ?:
                        doc.selectFirst("meta[name=\"twitter:title\"]") ?:
                        doc.selectFirst("meta[property=\"twitter:title\"]") ?:
                        doc.selectFirst("meta[name=\"hdl\"]")
                )?.attr("content") ?:
                doc.selectFirst("title")?.text()

        val metadata = MetadataResult(null, title, description, image)

        image?.let {
            metadata.mediaId = MediaController.parseImg(
                    it,
                    MediaController.CacheAttr(maxWidth = 100)
            )
        }

        Api.db.sql2o.open().createQuery("""
            INSERT INTO `metadata` (
                `url`, `media_id`, `meta`
            ) VALUES (
                :url, :mediaId, :meta
            )
        """.trimIndent())
                .addParameter("url", url)
                .addParameter("mediaId", metadata.mediaId)
                .addParameter("meta", Api.gson.toJson(metadata))

        ctx.json(metadata)
    }
}
