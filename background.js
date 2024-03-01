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
 * Listens for messages from other parts of the extension.
 * Specifically, it handles requests to fetch a list of blocked authors.
 *
 * @param {Object} message - The message sent by the calling part of the extension.
 *                           Expected to contain an action property.
 * @param {Object} sender - An object containing information about the sender of the message.
 * @param {function} sendResponse - A callback function to send a response back to the sender.
 *                                  The response is an object that may contain an array of authors
 *                                  if the requested action is "fetchBlockedAuthors".
 *
 * @returns {boolean} Returns true to indicate that the response to the message will be sent asynchronously.
 *                    This is necessary because the sendResponse callback function is used
 *                    within a promise (getAuthors). Returning true keeps the message channel open
 *                    for the asynchronous operation to complete.
 *
 * The listener checks if the received message has an action property equal to "fetchBlockedAuthors".
 * If so, it attempts to fetch the list of authors using the getAuthors function, which returns a promise.
 * Upon resolving the promise, the list of authors is sent back to the sender through the sendResponse callback.
 * If the promise is rejected (e.g., due to an error accessing the database), an empty array is sent back,
 * indicating that no authors could be fetched.
 *
 * Note: It's important to handle any potential errors gracefully to ensure the extension remains functional
 * even when unexpected issues occur during data retrieval.
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "fetchBlockedAuthors") {
    getAuthors()
      .then((authors) => {
        sendResponse({ authors: authors });
      })
      .catch((error) => {
        // It's a good practice to log the error or handle it in a way that's appropriate for your extension.
        console.error("Error fetching authors:", error);
        sendResponse({ authors: [] });
      });
    return true; // Indicates asynchronous response.
  }
});
