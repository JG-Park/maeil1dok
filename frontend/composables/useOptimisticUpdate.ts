import { ref, Ref } from 'vue'

interface OptimisticOptions<T> {
  onSuccess?: (data: T) => void
  onError?: (error: any, previousValue: T) => void
  retryCount?: number
  retryDelay?: number
}

export function useOptimisticUpdate<T>() {
  const isUpdating = ref(false)
  const error = ref<Error | null>(null)
  
  /**
   * Optimistic update with automatic rollback on error
   * 
   * @param currentValue - Current value reference
   * @param optimisticValue - Value to set optimistically
   * @param updateFn - Async function to perform the actual update
   * @param options - Additional options
   */
  async function optimisticUpdate(
    currentValue: Ref<T>,
    optimisticValue: T,
    updateFn: () => Promise<any>,
    options: OptimisticOptions<T> = {}
  ) {
    const previousValue = { ...currentValue.value } as T
    const { 
      onSuccess, 
      onError, 
      retryCount = 0, 
      retryDelay = 1000 
    } = options
    
    // Apply optimistic update immediately
    currentValue.value = optimisticValue
    isUpdating.value = true
    error.value = null
    
    let attempts = 0
    
    const executeUpdate = async (): Promise<any> => {
      try {
        const result = await updateFn()
        
        // Success callback
        if (onSuccess) {
          onSuccess(result)
        }
        
        isUpdating.value = false
        return result
      } catch (err: any) {
        attempts++
        
        // Retry logic
        if (attempts <= retryCount) {
          console.log(`Retrying... Attempt ${attempts}/${retryCount}`)
          await new Promise(resolve => setTimeout(resolve, retryDelay))
          return executeUpdate()
        }
        
        // Rollback on final failure
        console.error('Optimistic update failed:', err)
        currentValue.value = previousValue
        error.value = err
        isUpdating.value = false
        
        // Error callback
        if (onError) {
          onError(err, previousValue)
        }
        
        throw err
      }
    }
    
    return executeUpdate()
  }
  
  return {
    optimisticUpdate,
    isUpdating,
    error
  }
}

/**
 * Optimistic list operations
 */
export function useOptimisticList<T extends { id: number | string }>() {
  const { optimisticUpdate, isUpdating, error } = useOptimisticUpdate<T[]>()
  
  /**
   * Optimistically add an item to a list
   */
  async function optimisticAdd(
    list: Ref<T[]>,
    newItem: T,
    addFn: () => Promise<any>
  ) {
    const optimisticList = [...list.value, newItem]
    
    return optimisticUpdate(
      list,
      optimisticList,
      addFn,
      {
        onError: (err, previousList) => {
          console.error('Failed to add item:', err)
          // Additional error handling if needed
        }
      }
    )
  }
  
  /**
   * Optimistically remove an item from a list
   */
  async function optimisticRemove(
    list: Ref<T[]>,
    itemId: number | string,
    removeFn: () => Promise<any>
  ) {
    const optimisticList = list.value.filter(item => item.id !== itemId)
    
    return optimisticUpdate(
      list,
      optimisticList,
      removeFn,
      {
        onError: (err, previousList) => {
          console.error('Failed to remove item:', err)
        }
      }
    )
  }
  
  /**
   * Optimistically update an item in a list
   */
  async function optimisticUpdateItem(
    list: Ref<T[]>,
    itemId: number | string,
    updates: Partial<T>,
    updateFn: () => Promise<any>
  ) {
    const optimisticList = list.value.map(item =>
      item.id === itemId ? { ...item, ...updates } : item
    )
    
    return optimisticUpdate(
      list,
      optimisticList,
      updateFn,
      {
        onError: (err, previousList) => {
          console.error('Failed to update item:', err)
        }
      }
    )
  }
  
  /**
   * Optimistically toggle a boolean property
   */
  async function optimisticToggle(
    list: Ref<T[]>,
    itemId: number | string,
    property: keyof T,
    toggleFn: () => Promise<any>
  ) {
    const item = list.value.find(i => i.id === itemId)
    if (!item) return
    
    const updates = { [property]: !item[property] } as Partial<T>
    
    return optimisticUpdateItem(list, itemId, updates, toggleFn)
  }
  
  return {
    optimisticAdd,
    optimisticRemove,
    optimisticUpdateItem,
    optimisticToggle,
    isUpdating,
    error
  }
}