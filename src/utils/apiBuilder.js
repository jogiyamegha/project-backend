const express = require("express");
const adminAuth = require("../middleware/adminAuth");
const userAuth = require("../middleware/userAuth");

 
const Util = require("../utils/util");
const { ApiResponseCode, ResponseStatus } = require("../utils/constants");
const ValidationError = require("../utils/ValidationError");
const appSettings = require("../middleware/appSettings");

class API {
    static configRoute(root) {
        let router = new express.Router();
        return new PathBuilder(root, router);
    }
}

const MethodBuilder = class {
    constructor(root, subPath, router) {
        this.asGET = function (methodToExecute) {
            return new Builder("get", root, subPath, methodToExecute, router);
        };

        this.asPOST = function (methodToExecute) {
            return new Builder("post", root, subPath, methodToExecute, router);
        };

        this.asDELETE = function (methodToExecute) {
            return new Builder("delete", root, subPath, methodToExecute, router);
        };

        this.asUPDATE = function (methodToExecute) {
            return new Builder("patch", root, subPath, methodToExecute, router);
        };
    }
};

const PathBuilder = class {
    constructor(root, router) {
        this.addPath = function (subPath) {
            return new MethodBuilder(root, subPath, router);
        };
        this.getRouter = () => {
            return router;
        };
        this.changeRoot = (newRoot) => {
            root = newRoot;
            return this;
        };
    }
};

const Builder = class {
    constructor(
        methodType,
        root,
        subPath,
        executer,
        router,
        useAuthMiddleware,
        duplicateErrorHandler,
        middlewaresList = [],
        useAdminAuth = false,
        useUserAuth = false,
        useAppSettingsAuth = false,
        allowedRoles = []  
    ) {

        this.allowedRoles = allowedRoles;

        this.useAdminAuth = () => {
            return new Builder(
                methodType,
                root,
                subPath,
                executer,
                router,
                useAuthMiddleware,
                duplicateErrorHandler,
                middlewaresList,
                true,
                false,
                false,
                false
            );
        };


          this.useUserAuth = (allowedRoles = []) => {
            return new Builder(
                methodType,
                root,
                subPath,
                executer,
                router,
                useAuthMiddleware,
                duplicateErrorHandler,
                middlewaresList,
                false,
                true,
                false,
                 allowedRoles
            );
        };

        this.useAppSettings = () => {
            return new Builder(
                methodType,
                root,
                subPath,
                executer,
                router,
                useAuthMiddleware,
                duplicateErrorHandler,
                middlewaresList,
                false,
                false, 
                true
            );
        };

       
        this.setDuplicateErrorHandler = (mDuplicateErrorHandler) => {
            return new Builder(
                methodType,
                root,
                subPath,
                executer,
                router,
                useAuthMiddleware,
                mDuplicateErrorHandler,
                middlewaresList,
                useAdminAuth
            );
        };

        this.userMiddlewares = (...middlewares) => {
            middlewaresList = [...middlewares];
            return new Builder(
                methodType,
                root,
                subPath,
                executer,
                router,
                useAuthMiddleware,
                duplicateErrorHandler,
                middlewaresList,
                useAdminAuth,
                useUserAuth,
                useAppSettingsAuth
            );
        };

        this.build = () => {
            let controller = async (req, res) => {
                try {
                    let response = await executer(req, res);
                    if (res.headersSent) return;
                    res.status(ResponseStatus.Success).send(response);
                } catch (e) {
                    if (e && duplicateErrorHandler) {
                        res
                            .status(ResponseStatus.InternalServerError)
                            .send(Util.getErrorMessageFromString(duplicateErrorHandler(e)));
                    } else {
                        if (e && e.name != ValidationError.name) {
                            console.log(e);
                        }
                        res
                            .status(ResponseStatus.BadRequest)
                            .send(Util.getErrorMessage(e));
                    }
                }
            };

            let middlewares = [...middlewaresList];
            if (useAdminAuth) middlewares.push(adminAuth); 
            if (useUserAuth) middlewares.push(userAuth(this.allowedRoles));
            if (useAppSettingsAuth) middlewares.push(appSettings);

            router[methodType](root + subPath, ...middlewares, controller);
            return new PathBuilder(root, router);
        };
    }
};

module.exports = API;
