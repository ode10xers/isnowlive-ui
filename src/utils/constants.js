import WebsiteLogo from 'assets/icons/website/WebsiteLogo';
import FacebookLogo from 'assets/icons/facebook/FacebookLogo';
import TwitterLogo from 'assets/icons/twitter/TwitterLogo';
import InstagramLogo from 'assets/icons/instagram/InstagramLogo';
import LinkedInLogo from 'assets/icons/linkedin/LinkedInLogo';

// TODO: Move constants in helper.js and other utils file here
export const paymentProvider = {
  STRIPE: 'STRIPE',
  PAYPAL: 'PAYPAL',
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
