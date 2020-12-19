import mixpanel from 'mixpanel-browser';
import config from 'config';

export const mixPanelEventTags = {};

export const initMixPanel = () => {
  mixpanel.init(config.mixPanel.projectToken);
};

export const identifyUserInMixPanel = (userData) => {
  mixpanel.identify(userData.external_id);
  //TODO: Might probably want to set only on certain scenarios (Login, Signup, Edit)
  mixpanel.people.set({
    ...userData,
  });
};

export const trackEventInMixPanel = (eventTag, eventData) => {
  mixpanel.track(eventTag, {
    ...eventData,
  });
};
