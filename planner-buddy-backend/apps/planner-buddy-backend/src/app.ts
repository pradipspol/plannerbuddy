import { Router } from "express"

// const createError = require ('http-errors')
const express = require ('express')
const path = require ('path')
// const cookieParser = require ('cookie-parser')
// const queryParser = require ('query-string')
const cors = require ('cors')

// config.setAppRoot (__dirname)

// global.appRoot = __dirname

// const instanceName = config.instanceName


interface RouteOptions {
  router?: Router, 
  redirectOnAuth?: boolean, 
  errorOnAuth?: boolean, 
  onError?: unknown, 
  authAction?: unknown,
  internal?: boolean
}

class AppRegistry {
  app: any
  paths: any = []
  constructor () {
    this.app = express ()

    // this.app.logAny = LogUtils.Loggable.logAny;
    // this.app.config = config;
    // this.app.DeploymentEnv = DeploymentEnv;

    this.app.disable('x-powered-by');

    // this.swaggerRouter = require ('./swagger/init')

    // view engine setup
    this.app.set ('views', path.join (__dirname, 'views'))
    this.app.set ('view engine', 'hbs')

    this.app.use (function (req: any, res: any, next: any) {
      function logBody () {
        const body: any[] = []
        req.on('data', (chunk: any) => {
          body.push(chunk)
        }).on('end', () => {
          // on end of data, perform necessary action
          console.log (Buffer.concat(body).toString())
          res.status (505).json ('failed by debugging')
        });
      }
      // to debug raw request before any middleware
      const fail = false
      if (fail) {
        if (req.method == 'POST') {
          logBody ()
        }
        else {
          res.status (505).json ('failed by debugging')
        }
      }
      else {
        next ()
      }
    })

    // this.app.use(logger(function (tokens, req, res) {
    //   if (config.logging.useMorgan) {
    //     let exeContext = execCtx?.getCurrentLoggingDetails()
    //     if (!exeContext || Object.keys(exeContext).length == 0 ) {
    //       exeContext = {'error': 'NO_EXECUTION_CONTEXT'}
    //     } else {
    //       if (Array.isArray(exeContext.clientIps) && exeContext.clientIps.length == 0) {
    //         exeContext.clientIps = []
    //       }
    //     }

    //     //const level = LogUtils.Loggable.getCachedLogLevel (INFO_LEVEL, ACCESS_CATEGORY);
    //     if ( LogUtils.LogLevel[INFO_LEVEL] <= morganLogLevel) {
    //       return JSON.stringify({
    //         creosaas:{
    //           timestamp: new Date(),
    //           level: INFO_LEVEL,
    //           category: ACCESS_CATEGORY,
    //           log: {
    //             method: tokens.method(req, res),
    //             url: tokens.url(req, res),
    //             status: tokens.status(req, res),
    //             length: tokens.length,
    //             time: Number(tokens['response-time'](req, res)),
    //             appInfo: exeContext
    //           }
    //         }
    //       })
    //     }
    //   }
    // }));

    // this.app.use (express.json ({limit: config.requestSizeLimit}))
    this.app.use (express.urlencoded ({ extended: false }))
    // this.app.use (cookieParser())
    // this.app.use (require ('./build/routes/securityheaders').default);
    // this.app.use (compression.initialize ())

    this.paths = []

    // this.app.use((req, res, next) => {
    //   execCtx.run(() => {
    //     req.originalUrl = req.headers[atlasDefs.ORIGINAL_PATH_HEADER] || `${config.proxyPath || ''}${req.originalUrl || ''}` || req.url;
    //     req.proxyPath = req.originalUrl.replace(req.url,'');
    //     if(req.headers['x-ptc-server-loglevel']) execCtx.getCurrExeContext().setLoglevel(req.headers['x-ptc-server-loglevel']);
    //     execCtx.getCurrExeContext().setClientIps(Service.getClientIps(req));
    //     next();
    //   }, Service.extractTransactionId(req));
    // });

    /**
     * This API is used by K8S for health check as well as can be used by
     * Creo Embedded browser for cookie refresh
     * So moved this  API from internal routes to external routes
     */
    this.app.get ('/health', (req: any, res: any) => res.json ({ status: 'OK'}));

    /**
     * This API is used by clients to check service availability
     * The API is on unauthenticated path at ambassador (gateway level) 
     * May be, to avoid performance issues/delays, we should remove logging, once workflow is tested on dev(?)
     */
    this.app.get ('/ping', (req: any, res: any) => {
      res.json ({ status: 'success'})
    });

    // function validateOrigin (origin, callback) {
    //   if (origin && config.security.allowedOrigins.test (origin)) {
    //     return callback (null, true);
    //   } else {
    //       const error =  new Error('cross-site scripting forbidden');
    //       error.status = 403;
    //       delete error.stack;
    //       return callback (error, false);
    //   }
    // }
    /* CORS - Options request handling
     * credentials - When used as part of a response to a preflight request,
     * this indicates whether or not the actual request can be made using credentials (e.g. cookies).
     *
     * set origin to null if request origin in request is null
     * (to support curl requests or requests during Atlas ambassador cookie refresh)
     * and set it to true to reflect the request origin, as defined by req.header('Origin')
     * for ptc urls
     *
     * optionsSuccessStatus: Provides a status code to use for successful OPTIONS requests,
     * since some legacy browsers (IE11, various SmartTVs) choke on 204.
     */
    this.app.options('/*', cors({
        credentials: true,
        origin: function (origin: any, callback: any) {
          //validateOrigin (origin, callback)
        },
        optionsSuccessStatus: 200
    }));

    /* CORS - non-Options request handling.
    * Validating orgin request header for supported ptc URLs.
    *
    * Origin is added when the origin doesn't match the page from which the XMLHttpRequest is created,
    * but may also be sent in a same-origin request.
    * When origin not received, we will consider it as valid case.
    */
    this.app.use('/*', cors({
      origin: function (origin: any, callback: any) {
        // allow requests with no origin (like mobile apps or curl requests)
        if(!origin) return callback(null, true);

        //validateOrigin (origin, callback);
      }
    }));

    // this.app.use ((req, res, next) => {
    //   const routeData = this.getRouteData (req.path)
    //   if (routeData && routeData.authAction) {
    //     auth.validateSessionCookie (req, res).catch (ex => undefined).then (cookie => {
    //       let authorized = cookie
    //       if (authorized) {
    //         const expiration = cookie.expires
    //         const expirationType = typeof expiration
    //         const expirationDate = (expirationType === 'number' || expirationType === 'string') ? new Date (expiration) :
    //           (expirationType === 'object' && expiration instanceof Date) ? expiration : undefined
    //         authorized = !expirationDate || (expirationDate.getTime () > new Date ().getTime ())
    //       }
    //       if (!authorized) {
    //         routeData.authAction (req, res, next)
    //       }
    //       else {
    //         const params = req.query;
    //         if (params.redirect) {
    //           LogUtils.Loggable.logAny ('WARNING',`(TODO- TO REMOVE) URL NOT REDIRECTING: ${params.redirect}`);
    //           // res.redirect (`${params.redirect}`) // Commented this line as per suggestions as this case is being already handled.
    //         } // else {
    //           next ()
    //         // }
    //       }
    //     })
    //   }
    //   else {
    //     next ()
    //   }
    // })

    // this.app.use((req, res, next) => {
    //   if (config.logging.useMorgan) {
    //       LogUtils.Loggable.cachedLogLevel (LogUtils.LogLevel[INFO_LEVEL], ACCESS_CATEGORY, req.sessionCookie?.isOrgLoglevelsOverridden || false, req.sessionCookie?.isLoglevelsOverridden || false, req.sessionCookie?.orgId || undefined, req.sessionCookie?.memberId || undefined).then(level=>{
    //         morganLogLevel = level;
    //       })
    //   }
    //   next();
    // });

    // // This middleware added to set log levels for users if it is overridden.
    // this.app.use((req, res, next) => {
    //   if (config.logging.dynamicLogLevels && req.sessionCookie) {
    //     if (req.sessionCookie?.isLoglevelsOverridden) {
    //       logLevelsService.initUserLogLevelsFromCache (req.sessionCookie.memberId);
    //     } else if (req.sessionCookie?.isOrgLoglevelsOverridden) {
    //       logLevelsService.initUserLogLevelsFromCache (req.sessionCookie.orgId);
    //     }
    //   }
    //   next();
    // });

    // // This meddleware is for path restriction on prod environment.
    // // only Root user from internal client ips will access all paths else only open paths.
    // this.app.use((req, res, next) => {
    //   const routeData = this.getRouteData(req.path)
    //   if (config.deployment.env == DeploymentEnv.prod && routeData) {
    //     if (!(routeData.internal) || (req.sessionCookie.isRoot && utils.isInternalClient(Service.getClientIps(req)))) {
    //       next();
    //     } else {
    //       res.status(403).json({ message: "Access Forbidden." });
    //     }
    //   } else {
    //     next();
    //   }
    // })


    this.app.startServer = (startServer: () => void) => {
        startServer()
    //   this.swaggerRouter.init (this.app, () => {
    //     // this.setErrorHandler ()
    //     startServer ()
    //   })
    }
  }

  async getAuthInfo(req: any, flag: boolean) {
      const cookie = req.cookies;
      if (flag){
        return {userId: "abc", cookie: cookie};
      } else {
        throw "Issue";
      }
  }
  
  
  redirectOnAuth (req: any, res: any, next: any) {
    const params = req.query;
    const redirectUrl = params.redirect || req.originalUrl
    const parsedUrl = redirectUrl; //queryParser.parseUrl (redirectUrl, {parseFragmentIdentifier: true})
    const parms = (parsedUrl.query && parsedUrl.query.skipProfiles && 'skipProfiles=true&') || ''
    let url = `${req.proxyPath}/signin/login.html?${parms}redirect=${redirectUrl}`;
    return this.getAuthInfo (req, true).catch((exp: any) => {
        return undefined;
    }).then((authInfo: any) => {
        //LogUtils.Loggable.logAny ('INFO',`UserId and Debug Info during sign-in: ${authInfo?.userId}, ${authInfo?.isDebugAuthInfo}`);
        const userId = authInfo?.userId
        if (userId && !(authInfo?.isDebugAuthInfo)) url += `&userid=${userId}`;
        res.redirect (url);
    });
  }
  
  errorOnAuth (req: any, res: any) {
    res.status (401).json ({status:401, error: 'Authentication failure'})
  }
  
  // getRouteData (routePath) {
  //   return this.paths.find (path => routePath.startsWith (path.prefix))
  // }
  
  // add (route: string, {router, redirectOnAuth, errorOnAuth, onError, internal=true}) {
  //   const authAction = redirectOnAuth ? this.redirectOnAuth.bind (this) : errorOnAuth ? this.errorOnAuth.bind (this) : undefined
  //   this.addWithAuthAction (route, {router, authAction, onError, internal})
  // }

  add (route: string, options:RouteOptions ){
    options.authAction = options.redirectOnAuth ? this.redirectOnAuth.bind (this) : options.errorOnAuth ? this.errorOnAuth.bind (this) : undefined
    this.addWithAuthAction (route, options)
  }
  
  // addSwaggerHandlers () {
  //   this.add ('/docs', {redirectOnAuth: true, onError: this.swaggerRouter.onError, internal: true})
  //   this.add ('/v1', {errorOnAuth: true, onError: this.swaggerRouter.onError, internal: false})
  // }
  
  addWithAuthAction (route: string, options: RouteOptions) {
    if (options.router) {
      if (route) {
        this.app.use (route, options.router)
      }
      else {
        this.app.use (options.router)
      }
    }
    if (route && (options.authAction || options.onError)) {
      this.paths.push ({prefix: route, authAction: options.authAction, onError: options.onError, internal: options.internal})
    }
  }

  // setErrorHandler () {
  //   // catch 404 and forward to error handler
  //   this.app.use (function (req, res, next) {
  //     next (createError (404));
  //   });
  //   this.app.use ((err, req, res, next) => {
  //     res.status (err.status || 500)
  //     const routeData = this.getRouteData (req.path)
  //     if (routeData && routeData.onError) {
  //       routeData.onError (err, req, res, next)
  //     }
  //     else {
  //       // set locals, only providing error in development
  //       res.locals.message = err.message
  //       res.locals.error = req.app.get ('env') === 'development' ? err : {}
  //       // render the error page
  //       res.render ('error')
  //     }
  //   })
  // }
}

export const appRegistry = new AppRegistry()
// // Routes registration with auth failure handling
// appRegistry.add (undefined, {router: express.static (path.join (__dirname, 'public'))})
// appRegistry.add('/dom/domjs',{router: express.static (path.join (__dirname, 'views/domjs'))});
// appRegistry.add ('/creosaasjsapis', {router: express.static (clientApiPath)})
// appRegistry.add ('/mockup', {redirectOnAuth: true})
// appRegistry.addSwaggerHandlers ()
// // appRegistry.add ('/blobs', {router: blobUploadRouter}) // TODO: handle auth, confirm needed
// appRegistry.add ('/dom', {router: require ('./build/routes/dom').default}) // TODO: handle auth
// appRegistry.add ('/content', {errorOnAuth: true, router: require ('./build/routes/content').router, internal: false}) // TODO: handle auth
// appRegistry.add ('/downloads', {errorOnAuth: true, router: require ('./build/routes/downloads').router, internal: false}) // TODO: handle auth
// appRegistry.add ('/auth', {router: auth.router, internal: false}) // TODO: handle auth
// appRegistry.add ('/msai', {router: require ('./build/routes/msai')}) // TODO: handle auth
// appRegistry.add ('/testing', {
//   redirectOnAuth: true,
//   router: require ('./build/swagger/service/Test').initTestRouter ()
// })
// require ('./build/swagger/utils/PlatformService').initDataPath (path.join (__dirname, 'data'))
// const profilePicRouter = require ('./build/routes/profile-pic');
// appRegistry.add ('/profilepic', {router: profilePicRouter, redirectOnAuth: true});

// const buildInfo = require('../build.json');
// // on startup check if common creo-saas-build id needs update - dependes on backend commit number
// buildUtils.updateCreoSaaSBuild(config.deployment.env, buildInfo.commitSha, undefined, buildInfo.release);
// buildUtils.cacheBuildJSON (buildInfo);

appRegistry.add ('/about', { router: (req: any, res: any) => {
  const about = {app: "plannerBuddyBackend", version: '0.0.1'}
  res.json(about)
}, internal: false});

// // This is for close.html and authenticate.html which we moved from mockup folder.
// appRegistry.add ('/creo/creoauth', {redirectOnAuth: true, internal: false})

// // /creoauth?checkCUA=true [CUA is Creo User Access]
// appRegistry.add('/creoauth', {router: (req, res) => {
//   const uiChooseOrgURL = config.authConfig.getUiChooseOrgURLForBaseLocation(req)
//   const redirectUrl =  uiChooseOrgURL ? req.query.checkCUA ? `${uiChooseOrgURL}?checkCUA=${req.query.checkCUA}` : uiChooseOrgURL : `${req.proxyPath}/creo/creoauth/close.html`;
//   res.redirect(redirectUrl);
// }, internal: false});

