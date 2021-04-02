export function generateLightColorHex() {
  let color = '#';
  for (let i = 0; i < 3; i++)
    color += ('0' + Math.floor(((1 + Math.random()) * Math.pow(16, 2)) / 2).toString(16)).slice(-2);
  return color;
}

const backdropColors = ['fcb096', 'fce992', 'dffc9b', 'a3feae', '85d2ff', '8a98ff', 'c098ff', 'fdade9', 'f1ffdc'];

export function getBackgroundColorsForMobile() {
  return `#${backdropColors[Math.floor(Math.random() * backdropColors.length)]}`;
}

export function getSessionCountByDate(allEvents) {
  const eventsPerDay = {};
  allEvents.forEach((event) => {
    if (eventsPerDay[event.session_date]) {
      const tempVal = eventsPerDay[event.session_date];
      if (!tempVal.includes(event.inventory_id)) {
        const updatedVal = [...tempVal, event.inventory_id];
        eventsPerDay[event.session_date] = updatedVal;
      }
    } else {
      eventsPerDay[event.session_date] = [event.inventory_id];
    }
  });
  return eventsPerDay;
};