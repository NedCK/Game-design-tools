import { ReferenceImage } from '../types';

const DB_NAME = 'AIGameArchitectDB';
const DB_VERSION = 1;
const STORE_NAME = 'referenceImages';

let db: IDBDatabase;

export const initDB = (): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    if (db) {
      return resolve(true);
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const dbInstance = (event.target as IDBOpenDBRequest).result;
      if (!dbInstance.objectStoreNames.contains(STORE_NAME)) {
        dbInstance.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      db = (event.target as IDBOpenDBRequest).result;
      resolve(true);
    };

    request.onerror = (event) => {
      console.error('IndexedDB error:', (event.target as IDBOpenDBRequest).error);
      reject(false);
    };
  });
};

export const addImage = (image: ReferenceImage): Promise<void> => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(image);

    request.onsuccess = () => resolve();
    request.onerror = () => {
      console.error('Error adding image:', request.error);
      reject(request.error);
    };
  });
};

export const getAllImages = (): Promise<ReferenceImage[]> => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      console.error('Error getting all images:', request.error);
      reject(request.error);
    };
  });
};

export const updateImage = (image: ReferenceImage): Promise<void> => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(image);

    request.onsuccess = () => resolve();
    request.onerror = () => {
      console.error('Error updating image:', request.error);
      reject(request.error);
    };
  });
};

export const deleteImage = (id: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => {
      console.error('Error deleting image:', request.error);
      reject(request.error);
    };
  });
};

export const clearImages = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => {
      console.error('Error clearing images:', request.error);
      reject(request.error);
    };
  });
};

export const bulkAddImages = (images: ReferenceImage[]): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (!images || images.length === 0) {
            return resolve();
        }
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        images.forEach(image => {
            store.add(image);
        });

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => {
            console.error('Error bulk adding images:', transaction.error);
            reject(transaction.error);
        }
    });
};