const express = require('express');
const { auth: adminAndOrgAuth } = require('../../middleware/adminAndOrgAuth');
const { auth: adminAuth } = require('../../middleware/adminAuth');
const Util = require('../util');
const { ResponseStatus, ResponseFields } = require('../constants');
const ValidationError = require('../ValidationError');
const RoutesUtil = require('./routesUtil');
const IncomingWebhook = require('../../utils/webhook/IncomingWebhook');
class VIEW {
  static configRoute(root) {
    let router = new express.Router();
    return new PathBuilder(root, router);
  }
}
const MethodBuilder = class {
  constructor(root, subPath, router) {
    this.asGET = function (methodToExecute) {
      return new Builder('get', root, subPath, methodToExecute, router);
    };
    this.asPOST = function (methodToExecute) {
      return new Builder('post', root, subPath, methodToExecute, router);
    };
    this.asDELETE = function (methodToExecute) {
      return new Builder('delete', root, subPath, methodToExecute, router);
    };
    this.asUPDATE = function (methodToExecute) {
      return new Builder('patch', root, subPath, methodToExecute, router);
    };
    this.asALL = function (methodToExecute) {
      return new Builder('all', root, subPath, methodToExecute, router);
    };
    this.render = function (pageName, forAllMethods = false) {
      return new Builder(
        forAllMethods ? 'all' : 'get',
        root,
        subPath,
        () => RoutesUtil.render(pageName).build(),
        router
      );
    };
    this.redirect = function (pageName, forAllMethods = false) {
      return new Builder(
        forAllMethods ? 'all' : 'get',
        root,
        subPath,
        () => RoutesUtil.redirectTo(pageName).build(),
        router
      );
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
    middlewareList = [],
    useAdminAuthMiddleware
  ) {
    this.useAdminAndOrgAuth = () => {
      return new Builder(
        methodType,
        root,
        subPath,
        executer,
        router,
        true,
        middlewareList,
        false
      );
    };
    this.useAdminAuth = () => {
      return new Builder(
        methodType,
        root,
        subPath,
        executer,
        router,
        false,
        middlewareList,
        true
      );
    };
    this.userMiddleware = (...middleware) => {
      middlewareList = [...middleware];
      return new Builder(
        methodType,
        root,
        subPath,
        executer,
        router,
        useAuthMiddleware,
        middlewareList,
        useAdminAuthMiddleware
      );
    };
    this.build = () => {
      let controller = async (req, res) => {
        try {
          let responseObj = await executer(req, res); //return object from RoutesUtil
          if (responseObj) {
            let data = responseObj.d || {};
            if (data.error) {
              //if new errors added, the flash it.
              req.flash('error', data.error);
            } else {
              //if no new errors added, then attach previous pending errors messages
              data.error = req.flash('error');
            }
            if (data.success) {
              req.flash('success', data.success);
            } else {
              data.success = req.flash('success');
            }
            let preFilled = req.flash('data');
            if (preFilled) {
              res.locals.oldData = preFilled;
            }
            if (responseObj.r) {
              //redirect?
              res.redirect(responseObj.p);
            } else {
              res.render(responseObj.p, data);
            }
          } else {
            res.end();
          }
        } catch (e) {
          if (e && e.name != ValidationError.name) {
            console.log(e);
          }
          if (e && e.data) {
            req.flash('data', e.data); //We have transferred this back to webpages using res.locals.oldData
          }
          req.flash('error', e.message);
          res.redirect('back');
        }
      };
      if (useAuthMiddleware) {
        router[methodType](
          root + subPath,
          adminAndOrgAuth,
          ...middlewareList,
          controller
        );
      } else if (useAdminAuthMiddleware) {
        router[methodType](
          root + subPath,
          adminAuth,
          ...middlewareList,
          controller
        );
      } else {
        router[methodType](root + subPath, ...middlewareList, controller);
      }
      return new PathBuilder(root, router);
    };
    this.buildWithApi = () => {
      let controller = async (req, res) => {
        try {
          let response = await executer(req, res);
          res.status(ResponseStatus.Success).send(response);
        } catch (e) {
          let responce = {
            [ResponseFields.status]: ResponseStatus.ClientOrServerError,
            [ResponseFields.message]: e.message,
            [ResponseFields.result]: e,
          };
          await IncomingWebhook.send(e);
          res.status(ResponseStatus.Success).send(responce);
        }
      };
      if (useAuthMiddleware) {
        router[methodType](
          root + subPath,
          adminAndOrgAuth,
          ...middlewareList,
          controller
        );
      } else if (useAdminAuthMiddleware) {
        router[methodType](
          root + subPath,
          adminAuth,
          ...middlewareList,
          controller
        );
      } else {
        router[methodType](root + subPath, ...middlewareList, controller);
      }
      return new PathBuilder(root, router);
    };
  }
};
module.exports = VIEW;
