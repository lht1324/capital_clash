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
    body?: Record<string, any>
): Promise<any> {
    return await baseFetch(url, 'DELETE', headers, body);
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

export async function baseFilePostFetch(
    url: string,
    headers: Record<string, string> | undefined = undefined,
    body: Record<string, any>  // { file: File, ...extraFields }
): Promise<any> {
    /* ① JavaScript 객체 → FormData */
    const form = new FormData();
    Object.entries(body).forEach(([key, value]) => {
        if (value instanceof File || value instanceof Blob) {
            // 파일·Blob은 그대로
            form.append(key, value, (value as File).name ?? 'blob');
        } else if (value !== undefined && value !== null) {
            // 나머지는 문자열로
            form.append(key, String(value));
        }
    });

    /* ② JSON 전송과 달리 Content-Type 헤더를 건드리지 않는다 */
    const response = await fetch(url, {
        method: 'POST',
        headers,      // Authorization 등이 필요하면 여기에
        body: form,   // boundary 포함 multipart/form-data 자동 설정
    });

    const data = await (response.headers
        .get('content-type')
        ?.includes('application/json')
        ? response.json()
        : response.text());

    if (!response.ok) {
        console.error('[baseFilePostFetch] request failed', data);
        throw new Error(`[${response.status}] ${response.statusText}`);
    }
    return data;
}