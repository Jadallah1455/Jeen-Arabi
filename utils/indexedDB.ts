const DB_NAME = 'JeenArabiCache';
const STORE_NAME = 'pages';
const DB_VERSION = 1;

export const initDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
    });
};

export const savePageToCache = async (storyId: string, pageNum: number, blob: Blob): Promise<void> => {
    try {
        const db = await initDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const key = `story_${storyId}_page_${pageNum}`;
        store.put(blob, key);
    } catch (err) {
        console.error('Failed to save to cache:', err);
    }
};

export const getPageFromCache = async (storyId: string, pageNum: number): Promise<Blob | undefined> => {
    try {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const key = `story_${storyId}_page_${pageNum}`;
            const request = store.get(key);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    } catch (err) {
        console.error('Failed to get from cache:', err);
        return undefined;
    }
};

export const clearCache = async (): Promise<void> => {
    try {
        const db = await initDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.clear();
    } catch (err) {
        console.error('Failed to clear cache:', err);
    }
};
