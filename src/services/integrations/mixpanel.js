import mixpanel from 'mixpanel-browser';
import config from 'config';

export const mixPanelEventTags = {
  creator: {
    click: {
      creatorLogin: '(Creator) Login Clicked',
      dashboard: {
        upcomingSessions: '(Creator) Upcoming Sessions Clicked',
        pastSessions: '(Creator) Past Sessions Clicked',
        manageSessions: '(Creator) Manage Sessions Clicked',
        createSession: '(Creator) Create Session Clicked',
        attendeeNav: '(Creator) Attendee Nav Clicked',
        packagesNav: '(Creator) Packages Nav Clicked',
        livestreamNav: '(Creator) LiveStream Nav Clicked',
        profileNav: '(Creator) Profile Nav Clicked',
        paymentNav: '(Creator) Get Paid Nav Clicked',
        accountNav: '(Creator) Account Nav Clicked',
      },
      livestream: {
        submitZoomDetails: '(Creator) Submit Zoom Details Clicked',
        connectZoomAccount: '(Creator) Connect Zoom Acc Clicked',
      },
      payment: {
        connectStripe: '(Creator) Connect Stripe Clicked',
        requestPayout: '(Creator) Request Payout Clicked',
        sessionEarnings: '(Creator) Session Earning Details Clicked',
        backToEarningDashboard: '(Creator) Back to All Earnings Clicked',
        showMoreEarnings: '(Creator) Show More Earnings Clicked',
      },
    },
  },

  attendee: {
    click: {
      dashboard: {
        upcomingSession: '(Attendee) Upcoming Sessions Clicked',
        pastSessions: '(Attendee) Past Sessions Clicked',
        packagesNav: '(Attendee) Packages Nav Clicked',
        accountNav: '(Attendee) Account Nav Clicked',
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
    is_creator: userData.is_creator,
    name: `${userData.first_name || ''} ${userData.last_name || ''}`,
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
