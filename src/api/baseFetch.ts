export async function basePostFetch(
    url: string,
    headers?: any,
    body?: any
): Promise<any> {
    return await baseFetch(url, 'POST', headers, body);
}

export async function baseGetFetch(
    url: string,
    headers?: any,
): Promise<any> {
    return await baseFetch(url, 'GET', headers);
}

export async function basePutFetch(
    url: string,
    headers?: any,
    body?: any
): Promise<any> {
    return await baseFetch(url, 'PUT', headers, body);
}

export async function baseDeleteFetch(
    url: string,
    headers?: any,
): Promise<any> {
    return await baseFetch(url, 'DELETE', headers);
}

export async function basePatchFetch(
    url: string,
    headers?: any,
    body?: any
): Promise<any> {
    return await baseFetch(url, 'PATCH', headers, body);
}

async function baseFetch(
    url: string,
    requestType: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    headers?: any,
    body?: any
) {
    console.log("postBody", body);
    const baseHeaders = headers ? {
        ...headers,
        "Content-Type": "application/json"
    } : {
        "Content-Type": "application/json"
    }
    const baseRequestBody = {
        method: requestType,
        headers: baseHeaders,
    }
    const requestBody = body ? {
        ...baseRequestBody,
        body: JSON.stringify(body)
    } : {
        ...baseRequestBody
    }

    const response = await fetch(url, requestBody);
    console.log("response", response);
    const data = await response.json();

    if (!response.ok) {
        console.error("Request failed", data);
        throw new Error(`[${response.status}] ${response.statusText}`);
    }

    return data;
}