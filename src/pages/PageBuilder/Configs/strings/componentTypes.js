/*
  Component Types with '-block' endings refers to Block Component TYpes
  These Types usually have most of the traits and event listeners, wraps the 
  inner components at the outer level. These are the ones that also shows up
  in the block list (left of the UI).

  Everything else are Inner Component Types that are intended to exist/dropped inside
  wrappers (e.g. containers) or Block Type Components. These Inner Components usually
  have the stylings and class definitions.
*/

export default {
  BLOCKS: {
    PASSION_SESSION_LIST: 'passion-session-list-block',
    PASSION_VIDEO_LIST: 'passion-video-list-block',
    PASSION_COURSE_LIST: 'passion-course-list-block',
    PASSION_PASS_LIST: 'passion-pass-list-block',
    PASSION_SUBSCRIPTION_LIST: 'passion-subscription-list-block',

    LAYOUT_TEXT_SECTION: 'simple-text-section-block',
    LAYOUT_TEXT_IMAGE_SECTION: 'simple-text-with-image-block',
    LAYOUT_TEXT_BTN_SECTION: 'simple-text-section-with-button-block',
    LAYOUT_TEXT_BTN_IMAGE_SECTION: 'simple-text-button-with-image-block',
    LAYOUT_BIO: 'simple-bio-section-block',
    LAYOUT_TESTIMONIALS: 'testimonials-block',

    HEADER: 'passion-header-block',
    FOOTER: 'PassionFooter', // This is due to us using React Wrapper for this footer
  },
  SIMPLE_COMPONENTS: {
    // NOTE: These are special blocks which also acts as components and can be nested
    FLEX_COLUMN_CONTAINER: 'flex-column-container',
    TWO_COLUMN_CONTAINER: 'two-column-container',
    TEXT_ITEM: 'text-item',
    IMAGE_ITEM: 'image-item',
    // NOTE: Specific types that are used internally and not exposed publicly
    INNER: {
      COLUMN_ITEM: 'flex-column-item',
    },
  },

  LAYOUTS: {
    CONTAINER: 'container',
    FIXED_WIDTH_CONTAINER: 'fixed-width-container',
    COMPACT_FIXED_WIDTH_CONTAINER: 'compact-fixed-width-container',

    INNER: {
      TEXT_SECTION_HEADING: 'text-section-heading',
      TEXT_SECTION_CONTENT: 'text-section-content',
      TEXT_SECTION_WRAPPER: 'simple-text-section',

      TEXT_SECTION_WITH_BTN_WRAPPER: 'simple-text-section-with-button',

      TEXT_IMAGE_SECTION_WRAPPER: 'simple-text-image-section',
      TEXT_IMAGE_BTN_SECTION_WRAPPER: 'simple-text-image-button-section',

      BIO_SECTION: 'simple-bio-section',
      BIO_WITH_IMAGE_SECTION: 'simple-bio-with-image-section',

      TESTIMONIAL_ITEM: 'testimonial-item',
      TESTIMONIALS_WRAPPER: 'testimonials',
    },
  },

  CUSTOM_COMPONENTS: {
    LINK_BUTTON: 'link-buttons',
    CUSTOM_IMAGE: 'custom-image',

    REACT_SIGN_IN_BUTTON: 'SignInButton',

    INNER: {
      TEXT_SECTION_BUTTON: 'text-section-link-button',
      SOCIAL_MEDIA_LINKS: 'social-media-links',
    },
  },

  PASSION_COMPONENTS: {
    SESSION_LIST: 'PassionSessionList',
    VIDEO_LIST: 'PassionVideoList',
    COURSE_LIST: 'PassionCourseList',
    PASS_LIST: 'PassionPassList',
    SUBSCRIPTION_LIST: 'PassionSubscriptionList',
  },

  HEADER: {
    NAVBAR_WRAPPER: 'navbar-header',

    INNER: {
      TEXT_BRAND: 'header-text-brand',
      BRAND_WRAPPER: 'header-brand',
    },
  },

  REACT_COMPONENT_HANDLER: 'react-component',
};
