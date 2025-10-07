// ZIP file storage using IndexedDB for better performance with large files

const DB_NAME = 'smiio_backtest_storage';
const DB_VERSION = 1;
const STORE_NAME = 'zip_files';

interface ZipFileEntry {
  id: string;           // Strategy ID
  fileName: string;     // ZIP file name
  data: Blob;          // ZIP file data
  savedAt: string;     // ISO timestamp
  size: number;        // File size in bytes
}

// Initialize IndexedDB
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        objectStore.createIndex('savedAt', 'savedAt', { unique: false });
      }
    };
  });
}

// Save ZIP file to IndexedDB
export async function saveZipFile(
  strategyId: string,
  fileName: string,
  blob: Blob
): Promise<boolean> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const entry: ZipFileEntry = {
      id: strategyId,
      fileName,
      data: blob,
      savedAt: new Date().toISOString(),
      size: blob.size,
    };

    await new Promise<void>((resolve, reject) => {
      const request = store.put(entry);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    db.close();
    console.log(`ZIP file saved to IndexedDB: ${fileName} (${(blob.size / 1024).toFixed(2)} KB)`);
    return true;
  } catch (error) {
    console.error('Error saving ZIP file to IndexedDB:', error);
    return false;
  }
}

// Get ZIP file from IndexedDB
export async function getZipFile(strategyId: string): Promise<ZipFileEntry | null> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    const entry = await new Promise<ZipFileEntry | null>((resolve, reject) => {
      const request = store.get(strategyId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });

    db.close();
    
    if (entry) {
      console.log(`ZIP file loaded from IndexedDB: ${entry.fileName} (${(entry.size / 1024).toFixed(2)} KB)`);
    } else {
      console.log(`No ZIP file found for strategy: ${strategyId}`);
    }
    
    return entry;
  } catch (error) {
    console.error('Error getting ZIP file from IndexedDB:', error);
    return null;
  }
}

// Delete ZIP file from IndexedDB
export async function deleteZipFile(strategyId: string): Promise<boolean> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    await new Promise<void>((resolve, reject) => {
      const request = store.delete(strategyId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    db.close();
    console.log(`ZIP file deleted from IndexedDB: ${strategyId}`);
    return true;
  } catch (error) {
    console.error('Error deleting ZIP file from IndexedDB:', error);
    return false;
  }
}

// Get all ZIP files
export async function getAllZipFiles(): Promise<ZipFileEntry[]> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    const entries = await new Promise<ZipFileEntry[]>((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });

    db.close();
    return entries;
  } catch (error) {
    console.error('Error getting all ZIP files:', error);
    return [];
  }
}

// Clean up old ZIP files (older than 7 days)
export async function cleanupOldZipFiles(): Promise<number> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('savedAt');

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const entries = await new Promise<ZipFileEntry[]>((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });

    let deletedCount = 0;

    for (const entry of entries) {
      const savedAt = new Date(entry.savedAt);
      if (savedAt < oneWeekAgo) {
        await new Promise<void>((resolve, reject) => {
          const request = store.delete(entry.id);
          request.onsuccess = () => {
            deletedCount++;
            resolve();
          };
          request.onerror = () => reject(request.error);
        });
        console.log(`Deleted old ZIP file: ${entry.fileName}`);
      }
    }

    db.close();
    
    if (deletedCount > 0) {
      console.log(`Cleaned up ${deletedCount} old ZIP files`);
    }
    
    return deletedCount;
  } catch (error) {
    console.error('Error cleaning up old ZIP files:', error);
    return 0;
  }
}

// Get total storage usage
export async function getZipStorageUsage(): Promise<{ count: number; totalSize: number }> {
  try {
    const entries = await getAllZipFiles();
    const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);
    
    return {
      count: entries.length,
      totalSize,
    };
  } catch (error) {
    console.error('Error getting ZIP storage usage:', error);
    return { count: 0, totalSize: 0 };
  }
}

