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
        passesNav: '(Creator) Class Passes Nav Clicked',
        livestreamNav: '(Creator) LiveStream Nav Clicked',
        profileNav: '(Creator) Public Page Nav Clicked',
        paymentNav: '(Creator) Get Paid Nav Clicked',
        settingsNav: '(Creator) Settings Nav Clicked',
        accountNav: '(Creator) Account Nav Clicked',
      },
      sessions: {
        manage: {
          publishSession: '(Creator) Publish Session Clicked',
          unpublishSession: '(Creator) Unpublish Session Clicked',
          editSession: '(Creator) Edit Session Clicked',
          deleteSession: '(Creator) Delete Session Clicked',
          backToManageSessionsList: '(Creator) Back to Manage Sessions Clicked',
        },
        details: {
          backToPastSessionsList: '(Creator) Back to Past Sessions Clicked',
          backToUpcomingSessionsList: '(Creator) Back to Upcoming Sessions Clicked',
          publicPage: '(Creator) Public Page Clicked',
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
            sessionDetails: '(Creator) Session Details for Mobile device Clicked',
            startSession: '(Creator) Start Session for Mobile device Clicked',
          },
        },
        form: {
          submitNewSession: '(Creator) Publish Button in Create Form Clicked',
          submitUpdate: '(Creator) Publish Button in Update Form Clicked',
          addNewInModal: '(Creator) Add New in Confirmation Modal Clicked',
          doneInModal: '(Creator) Done in Confirmation Modal Clicked',
        },
      },
      // Attendee Dashboard seem to have links to Profile and Livestream
      // as found in AttendeeDashboard/index.js, but no Nav Links to access them
      // If attendee can access livestream and profile page, will move this to
      // public or add new tags in attendee section accordingly
      livestream: {
        submitZoomDetails: '(Creator) Submit Zoom Details Clicked',
        connectZoomAccount: '(Creator) Connect Zoom Acc Clicked',
      },
      profile: {
        backToDashboard: '(Creator) Back to Dashboard Clicked',
        editProfile: '(Creator) Edit Profile Clicked',
        publicPage: '(Creator) Public Page Clicked',
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
        verifyBankAccount: '(Creator) Verify Bank Account Clicked',
      },
    },
  },

  attendee: {
    click: {
      dashboard: {
        upcomingSession: '(Attendee) Upcoming Sessions Clicked',
        pastSessions: '(Attendee) Past Sessions Clicked',
        passesNav: '(Attendee) Class Passes Nav Clicked',
        accountNav: '(Attendee) Account Nav Clicked',
        becomeHost: '(Attendee) Become Host Clicked',
      },
      sessions: {
        pastSessionDetails: '(Attendee) Past Session Details Clicked',
        upcomingSessionDetails: '(Attendee) Upcoming Session Details Clicked',
        joinSession: '(Attendee) Join Session Clicked',
        cancelOrder: '(Attendee) Cancel Session Order Clicked',
        mobile: {
          sessionDetails: '(Attendee) Session Details for Mobile device Clicked',
          joinSession: '(Attendee) Join Session for Mobile device Clicked',
        },
      },
    },
  },

  user: {
    click: {
      signUp: 'Sign Up Clicked',
      logIn: 'Log In Clicked',
      logOut: 'Log Out Clicked',
      adminLogIn: 'Super Admin Login Clicked',
      newPassword: 'Set New Password Clicked',
      sendNewPasswordEmail: 'Send New Password Email Clicked',
      loginWithNewPassword: 'Login with New Password Clicked',
      switchToAttendee: 'Switch to Attendee ,Clicked',
      switchToCreator: 'Switch to Hosting Clicked',
      profile: {
        upcomingSessionsTab: 'Profile Upcoming Session Tab Clicked',
        pastSessionsTab: 'Profile Past Session Tab Clicked',
        sessionCard: 'Session Card in Profile List Clicked',
        showMore: 'Show More Session Card in Profile Clicked',
      },
    },
  },
};

const env = process.env.REACT_APP_ENV || 'development';
const isDevelopment = () => env === 'development' || env === 'staging';

export const initMixPanel = () => {
  if (isDevelopment()) return;
  mixpanel.init(config.mixPanel.projectToken);
};

export const resetMixPanel = () => {
  if (isDevelopment()) return;
  mixpanel.reset();
};

export const mapUserToMixPanel = (userData) => {
  if (isDevelopment()) return;
  mixpanel.alias(userData.external_id);
};

export const identifyUserInMixPanel = (userData) => {
  if (isDevelopment()) return;

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

export const trackSimpleEvent = (eventTag, eventData = {}) => {
  if (isDevelopment()) return;

  mixpanel.track(eventTag, eventData);
};

export const trackSuccessEvent = (eventTag, eventData = {}) => {
  if (isDevelopment()) return;

  mixpanel.track(eventTag, {
    result: 'SUCCESS',
    error_code: 'N/A',
    error_message: 'N/A',
    ...eventData,
  });
};

export const trackFailedEvent = (eventTag, error, eventData = {}) => {
  if (isDevelopment()) return;

  mixpanel.track(eventTag, {
    result: 'FAILED',
    error_code: error.response?.data?.code,
    error_message: error.response?.data?.message,
    ...eventData,
  });
};
