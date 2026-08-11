export async function apiClient<T>(
    url: string, 
    options?: RequestInit
): Promise<T> {
    const response = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...options?.headers,
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(()=>null);

        throw new Error(
            error?.message ?? `Request failed: ${response.status}`
        );
    }

    return response.json();
}