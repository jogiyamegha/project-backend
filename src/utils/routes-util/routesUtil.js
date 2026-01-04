const RedirectDataBuilder = class {
    constructor(pageToNavigate) {
        const projection = {}
        this.withError = (errorMsg) => {
            projection.error = errorMsg
            return this
        }
        this.withSuccess = (successMsg) => {
            projection.success = successMsg
            return this
        }
        this.build = async () => {
            return pageToNavigate.call(projection)
        }
    }
}
const RenderDataBuilder = class {
    constructor(pageToNavigate) {
        let projection = {}
        this.withTitle = (newTitle) => {
            projection.title = newTitle
            return this
        }
        this.withError = (errorMsg) => {
            projection.error = errorMsg
            return this
        }
        this.withSuccess = (successMsg) => {
            projection.success = successMsg
            return this
        }
        this.withLayout = (layoutPath, pageTitle = undefined) => {
            projection.layout = layoutPath
            if (pageTitle != undefined) {
                projection.title = pageTitle
            }
            return this
        }
        this.withData = (keyValueObj = {}) => {
            projection = {
                ...projection,
                ...keyValueObj
            }
            return this
        }
        this.build = async () => {
            return pageToNavigate.call(projection)
        }
    }
}
module.exports = {
    render: (fileName) => {
        return new RenderDataBuilder(function () {
            return {
                p: fileName,
                d: {
                    ...this
                }
            }
        })
    },
    redirectTo: (path) => {
        return new RedirectDataBuilder(function () {
            return {
                p: path,
                d: {
                    ...this
                },
                r: true
            }
        })
    }
}