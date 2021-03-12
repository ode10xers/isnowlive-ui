// const clearCustomVariableDataLayer = () => {
//   window.dataLayer.push(gtmResetObject);
// };

export const pushToDataLayer = (eventName, eventData = {}) => {
  window.dataLayer.push({
    event: eventName,
    ...eventData,
  });

  // clearCustomVariableDataLayer();
};
