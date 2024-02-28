/**
 * Asynchronously deletes an data from the database and executes a callback function upon completion.
 *
 * @param {any} data - The data needed to identify the data to be deleted. This could be an data ID or any other unique identifier.
 * @param {Function} callBackFN - The callback function to be executed after the data has been successfully deleted. This function does not take any parameters.
 *
 * @returns {Promise<void>} A promise that resolves once the data is successfully deleted and the callback function has been called.
 */
export const deleteBtnFnc = async (data, deleteFnc, callBackFnc) => {
  await deleteFnc(data);
  callBackFnc();
};
