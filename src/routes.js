const Routes = {
  root: '/',
  legals: '/terms',
  login: '/login',
  signup: '/signup',
  adminLogin: '/admin',
  sessions: '/sessions',
  videos: '/videos',
  courses: '/courses',
  passwordVerification: '/password/verify/:token',
  emailVerification: '/email/verify/:token',
  createPassword: '/password/create',
  profile: '/creator/profile',
  livestream: '/creator/livestream',
  sessionCreate: '/creator/session',
  courseSessionDetails: '/cs/:session_id',
  courseDetails: '/c/:course_id',
  videoDetails: '/v/:video_id',
  passDetails: '/p/:pass_id',
  inventoryDetails: '/e/:inventory_id',
  sessionDetails: '/s/:session_id',
  membershipDetails: '/m/:membership_id',
  sessionUpdate: '/creator/session/:id/edit',
  sessionReschedule: '/reschedule',
  profilePreview: '/profile/preview',
  stripeAccountValidate: '/stripe/account/validate',
  stripePaymentSuccess: '/stripe/payment/success',
  paymentRetry: '/payment/retry/:retry_token',
  paymentConfirm: '/payment/redirect/verify',
  community: {
    root: '/community/:course_id',
    chatChannels: '/channels',
    feeds: '/feeds',
  },
  list: {
    sessions: '/list/sessions',
    videos: '/list/videos',
    courses: '/list/courses',
  },
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
    profileComponents: {
      sessions: '/profile/sessions',
      sessionsList: '/profile/list/sessions',
      videos: '/profile/videos',
      videosList: '/profile/list/videos',
      courses: '/profile/courses',
      coursesList: '/profile/list/courses',
    },
    editProfile: '/profile/edit',
    paymentAccount: '/payments',
    earningDetails: '/payments/:productType/:productId',
    manageSessions: '/manage/sessions',
    createSessions: '/manage/session',
    updateSessions: '/manage/session/:id/edit',
    createCourse: '/courses/new',
    updateCourse: '/courses/:course_id/edit',
    createCourseModule: '/courses/:course_id/modules',
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
    defaultPath: '/products',
    sessions: '/sessions/:session_type',
    passes: '/passes',
    videos: '/videos',
    videoDetails: '/videos/:video_id/:video_order_id',
    courses: '/courses',
    courseDetails: '/course/:course_id',
    subscriptions: '/subscriptions',
    referrals: '/referrals',
    dashboardPage: '/products',
  },
};

export default Routes;
