import mixpanel from 'mixpanel-browser';
import config from 'config';

export const mixPanelEventTags = {
  creator: {
    click: {
      dashboard: {
        upcomingSessions: '(Creator) Upcoming Sessions Clicked',
        pastSessions: '(Creator) Past Sessions Clicked',
        manageSessions: '(Creator) Manage Sessions Clicked',
        createSession: '(Creator) Create Session Clicked',
        attendeeNav: '(Creator) Attendee Nav Clicked',
        packagesNav: '(Creator) Packages Nav Clicked',
        livestreamNav: '(Creator) LiveStream Nav Clicked',
        profileNav: '(Creator) Public Page Nav Clicked',
        paymentNav: '(Creator) Get Paid Nav Clicked',
        accountNav: '(Creator) Account Nav Clicked',
      },
      sessions: {
        manage: {
          publishSession: '(Creator) Publish Session Clicked',
          unpublishSession: '(Creator) Unpublish Session Clicked',
          editSession: '(Creator) Edit Session Clicked',
          backToManageSessionsList: '(Creator) Back to Manage Sessions Clicked',
          mobile: {
            sessionCard: '(Creator) Manage Session Card for Mobile device Clicked',
            editSession: '(Creator) Edit Session for Mobile device Clicked',
            publishSession: '(Creator) Publish Session for Mobile device Clicked',
            unpublishSession: '(Creator) Unpublish Session for Mobile device Clicked',
          },
        },
        details: {
          backToPastSessionsList: '(Creator) Back to Past Sessions Clicked',
          backToUpcomingSessionsList: '(Creator) Back to Upcoming Sessions Clicked',
          toPublicPage: '(Creator) Public Page Clicked',
          shareSession: '(Creator) Share Session Clicked',
          startSession: '(Creator) Start Session Clicked',
          editSession: '(Creator) Edit Session Clicked',
          cancelSession: '(Creator) Cancel Session Clicked',
          sendEmail: '(Creator) Send Email Clicked',
        },
        list: {
          pastSessionsDetails: '(Creator) Past Session Details Clicked',
          upcomingSessionsDetails: '(Creator) Upcoming Session Details Clicked',
          startSession: '(Creator) Start Session in List Clicked',
          cancelSession: '(Creator) Cancel Session in List Clicked',
          mobile: {
            sessionCard: '(Creator) Session Card for Mobile device Clicked',
            sessionDetails: '(Creator) Session Details for Mobile device Clicked',
            cancelSession: '(Creator) Cancel Session for Mobile device Clicked',
            startSession: '(Creator) Start Session for Mobile device Clicked',
          },
        },
        form: {
          submitUpdate: '(Creator) Publish Button in Form Clicked',
          addNewInModal: '(Creator) Add New in Confirmation Modal Clicked',
          doneInModal: '(Creator) Done in Confirmation Modal Clicked',
        },
      },
      livestream: {
        submitZoomDetails: '(Creator) Submit Zoom Details Clicked',
        connectZoomAccount: '(Creator) Connect Zoom Acc Clicked',
      },
      profile: {
        backToDashboard: '(Creator) Back to Dashboard Clicked',
        editProfile: '(Creator) Edit Profile Clicked',
        publicPage: '(Creator) Public Page Clicked',
        shareButton: '(Creator) Share Button Clicked',
        upcomingSessionsTab: '(Creator) Upcoming Session Tab Clicked',
        pastSessionsTab: '(Creator) Past Session Tab Clicked',
        editForm: {
          backToProfile: '(Creator) Back to Profile Clicked',
          addEmbedCode: '(Creator) Add Embed Code Clicked',
          deleteEmbedCode: '(Creator) Delete Embed Code Clicked',
          submitProfile: '(Creator) Submit Profile Clicked',
        },
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

  public: {
    click: {
      logIn: 'Log In Clicked',
      logOut: 'Log Out Clicked',
      newPassword: 'Set New Password Clicked',
      sendEmail: 'Send Reset Password Email Clicked',
      loginWithNewPassword: 'Login with New Password Clicked',
      switchToAttendee: 'Switch to Attendee ,Clicked',
      switchToCreator: 'Switch to Hosting Clicked',
      sessions: {
        sessionCard: 'Session Card in List Clicked',
        showMore: 'Show More Session Card Clicked',
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
