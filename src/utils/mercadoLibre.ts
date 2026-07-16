import { MLProduct, MiningFilters, MiningStats } from '../types';

export const ML_SITES = [
  { id: 'MLB', name: 'Brasil 🇧🇷', currency: 'R$' },
  { id: 'MLA', name: 'Argentina 🇦🇷', currency: '$' },
  { id: 'MLM', name: 'México 🇲🇽', currency: '$' },
  { id: 'MLC', name: 'Chile 🇨🇱', currency: '$' },
  { id: 'MCO', name: 'Colômbia 🇨🇴', currency: '$' },
  { id: 'MLU', name: 'Uruguai 🇺🇾', currency: '$U' },
  { id: 'MPE', name: 'Peru 🇵🇪', currency: 'S/' },
];

const isDevelopment = import.meta.env.DEV;
const ML_API_BASE = isDevelopment ? '/api-ml' : 'https://api.mercadolibre.com';

/**
 * Normalizes thumbnails to high resolution
 */
export function getHighResImage(url: string): string {
  if (!url) return '';
  // Replace HTTP with HTTPS
  let secureUrl = url.replace('http://', 'https://');
  // Mercado Libre thumbnails: replaces ending '-I.jpg' or '-V.jpg' with '-O.jpg' for high-resolution
  if (secureUrl.includes('-I.jpg')) {
    secureUrl = secureUrl.replace('-I.jpg', '-O.jpg');
  } else if (secureUrl.includes('-V.jpg')) {
    secureUrl = secureUrl.replace('-V.jpg', '-O.jpg');
  }
  return secureUrl;
}



/**
 * Mines products from Mercado Libre using the search API, supporting pagination.
 * Falls back to mock data if fetch fails or lacks token.
 */
export async function mineProducts(
  filters: MiningFilters,
  onProgress?: (fetched: number, total: number) => void,
  onDemoModeActive?: (active: boolean) => void
): Promise<MLProduct[]> {
  const { siteId, query, condition, shipping, minPrice, maxPrice, accessToken, searchMode } = filters;
  
  if (searchMode !== 'seller' && searchMode !== 'other_seller' && !query.trim()) return [];
  if (searchMode === 'other_seller' && !filters.sellerId?.trim()) {
    throw new Error("Você precisa especificar o ID do vendedor.");
  }

  // Setup headers
  const headers: Record<string, string> = {
    'Accept': 'application/json',
  };
  if (accessToken && accessToken.trim()) {
    headers['Authorization'] = `Bearer ${accessToken.trim()}`;
  }

  // Seller Mode: fetch own product listings using users/me/items/search
  if (searchMode === 'seller') {
    if (!accessToken) {
      throw new Error("Você precisa estar conectado via API para buscar os seus anúncios.");
    }
    try {
      // 1. Fetch user ID dynamically from users/me since /items/search doesn't support the 'me' alias
      const profileResponse = await fetch(`${ML_API_BASE}/users/me`, { headers });
      if (!profileResponse.ok) {
        const errBody = await profileResponse.json().catch(() => ({}));
        const err: any = new Error(`Erro ao obter perfil do usuário: ${errBody.message || errBody.error || profileResponse.statusText} (Status ${profileResponse.status})`);
        err.status = profileResponse.status;
        throw err;
      }
      const profileData = await profileResponse.json();
      const userId = profileData.id;
      if (!userId) {
        throw new Error("Não foi possível identificar o seu ID de vendedor.");
      }

      // 2. Fetch own product listings using the numeric user ID
      const searchUrl = `${ML_API_BASE}/users/${userId}/items/search?limit=50`;
      const searchResponse = await fetch(searchUrl, { headers });
      if (!searchResponse.ok) {
        const errBody = await searchResponse.json().catch(() => ({}));
        const err: any = new Error(`Erro ao buscar seus anúncios: ${errBody.message || errBody.error || searchResponse.statusText} (Status ${searchResponse.status})`);
        err.status = searchResponse.status;
        throw err;
      }
      
      const searchData = await searchResponse.json();
      const itemIds = searchData.results || [];
      
      if (itemIds.length === 0) {
        return [];
      }

      // Limit to the first 15 items for testing
      const targetIds = itemIds.slice(0, 15);
      
      if (onProgress) {
        onProgress(5, targetIds.length);
      }

      const itemsUrl = `${ML_API_BASE}/items?ids=${targetIds.join(',')}`;
      const itemsResponse = await fetch(itemsUrl, { headers });
      
      if (!itemsResponse.ok) {
        const errBody = await itemsResponse.json().catch(() => ({}));
        const err: any = new Error(`Erro ao obter detalhes dos seus anúncios: ${errBody.message || errBody.error || itemsResponse.statusText} (Status ${itemsResponse.status})`);
        err.status = itemsResponse.status;
        throw err;
      }

      const itemsData = await itemsResponse.json();
      
      if (onProgress) {
        onProgress(10, targetIds.length);
      }

      const detailedProducts = itemsData.map((responseObj: any) => {
        if (responseObj.code !== 200 || !responseObj.body) {
          return null;
        }

        const item = responseObj.body;
        return {
          id: item.id,
          title: item.title,
          price: item.price,
          original_price: item.original_price || null,
          currency_id: item.currency_id,
          thumbnail: item.pictures?.[0]?.secure_url || item.pictures?.[0]?.url || getHighResImage(item.thumbnail || ''),
          pictures: (item.pictures || []).map((pic: any) => ({
            id: pic.id,
            url: pic.secure_url || pic.url,
          })),
          permalink: item.permalink || '',
          condition: item.condition || 'new',
          shipping: {
            free_shipping: item.shipping?.free_shipping || false,
            logistic_type: item.shipping?.logistic_type || '',
          },
          sold_quantity: item.sold_quantity || item.sell_flow_info?.sold_quantity || 0,
          available_quantity: item.available_quantity || 0,
          official_store_id: item.official_store_id || null,
          official_store_name: item.official_store_name || '',
          seller: {
            id: item.seller_id || 0,
            nickname: 'Você',
            permalink: '',
          },
          attributes: (item.attributes || []).map((attr: any) => ({
            id: attr.id,
            name: attr.name,
            value_name: attr.value_name,
          })),
          warranty: item.warranty || '',
          video_id: item.video_id || null,
        };
      }).filter((p: any): p is MLProduct => p !== null);

      // If a search query is specified, filter in memory
      if (query && query.trim()) {
        const queryLower = query.toLowerCase();
        return detailedProducts.filter((p: MLProduct) => p.title.toLowerCase().includes(queryLower));
      }

      if (onProgress) {
        onProgress(targetIds.length, targetIds.length);
      }
      return detailedProducts;
    } catch (error: any) {
      console.error('Seller products mining failed:', error);
      throw error;
    }
  }

  // Define total items to mine (first 15 positions)
  const totalToFetch = 15;

  // Build query parameters for search
  const params = new URLSearchParams({
    limit: String(totalToFetch),
  });
  if (searchMode === 'other_seller' && filters.sellerId) {
    params.append('seller_id', filters.sellerId.trim());
  }
  if (query && query.trim()) {
    params.append('q', query);
  }

  if (condition !== 'all') {
    params.append('condition', condition);
  }
  if (shipping === 'free') {
    params.append('shipping_cost', 'free');
  }
  if (minPrice) {
    params.append('price', `${minPrice}-${maxPrice || '*'}`);
  } else if (maxPrice) {
    params.append('price', `*-${maxPrice}`);
  }

  try {
    const searchUrl = `${ML_API_BASE}/sites/${siteId}/search?${params.toString()}`;
    
    const searchResponse = await fetch(searchUrl, { headers });
    if (!searchResponse.ok) {
      const errBody = await searchResponse.json().catch(() => ({}));
      const err: any = new Error(`Failed to fetch search results: ${errBody.message || errBody.error || searchResponse.statusText} (Status ${searchResponse.status})`);
      err.status = searchResponse.status;
      throw err;
    }
    
    const searchData = await searchResponse.json();
    const searchResults = searchData.results || [];
    
    if (searchResults.length === 0) {
      if (onDemoModeActive) {
        onDemoModeActive(false);
      }
      return [];
    }

    // Limit to the top 15 results
    const topResults = searchResults.slice(0, totalToFetch);
    const itemIds = topResults.map((item: any) => item.id);

    if (onProgress) {
      onProgress(5, totalToFetch); // Indicate progress starting
    }

    // 2. Fetch the rich details via multi-get /items endpoint
    let detailedProducts: MLProduct[] = [];
    try {
      const itemsUrl = `${ML_API_BASE}/items?ids=${itemIds.join(',')}`;
      const itemsResponse = await fetch(itemsUrl, { headers });
      
      if (!itemsResponse.ok) {
        throw new Error(`Failed to fetch items details: ${itemsResponse.status} ${itemsResponse.statusText}`);
      }

      const itemsData = await itemsResponse.json();
      
      if (onProgress) {
        onProgress(10, totalToFetch); // Progress step
      }

      // Map and merge search results with detailed data
      detailedProducts = itemsData.map((responseObj: any) => {
        if (responseObj.code !== 200 || !responseObj.body) {
          return null;
        }

        const item = responseObj.body;
        const searchItem = topResults.find((r: any) => r.id === item.id);

        return {
          id: item.id,
          title: item.title,
          price: item.price,
          original_price: item.original_price || searchItem?.original_price || null,
          currency_id: item.currency_id,
          thumbnail: item.pictures?.[0]?.secure_url || item.pictures?.[0]?.url || getHighResImage(item.thumbnail || searchItem?.thumbnail || ''),
          pictures: (item.pictures || []).map((pic: any) => ({
            id: pic.id,
            url: pic.secure_url || pic.url,
          })),
          permalink: item.permalink || searchItem?.permalink || '',
          condition: item.condition || searchItem?.condition || 'new',
          shipping: {
            free_shipping: item.shipping?.free_shipping || searchItem?.shipping?.free_shipping || false,
            logistic_type: item.shipping?.logistic_type || searchItem?.shipping?.logistic_type || '',
          },
          sold_quantity: item.sold_quantity || item.sell_flow_info?.sold_quantity || searchItem?.sold_quantity || 0,
          available_quantity: item.available_quantity || searchItem?.available_quantity || 0,
          official_store_id: item.official_store_id || searchItem?.official_store_id || null,
          official_store_name: item.official_store_name || searchItem?.official_store_name || '',
          seller: {
            id: item.seller_id || searchItem?.seller?.id || 0,
            nickname: searchItem?.seller?.nickname || 'Vendedor',
            permalink: searchItem?.seller?.permalink || '',
            seller_reputation: searchItem?.seller?.seller_reputation,
          },
          address: searchItem?.address || (item.address ? {
            state_name: item.address.state_name || '',
            city_name: item.address.city_name || '',
          } : undefined),
          attributes: (item.attributes || []).map((attr: any) => ({
            id: attr.id,
            name: attr.name,
            value_name: attr.value_name,
          })),
          warranty: item.warranty || '',
          video_id: item.video_id || null,
        };
      }).filter((p: any): p is MLProduct => p !== null);

    } catch (itemsErr) {
      console.warn('Failed to fetch product details. Falling back to search metadata:', itemsErr);
      
      // Fallback: map search results directly if items details call fails
      detailedProducts = topResults.map((item: any) => ({
        id: item.id,
        title: item.title,
        price: item.price,
        original_price: item.original_price || null,
        currency_id: item.currency_id,
        thumbnail: getHighResImage(item.thumbnail),
        permalink: item.permalink,
        condition: item.condition,
        shipping: {
          free_shipping: item.shipping?.free_shipping || false,
          logistic_type: item.shipping?.logistic_type || '',
        },
        sold_quantity: item.sold_quantity || item.sell_flow_info?.sold_quantity || 0,
        available_quantity: item.available_quantity || 0,
        official_store_id: item.official_store_id || null,
        official_store_name: item.official_store_name || '',
        seller: {
          id: item.seller?.id || 0,
          nickname: item.seller?.nickname || 'Vendedor',
          permalink: item.seller?.permalink || '',
          seller_reputation: item.seller?.seller_reputation,
        },
        address: item.address ? {
          state_name: item.address.state_name || '',
          city_name: item.address.city_name || '',
        } : undefined,
        attributes: (item.attributes || []).map((attr: any) => ({
          id: attr.id,
          name: attr.name,
          value_name: attr.value_name,
        })),
      }));
    }

    if (onProgress) {
      onProgress(totalToFetch, totalToFetch);
    }
    if (onDemoModeActive) {
      onDemoModeActive(false);
    }
    
    return detailedProducts;

  } catch (error: any) {
    console.error('API request failed:', error);
    if (onDemoModeActive) {
      onDemoModeActive(false);
    }
    throw error;
  }
}

/**
 * Fetches full product details including high-res pictures and category attributes
 */
export async function fetchProductDetails(productId: string, accessToken?: string): Promise<Partial<MLProduct>> {
  const headers: Record<string, string> = {};
  if (accessToken && accessToken.trim()) {
    headers['Authorization'] = `Bearer ${accessToken.trim()}`;
  }

  const response = await fetch(`${ML_API_BASE}/items/${productId}`, { headers });
  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    const err: any = new Error(`Erro ao obter detalhes do item: ${errBody.message || errBody.error || response.statusText} (Status ${response.status})`);
    err.status = response.status;
    throw err;
  }
  const data = await response.json();

  return {
    pictures: (data.pictures || []).map((pic: any) => ({
      id: pic.id,
      url: pic.secure_url || pic.url,
    })),
    attributes: (data.attributes || []).map((attr: any) => ({
      id: attr.id,
      name: attr.name,
      value_name: attr.value_name,
    })),
    available_quantity: data.available_quantity || 0,
    video_id: data.video_id || null,
    warranty: data.warranty || '',
  };
}

/**
 * Fetches item description
 */
export async function fetchProductDescription(productId: string, accessToken?: string): Promise<string> {
  const headers: Record<string, string> = {};
  if (accessToken && accessToken.trim()) {
    headers['Authorization'] = `Bearer ${accessToken.trim()}`;
  }

  const response = await fetch(`${ML_API_BASE}/items/${productId}/description`, { headers });
  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    const err: any = new Error(`Erro ao obter descrição do item: ${errBody.message || errBody.error || response.statusText} (Status ${response.status})`);
    err.status = response.status;
    throw err;
  }
  const data = await response.json();
  return data.plain_text || data.text || '';
}

/**
 * Compiles statistic indicators based on mined products
 */
export function calculateStats(products: MLProduct[]): MiningStats {
  if (products.length === 0) {
    return {
      totalItems: 0,
      averagePrice: 0,
      medianPrice: 0,
      minPriceItem: null,
      maxPriceItem: null,
      freeShippingCount: 0,
      freeShippingPercentage: 0,
      officialStoreCount: 0,
      officialStorePercentage: 0,
      newConditionCount: 0,
      usedConditionCount: 0,
    };
  }

  const prices = products.map((p) => p.price).sort((a, b) => a - b);
  const totalItems = products.length;

  const totalSum = prices.reduce((sum, p) => sum + p, 0);
  const averagePrice = totalSum / totalItems;

  let medianPrice = 0;
  const mid = Math.floor(totalItems / 2);
  if (totalItems % 2 === 0) {
    medianPrice = (prices[mid - 1] + prices[mid]) / 2;
  } else {
    medianPrice = prices[mid];
  }

  let minPriceItem = products[0];
  let maxPriceItem = products[0];

  products.forEach((p) => {
    if (p.price < minPriceItem.price) minPriceItem = p;
    if (p.price > maxPriceItem.price) maxPriceItem = p;
  });

  const freeShippingCount = products.filter((p) => p.shipping.free_shipping).length;
  const freeShippingPercentage = (freeShippingCount / totalItems) * 100;

  const officialStoreCount = products.filter((p) => p.official_store_id !== null).length;
  const officialStorePercentage = (officialStoreCount / totalItems) * 100;

  const newConditionCount = products.filter((p) => p.condition === 'new').length;
  const usedConditionCount = products.filter((p) => p.condition === 'used').length;

  return {
    totalItems,
    averagePrice,
    medianPrice,
    minPriceItem,
    maxPriceItem,
    freeShippingCount,
    freeShippingPercentage,
    officialStoreCount,
    officialStorePercentage,
    newConditionCount,
    usedConditionCount,
  };
}
