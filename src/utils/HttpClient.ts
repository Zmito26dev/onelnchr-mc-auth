/**
 * Native HttpClient implementation using fetch API to replace http-client-methods
 * and resolve punycode deprecation warnings.
 */

export async function HttpGet(url: string, headers?: Record<string, string>, objectResponse = false): Promise<any> {
  return await HttpCustom("get", url, undefined, headers, objectResponse);
}

export async function HttpPost(url: string, data?: any, headers?: Record<string, string>, objectResponse = false): Promise<any> {
  return await HttpCustom("post", url, data, headers, objectResponse);
}

export async function HttpCustom(
  method: string,
  url: string,
  body?: any,
  headers: Record<string, string> = {},
  objectResponse = false
): Promise<any> {
  if (typeof body === "object" && body !== null) {
    body = JSON.stringify(body);
    if (!headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }
  }

  const options: RequestInit = {
    method: method.toUpperCase(),
    headers: headers,
  };

  if (body) {
    options.body = body;
  }

  const response = await fetch(url, options);

  if (objectResponse) {
    return response;
  }

  return await response.text();
}

export async function HttpGetJson(url: string, headers?: Record<string, string>): Promise<any> {
  const text = await HttpGet(url, headers);
  return JSON.parse(text);
}

export async function HttpPostJson(url: string, data?: any, headers?: Record<string, string>): Promise<any> {
  const text = await HttpPost(url, data, headers);
  return JSON.parse(text);
}

export async function HttpCustomJson(
  method: string,
  url: string,
  body?: any,
  headers?: Record<string, string>
): Promise<any> {
  const text = await HttpCustom(method, url, body, headers, false);
  return JSON.parse(text);
}
