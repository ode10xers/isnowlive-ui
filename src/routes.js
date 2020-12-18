const Routes = {
  root: '/',
  login: '/login',
  signup: '/signup',
  adminLogin: '/admin',
  passwordVerification: '/password/verify/:token',
  emailVerification: '/email/verify/:token',
  createPassword: '/password/create',
  profile: '/creator/profile',
  livestream: '/creator/livestream',
  session: '/creator/session',
  sessionDetails: '/e/:inventory_id',
  sessionUpdate: '/creator/session/:id/edit',
  profilePreview: '/profile/preview',
  stripeAccountValidate: '/stripe/account/validate',
  stripePaymentSuccess: '/stripe/payment/success',
  creatorDashboard: {
    rootPath: '/creator/dashboard',
    defaultPath: '/sessions/upcoming',
    manageSessions: '/manage/sessions',
    createSessions: '/manage/session',
    updateSessions: '/manage/session/:id/edit',
    sessions: '/sessions/:session_type',
    sessionsDetails: '/sessions/e/:inventory_id/details',
    profile: '/profile',
    editProfile: '/profile/edit',
    livestream: '/livestream',
    paymentAccount: '/payment',
  },
  attendeeDashboard: {
    rootPath: '/attendee/dashboard',
    defaultPath: '/sessions/upcoming',
    sessions: '/sessions/:session_type',
    sessionsDetails: '/sessions/e/:inventory_id/details',
    profile: '/profile',
    editProfile: '/profile/edit',
    livestream: '/livestream',
  },
};

export default Routes;
