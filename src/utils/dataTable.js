const {
    TableFields
} = require("./constants")
const moment = require("moment")

class DataTable {
    static queryBuilder = (req) => {
        const searchRegex = new RegExp(req.query.search.value, 'i')
        const searchableColumns = req.query.columns.filter(col => col.searchable === 'true').map(col => col.data)

        const query = {}
        if (req.query.search.value && searchableColumns && searchableColumns.length) {
            query["$or"] = searchableColumns.reduce((prev, col) => ([...prev, {
                [col]: searchRegex
            }]), [])
        }

        return query
    }

    static optionsBuilder = (req) => {
        const columns = req.query.columns.map(col => col.data)
        const order = req.query.order[0]

        return {
            select: columns,
            offset: req.query.start,
            limit: req.query.length,
            sort: {
                [columns[order.column]]: order.dir == "asc" ? 1 : -1
            },
            options: {
                transform: (docs) => {
                    const formatDate = (doc, field) => {
                        if (doc[field]) doc[field] = moment(doc[field]).format("DD-MM-YYYY HH:mm:ss")
                    }

                    return docs.map((doc) => {
                        doc = doc.toJSON()
                        formatDate(doc, TableFields._createdAt)
                        return doc
                    })
                }
            }
        }
    }
}

module.exports = DataTable