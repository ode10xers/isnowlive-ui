import apis from 'apis';

import dateUtil from 'utils/date';

const {
  formatDate: { getISODayOfWeek },
} = dateUtil;

export const mapInventoryDays = (inventories) =>
  [...new Set(inventories.map((inventory) => getISODayOfWeek(inventory.start_time)))].sort();

export const getDaysForSession = async (sessionId) => {
  try {
    const { data } = await apis.session.getSessionDetails(sessionId);
    return mapInventoryDays(data.inventory);
  } catch (error) {
    console.error(error);
    console.error('Something wrong happened!');
  }
  return [];
};
