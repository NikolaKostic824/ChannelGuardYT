import { createButton } from "./buttonUI.js";
import { deleteBtnFnc } from "./buttonLogic.js";
import {
  addAuthor,
  deleteAuthor,
  getAuthors,
  verifyPIN,
  setPIN,
} from "./indexedDBService.js";

/**
 * Asynchronously submits a PIN for verification and handles the application state based on the verification result.
 *
 * This function takes a PIN as input and uses an asynchronous call to `verifyPIN` to check its validity.
 * If the PIN is valid, it calls the `stateHandler` function with "app" to change the application's state to the main app view.
 * If the PIN is not valid, it displays an alert notifying the user of the invalid PIN.
 *
 * @param {string} pin - The PIN entered by the user for verification.
 * @param {Function} stateHandler - A callback function that handles the state transition of the application.
 *                                  This function should accept a single string argument representing the new state.
 * @returns {Promise<void>} A promise that resolves when the PIN has been submitted and the state has been handled accordingly.
 */
const submitPIN = async (pin, stateHandler) => {
  const isPINValid = await verifyPIN(pin);
  if (isPINValid) {
    stateHandler("app");
  } else {
    alert("Invalid PIN!");
  }
};

/**
 * Creates and returns a login view component with associated event listeners.
 *
 * This function generates a login view where users can enter their PIN and either log in
 * or navigate to the change PIN view. It encapsulates the logic for handling login attempts
 * and changing the application state based on user interactions. The returned object contains
 * a method to retrieve the HTML structure of the view (`getHTML`) and a method to set up
 * necessary event listeners (`setListeners`) for handling user actions.
 *
 * @param {Function} changeState - A function used to change the current state of the application.
 *                                  This function should accept a string argument representing
 *                                  the new state to transition to (e.g., "changePIN").
 * @returns {Object} An object containing two methods: `getHTML`, which returns the HTML
 *                   string for the login view, and `setListeners`, which sets up event
 *                   listeners for the login and change PIN buttons within the view.
 *                   The `setListeners` method attaches a click event listener to the
 *                   login button to handle PIN submission, and another click event
 *                   listener to the change PIN button to navigate to the change PIN view.
 */
export const loginView = (changeState) => {
  // Function to handle the login process
  const handleLogin = async () => {
    const pin = document.getElementById("pinInput").value;
    await submitPIN(pin, changeState);
  };

  // Function to set event listeners for the view
  const setListeners = () => {
    document
      .getElementById("loginButton")
      .addEventListener("click", handleLogin);
    document
      .getElementById("changePINButton")
      .addEventListener("click", () => changeState("changePIN"));
  };

  // HTML structure of the login view
  const HTML = `
    <div id="container">
      <h2>Login</h2>
      <input type="text" id="pinInput" />
      <button id="loginButton">Log In</button>
      <button id="changePINButton">Change PIN</button>
    </div>`;

  // Method to return the HTML structure
  const getHTML = () => HTML;

  // Returning an object with methods to get HTML and set listeners
  return { getHTML, setListeners };
};

/**
 * Creates and returns a view component for setting a new PIN, with associated event listeners.
 *
 * This function generates a view that allows users to enter and confirm a new PIN. It validates
 * the entered PINs, ensuring they match and adhere to the specified format (6 digits). Upon
 * successful PIN confirmation, the PIN is set using an asynchronous call to `setPIN`, and the
 * user is notified of the successful operation. The view also includes logic to enable or disable
 * the save button based on the validity of the input.
 *
 * @param {Function} changeState - A function used to change the current state of the application.
 *                                  This function should accept a string argument representing
 *                                  the new state to transition to (e.g., "login").
 * @returns {Object} An object containing two methods: `getHTML`, which returns the HTML string
 *                   for the set PIN view, and `setListeners`, which sets up event listeners for
 *                   the input fields and the save button within the view.
 *                   The `setListeners` method includes logic to validate the PIN format and
 *                   matching PINs in real-time, update the UI accordingly, and handle the
 *                   submission once the save button is clicked.
 */
export const setPINView = (changeState) => {
  // Function to handle PIN confirmation and setting
  const handlePINConfirmation = async () => {
    const pinValue = document.getElementById("pinInput").value;
    const confirmPinValue = document.getElementById("confirmPinInput").value;

    if (/^\d{6}$/.test(pinValue) && pinValue === confirmPinValue) {
      await setPIN(pinValue);
      alert("Pin added successfully!");
      changeState("login");
    } else {
      alert("PINs do not match or do not meet the required format.");
    }
  };

  // Function to set event listeners for the view
  const setListeners = () => {
    const pinInput = document.getElementById("pinInput");
    const confirmPinInput = document.getElementById("confirmPinInput");
    const savePinBtn = document.getElementById("savePinBtn");

    // Real-time validation of PIN input
    const validatePIN = () => {
      const pinValue = pinInput.value;
      const confirmPinValue = confirmPinInput.value;
      const isValid = /^\d{6}$/.test(pinValue) && pinValue === confirmPinValue;
      pinInput.classList.toggle("error", !isValid);
      confirmPinInput.classList.toggle("error", !isValid);
      savePinBtn.disabled = !isValid;
    };

    pinInput.addEventListener("input", validatePIN);
    confirmPinInput.addEventListener("input", validatePIN);

    // Handling PIN confirmation on save button click
    savePinBtn.addEventListener("click", handlePINConfirmation);
  };

  // HTML structure of the set PIN view
  const HTML = `
    <div id="container">
      <h2>Set PIN</h2>
      <input type="text" id="pinInput" placeholder="Enter PIN (6 digits)" />
      <input type="text" id="confirmPinInput" placeholder="Confirm PIN" />
      <button id="savePinBtn" disabled>Save PIN</button>
    </div>`;

  // Method to return the HTML structure
  const getHTML = () => HTML;

  // Returning an object with methods to get HTML and set listeners
  return { getHTML, setListeners };
};

/**
 * Creates and returns a view component for changing an existing PIN, with associated event listeners.
 *
 * This function generates a view allowing users to change their current PIN. It requires users to
 * enter their current PIN and then input and confirm a new PIN. It validates the current PIN against
 * the stored value, and if valid, updates the PIN to the new value. The view also includes real-time
 * validation to ensure the new PINs match and meet the required format (6 digits). Upon successful
 * PIN change, the user is notified, and the application state is changed back to the login view.
 *
 * @param {Function} changeState - A function used to change the current state of the application.
 *                                  This function should accept a string argument representing
 *                                  the new state to transition to (e.g., "login").
 * @returns {Object} An object containing two methods: `getHTML`, which returns the HTML string
 *                   for the change PIN view, and `setListeners`, which sets up event listeners
 *                   for the input fields and the save button within the view.
 *                   The `setListeners` method ensures the validation logic for the current and
 *                   new PINs is applied, updates the UI based on validation results, and handles
 *                   the PIN change submission.
 */
export const changePINView = (changeState) => {
  // Function to render view and set initial validation and event listeners
  const renderView = () => {
    const currentPinInput = document.getElementById("currentPinInput");
    const pinInput = document.getElementById("pinInput");
    const confirmPinInput = document.getElementById("confirmPinInput");
    const savePinBtn = document.getElementById("savePinBtn");

    // Validates the PIN inputs in real-time
    const validatePINInputs = () => {
      const currentPinValue = currentPinInput.value;
      const pinValue = pinInput.value;
      const confirmPinValue = confirmPinInput.value;

      if (
        /^\d{6}$/.test(currentPinValue) &&
        /^\d{6}$/.test(pinValue) &&
        pinValue === confirmPinValue
      ) {
        currentPinInput.classList.remove("error");
        pinInput.classList.remove("error");
        confirmPinInput.classList.remove("error");
        savePinBtn.disabled = false;
      } else {
        currentPinInput.classList.add("error");
        pinInput.classList.add("error");
        confirmPinInput.classList.add("error");
        savePinBtn.disabled = true;
      }
    };

    // Handles the PIN change process
    const handleChangePIN = async () => {
      const currentPinValue = currentPinInput.value;
      const pinValue = pinInput.value;

      // Verifies the current PIN before allowing a change
      const isCurrentPINValid = await verifyPIN(currentPinValue);
      if (!isCurrentPINValid) {
        alert("Invalid current PIN!");
        return;
      }

      // Sets the new PIN and notifies the user
      await setPIN(pinValue);
      alert("PIN changed successfully!");
      changeState("login");
    };

    // Event listeners for real-time validation and PIN change submission
    currentPinInput.addEventListener("input", validatePINInputs);
    pinInput.addEventListener("input", validatePINInputs);
    confirmPinInput.addEventListener("input", validatePINInputs);
    savePinBtn.addEventListener("click", handleChangePIN);
  };

  // Sets up the view and event listeners upon initialization
  const setListeners = () => {
    renderView();
  };

  // HTML structure of the change PIN view
  const HTML = `
    <div id="container">
      <h2>Change PIN</h2>
      <input type="text" id="currentPinInput" placeholder="Enter current PIN" />
      <input type="text" id="pinInput" placeholder="Enter new PIN (6 digits)" />
      <input type="text" id="confirmPinInput" placeholder="Confirm new PIN" />
      <button id="savePinBtn" disabled>Save PIN</button>
    </div>`;

  // Method to return the HTML structure
  const getHTML = () => HTML;

  // Returning an object with methods to get HTML and set listeners
  return { getHTML, setListeners };
};

/**
 * Creates and returns a view component for managing YouTube authors, with associated event listeners.
 *
 * This function generates a view that allows users to add new authors to a block list and display
 * the list of currently blocked authors. Users can add authors by entering the author's name and
 * clicking the save button. Each author in the list also has an associated delete button to remove
 * them from the block list. The view handles adding and deleting authors asynchronously, updating
 * the displayed list accordingly. Upon successful addition or deletion, the list of authors is
 * refreshed to reflect the changes.
 *
 * @param {Function} changeState - A function used to change the current state of the application.
 *                                  This function should accept a string argument representing
 *                                  the new state to transition to (e.g., "login").
 * @returns {Object} An object containing two methods: `getHTML`, which returns the HTML string
 *                   for the app view, and `setListeners`, which sets up event listeners for
 *                   adding new authors, deleting existing authors, and logging out.
 *                   The `setListeners` method also calls `refreshAuthorsList` to initially
 *                   populate the list of blocked authors and to update the list as authors
 *                   are added or removed.
 */
export const appView = (changeState) => {
  // Function to refresh the list of blocked authors
  const refreshAuthorsList = async () => {
    const authorsList = document.getElementById("authorsList");
    authorsList.innerHTML = "";

    try {
      const authors = await getAuthors();
      authors.forEach((author) => {
        const li = document.createElement("li");
        li.textContent = author.name;
        createButton(
          "🚫",
          () => deleteBtnFnc(author.id, deleteAuthor, refreshAuthorsList),
          null,
          li
        );
        authorsList.appendChild(li);
      });
    } catch (error) {
      console.error("Error fetching authors:", error);
    }
  };

  // Function to handle saving a new author
  const handleSaveAuthor = async () => {
    const authorName = document.getElementById("authorName").value;
    if (authorName) {
      try {
        await addAuthor(authorName);
        console.log("Author saved:", authorName);
        document.getElementById("authorName").value = "";
        refreshAuthorsList();
      } catch (error) {
        console.error("Error saving the author:", error);
      }
    }
  };

  // Function to set event listeners for the view
  const setListeners = () => {
    document
      .getElementById("saveButton")
      .addEventListener("click", handleSaveAuthor);

    document
      .getElementById("logOutButton")
      .addEventListener("click", () => changeState("login"));
    refreshAuthorsList();
  };

  // HTML structure of the app view
  const HTML = `<div id="container">
    <h2>Block YouTube Author</h2>
    <div id="form">
        <input type="text" id="authorName" placeholder="Enter author's name" />
        <button id="saveButton">Save</button>
    </div>
    <ul id="authorsList"></ul>
    <button id='logOutButton'>Log Out</button>
  </div>`;

  // Method to return the HTML structure
  const getHTML = () => HTML;

  // Returning an object with methods to get HTML and set listeners
  return { getHTML, setListeners };
};
