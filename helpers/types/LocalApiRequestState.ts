import http from 'http';

export interface LocalApiRequestState {
    response: http.ServerResponse;
    request: http.IncomingMessage;
}

export default LocalApiRequestState;
