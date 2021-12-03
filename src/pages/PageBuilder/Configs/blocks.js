// API Doc : https://grapesjs.com/docs/api/block.html#block

import sessionListIcon from 'assets/icons/page_editor_blocks/session_list.svg';
import videoListIcon from 'assets/icons/page_editor_blocks/video_list.svg';
import courseListIcon from 'assets/icons/page_editor_blocks/course_list.svg';
import passListIcon from 'assets/icons/page_editor_blocks/pass_list.svg';
import membershipListIcon from 'assets/icons/page_editor_blocks/membership_list.svg';
import textSectionIcon from 'assets/icons/page_editor_blocks/text_section.svg';
import textWithImageIcon from 'assets/icons/page_editor_blocks/text_with_image.svg';
import componentTypes from './strings/componentTypes';

export const blockCategories = {
  LAYOUTS: 'Layouts',
  PASSION_COMPONENTS: 'Passion Components',
  SIMPLE_COMPONENTS: 'Simple Components',
  BASIC: 'Basic',
};

const generateMediaIcon = (iconUrl = 'none') => `<img src="${iconUrl}" loading="lazy" />`;

const passionProductListBlocks = [
  {
    id: componentTypes.BLOCKS.PASSION_SESSION_LIST,
    label: 'Passion Session List',
    icon: sessionListIcon,
  },
  {
    id: componentTypes.BLOCKS.PASSION_VIDEO_LIST,
    label: 'Passion Video List',
    media: videoListIcon,
  },
  {
    id: componentTypes.BLOCKS.PASSION_COURSE_LIST,
    label: 'Passion Course List',
    media: courseListIcon,
  },
  {
    id: componentTypes.BLOCKS.PASSION_PASS_LIST,
    label: 'Passion Pass List',
    media: passListIcon,
  },
  {
    id: componentTypes.BLOCKS.PASSION_SUBSCRIPTION_LIST,
    label: 'Passion Subscription List',
    media: membershipListIcon,
  },
].map((data) => ({
  id: data.id,
  label: `<b> ${data.label} </b>`,
  droppable: false,
  resizable: false,
  media: generateMediaIcon(data.icon),
  category: blockCategories.PASSION_COMPONENTS,
  content: { type: data.id },
}));

const presetLayouts = [
  {
    id: componentTypes.BLOCKS.LAYOUT_TEXT_SECTION,
    label: '<b> Simple Text Section </b>',
    media: generateMediaIcon(textSectionIcon),
    category: blockCategories.LAYOUTS,
    content: {
      type: componentTypes.BLOCKS.LAYOUT_TEXT_SECTION,
    },
  },
  {
    id: componentTypes.BLOCKS.LAYOUT_TEXT_IMAGE_SECTION,
    label: '<b> Simple Text with Image Section </b>',
    media: generateMediaIcon(textWithImageIcon),
    category: blockCategories.LAYOUTS,
    content: {
      type: componentTypes.BLOCKS.LAYOUT_TEXT_IMAGE_SECTION,
    },
  },
  {
    id: componentTypes.BLOCKS.LAYOUT_TEXT_BTN_SECTION,
    label: '<b> Simple Text with Button Section </b>',
    category: blockCategories.LAYOUTS,
    content: {
      type: componentTypes.BLOCKS.LAYOUT_TEXT_BTN_SECTION,
    },
  },
  {
    id: componentTypes.BLOCKS.LAYOUT_TEXT_BTN_IMAGE_SECTION,
    label: '<b> Simple Text Image with Button Section </b>',
    category: blockCategories.LAYOUTS,
    content: {
      type: componentTypes.BLOCKS.LAYOUT_TEXT_BTN_IMAGE_SECTION,
    },
  },
  {
    id: componentTypes.BLOCKS.LAYOUT_BIO,
    label: '<b> Simple Bio </b>',
    category: blockCategories.LAYOUTS,
    content: {
      type: componentTypes.BLOCKS.LAYOUT_BIO,
    },
  },
  {
    id: componentTypes.BLOCKS.LAYOUT_TESTIMONIALS,
    label: '<b> Testimonials </b>',
    category: blockCategories.LAYOUTS,
    content: {
      type: componentTypes.BLOCKS.LAYOUT_TESTIMONIALS,
    },
  },
];

const simpleComponents = [
  {
    id: componentTypes.SIMPLE_COMPONENTS.FLEX_COLUMN_CONTAINER,
    label: '<b> Single Column Container </b>',
    category: blockCategories.SIMPLE_COMPONENTS,
    select: true,
    content: {
      type: componentTypes.SIMPLE_COMPONENTS.FLEX_COLUMN_CONTAINER,
    },
  },
  {
    id: componentTypes.SIMPLE_COMPONENTS.TWO_COLUMN_CONTAINER,
    label: '<b> Two Column Container </b>',
    category: blockCategories.SIMPLE_COMPONENTS,
    select: true,
    content: {
      type: componentTypes.SIMPLE_COMPONENTS.TWO_COLUMN_CONTAINER,
    },
  },
  {
    id: componentTypes.SIMPLE_COMPONENTS.TEXT_ITEM,
    label: '<b> Text </b>',
    category: blockCategories.SIMPLE_COMPONENTS,
    select: true,
    content: {
      type: componentTypes.SIMPLE_COMPONENTS.TEXT_ITEM,
    },
  },
  {
    id: componentTypes.SIMPLE_COMPONENTS.IMAGE_ITEM,
    label: '<b> Image </b>',
    category: blockCategories.SIMPLE_COMPONENTS,
    select: true,
    content: {
      type: componentTypes.SIMPLE_COMPONENTS.IMAGE_ITEM,
    },
  },
];

export default [...presetLayouts, ...simpleComponents, ...passionProductListBlocks];
