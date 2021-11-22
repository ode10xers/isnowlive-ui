// API Doc : https://grapesjs.com/docs/api/block.html#block
import { fullyDisabledComponentFlags } from '../Configs/common/component_flags';

const categories = {
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

export default [
  {
    id: 'PassionSessionList',
    label: '<b> Passion Sessions List </b>',
    droppable: false,
    resizable: false,
    category: categories.PASSION_COMPONENTS,
    content: {
      type: 'container',
      components: [
        {
          type: 'fixed-width-container',
          components: [
            {
              type: 'PassionSessionList',
            },
          ],
        },
      ],
    },
  },
  {
    id: 'PassionVideoList',
    label: '<b> Passion Videos List </b>',
    droppable: false,
    resizable: false,
    category: categories.PASSION_COMPONENTS,
    content: {
      type: 'container',
      components: [
        {
          type: 'fixed-width-container',
          components: [
            {
              type: 'PassionVideoList',
            },
          ],
        },
      ],
    },
  },
  {
    id: 'PassionCourseList',
    label: '<b> Passion Course List </b>',
    droppable: false,
    resizable: false,
    category: categories.PASSION_COMPONENTS,
    content: {
      type: 'container',
      components: [
        {
          type: 'fixed-width-container',
          components: [
            {
              type: 'PassionVideoList',
            },
          ],
        },
      ],
    },
  },
  {
    id: 'PassionPassList',
    label: '<b> Passion Passes List </b>',
    droppable: false,
    resizable: false,
    category: categories.PASSION_COMPONENTS,
    content: {
      type: 'container',
      components: [
        {
          type: 'fixed-width-container',
          components: [
            {
              type: 'PassionPassList',
            },
          ],
        },
      ],
    },
  },
  {
    id: 'PassionSubscriptionList',
    label: '<b> Passion Membership List </b>',
    droppable: false,
    resizable: false,
    category: categories.PASSION_COMPONENTS,
    content: {
      type: 'container',
      components: [
        {
          type: 'fixed-width-container',
          components: [
            {
              type: 'PassionSubscriptionList',
            },
          ],
        },
      ],
    },
  },
  {
    id: 'testimonials',
    label: '<b> Testimonials </b>',
    droppable: false,
    resizable: true,
    category: categories.LAYOUTS,
    content: {
      type: 'container',
      components: [
        {
          type: 'fixed-width-container',
          components: [
            {
              tagName: 'h1',
              type: 'text',
              content: 'Testimonials',
              name: 'Testimonial Section Title',
              attributes: {},
              traits: [],
              toolbar: [
                {
                  attributes: { class: 'fa fa-trash-o' },
                  command: 'tlb-delete',
                },
              ],
              removable: true,
              draggable: false,
              droppable: false,
              highlightable: false,
              editable: true,
              copyable: false,
            },
            {
              type: 'testimonials',
            },
          ],
        },
      ],
    },
  },
  {
    id: 'simple-text-section',
    label: '<b> Simple Text Section </b>',
    category: categories.LAYOUTS,
    content: {
      type: 'simple-text-section-block',
    },
  },
  {
    id: 'simple-text-with-image-section',
    label: '<b> Simple Text with Image Section </b>',
    category: categories.LAYOUTS,
    content: {
      type: 'simple-text-with-image-block',
    },
  },
  {
    id: 'simple-text-with-button-section',
    label: '<b> Simple Text with Button Section </b>',
    category: categories.LAYOUTS,
    content: {
      type: 'simple-text-section-with-button-block',
    },
  },
  {
    id: 'simple-text-image-button-section',
    label: '<b> Simple Text Image with Button Section </b>',
    category: categories.LAYOUTS,
    content: {
      type: 'simple-text-button-with-image-block',
    },
  },
  {
    id: 'bio-with-links',
    label: '<b> Simple Bio </b>',
    category: categories.LAYOUTS,
    content: {
      type: 'simple-bio-section-block',
    },
  },
  // {
  //   id: 'link-buttons',
  //   label: '<b> Link Button </b>',
  //   droppable: false,
  //   resizable: true,
  //   category: categories.BASIC,
  //   content: {
  //     type: 'link-buttons',
  //   },
  // },
];
