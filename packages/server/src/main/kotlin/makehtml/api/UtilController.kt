package makehtml.api

import io.javalin.http.Context
import org.jsoup.Jsoup
import java.net.URI

object UtilController {
    private data class MetadataResult(
            val mediaId: String?,
            val url: String,
            val title: String?,
            val description: String?,
            val image: String?
    )

    fun metadata(ctx: Context) {
        val uri = URI(ctx.queryParam<String>("url").get())
        val url = uri.toString()

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

        val mediaId = image?.let {
            MediaController.parseImg(
                    it,
                    MediaController.CacheAttr(maxWidth = 100)
            )
        }

        ctx.json(MetadataResult(mediaId, url, title, description, image))
    }
}
