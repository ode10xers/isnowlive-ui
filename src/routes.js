const Routes = {
  root: '/',
  login: '/login',
  signup: '/signup',
  profile: '/profile',
  session: '/session',
  sessionDetails: '/session/:id',
  sessionUpdate: '/session/:id/edit',
  profilePreview: '/profile/preview',
  dashboardSessions: '/dashboard/sessions/:session_type',
  dashboardSessionsDetails: '/dashboard/sessions/:session_id/:inventory_id/details',
};

export default Routes;
