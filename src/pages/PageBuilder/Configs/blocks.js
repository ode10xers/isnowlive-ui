// API Doc : https://grapesjs.com/docs/api/block.html#block
import { fullyDisabledComponentFlags } from '../Configs/common/component_flags';

import sessionListIcon from 'assets/icons/page_editor_blocks/session_list.svg';
import videoListIcon from 'assets/icons/page_editor_blocks/video_list.svg';
import courseListIcon from 'assets/icons/page_editor_blocks/course_list.svg';
import passListIcon from 'assets/icons/page_editor_blocks/pass_list.svg';
import membershipListIcon from 'assets/icons/page_editor_blocks/membership_list.svg';
import textSectionIcon from 'assets/icons/page_editor_blocks/text_section.svg';
import textWithImageIcon from 'assets/icons/page_editor_blocks/text_with_image.svg';

export const blockCategories = {
  LAYOUTS: 'Layouts',
  PASSION_COMPONENTS: 'Passion Components',
  SIMPLE_COMPONENTS: 'Simple Components',
  BASIC: 'Basic',
};

export const generateContainerWrapper = (innerComponents = []) => [
  {
    type: 'container',
    ...fullyDisabledComponentFlags,
    components: [
      {
        type: 'fixed-width-container',
        ...fullyDisabledComponentFlags,
        components: innerComponents,
      },
    ],
  },
];

const passionProductListBlocks = [
  {
    id: 'passion-session-list-block',
    label: '<b> Passion Session List </b>',
    droppable: false,
    resizable: false,
    media: `<img src="${sessionListIcon}" loading="lazy" />`,
    category: blockCategories.PASSION_COMPONENTS,
    attributes: {
      title: 'Click to add',
    },
    content: {
      type: 'passion-session-list-block',
    },
  },
  {
    id: 'passion-video-list-block',
    label: '<b> Passion Video List </b>',
    droppable: false,
    resizable: false,
    media: `<img src="${videoListIcon}" loading="lazy" />`,
    category: blockCategories.PASSION_COMPONENTS,
    attributes: {
      title: 'Click to add',
    },
    content: {
      type: 'passion-video-list-block',
    },
  },
  {
    id: 'passion-course-list-block',
    label: '<b> Passion Course List </b>',
    droppable: false,
    resizable: false,
    media: `<img src="${courseListIcon}" loading="lazy" />`,
    category: blockCategories.PASSION_COMPONENTS,
    content: {
      type: 'passion-course-list-block',
    },
  },
  {
    id: 'passion-pass-list-block',
    label: '<b> Passion Pass List </b>',
    droppable: false,
    resizable: false,
    media: `<img src="${passListIcon}" loading="lazy" />`,
    category: blockCategories.PASSION_COMPONENTS,
    content: {
      type: 'passion-pass-list-block',
    },
  },
  {
    id: 'passion-subscription-list-block',
    label: '<b> Passion Subscription List </b>',
    droppable: false,
    resizable: false,
    media: `<img src="${membershipListIcon}" loading="lazy" />`,
    category: blockCategories.PASSION_COMPONENTS,
    content: {
      type: 'passion-subscription-list-block',
    },
  },
];

const presetLayouts = [
  {
    id: 'simple-text-section',
    label: '<b> Simple Text Section </b>',
    media: `<img src="${textSectionIcon}" loading="lazy" />`,
    category: blockCategories.LAYOUTS,
    attributes: {
      'data-wide-mode': 'true',
    },
    content: {
      type: 'simple-text-section-block',
    },
  },
  {
    id: 'simple-text-with-image-section',
    label: '<b> Simple Text with Image Section </b>',
    media: `<img src="${textWithImageIcon}" loading="lazy" />`,
    category: blockCategories.LAYOUTS,
    attributes: {
      'data-wide-mode': 'true',
    },
    content: {
      type: 'simple-text-with-image-block',
    },
  },
  {
    id: 'simple-text-with-button-section',
    label: '<b> Simple Text with Button Section </b>',
    category: blockCategories.LAYOUTS,
    attributes: {
      'data-wide-mode': 'true',
    },
    content: {
      type: 'simple-text-section-with-button-block',
    },
  },
  {
    id: 'simple-text-image-button-section',
    label: '<b> Simple Text Image with Button Section </b>',
    category: blockCategories.LAYOUTS,
    attributes: {
      'data-wide-mode': 'true',
    },
    content: {
      type: 'simple-text-button-with-image-block',
    },
  },
  {
    id: 'bio-with-links',
    label: '<b> Simple Bio </b>',
    category: blockCategories.LAYOUTS,
    attributes: {
      'data-wide-mode': 'true',
    },
    content: {
      type: 'simple-bio-section-block',
    },
  },
  {
    id: 'testimonials',
    label: '<b> Testimonials </b>',
    category: blockCategories.LAYOUTS,
    attributes: {
      'data-wide-mode': 'true',
    },
    content: {
      type: 'testimonials-block',
    },
  },
];

const simpleComponents = [
  {
    id: 'flex-container',
    label: '<b> Single Column Container </b>',
    category: blockCategories.SIMPLE_COMPONENTS,
    select: true,
    content: {
      type: 'flex-column-container',
    },
  },
  {
    id: 'two-column-container',
    label: '<b> Two Column Container </b>',
    category: blockCategories.SIMPLE_COMPONENTS,
    select: true,
    content: {
      type: 'two-column-container',
    },
  },
  {
    id: 'text-item',
    label: '<b> Text </b>',
    category: blockCategories.SIMPLE_COMPONENTS,
    select: true,
    content: {
      type: 'text-item',
    },
  },
  {
    id: 'image-item',
    label: '<b> Image </b>',
    category: blockCategories.SIMPLE_COMPONENTS,
    select: true,
    content: {
      type: 'image-item',
    },
  },
];

export default [...presetLayouts, ...simpleComponents, ...passionProductListBlocks];
