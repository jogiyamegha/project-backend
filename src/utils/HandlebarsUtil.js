const Handlebars = require('handlebars')
const fs = require('fs')
const path = require('path')

class HandlebarsUtil {

    static readFileAndFillData(data = {}, filePaths = []) {
        let fileStr = fs.readFileSync(path.join(...filePaths)).toString()
        return Handlebars.compile(fileStr)(data);
    }

}

module.exports = HandlebarsUtil