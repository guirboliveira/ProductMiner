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
 * Generates high-quality realistic mock products for fallback/demo mode
 */
export function generateMockProducts(filters: MiningFilters): MLProduct[] {
  const { query, limit, condition, minPrice, maxPrice } = filters;
  const count = Math.min(limit || 50, 100);
  const min = minPrice ? parseFloat(minPrice) : 50;
  const max = maxPrice ? parseFloat(maxPrice) : 8000;

  const products: MLProduct[] = [];
  const queryLower = query.toLowerCase();

  let category = 'generic';
  if (queryLower.includes('phone') || queryLower.includes('iphone') || queryLower.includes('celular')) {
    category = 'smartphone';
  } else if (queryLower.includes('tv') || queryLower.includes('televis') || queryLower.includes('smart tv')) {
    category = 'tv';
  } else if (queryLower.includes('notebook') || queryLower.includes('laptop') || queryLower.includes('macbook')) {
    category = 'notebook';
  }

  const phoneModels = ['iPhone 13 128GB', 'Samsung Galaxy S23 Ultra', 'iPhone 14 Pro Max 256GB', 'Xiaomi Redmi Note 12 Pro', 'Motorola Edge 40', 'iPhone 15 Pro 128GB', 'Samsung Galaxy A54 5G'];
  const tvModels = ['Smart TV LG 50" 4K UHD', 'Smart TV Samsung 55" QLED 4K', 'Smart TV TCL 65" 4K HDR', 'Smart TV Philips 43" Full HD Ambilight', 'Smart TV LG OLEDEvo 55" 4K', 'Smart TV Samsung Neo QLED 65"'];
  const notebookModels = ['Notebook Dell Inspiron 15', 'Lenovo IdeaPad 3 AMD Ryzen 5', 'MacBook Air M2 8GB 256GB SSD', 'Notebook Acer Aspire 5 Intel Core i5', 'Notebook Asus Vivobook 15', 'MacBook Pro M3 16GB 512GB SSD'];
  const genericModels = [
    `${query} Pro Edition`,
    `${query} Premium Series`,
    `${query} Slim Ultra`,
    `${query} Advanced V2`,
    `${query} Professional Standard`,
    `${query} Compact Portable`,
    `${query} Essential Pack`
  ];

  const brands = {
    smartphone: ['Apple', 'Samsung', 'Xiaomi', 'Motorola'],
    tv: ['LG', 'Samsung', 'TCL', 'Philips'],
    notebook: ['Dell', 'Lenovo', 'Apple', 'Acer', 'Asus'],
    generic: ['GenericCorp', 'Acme', 'TechCorp', 'PremiumBrands']
  };

  const images = {
    smartphone: [
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=350&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=350&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1565849906461-0965d34a19fc?w=350&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=350&auto=format&fit=crop&q=80'
    ],
    tv: [
      'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=350&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1593789198777-f29bc259780e?w=350&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1601944179066-297acd3ad6d5?w=350&auto=format&fit=crop&q=80'
    ],
    notebook: [
      'https://images.unsplash.com/photo-1496181130204-7552cc145cdb?w=350&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=350&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=350&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=350&auto=format&fit=crop&q=80'
    ],
    generic: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=350&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=350&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=350&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=350&auto=format&fit=crop&q=80'
    ]
  };

  const sellerNicknames = ['STORE_OFICIAL', 'TECH_MAGAZINE', 'E-COMMERCE_BRASIL', 'BEST_DEALS', 'SHOP_RAPIDO', 'PRO_SHOP'];

  for (let i = 0; i < count; i++) {
    const id = `MLB-MOCK${Math.floor(Math.random() * 900000000 + 100000000)}`;
    let modelName = '';
    
    if (category === 'smartphone') {
      modelName = phoneModels[i % phoneModels.length];
    } else if (category === 'tv') {
      modelName = tvModels[i % tvModels.length];
    } else if (category === 'notebook') {
      modelName = notebookModels[i % notebookModels.length];
    } else {
      modelName = `${genericModels[i % genericModels.length]} #${i + 1}`;
    }

    // Generate random price within filters
    const basePrice = min + (Math.random() * (Math.max(min + 10, max) - min));
    const price = Math.round(basePrice * 100) / 100;
    const originalPrice = Math.random() > 0.5 ? Math.round(price * 1.15 * 100) / 100 : null;

    const catImages = images[category as keyof typeof images] || images.generic;
    const thumbnail = catImages[i % catImages.length];

    const prodCondition = condition === 'all' ? (Math.random() > 0.15 ? 'new' : 'used') : condition;

    const prodShipping = {
      free_shipping: filters.shipping === 'free' ? true : Math.random() > 0.4,
      logistic_type: Math.random() > 0.5 ? 'fulfillment' : 'cross_docking'
    };

    const isOfficialStore = Math.random() > 0.7;
    const sellerNick = sellerNicknames[i % sellerNicknames.length];

    products.push({
      id,
      title: modelName,
      price,
      original_price: originalPrice,
      currency_id: filters.siteId === 'MLU' ? 'UYU' : (filters.siteId === 'MLB' ? 'BRL' : 'USD'),
      thumbnail,
      permalink: 'https://www.mercadolivre.com.br',
      condition: prodCondition,
      shipping: prodShipping,
      sold_quantity: Math.floor(Math.random() * 250) + 5,
      available_quantity: Math.floor(Math.random() * 50) + 1,
      official_store_id: isOfficialStore ? Math.floor(Math.random() * 1000) : null,
      official_store_name: isOfficialStore ? `${sellerNick.replace('_', ' ')} Oficial` : '',
      seller: {
        id: Math.floor(Math.random() * 9000000) + 1000000,
        nickname: sellerNick,
        permalink: 'https://www.mercadolivre.com.br',
        seller_reputation: {
          power_seller_status: Math.random() > 0.5 ? 'platinum' : 'gold',
          level_id: '5_green'
        }
      },
      address: {
        state_name: ['São Paulo', 'Rio de Janeiro', 'Minas Gerais', 'Paraná', 'Santa Catarina'][i % 5],
        city_name: ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Curitiba', 'Florianópolis'][i % 5]
      },
      attributes: [
        { id: 'BRAND', name: 'Marca', value_name: brands[category as keyof typeof brands][i % brands[category as keyof typeof brands].length] },
        { id: 'MODEL', name: 'Modelo', value_name: modelName.split(' ')[1] || 'Standard' }
      ]
    });
  }

  return products;
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
  const { siteId, query, condition, shipping, minPrice, maxPrice, limit, accessToken } = filters;
  
  if (!query.trim()) return [];

  // Setup headers
  const headers: Record<string, string> = {
    'Accept': 'application/json',
  };
  if (accessToken && accessToken.trim()) {
    headers['Authorization'] = `Bearer ${accessToken.trim()}`;
  }

  let products: MLProduct[] = [];
  const limitPerRequest = 50;
  const totalToFetch = Math.min(limit, 200); // Caps mining at 200 items for speed and API safety
  
  let offset = 0;
  let hasMore = true;

  // Build base query parameters
  const baseParams = new URLSearchParams({
    q: query,
    limit: String(limitPerRequest),
  });

  if (condition !== 'all') {
    baseParams.append('condition', condition);
  }
  if (shipping === 'free') {
    baseParams.append('shipping_cost', 'free');
  }
  if (minPrice) {
    baseParams.append('price', `${minPrice}-${maxPrice || '*'}`);
  } else if (maxPrice) {
    baseParams.append('price', `*-${maxPrice}`);
  }

  try {
    while (products.length < totalToFetch && hasMore) {
      const params = new URLSearchParams(baseParams);
      params.append('offset', String(offset));

      const url = `${ML_API_BASE}/sites/${siteId}/search?${params.toString()}`;
      
      const response = await fetch(url, { headers });
      
      // If we encounter a CORS block, a 403 Forbidden, or 401 Unauthorized, fall back to mock data.
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      const results = data.results || [];
      
      if (results.length === 0) {
        hasMore = false;
        break;
      }

      // Map response to our clean MLProduct format
      const mappedResults: MLProduct[] = results.map((item: any) => ({
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
          seller_reputation: item.seller?.seller_reputation ? {
            power_seller_status: item.seller.seller_reputation.power_seller_status || null,
            level_id: item.seller.seller_reputation.level_id || null,
          } : undefined,
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

      products = [...products, ...mappedResults];
      
      // Update progress callback
      if (onProgress) {
        onProgress(products.length, totalToFetch);
      }

      offset += limitPerRequest;
      
      // Check if we reached the end of results
      if (results.length < limitPerRequest || products.length >= totalToFetch) {
        hasMore = false;
      }
    }

    if (onDemoModeActive) {
      onDemoModeActive(false);
    }
    return products.slice(0, totalToFetch);

  } catch (error) {
    console.warn('API request failed. Falling back to Demo/Mock Mode:', error);
    if (onDemoModeActive) {
      onDemoModeActive(true);
    }
    
    // Simulate mining progress for better UX in mock mode
    let progress = 0;
    const mockProducts = generateMockProducts(filters);
    const step = Math.ceil(mockProducts.length / 4);
    
    while (progress < mockProducts.length) {
      progress = Math.min(progress + step, mockProducts.length);
      if (onProgress) {
        onProgress(progress, mockProducts.length);
      }
      // Brief delay to simulate network latency
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
    
    return mockProducts;
  }
}

/**
 * Fetches full product details including high-res pictures and category attributes
 */
export async function fetchProductDetails(productId: string, accessToken?: string): Promise<Partial<MLProduct>> {
  if (productId.startsWith('MLB-MOCK')) {
    // Return high-quality mock details
    return {
      pictures: [
        { id: 'pic1', url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80' },
        { id: 'pic2', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80' },
        { id: 'pic3', url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80' }
      ],
      available_quantity: Math.floor(Math.random() * 20) + 2,
      video_id: null,
      warranty: 'Garantia oficial de 12 meses com o fabricante.',
    };
  }

  const headers: Record<string, string> = {};
  if (accessToken && accessToken.trim()) {
    headers['Authorization'] = `Bearer ${accessToken.trim()}`;
  }

  try {
    const response = await fetch(`${ML_API_BASE}/items/${productId}`, { headers });
    if (!response.ok) throw new Error('Failed to fetch details');
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
  } catch (error) {
    console.error('Error fetching product details, returning mock fallback:', error);
    return {
      pictures: [
        { id: 'pic1', url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80' }
      ],
      available_quantity: 5,
      warranty: 'Informação de garantia indisponível.',
    };
  }
}

/**
 * Fetches item description
 */
export async function fetchProductDescription(productId: string, accessToken?: string): Promise<string> {
  if (productId.startsWith('MLB-MOCK')) {
    return 'Descrição do produto fornecida em modo de demonstração. Este produto simulado oferece os mais altos padrões de qualidade com ótimo custo-benefício, garantindo satisfação total para suas necessidades de trabalho, estudo e lazer.';
  }

  const headers: Record<string, string> = {};
  if (accessToken && accessToken.trim()) {
    headers['Authorization'] = `Bearer ${accessToken.trim()}`;
  }

  try {
    const response = await fetch(`${ML_API_BASE}/items/${productId}/description`, { headers });
    if (!response.ok) return '';
    const data = await response.json();
    return data.plain_text || data.text || '';
  } catch (error) {
    console.error('Error fetching product description:', error);
    return 'Descrição de produto detalhada não pôde ser carregada do Mercado Livre.';
  }
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
