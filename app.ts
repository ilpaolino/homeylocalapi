import Homey from 'homey';
import http, { IncomingMessage, ServerResponse } from 'http';
import { EventEmitter } from 'events';
import LocalApiRequestArgs from './helpers/types/LocalApiRequestArgs';
import LocalApiRequestState from './helpers/types/LocalApiRequestState';

class LocalApi extends Homey.App {

  localApiEvent: EventEmitter = new EventEmitter();
  requestReceivedArgs: Array<LocalApiRequestArgs> = [];

  /**
   * Retrieve the CORS config from the settings
   */
  retrieveCorsConfig(): string {
    const corsAcao = this.homey.settings.get('corsAcao') || '*';
    if (corsAcao === '') {
      return '*';
    }
    return corsAcao;
  }

  /**
   * Retrieve CORS active status from the settings
   */
  isCorsActive(): boolean {
    const corsStatus = this.homey.settings.get('corsStatus') || 'false';
    return corsStatus === 'true';
  }

  /**
   * Check if the request is authorized to be handled by the Local API
   * @param req The node http request object
   */
  isRouteAuthorized(req: IncomingMessage): boolean {
    return this.requestReceivedArgs.find((arg: LocalApiRequestArgs) => arg.url === req.url) !== undefined;
  }

  /**
   * Check if the request is authorized to be handled by the Local API
   * @param req The node http request object
   */
  isRouteAndMethodAuthorized(req: IncomingMessage): boolean {
    return this.requestReceivedArgs.find((arg: LocalApiRequestArgs) => arg.url === req.url && arg.method === req.method?.toLowerCase()) !== undefined;
  }

  /**
   * Run listener for the response with 200 action Flow Card
   * @param args The arguments passed to the action card
   * @param state The state of the action card
   */
  responseWithOkRunListener = async (args: LocalApiRequestArgs, state: LocalApiRequestState) => {
    try {
      this.localApiEvent.emit('responseAction', { status: 'ok' });
    } catch (e) {
      this.error(e);
    }
    return true;
  };

  /**
   * Run listener for the response with action Flow Card
   * @param args The arguments passed to the action card
   * @param state The state of the action card
   */
  responseWithActionRunListener = async (args: LocalApiRequestArgs, state: LocalApiRequestState) => {
    let parsedBody = {};
    try {
      parsedBody = JSON.parse(args.body || '{}');
    } catch (e) {
      parsedBody = { status: 'error', message: 'Invalid JSON' };
    }
    try {
      this.localApiEvent.emit('responseAction', parsedBody);
    } catch (e) {
      this.error(e);
    }
    return true;
  };

  /**
   * Run listener for the request received Trigger Flow Card
   * @param args The arguments passed to the trigger card
   * @param state The state of the trigger card
   */
  requestReceivedTriggerRunListener = async (args: LocalApiRequestArgs, state: LocalApiRequestState) => (args.url === state.request.url && args.method === state.request.method?.toLowerCase());

  /**
   * onInit is called when the app is initialized.
   */
  async onInit() {
    // Define Trigger Requests
    const requestReceivedTrigger = this.homey.flow.getTriggerCard('local-api-request-received');
    // Define Actions Responses
    const responseWithAction = this.homey.flow.getActionCard('local-api-response-with');
    const responseWithOk = this.homey.flow.getActionCard('local-api-respond-with-200');
    // Retrieve Settings and initialize Local API App
    const serverPort = this.homey.settings.get('serverPort') || 3000;
    this.requestReceivedArgs = await requestReceivedTrigger.getArgumentValues() || [];
    this.localApiEvent.on('warning', (e) => this.error('warning', e.stack));
    this.localApiEvent.on('uncaughtException', (e) => this.error('uncaughtException', e.stack));
    requestReceivedTrigger.registerRunListener(this.requestReceivedTriggerRunListener);
    responseWithAction.registerRunListener(this.responseWithActionRunListener);
    responseWithOk.registerRunListener(this.responseWithOkRunListener);
    requestReceivedTrigger.on('update', async () => {
      this.log('LocalAPI: Found updated trigger, updating args... ');
      this.requestReceivedArgs = await requestReceivedTrigger.getArgumentValues();
      this.log('LocalAPI: args updated');
    });
    this.log('LocalAPI has been initialized');

    // Create a http server instance that can be used to listening on user defined port (or 3000, default).
    http.createServer(async (req: IncomingMessage, res: ServerResponse) => {
      const corsAcao = this.retrieveCorsConfig();
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Access-Control-Allow-Origin', corsAcao);
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Origin, Accept, Content-Type, Authorization, Content-Length, X-Requested-With, XMLHttpRequest');

      if (this.isRouteAuthorized(req) && req.method === 'OPTIONS' && this.isCorsActive()) {
        // Handle CORS preflight request
        res.writeHead(200);
      } else if (this.isRouteAndMethodAuthorized(req)) {
        // Handle request
        try {
          requestReceivedTrigger.trigger({}, { request: req, response: res });

          const argVal = await new Promise((resolve) => {
            this.localApiEvent.once('responseAction', (body:string) => {
              resolve(body);
            });
          });
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.write(JSON.stringify({
            status: 'success', url: req.url, method: req.method, data: argVal,
          }));
        } catch (e) {
          this.error(e);
        }
      } else {
        // Handle 404
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({
          status: 'not-found',
        }));
      }
      // Send end of response
      res.end();
      // Destroy the response, the request and the listener to free up memory
      this.localApiEvent.removeAllListeners('responseAction');
      res.destroy();
      req.destroy();
    }).listen(serverPort, () => {
      this.log(`LocalAPI server started at port ${serverPort}`);
    }).on('error', (e:unknown) => {
      // Handle server error
      if (e instanceof Error) {
        if (e.message.includes('EADDRINUSE') || e.message.includes('EACCES')) {
          this.error(`LocalAPI server error: port ${serverPort} already in use`);
        } else {
          this.error(`LocalAPI server error: ${e.message}`);
        }
      } else {
        this.error('LocalAPI server error: unknown error');
      }
    });
  }

}

module.exports = LocalApi;
