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
    sessions: '/sessions/:session_type',
    sessionsDetails: '/sessions/:session_id/:inventory_id/details',
  },
};

export default Routes;
