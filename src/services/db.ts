const DB_NAME = 'StudyPalDB'
const DB_VERSION = 1
const STORE_NAME = 'sync-queue'

// Define the type for a queue item, previously inferred from idb's DBSchema
export interface QueueItem {
  id?: number
  type: 'create' | 'update' | 'delete'
  entity: string
  payload: any
  timestamp: number
}

let dbPromise: Promise<IDBDatabase> | null = null

const getDb = (): Promise<IDBDatabase> => {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        return reject(
          new Error('IndexedDB is not supported in this environment.'),
        )
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => {
        console.error('IndexedDB error:', request.error)
        reject(request.error)
      }

      request.onsuccess = () => {
        resolve(request.result)
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, {
            keyPath: 'id',
            autoIncrement: true,
          })
          store.createIndex('by-timestamp', 'timestamp')
        }
      }
    })
  }
  return dbPromise
}

export const addToQueue = async (
  item: Omit<QueueItem, 'id' | 'timestamp'>,
): Promise<void> => {
  try {
    const db = await getDb()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.add({ ...item, timestamp: Date.now() })

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.warn('Could not add to IndexedDB queue:', error)
    return Promise.resolve()
  }
}

export const getQueue = async (): Promise<QueueItem[]> => {
  try {
    const db = await getDb()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const index = store.index('by-timestamp')
      const request = index.getAll()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.warn('Could not get IndexedDB queue:', error)
    return Promise.resolve([])
  }
}

export const clearQueue = async (): Promise<void> => {
  try {
    const db = await getDb()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.clear()

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.warn('Could not clear IndexedDB queue:', error)
    return Promise.resolve()
  }
}

export const deleteFromQueue = async (id: number): Promise<void> => {
  try {
    const db = await getDb()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.delete(id)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.warn('Could not delete from IndexedDB queue:', error)
    return Promise.resolve()
  }
}
