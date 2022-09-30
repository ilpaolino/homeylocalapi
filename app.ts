import Homey from 'homey';
import http, { IncomingMessage, ServerResponse } from 'http';
import { EventEmitter } from 'events';

interface LocalApiRequestState {
  response: http.ServerResponse;
  request: http.IncomingMessage;
}

interface LocalApiRequestArgs {
  url: string;
  method: 'get' | 'post';
  body?: string;
}

class LocalApi extends Homey.App {

  /**
   * onInit is called when the app is initialized.
   */
  async onInit() {
    const requestReceivedTrigger = this.homey.flow.getTriggerCard('local-api-request-received');
    const responseWithAction = this.homey.flow.getActionCard('local-api-response-with');
    const responseWithOk = this.homey.flow.getActionCard('local-api-respond-with-200');

    let requestReceivedArgs: Array<LocalApiRequestArgs> = await requestReceivedTrigger.getArgumentValues() || [];
    const localApi = new EventEmitter();
    localApi.on('warning', (e) => this.error('warning', e.stack));
    localApi.on('uncaughtException', (e) => this.error('uncaughtException', e.stack));
    this.log('LocalAPI has been initialized');

    requestReceivedTrigger.registerRunListener(
      async (args: LocalApiRequestArgs, state: LocalApiRequestState) => {
        return (args.url === state.request.url && args.method === state.request.method?.toLowerCase());
      },
    );
    responseWithAction.registerRunListener(
      async (args: LocalApiRequestArgs, state: LocalApiRequestState) => {
        let parsedBody = {};
        try {
          parsedBody = JSON.parse(args.body || '{}');
        } catch (e) {
          parsedBody = { status: 'error', message: 'Invalid JSON' };
        }
        try {
          localApi.emit('responseAction', parsedBody);
        } catch (e) {
          this.error(e);
        }
        return true;
      },
    );
    responseWithOk.registerRunListener(
      async (args: LocalApiRequestArgs, state: LocalApiRequestState) => {
        try {
          localApi.emit('responseAction', { status: 'ok' });
        } catch (e) {
          this.error(e);
        }
        return true;
      },
    );

    requestReceivedTrigger.on('update', async () => {
      this.log('LocalAPI: Found updated trigger, updating args');
      requestReceivedArgs = await requestReceivedTrigger.getArgumentValues();
    });

    /**
     * Create a http server instance that can be used to listening on port 3000.
     */
    http.createServer(async (req: IncomingMessage, res: ServerResponse) => {
      const authorizedRoute = requestReceivedArgs.find((arg: LocalApiRequestArgs) => arg.url === req.url && arg.method === req.method?.toLowerCase());
      if (authorizedRoute) {
        try {
          requestReceivedTrigger.trigger({}, { request: req, response: res });

          const argVal = await new Promise((resolve) => {
            localApi.once('responseAction', (body:string) => {
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
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({
          status: 'not-found',
        }));
      }
      // Send end of response
      res.end();
      // Destroy the response to free up memory
      res.destroy();
    }).listen(3000, () => {
      this.log('Local API server started at port 3000');
    });
  }

}

module.exports = LocalApi;
