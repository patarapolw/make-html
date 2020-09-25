package makehtml.db

import com.github.salomonbrys.kotson.fromJson
import makehtml.api.Api
import org.jetbrains.exposed.dao.Entity
import org.jetbrains.exposed.dao.EntityClass
import org.jetbrains.exposed.dao.id.EntityID

object EntryTable: IdInitTable<String>("entry") {
    override val id = varchar("id", 26).entityId()

    val data = varchar("data", 1000).index() // json
    val markdown = varchar("markdown", 5000)
    val html = varchar("html", 10000)
}

class Entry(id: EntityID<String>): Entity<String>(id) {
    companion object: EntityClass<String, Entry>(EntryTable)

    val data: Map<String, Any?> by EntryTable.data.transform(
            { Api.gson.toJson(it) },
            { Api.gson.fromJson<Map<String, Any?>>(it) }
    )
    val markdown by EntryTable.markdown
    val html by EntryTable.html
}