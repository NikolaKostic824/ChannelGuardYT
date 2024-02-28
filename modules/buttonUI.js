/**
 * Creates and appends a button element to a specified parent element in the DOM.
 * Optionally, assigns a click event listener that executes a provided function
 * with optional data.
 *
 * @param {string} text - The text content for the button.
 * @param {Function|null} [fnc=null] - The function to execute on button click. Optional.
 * @param {any} [fncData=null] - The data to be passed to the click function. Optional.
 * @param {Element} parent - The parent DOM element to which the button will be appended.
 */
export const createButton = (text, fnc = null, fncData = null, parent) => {
  const button = document.createElement("button");
  button.textContent = text;

  // Assign the click event listener if a function is provided
  if (fnc !== null) {
    button.onclick = () => (fncData != null ? fnc(fncData) : fnc());
  }

  // Append the button to the parent element if it's valid
  if (parent && parent.appendChild) {
    parent.appendChild(button);
  } else {
    console.warn("createButton: Provided parent element is invalid.", parent);
  }
};
