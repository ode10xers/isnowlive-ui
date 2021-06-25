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
  paymentRetry: '/payment/retry/:retry_token',
  paymentConfirm: '/payment/redirect/verify',
  creatorDashboard: {
    rootPath: '/creator/dashboard',
    defaultPath: '/sessions/upcoming',
    sessions: '/sessions/:session_type',
    sessionsDetails: '/sessions/e/:inventory_id/details',
    videos: '/videos',
    passes: '/passes',
    courses: '/courses',
    subscriptions: '/subscriptions',
    membersList: '/members/list',
    profile: '/profile',
    editProfile: '/profile/edit',
    paymentAccount: '/payments',
    earningDetails: '/payments/:productType/:productId',
    manageSessions: '/manage/sessions',
    createSessions: '/manage/session',
    updateSessions: '/manage/session/:id/edit',
    updateCourse: '/courses/:id/edit',
    createCourse: '/courses/new',
    livestream: '/livestream',
    coupons: '/coupons',
    documents: '/documents',
    audiences: '/audiences',
    emailTemplates: '/templates/email',
    emailList: '/templates/email-list',
    accountSettings: '/settings',
    legals: '/legals',
    plugins: '/plugins',
    domains: '/domains',
    membersSettings: '/members/settings',
    membersTags: '/members/tag',
    referral: '/referral',
    affiliates: '/affiliates',
  },
  attendeeDashboard: {
    rootPath: '/attendee/dashboard',
    defaultPath: '/sessions/upcoming',
    sessions: '/sessions/:session_type',
    sessionsDetails: '/sessions/e/:inventory_id/details',
    passes: '/passes',
    videos: '/videos',
    videoDetails: '/videos/:video_id/:video_order_id',
    courses: '/courses',
    courseDetails: '/course/:course_id',
    subscriptions: '/subscriptions',
    referrals: '/referrals',
  },
};

export default Routes;
