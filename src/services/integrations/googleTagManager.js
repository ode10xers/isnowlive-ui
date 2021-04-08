export const pushToDataLayer = (eventName, eventData = {}) => {
  window.dataLayer.push({
    event: eventName,
    ...eventData,
  });
};
