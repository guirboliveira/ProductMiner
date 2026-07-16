export interface MLSeller {
  id: number;
  nickname: string;
  permalink?: string;
  seller_reputation?: {
    power_seller_status: string | null;
    level_id: string | null;
    metrics?: {
      sales: {
        period: string;
        completed: number;
      };
    };
  };
}

export interface MLAttribute {
  id: string;
  name: string;
  value_name: string | null;
}

export interface MLProduct {
  id: string;
  title: string;
  price: number;
  original_price: number | null;
  currency_id: string;
  thumbnail: string;
  permalink: string;
  condition: string;
  shipping: {
    free_shipping: boolean;
    logistic_type?: string;
  };
  sold_quantity?: number;
  available_quantity?: number;
  official_store_name?: string;
  official_store_id?: number | null;
  seller: MLSeller;
  address?: {
    state_name: string;
    city_name: string;
  };
  attributes?: MLAttribute[];
  pictures?: Array<{ id: string; url: string }>;
  description?: string;
  category_id?: string;
  video_id?: string | null;
  warranty?: string;
}

export interface MiningFilters {
  query: string;
  siteId: string;
  condition: 'all' | 'new' | 'used';
  shipping: 'all' | 'free';
  minPrice: string;
  maxPrice: string;
  limit: number;
  accessToken?: string;
  searchMode?: 'general' | 'seller' | 'other_seller';
  sellerId?: string;
}

export interface MiningStats {
  totalItems: number;
  averagePrice: number;
  medianPrice: number;
  minPriceItem: MLProduct | null;
  maxPriceItem: MLProduct | null;
  freeShippingCount: number;
  freeShippingPercentage: number;
  officialStoreCount: number;
  officialStorePercentage: number;
  newConditionCount: number;
  usedConditionCount: number;
}

export interface SavedMine {
  id: string;
  timestamp: number;
  name: string;
  filters: MiningFilters;
  productCount: number;
}
