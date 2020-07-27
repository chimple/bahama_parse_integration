import {APPLICATION_ID, DEFAULT_TIMEOUT, GET, PARSE_REST_API_KEY} from '../constants';
import {FilePointer, Pointer} from '../domain/parseSchool';
import {ParseApi} from "./parseApi";
import {ParseLoggedInUser} from "../domain/parseLoggedInUser";

export interface RequestOptions {
    ignoreCache?: boolean;
    headers?: { [key: string]: string };
    timeout?: number; // 0 (or negative) to wait forever
    responseType?: XMLHttpRequestResponseType;
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
    includeParam?: string;
}


export interface RequestResult {
    ok: boolean;
    status: number;
    statusText: string;
    data: any;
    headers: string;
    responseType?: XMLHttpRequestResponseType;
}

export class ParseNetwork {

    private static withQuery(url: string, params: QueryParams, isWhereQuery: boolean, includeParam: string): string {
        if (!params) return url;
        const queryString = this.queryParams(params, isWhereQuery);
        const sep: string = url.indexOf('?') === -1 ? '?' : '&';
        let includeCriteria = !!includeParam ? '&include=' + includeParam : '';
        return queryString ? url + sep + queryString + includeCriteria: url;
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
        let isTextResponse = xhr.responseType === '' || xhr.responseType === 'text';
        let isJsonResponse = xhr.responseType === 'json';
        return {
            ok: xhr.status >= 200 && xhr.status < 300,
            status: xhr.status,
            statusText: xhr.statusText,
            responseType: xhr.responseType,
            headers: xhr.getAllResponseHeaders(),
            data: isTextResponse ? xhr.responseText : xhr.response
        };
    }

    private static errorResponse(xhr: XMLHttpRequest, message: string | null = null): RequestResult {
        return {
            ok: false,
            status: xhr.status,
            statusText: xhr.statusText,
            headers: xhr.getAllResponseHeaders(),
            data: message || xhr.statusText
        };
    }

    private static storeIntoCache(key: string, data: object | string) {
        let storeData = typeof (data) === 'object' ? JSON.stringify(data) : data;
        cc.sys.localStorage.setItem(key, storeData);
    }

    public static getFromCache(key: string): object {
        try {
            return JSON.parse(cc.sys.localStorage.getItem(key));
        } catch (e) {
            return cc.sys.localStorage.getItem(key);
        }
    }


    private static getAuthHeader(): AuthHeader {
        const loggedInUser: ParseLoggedInUser = ParseApi.getLoggedInUser();
        const authHeader: AuthHeader = {
            'X-Parse-Application-Id': APPLICATION_ID,
            'X-Parse-REST-API-Key': PARSE_REST_API_KEY,
            'x-parse-session-token': '',
            'Accept': 'application/json'
        }
        if (!!loggedInUser) {
            authHeader['x-parse-session-token'] = loggedInUser.sessionToken;
        }

        return authHeader;
    }

    public static async loadImage(
        requestParams: RequestParams,
        cachedKey: string = null,
        options: RequestOptions = null
    ) {
        options = options || {
            ignoreCache: false,
            headers: ParseNetwork.getAuthHeader(),
            timeout: DEFAULT_TIMEOUT,
            responseType: "arraybuffer"
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
        try {
            if (result && result.data) {
                let isTextResponse = result.responseType === '' || result.responseType === 'text';
                let isJsonResponse = result.responseType === 'json';
                let isArrayBufferResponse = result.responseType === 'arraybuffer';
                if (isJsonResponse) {
                    jsonResult = result.data;
                    if ('results' in jsonResult && Array.isArray(jsonResult.results)) {
                        jsonResult = jsonResult.results;
                    }
                    !!cachedKey ? ParseNetwork.storeIntoCache(cachedKey, jsonResult) : null;
                } else if (isArrayBufferResponse) {
                    let base64 = this.createBase64Image(result);
                    !!cachedKey ? ParseNetwork.storeIntoCache(cachedKey, base64) : null;
                }
            } else {
                jsonResult = !!cachedKey ? ParseNetwork.getFromCache(cachedKey) : null;
            }
        } catch (e) {
            cc.log('exception', e);
        }

        return jsonResult;
    }

    private static createBase64Image(result: RequestResult) {
        let uInt8Array = new Uint8Array(result.data);
        var i = uInt8Array.length;
        var biStr = new Array(i);
        while (i--) {
            biStr[i] = String.fromCharCode(uInt8Array[i]);
        }
        let base64 = window.btoa(biStr.join(''));
        return base64;
    }

    private static request(method,
                           requestParams: RequestParams,
                           options: RequestOptions) {

        let {url, queryParams, body, isWhereQuery, includeParam} = requestParams;
        const ignoreCache = options.ignoreCache || false;
        const headers = options.headers;
        const timeout = options.timeout || DEFAULT_TIMEOUT;

        return new Promise<RequestResult>((resolve, reject) => {
            const xhr = cc.loader.getXMLHttpRequest();
            xhr.responseType = !!options.responseType ? options.responseType : 'json';
            const requestUrl = this.withQuery(url, queryParams, isWhereQuery, includeParam);
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