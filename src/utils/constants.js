import WebsiteLogo from 'assets/icons/website/WebsiteLogo';
import FacebookLogo from 'assets/icons/facebook/FacebookLogo';
import TwitterLogo from 'assets/icons/twitter/TwitterLogo';
import InstagramLogo from 'assets/icons/instagram/InstagramLogo';
import LinkedInLogo from 'assets/icons/linkedin/LinkedInLogo';

// NOTE : Currently these are from Google Font Families
// If using WebFontLoader works with others and we want them
// Need to redefine the format
export const googleFonts = {
  MERRIWEATHER: 'Merriweather',
  INDIEFLOWER: 'Indie Flower',
  OPENSANS: 'Open Sans',
  POPPINS: 'Poppins',
};

export const paymentProvider = {
  STRIPE: 'STRIPE',
  PAYPAL: 'PAYPAL',
};

export const couponTypes = {
  ABSOLUTE: 'ABSOLUTE',
  PERCENTAGE: 'PERCENTAGE',
};

export const socialMediaIcons = {
  website: WebsiteLogo,
  facebook_link: FacebookLogo,
  twitter_link: TwitterLogo,
  instagram_link: InstagramLogo,
  linkedin_link: LinkedInLogo,
};

export const sessionMeetingTypes = {
  SYSTEM_GENERATED: 'SYSTEM_GENERATED_MEETING',
  CUSTOM_MEETING: 'CUSTOM_MEETING',
};

export const attendeeProductOrderTypes = {
  COURSE: 'course',
};

export const defaultPlatformFeePercentage = 0.1;

export const ZoomAuthType = {
  OAUTH: 'OAUTH',
  JWT: 'JWT',
  NOT_CONNECTED: 'NOT_CONNECTED',
};

export const StripeAccountStatus = {
  NOT_CONNECTED: 'NOT_CONNECTED',
  VERIFICATION_PENDING: 'VERIFICATION_PENDING',
  CONNECTED: 'CONNECTED',
};

export const StripePaymentStatus = {
  AWAITING_CAPTURE: 'AWAITING_CAPTURE',
  AWAITING_METHOD: 'AWAITING_METHOD',
  AWAITING_ACTION: 'AWAITING_ACTION',
  AWAITING_CONFIRMATION: 'AWAITING_CONFIRMATION ',
  AUTHORIZATION_REQUIRED: 'AUTHORIZATION_REQUIRED',
  SUCCESS: 'SUCCESS',
};

export const paymentSource = {
  GATEWAY: 'PAYMENT_GATEWAY',
  PASS: 'PASS',
  SUBSCRIPTION: 'SUBSCRIPTION',
};

export const orderType = {
  CLASS: 'SESSION_ORDER',
  PASS: 'PASS_ORDER',
  VIDEO: 'VIDEO_ORDER',
  COURSE: 'COURSE_ORDER',
  SUBSCRIPTION: 'SUBSCRIPTION_ORDER',
};

export const courseType = {
  LIVE: 'LIVE', // Live sessions only
  VIDEO: 'VIDEO', // Videos only
  MIXED: 'MIXED',
  VIDEO_SEQ: 'VIDEO_SEQUENCE', // Deprecated
  VIDEO_NON_SEQ: 'VIDEO_NON_SEQUENCE', // Deprecated
};

export const videoSourceType = {
  CLOUDFLARE: 'CLOUDFLARE',
  YOUTUBE: 'YOUTUBE',
};

export const productType = {
  CLASS: 'Session',
  PASS: 'Pass',
  VIDEO: 'Video',
  COURSE: 'Course',
  SUBSCRIPTION: 'Membership',
  PRODUCT: 'Product', //As a default
};

export const isoDayOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const reservedDomainName = ['app', ...(process.env.NODE_ENV === 'development' ? ['localhost'] : [])];
