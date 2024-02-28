/**
 * Generates a hash from a given string using SHA-256 algorithm.
 *
 * @param {string} input - The string to be hashed.
 * @returns {Promise<string>} A promise that resolves with the hashed string.
 */
export const hashString = async (input) => {
  // Convert the string to an array buffer
  const buffer = new TextEncoder().encode(input);

  // Generate the hash
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);

  // Convert the hash buffer to hexadecimal string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashedString = hashArray
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  return hashedString;
};
