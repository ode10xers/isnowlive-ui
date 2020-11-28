const Routes = {
  root: '/',
  login: '/login',
  signup: '/signup',
  passwordVerification: '/password/verify/:token',
  profile: '/creator/profile',
  livestream: '/creator/livestream',
  session: '/creator/session',
  sessionDetails: '/e/:inventory_id',
  sessionUpdate: '/creator/session/:id/edit',
  profilePreview: '/profile/preview',
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
  },
  attendeeDashboard: {
    rootPath: '/attendee/dashboard',
    defaultPath: '/sessions/upcoming',
    sessions: '/sessions/:session_type',
    sessionsDetails: '/sessions/e/:inventory_id/details',
    profile: '/profile',
    editProfile: '/profile/edit',
  },
};

export default Routes;
