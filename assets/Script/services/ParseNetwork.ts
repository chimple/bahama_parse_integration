import {APPLICATION_ID, DEFAULT_TIMEOUT, GET, PARSE_REST_API_KEY} from '../constants';
import Point = dragonBones.Point;
import {FilePointer, Pointer} from '../domain/parseSchool';

export interface RequestOptions {
    ignoreCache?: boolean;
    headers?: { [key: string]: string };
    timeout?: number; // 0 (or negative) to wait forever
}

export interface AuthHeader {
    [key: string]: string;
}

export interface QueryParams {
    [key: string]: any;
}


export interface RequestParams {
    url: string;
    queryParams?: QueryParams;
    isWhereQuery?: boolean;
    body?: any;
}


export interface RequestResult {
    ok: boolean;
    status: number;
    statusText: string;
    data: string;
    json: <T>() => T;
    headers: string;
}

export class ParseNetwork {

    private static withQuery(url: string, params: QueryParams, isWhereQuery: boolean): string {
        const queryString = this.queryParams(params, isWhereQuery);
        const sep: string = url.indexOf('?') === -1 ? '?' : '&';
        return queryString ? url + sep + queryString : url;
    }

    private static queryParams(params, isWhereQuery: boolean): string {
        if (isWhereQuery) {
            return 'where=' + JSON.stringify(params);
        } else {
            return Object.keys(params)
                .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
                .join('&');
        }
    }

    private static parseXHRResult(xhr: XMLHttpRequest): RequestResult {
        return {
            ok: xhr.status >= 200 && xhr.status < 300,
            status: xhr.status,
            statusText: xhr.statusText,
            headers: xhr.getAllResponseHeaders(),
            data: xhr.responseText,
            json: <T>() => JSON.parse(xhr.responseText) as T,
        };
    }

    private static errorResponse(xhr: XMLHttpRequest, message: string | null = null): RequestResult {
        return {
            ok: false,
            status: xhr.status,
            statusText: xhr.statusText,
            headers: xhr.getAllResponseHeaders(),
            data: message || xhr.statusText,
            json: <T>() => JSON.parse(message || xhr.statusText) as T,
        };
    }

    private static storeIntoCache(key: string, data: object) {
        cc.sys.localStorage.setItem(key, JSON.stringify(data));
    }

    public static getFromCache(key: string): object {
        return JSON.parse(cc.sys.localStorage.getItem(key));
    }


    public static getAuthHeader(): AuthHeader {
        return {
            'X-Parse-Application-Id': APPLICATION_ID,
            'X-Parse-REST-API-Key': PARSE_REST_API_KEY,
            'Accept': 'application/json'
        }
    }

    public static async get(requestParams: RequestParams,
                            cachedKey: string = null,
                            options: RequestOptions = null
    ) {
        options = options || {
            ignoreCache: false,
            headers: ParseNetwork.getAuthHeader(),
            timeout: DEFAULT_TIMEOUT
        };

        let jsonResult = null;
        try {
            let result: RequestResult = await ParseNetwork.request(GET, requestParams, options);
            jsonResult = ParseNetwork.processResult(result, cachedKey);
        } catch (e) {
            cc.log('exception:', e);
        }
        return jsonResult;
    }

    public static createPointer(className: string, objectId: string): Pointer {
        return {
            '__type': 'Pointer',
            'className': className,
            'objectId': objectId
        }
    }

    public static createFilePointer(name: string, url: string): FilePointer {
        return {
            '__type': 'File',
            'name': name,
            'url': url
        }
    }


    private static processResult(result: RequestResult, cachedKey: string) {
        let jsonResult = null;
        if (result && result.data) {
            jsonResult = JSON.parse(result.data);
            if ('results' in jsonResult && Array.isArray(jsonResult.results)
                && jsonResult.results.length > 0) {
                jsonResult = jsonResult.results;
            }
            !!cachedKey ? ParseNetwork.storeIntoCache(cachedKey, jsonResult) : null;
        } else {
            jsonResult = !!cachedKey ? ParseNetwork.getFromCache(cachedKey) : null;
        }

        return jsonResult;
    }

    private static request(method,
                           requestParams: RequestParams,
                           options: RequestOptions) {

        let {url, queryParams, body, isWhereQuery} = requestParams;
        const ignoreCache = options.ignoreCache || false;
        const headers = options.headers;
        const timeout = options.timeout || DEFAULT_TIMEOUT;

        return new Promise<RequestResult>((resolve, reject) => {
            const xhr = cc.loader.getXMLHttpRequest();
            const requestUrl = this.withQuery(url, queryParams, isWhereQuery);
            xhr.open(method, requestUrl, true);

            if (headers) {
                Object.keys(headers).forEach(key => xhr.setRequestHeader(key, headers[key]));
            }

            if (ignoreCache) {
                xhr.setRequestHeader('Cache-Control', 'no-cache');
            }

            xhr.timeout = timeout;

            xhr.onload = evt => {
                resolve(this.parseXHRResult(xhr));
            };

            xhr.onerror = evt => {
                resolve(this.errorResponse(xhr, 'Failed to make request.'));
            };

            xhr.ontimeout = evt => {
                resolve(this.errorResponse(xhr, 'Request took longer than expected.'));
            };

            if (method === 'post' && body) {
                xhr.setRequestHeader('Content-Type', 'application/json');
                xhr.send(JSON.stringify(body));
            } else {
                xhr.send();
            }
        });
    }
}