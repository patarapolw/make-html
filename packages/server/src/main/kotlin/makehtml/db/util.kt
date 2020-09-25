package makehtml.db

import org.jetbrains.exposed.dao.id.IdTable

abstract class IdInitTable<T:Comparable<T>>(name: String = ""): IdTable<T>(name) {
    open fun init() {}
}