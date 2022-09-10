import Homey from 'homey';
import http, { IncomingMessage, ServerResponse } from 'http';

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

    let requestReceivedArgs: Array<LocalApiRequestArgs> = await requestReceivedTrigger.getArgumentValues() || [];
    this.log('LocalAPI has been initialized');

    requestReceivedTrigger.registerRunListener(
      async (args: LocalApiRequestArgs, state: LocalApiRequestState) => (args.url === state.request.url && args.method === state.request.method?.toLowerCase()),
    );
    responseWithAction.registerRunListener(
      async (args: LocalApiRequestArgs, state: LocalApiRequestState) => {
        let parsedBody = {};
        try {
          parsedBody = JSON.parse(args.body || '{}');
        } catch (e) {
          parsedBody = { status: 'error', message: 'Invalid JSON' };
        }
        this.log(`Parsed: ${JSON.stringify(parsedBody, null, 2)}`);
        return parsedBody;
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
        const triggeredVal = await requestReceivedTrigger.trigger({}, { request: req, response: res });
        const argVal = await responseWithAction.getArgumentValues();
        try {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.write(JSON.stringify({
            status: 'success', url: req.url, method: req.method, data: argVal,
          }));
          this.log('Response sent');
        } catch (e) {
          this.log('err ', e);
        }
        this.log(triggeredVal);
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({
          status: 'not-found',
        }));
      }
      res.end();
    }).listen(3000, () => {
      this.log('Local API server started at port 3000');
    });
  }

}

module.exports = LocalApi;
