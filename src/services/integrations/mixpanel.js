import mixpanel from 'mixpanel-browser';
import config from 'config';

export const mixPanelEventTags = {
  creator: {
    click: {
      creatorLogin: 'Creator Login Clicked',
      dashboard: {
        upcomingSessions: 'Upcoming Sessions Clicked',
        pastSessions: 'Past Sessions Clicked',
        manageSessions: 'Manage Sessions Clicked',
        createSession: 'Create Session Clicked',
        attendeeNav: 'Attendee Nav (Creator Side) Clicked',
        packagesNav: 'Packages Nav (Creator Side) Clicked',
        livestreamNav: 'LiveStream Nav (Creator Side) Clicked',
        profileNav: 'Creator Profile Nav Clicked',
        paymentNav: 'Get Paid Nav Clicked',
      },
    },
  },
};

export const initMixPanel = () => mixpanel.init(config.mixPanel.projectToken);

export const resetMixPanel = () => mixpanel.reset();

export const mapUserToMixPanel = (userData) => mixpanel.alias(userData.external_id);

export const identifyUserInMixPanel = (userData) => {
  mixpanel.register({
    email: userData.email,
    external_id: userData.external_id,
  });

  mixpanel.people.set({
    $email: userData.email,
    $first_name: userData.first_name,
    $last_name: userData.last_name,
    is_creator: userData.is_creator,
  });

  mixpanel.identify(userData.external_id);
};

export const trackEventInMixPanel = (eventTag, eventData) =>
  mixpanel.track(eventTag, {
    ...eventData,
  });
