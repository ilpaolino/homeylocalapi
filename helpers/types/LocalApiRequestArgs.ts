export interface LocalApiRequestArgs {
    url: string;
    method: 'get' | 'post';
    body?: string;
}

export default LocalApiRequestArgs;
