interface UnsplashSearchResponse {
  results?: {
    id: string;
    urls?: { regular?: string; small?: string; thumb?: string };
    description?: string | null;
    alt_description?: string | null;
    user?: { name?: string };
    links?: { html?: string };
  }[];
  errors?: string[];
  error?: string;
}

export interface UnsplashPhoto {
  id: string;
  url: string;
  thumb: string;
  description: string | null;
  photographer: string | null;
  link: string | null;
}

export async function searchUnsplashPhotos(_userId: number, query: string, perPage = 9) {
  const trimmed = query.trim();
  if (!trimmed) {
    return { error: 'Search query is required', status: 400 };
  }

  const params = new URLSearchParams({
    page: '1',
    query: trimmed,
    per_page: String(perPage),
  });
  const response = await fetch(`https://unsplash.com/napi/search/photos?${params.toString()}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0',
      Accept: '*/*',
      'Accept-Language': 'en-US',
      Referer: `https://unsplash.com/s/photos/${encodeURIComponent(trimmed)}`,
      'client-geo-region': 'global',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Site': 'same-origin',
    },
  });
  let data: UnsplashSearchResponse;
  try {
    data = await response.json() as UnsplashSearchResponse;
  } catch {
    return { error: 'Unsplash search unavailable', status: response.ok ? 502 : response.status };
  }

  if (!response.ok) {
    return { error: data.errors?.[0] || data.error || 'Unsplash search unavailable', status: response.status };
  }

  const photos: UnsplashPhoto[] = (data.results || [])
    .map((p) => ({
      id: p.id,
      url: p.urls?.regular || '',
      thumb: p.urls?.small || p.urls?.thumb || p.urls?.regular || '',
      description: p.description || p.alt_description || null,
      photographer: p.user?.name || null,
      link: p.links?.html || null,
    }))
    .filter((p) => p.url && p.thumb)
    .slice(0, perPage);

  return { photos };
}
