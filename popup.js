/**
 * Initializes the application by determining the initial view based on whether a PIN is set.
 *
 * Upon loading the DOM, this script checks if a PIN has already been set using the `isPINSet`
 * function from the indexedDBService module. Depending on the result, it sets the initial state
 * of the application to either prompt the user to log in (if a PIN is set) or to set a new PIN
 * (if a PIN is not set). The application's state can be changed dynamically using the `changeState`
 * function, which updates the state and re-renders the appropriate view.
 *
 * The `render` function manages the display of the current view based on the application's state,
 * dynamically injecting the view's HTML into the `contentContainer` and setting up any required
 * event listeners for that view. This modular approach allows for easy expansion and maintenance
 * of the application's views and interactions.
 *
 * @imports loginView, appView, setPINView, changePINView from "./modules/views.js" to handle different application views.
 * @imports isPINSet from "./modules/indexedDBService.js" to check for an existing PIN in the IndexedDB.
 */
import {
  loginView,
  appView,
  setPINView,
  changePINView,
} from "./modules/views.js";
import { isPINSet } from "./modules/indexedDBService.js";

document.addEventListener("DOMContentLoaded", async () => {
  // Check if a PIN is set to determine the initial application state
  const pinSet = await isPINSet();
  let state = pinSet ? "login" : "setPIN";

  /**
   * Changes the current state of the application and re-renders the view.
   *
   * @param {string} newState - The new state to which the application should transition.
   */
  const changeState = (newState) => {
    state = newState;
    render(); // Re-render the application view based on the new state
  };

  /**
   * Renders the application view based on the current state.
   *
   * Dynamically updates the content of the `contentContainer` element with the HTML
   * of the current view and sets up any required event listeners for that view.
   */
  const render = () => {
    const contentContainer = document.getElementById("content");
    contentContainer.innerHTML = ""; // Clear existing content

    // Determine the view to render based on the current state
    let view;
    switch (state) {
      case "login":
        view = loginView(changeState);
        break;
      case "setPIN":
        view = setPINView(changeState);
        break;
      case "changePIN":
        view = changePINView(changeState);
        break;
      case "app":
        view = appView(changeState);
        break;
      default:
        changeState("login"); // Handle invalid state
        return;
    }

    // Inject the view's HTML and set up event listeners
    contentContainer.innerHTML = view.getHTML();
    view.setListeners();
  };

  render(); // Initial rendering of the application view
});
