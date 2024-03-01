import { hashString } from "./hashUtils.js";
/**
 * Global variable to hold the instance of the IndexedDB database.
 * This variable is used to maintain a single instance of the database
 * throughout the lifecycle of the application, ensuring efficient
 * access to the database without the need to repeatedly open connections.
 */
let db;

/**
 * Opens the IndexedDB database or initializes it if it doesn't exist.
 * If the database connection is already open, resolves immediately with the existing db instance.
 * If the database needs to be upgraded, creates necessary object stores.
 *
 * @returns {Promise<IDBDatabase>} A promise that resolves with the database instance.
 * @rejects {string} If there is an error opening the database.
 */
const openDatabase = () => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open("channelGuardDB", 2);

    request.onupgradeneeded = (event) => {
      db = event.target.result;

      // Create object store for blocked authors
      if (!db.objectStoreNames.contains("blockedAuthors")) {
        db.createObjectStore("blockedAuthors", {
          keyPath: "id",
          autoIncrement: true,
        });
      }

      // Create object store for settings (including PIN)
      if (!db.objectStoreNames.contains("settings")) {
        db.createObjectStore("settings", { keyPath: "id" });
      }
    };

    request.onsuccess = (event) => {
      db = event.target.result;
      resolve(db);
    };

    request.onerror = (event) => {
      reject("IndexedDB error:", event.target.error);
    };
  });
};

/**
 * Checks if an author already exists in the "blockedAuthors" object store of the IndexedDB.
 * It iterates through all records using a cursor, comparing each author's name (case-insensitive)
 * with the provided author name.
 *
 * @param {string} authorName - The name of the author to check for existence in the database.
 * @returns {Promise<boolean>} A promise that resolves to `true` if the author exists,
 * or `false` if the author does not exist. The comparison is case-insensitive,
 * meaning 'AuthorName' and 'authorname' are treated as the same.
 *
 * This function ensures a case-insensitive search by converting both the stored names
 * and the provided author name to lowercase before comparison.
 */
const authorExists = async (authorName) => {
  const db = await openDatabase();
  const transaction = db.transaction(["blockedAuthors"], "readonly");
  const store = transaction.objectStore("blockedAuthors");
  const lowercasedName = authorName.toLowerCase();

  return new Promise((resolve) => {
    store.openCursor().onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        // If a matching author is found, resolve the promise with true.
        if (cursor.value.name.toLowerCase() === lowercasedName) {
          resolve(true);
          return;
        }
        // Move to the next record in the store.
        cursor.continue();
      } else {
        // If no matching author is found by the end of the store, resolve the promise with false.
        resolve(false);
      }
    };
  });
};

/**
 * Asynchronously adds a new author to the "blockedAuthors" object store in the IndexedDB,
 * after ensuring the author does not already exist. This function first checks for the
 * existence of the author using the `authorExists` function. If the author already exists,
 * it alerts the user and does not proceed with the addition. If the author does not exist,
 * it adds the new author to the database.
 *
 * The author's name is stored in lowercase to ensure case-insensitive uniqueness.
 *
 * @param {string} authorName - The name of the author to be added to the database. The name
 * will be converted to lowercase before storage to ensure case-insensitive comparison.
 * @returns {Promise<IDBValidKey | undefined>} A promise that resolves to the new record's key
 * if the addition is successful, or `undefined` if the author already exists. The promise is
 * rejected if there is an error during the addition process.
 */
const addAuthor = async (authorName) => {
  // Check if the author already exists in the database
  const exists = await authorExists(authorName);
  if (exists) {
    alert(`Author already exists: ${authorName}`);
    return;
  }

  // Proceed to add the new author if they don't already exist
  const db = await openDatabase();
  const transaction = db.transaction(["blockedAuthors"], "readwrite");
  const store = transaction.objectStore("blockedAuthors");

  // Attempt to add the new author record to the database
  return new Promise((resolve, reject) => {
    // Store the author name in lowercase to ensure case-insensitive uniqueness
    const request = store.add({ name: authorName.toLowerCase() });
    request.onsuccess = () => resolve(request.result); // On success, resolve with the new record's key
    request.onerror = () => reject(request.error); // On error, reject the promise
  });
};
/**
 * Asynchronously deletes an author from the "blockedAuthors" object store in the IndexedDB
 * based on the provided unique identifier (id). This function opens a readwrite transaction
 * on the "blockedAuthors" object store and attempts to delete the record corresponding to the
 * specified id.
 *
 * @param {IDBValidKey} id - The unique identifier for the author record to be deleted. This
 * is typically the key used in the IndexedDB object store.
 * @returns {Promise<undefined>} A promise that resolves when the deletion is successful,
 * indicating that the record has been removed from the database. The promise is rejected if
 * an error occurs during the deletion process.
 */
const deleteAuthor = async (id) => {
  // Open the database and access the "blockedAuthors" object store for readwrite operations
  const db = await openDatabase();
  const transaction = db.transaction(["blockedAuthors"], "readwrite");
  const store = transaction.objectStore("blockedAuthors");

  // Attempt to delete the author record with the specified id
  return new Promise((resolve, reject) => {
    const request = store.delete(id);
    request.onsuccess = () => resolve(request.result); // Resolve the promise on successful deletion
    request.onerror = () => reject(request.error); // Reject the promise if an error occurs
  });
};
/**
 * Asynchronously retrieves all author records from the "blockedAuthors" object store
 * in the IndexedDB. This function opens a readonly transaction on the "blockedAuthors"
 * object store and uses the `getAll` method to fetch all records.
 *
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of author objects
 * when the retrieval is successful. Each author object contains details of an author
 * stored in the database. The promise is rejected if an error occurs during the retrieval
 * process.
 */
const getAuthors = async () => {
  // Open the database and access the "blockedAuthors" object store for readonly operations
  const db = await openDatabase();
  const transaction = db.transaction(["blockedAuthors"], "readonly");
  const store = transaction.objectStore("blockedAuthors");

  // Attempt to retrieve all author records from the database
  return new Promise((resolve, reject) => {
    const request = store.getAll(); // Use the getAll method to fetch all records
    request.onsuccess = () => resolve(request.result); // Resolve the promise with the retrieved records
    request.onerror = () => reject(request.error); // Reject the promise if an error occurs
  });
};
/**
 * Asynchronously clears all records from the "blockedAuthors" object store in the IndexedDB.
 * This function opens a readwrite transaction on the "blockedAuthors" object store and
 * uses the `clear` method to remove all existing records. This can be useful for resetting
 * the data or performing bulk deletions.
 *
 * @returns {Promise<void>} A promise that resolves when the object store has been successfully
 * cleared of all records. The promise is rejected if an error occurs during the clearing process.
 */
const clearAuthors = async () => {
  // Open the database and access the "blockedAuthors" object store for readwrite operations
  const db = await openDatabase();
  const transaction = db.transaction(["blockedAuthors"], "readwrite");
  const store = transaction.objectStore("blockedAuthors");

  // Attempt to clear all records from the object store
  return new Promise((resolve, reject) => {
    const request = store.clear(); // Use the clear method to remove all records
    request.onsuccess = () => resolve(); // Resolve the promise on successful clearing
    request.onerror = () => reject(request.error); // Reject the promise if an error occurs
  });
};
/**
 * Sets the hashed PIN in the IndexedDB settings.
 *
 * @param {string} pin - The PIN to be hashed and set.
 * @returns {Promise<void>} A promise that resolves when the hashed PIN is successfully set.
 * @rejects {Error} If there is an error setting the hashed PIN.
 */
const setPIN = async (pin) => {
  const hashedPIN = await hashString(pin); // Hash PIN
  const db = await openDatabase();
  const transaction = db.transaction(["settings"], "readwrite");
  const store = transaction.objectStore("settings");

  return new Promise((resolve, reject) => {
    const request = store.put({ id: "pin", type: "pin", value: hashedPIN });
    request.onsuccess = () => resolve();
    request.onerror = (e) => reject(e.target.error);
  });
};
/**
 * Verifies if the entered PIN matches the stored hashed PIN in IndexedDB settings.
 *
 * @param {string} pin - The PIN to be verified.
 * @returns {Promise<boolean>} A promise that resolves with a boolean value indicating whether the PIN is verified or not.
 */
const verifyPIN = async (pin) => {
  const db = await openDatabase();
  const transaction = db.transaction(["settings"], "readonly");
  const store = transaction.objectStore("settings");
  const request = store.get("pin");

  return new Promise((resolve) => {
    request.onsuccess = async () => {
      if (request.result) {
        const hashedPIN = request.result.value;
        const inputPINHashed = await hashString(pin);
        resolve(hashedPIN === inputPINHashed);
      } else {
        resolve(false);
      }
    };
    request.onerror = () => resolve(false);
  });
};
/**
 * Updates the hashed PIN in the IndexedDB settings.
 *
 * @param {string} oldPIN - The current PIN.
 * @param {string} newPIN - The new PIN to be hashed and set.
 * @returns {Promise<void>} A promise that resolves when the hashed PIN is successfully updated.
 * @rejects {Error} If there is an error updating the hashed PIN.
 */
const updatePIN = async (oldPIN, newPIN) => {
  // Hash the new PIN
  const newHashedPIN = await hashString(newPIN);

  // Verify the old PIN
  const isOldPINVerified = await verifyPIN(oldPIN);

  if (!isOldPINVerified) {
    throw new Error("Old PIN is incorrect.");
  }

  // Update the hashed PIN in the database
  const db = await openDatabase();
  const transaction = db.transaction(["settings"], "readwrite");
  const store = transaction.objectStore("settings");

  return new Promise((resolve, reject) => {
    const request = store.put({ id: "pin", type: "pin", value: newHashedPIN });
    request.onsuccess = () => resolve();
    request.onerror = (e) => reject(e.target.error);
  });
};
/**
 * Checks if a PIN is already set in the IndexedDB settings.
 * If a PIN is set, it means the user should be directed to the login view.
 * If not, the user should be directed to set a new PIN.
 *
 * @returns {Promise<boolean>} A promise that resolves with `true` if a PIN is set,
 * or `false` if a PIN is not set, indicating that the user should be directed
 * to set a new PIN.
 */
const isPINSet = async () => {
  const db = await openDatabase();
  const transaction = db.transaction(["settings"], "readonly");
  const store = transaction.objectStore("settings");
  const request = store.get("pin");

  return new Promise((resolve) => {
    request.onsuccess = () => {
      if (request.result) {
        // PIN is set
        resolve(true);
      } else {
        // PIN is not set
        resolve(false);
      }
    };
    request.onerror = () => {
      // Handle error - consider PIN not set for safety
      resolve(false);
    };
  });
};

/**
 * Exports the functions for managing authors, PINs, and other application settings.
 *
 * This module encapsulates a variety of functions related to the application's interaction
 * with the IndexedDB database, including operations for adding, retrieving, and deleting
 * YouTube authors from a block list, as well as setting, verifying, and updating a user's PIN.
 *
 * Functions:
 * - addAuthor: Adds a new author to the block list in the IndexedDB.
 * - getAuthors: Retrieves all authors from the block list in the IndexedDB.
 * - deleteAuthor: Deletes an author from the block list in the IndexedDB.
 * - clearAuthors: Clears all authors from the block list in the IndexedDB.
 * - setPIN: Sets or updates the user's PIN in the IndexedDB settings.
 * - verifyPIN: Verifies if the entered PIN matches the stored PIN in the IndexedDB settings.
 * - updatePIN: Updates the user's PIN in the IndexedDB settings.
 * - isPINSet: Checks if a PIN is already set in the IndexedDB settings.
 *
 * Each function interacts with the IndexedDB database asynchronously and returns a Promise,
 * making it suitable for use in asynchronous workflows.
 */
export {
  addAuthor,
  getAuthors,
  deleteAuthor,
  clearAuthors,
  setPIN,
  verifyPIN,
  updatePIN,
  isPINSet,
};
