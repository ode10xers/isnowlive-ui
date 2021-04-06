const Routes = {
  root: '/',
  legals: '/terms',
  login: '/login',
  signup: '/signup',
  adminLogin: '/admin',
  passwordVerification: '/password/verify/:token',
  emailVerification: '/email/verify/:token',
  createPassword: '/password/create',
  profile: '/creator/profile',
  livestream: '/creator/livestream',
  session: '/creator/session',
  courseSessionDetails: '/cs/:session_id',
  courseDetails: '/c/:course_id',
  videoDetails: '/v/:video_id',
  passDetails: '/p/:pass_id',
  inventoryDetails: '/e/:inventory_id',
  sessionDetails: '/s/:session_id',
  sessionUpdate: '/creator/session/:id/edit',
  sessionReschedule: '/reschedule',
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
    paymentAccount: '/payments',
    sessionEarnings: '/payments/inventory/:inventory_id',
    passEarnings: '/payments/pass/:pass_id',
    videoEarnings: '/payments/video/:video_id',
    courseEarnings: '/payments/course/:course_id',
    passes: '/passes',
    videos: '/videos',
    courses: '/courses',
    coupons: '/coupons',
    accountSettings: '/settings',
    legals: '/legals',
    documents: '/documents',
    externalSiteSettings: '/widgets',
  },
  attendeeDashboard: {
    rootPath: '/attendee/dashboard',
    defaultPath: '/sessions/upcoming',
    sessions: '/sessions/:session_type',
    sessionsDetails: '/sessions/e/:inventory_id/details',
    profile: '/profile',
    passes: '/passes',
    editProfile: '/profile/edit',
    livestream: '/livestream',
    videos: '/videos',
    videoDetails: '/videos/:video_id/:video_order_id',
    courses: '/courses',
    courseDetails: '/course/:course_id',
  },
};

export default Routes;
