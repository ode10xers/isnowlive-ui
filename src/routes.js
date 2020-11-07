const Routes = {
  root: '/',
  login: '/login',
  signup: '/signup',
  passwordVerification: '/password/verify/:token',
  profile: '/creator/profile',
  livestream: '/creator/livestream',
  session: '/session',
  sessionDetails: '/session/:id',
  sessionUpdate: '/session/:id/edit',
  profilePreview: '/profile/preview',
  dashboard: {
    rootPath: '/dashboard',
    defaultPath: '/sessions/upcoming',
    manageSessions: '/manage/sessions',
    createSessions: '/manage/session',
    updateSessions: '/manage/session/:id/edit',
    sessions: '/sessions/:session_type',
    sessionsDetails: '/sessions/:session_id/:inventory_id/details',
    profile: '/profile',
    editProfile: '/profile/edit',
  },
};

export default Routes;
