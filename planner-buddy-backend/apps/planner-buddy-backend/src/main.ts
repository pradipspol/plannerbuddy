// import express from 'express';

// const host = process.env.HOST ?? 'localhost';
// const port = process.env.PORT ? Number(process.env.PORT) : 3000;

// const app = express();

// app.get('/', (req, res) => {
//   res.send({ message: 'Hello API' });
// });

// app.listen(port, host, () => {
//   console.log(`[ ready ] http://${host}:${port}`);
// });


/**
 * 
 * 
 */

/**
 * Module dependencies.
 */
// require ('dotenv').config();
// require ('module-alias/register')

// import https from 'https';
import http from 'http';
import { debug } from 'console';
// const crypto = require('crypto');

import { appRegistry } from './app';

// let server: any;
const port = 3000;

const app = appRegistry.app;

console.info(`max http header size - ${http.maxHeaderSize}`);

app.set( 'port', port );

/**
 * Create HTTPS server.
 */

const server = http.createServer( app );

// if ( config.privateKey && config.certificate ) {
//     const credentials = { key: config.privateKey, cert: config.certificate };
//     if ( serviceConfig.config.deployment.sslPassphrase ) credentials.passphrase = serviceConfig.config.deployment.sslPassphrase;
//     server = https.createServer( credentials, app );
// } else {
//     server = http.createServer( app );
// }


if ( app.startServer ) {
    app.startServer( startServer )
}
else {
    startServer()
}



function startServer () {

    /**
     * Listen on provided port, on all network interfaces.
     */

    server.listen( port );
    // below code is for websocket server
    //   if (app.initWS) {
    //     app.initWS (server)
}

/**
 * Update the keep-alive time to given configurable value yo avoid 503
 * make sure headerstimeout is some units more than keep-alive time
 * https://nodejs.org/api/http.html#serverkeepalivetimeout
 * https://github.com/envoyproxy/envoy/issues/14981
 * https://medium.com/@in.live.in/puzzling-503s-and-istio-1bf504b9aae6
 */
server.keepAliveTimeout = 1000000; //(serviceConfig.config.deployment.keepAliveTime * 1000);

if((server.headersTimeout - server.keepAliveTimeout) < 1000) {
    server.headersTimeout = server.keepAliveTimeout + 1000;
}

// if(serviceConfig.config.deployment.debugSocketEvents) {
//     server.on('connection', (client) => onConnection(client));
// }

server.on('error', (error) => onError(error, port));
server.on('listening', () => onListening(server));

/**
 * Normalize a port into a number, string, or false.
 */


/**
 * Event listener for HTTP server "error" event.
 */

function onError(error: any, port: any) {
  console.error('onError:' + error);
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Added logging till we identify reason behind 503 status code
 * @param socket
 */
// function onConnection(socket: any) {
//   const uuid = crypto.randomUUID();
//   app.logAny('INFO', `onConnection connection created: ${uuid}`);
//   socket.on('close', function(isError: any) {
//     app.logAny('INFO', `connection closed: ${isError}, ${uuid}`);
//   });
//   socket.on('error', function(err: any) {
//     app.logAny('ERROR', `connection error: ${err}, ${uuid}`);
//   });
// }

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening(server: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>) {
  const addr = server.address();
  const bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr?.port;
  debug('Listening on ' + bind);
}


function prepareProcessExit () {
    app.logAny('WARNING',`prepareProcessExit called`);
    // Stop Accepting new connections
    server.close(() => {
        app.logAny('WARNING', 'Public Http server closed');
        // to do - other cleanups
    });

    // Close all existing idle connections - This API is newly added in Node18
    server.closeIdleConnections();
    app.logAny('WARNING', 'Public Http server Idle connections closed');
    app.logAny('WARNING', 'Internal Http server Idle connections closed');
    app.logAny('WARNING', 'prepareProcessExit done');
}

function handleProcessExit (exitCode: number | undefined) {
    app.logAny('WARNING', `handleProcessExit called: Exiting with code ${exitCode}`);
    process.exit(exitCode)
}

/**
 * A SIGTERM signal is sent to the main process (PID 1) in each container, and
 * a “grace period” countdown starts (defaults to 30 seconds).
 * Upon the receival of the SIGTERM, each container should start a graceful shutdown of the running application and exit.
 * If a container doesn’t terminate within the grace period, a SIGKILL signal will be sent and the container violently terminated.
 */
process.on('SIGTERM', function () {
    app.logAny('WARNING', 'received SIGTERM');
    prepareProcessExit();
});

process.on('SIGINT', function () {
    app.logAny('WARNING', 'received SIGINT');
    handleProcessExit(2);
});

process.on('unhandledRejection', (reason, promise) => {
    const msg = {reason, promise, programmingError: "unhandledRejection"}
    app.logAny('ERROR', msg);
    if (app.config.deployment.env == app.DeploymentEnv.local)
      {
          console.log ('ERROR', msg)
          app.logAny('ERROR', `Crashing in dev mode, comment out in apps/service/src/bin/www to disable`)
          handleProcessExit(99);
      }
  });

process.on('uncaughtException', function(e) {
    const msg = {exception: e, programmingError: "uncaughtException"}
    app.logAny('ERROR', msg);
    if (app.config.deployment.env == app.DeploymentEnv.local)
    {
        console.log ('ERROR', msg)
        app.logAny('ERROR', `Crashing in dev mode, comment out in apps/service/src/bin/www to disable`)
        handleProcessExit(99);
    }
});
