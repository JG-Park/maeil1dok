import { ref, Ref } from 'vue'

interface CacheEntry<T> {
  data: T
  timestamp: number
  etag?: string
}

interface CacheOptions {
  ttl?: number // Time to live in milliseconds
  key?: string // Custom cache key
  forceRefresh?: boolean // Force bypass cache
  staleWhileRevalidate?: boolean // Return stale data while fetching fresh
}

const cacheStore = new Map<string, CacheEntry<any>>()

/**
 * API Response caching composable
 */
export function useApiCache<T>() {
  const isLoading = ref(false)
  const isCached = ref(false)
  const isStale = ref(false)
  const error = ref<Error | null>(null)
  const data = ref<T | null>(null) as Ref<T | null>
  
  /**
   * Generate cache key from URL and params
   */
  function generateCacheKey(url: string, params?: any): string {
    const paramString = params ? JSON.stringify(params) : ''
    return `${url}:${paramString}`
  }
  
  /**
   * Check if cache entry is still valid
   */
  function isCacheValid(entry: CacheEntry<T>, ttl: number): boolean {
    return Date.now() - entry.timestamp < ttl
  }
  
  /**
   * Get cached data if available and valid
   */
  function getCachedData(key: string, ttl: number): T | null {
    const entry = cacheStore.get(key)
    
    if (!entry) {
      return null
    }
    
    if (isCacheValid(entry, ttl)) {
      isCached.value = true
      isStale.value = false
      return entry.data
    }
    
    // Data is stale but still available
    isStale.value = true
    return entry.data
  }
  
  /**
   * Set data in cache
   */
  function setCacheData(key: string, data: T, etag?: string) {
    cacheStore.set(key, {
      data,
      timestamp: Date.now(),
      etag
    })
  }
  
  /**
   * Clear specific cache entry
   */
  function clearCache(key?: string) {
    if (key) {
      cacheStore.delete(key)
    } else {
      cacheStore.clear()
    }
  }
  
  /**
   * Fetch data with caching
   */
  async function fetchWithCache(
    fetchFn: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T | null> {
    const {
      ttl = 5 * 60 * 1000, // Default 5 minutes
      key = 'default',
      forceRefresh = false,
      staleWhileRevalidate = true
    } = options
    
    error.value = null
    
    // Check cache first unless force refresh
    if (!forceRefresh) {
      const cached = getCachedData(key, ttl)
      
      if (cached && !isStale.value) {
        data.value = cached
        return cached
      }
      
      // Return stale data immediately if enabled
      if (cached && isStale.value && staleWhileRevalidate) {
        data.value = cached
        // Continue to fetch fresh data in background
      }
    }
    
    // Fetch fresh data
    isLoading.value = true
    isCached.value = false
    
    try {
      const freshData = await fetchFn()
      
      // Update cache
      setCacheData(key, freshData)
      
      // Update reactive data
      data.value = freshData
      isStale.value = false
      
      return freshData
    } catch (err: any) {
      error.value = err
      console.error('Cache fetch error:', err)
      
      // If we have stale data and fetch failed, keep using it
      if (isStale.value && data.value) {
        return data.value
      }
      
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  /**
   * Invalidate cache entries matching a pattern
   */
  function invalidateCache(pattern?: RegExp | string) {
    if (!pattern) {
      cacheStore.clear()
      return
    }
    
    const regex = typeof pattern === 'string' 
      ? new RegExp(pattern) 
      : pattern
    
    for (const key of cacheStore.keys()) {
      if (regex.test(key)) {
        cacheStore.delete(key)
      }
    }
  }
  
  /**
   * Prefetch and cache data
   */
  async function prefetch(
    fetchFn: () => Promise<T>,
    key: string,
    ttl: number = 5 * 60 * 1000
  ) {
    try {
      const data = await fetchFn()
      setCacheData(key, data)
      return data
    } catch (err) {
      console.error('Prefetch error:', err)
      return null
    }
  }
  
  /**
   * Get cache statistics
   */
  function getCacheStats() {
    const stats = {
      size: cacheStore.size,
      entries: [] as Array<{
        key: string
        age: number
        isStale: boolean
      }>
    }
    
    const now = Date.now()
    for (const [key, entry] of cacheStore.entries()) {
      stats.entries.push({
        key,
        age: now - entry.timestamp,
        isStale: now - entry.timestamp > (5 * 60 * 1000)
      })
    }
    
    return stats
  }
  
  return {
    data,
    isLoading,
    isCached,
    isStale,
    error,
    fetchWithCache,
    clearCache,
    invalidateCache,
    prefetch,
    getCacheStats
  }
}

/**
 * Global cache management
 */
export const cacheManager = {
  /**
   * Clear all cached data
   */
  clearAll() {
    cacheStore.clear()
  },
  
  /**
   * Get cache size
   */
  getSize() {
    return cacheStore.size
  },
  
  /**
   * Prune old cache entries
   */
  prune(maxAge: number = 10 * 60 * 1000) {
    const now = Date.now()
    for (const [key, entry] of cacheStore.entries()) {
      if (now - entry.timestamp > maxAge) {
        cacheStore.delete(key)
      }
    }
  }
}