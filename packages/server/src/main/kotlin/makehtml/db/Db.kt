package makehtml.db

import org.sql2o.Sql2o
import java.io.File
import java.nio.file.Paths

class Db(dbString: String) {
    val isJar = Db::class.java.getResource("Db.class").toString().startsWith("jar:")
    private val root: File = if (isJar) {
        File(Db::class.java.protectionDomain.codeSource.location.toURI()).parentFile
    } else {
        File(System.getProperty("user.dir"))
    }

    val sql2o = Sql2o("jdbc:sqlite:${let {
        Paths.get(root.toString(), dbString).toUri().path
    }}",
            null, null)

    init {
        sql2o.open().let { connection ->
            connection.createQuery("""
                CREATE VIRTUAL TABLE IF NOT EXISTS `entry` USING fts5 (
                    `id`    UNINDEXED,
                    `title`,
                    `tag`,
                    `markdown`,
                    `html`  UNINDEXED,
                    `date`  UNINDEXED,
                    `data`  UNINDEXED /* json */
                )
            """.trimIndent()).executeUpdate()

            connection.createQuery("""
                CREATE TABLE IF NOT EXISTS `media` (
                    `id`        TEXT PRIMARY KEY,
                    `name`      TEXT NOT NULL,
                    `data`      BLOB NOT NULL,
                    `h`         TEXT NOT NULL,
                    `width`     INTEGER NOT NULL,
                    `height`    INTEGER NOT NULL
                )
            """.trimIndent()).executeUpdate()

            connection.createQuery("""
                CREATE INDEX IF NOT EXISTS `media_name` ON `media`(`name`)
            """.trimIndent()).executeUpdate()

            connection.createQuery("""
                CREATE INDEX IF NOT EXISTS `media_h` ON `media`(`h`)
            """.trimIndent()).executeUpdate()

            connection.createQuery("""
                CREATE INDEX IF NOT EXISTS `media_width` ON `media`(`width`)
            """.trimIndent()).executeUpdate()

            connection.createQuery("""
                CREATE INDEX IF NOT EXISTS `media_height` ON `media`(`height`)
            """.trimIndent()).executeUpdate()

            connection.createQuery("""
                CREATE TABLE IF NOT EXISTS `entry_media` (
                    `entry_id`  TEXT NOT NULL REFERENCES `entry`(`id`) ON DELETE CASCADE,
                    `media_id`  TEXT NOT NULL REFERENCES `media`(`id`) ON DELETE CASCADE,
                    PRIMARY KEY (`entry_id`, `media_id`)
                )
            """.trimIndent()).executeUpdate()
        }
    }
}