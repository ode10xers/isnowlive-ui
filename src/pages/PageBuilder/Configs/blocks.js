// API Doc : https://grapesjs.com/docs/api/block.html#block

const categories = {
  LAYOUTS: 'Layouts',
  PASSION_COMPONENTS: 'Passion Components',
  SIMPLE_COMPONENTS: 'Simple Components',
  BASIC: 'Basic',
};

// export default [
//   {
//     id: 'container', // id is mandatory
//     label: '<b>Container</b>', // You can use HTML/SVG inside labels
//     droppable: true,
//     resizable: true,
//     content: `<section>
//       <h1>This is a simple container</h1>
//       <div>You can drag other components inside this container</div>
//     </section>`,
//   },
//   {
//     id: 'text',
//     label: 'Text',
//     droppable: false,
//     content: '<div data-gjs-type="text">Insert your text here</div>',
//   },
//   {
//     id: 'image',
//     label: 'Image',
//     // Select the component once it's dropped
//     select: true,
//     // You can pass components as a JSON instead of a simple HTML string,
//     // in this case we also use a defined component type `image`
//     content: { type: 'image' },
//     // This triggers `active` event on dropped components and the `image`
//     // reacts by opening the AssetManager
//     activate: true,
//     resizable: true,
//   },
// ];

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
          type: 'PassionSessionList',
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
          type: 'PassionVideoList',
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
          type: 'PassionCourseList',
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
          type: 'PassionPassList',
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
          type: 'PassionSubscriptionList',
        },
      ],
    },
  },
  {
    id: 'text-section',
    label: '<b> Text Section </b>',
    droppable: false,
    resizable: true,
    category: categories.LAYOUTS,
    content: {
      type: 'text-section',
    },
  },
  {
    id: 'text-with-image',
    label: '<b> Text with Image </b>',
    droppable: false,
    resizable: true,
    category: categories.LAYOUTS,
    content: {
      type: 'text-with-image-section',
    },
  },
  {
    id: 'text-section-with-btn',
    label: '<b> Text Section with Button </b>',
    droppable: false,
    resizable: true,
    category: categories.LAYOUTS,
    content: {
      type: 'text-section-with-button',
    },
  },
  {
    id: 'text-button-with-image-section',
    label: '<b> Text Section with Button and Image </b>',
    droppable: false,
    resizable: true,
    category: categories.LAYOUTS,
    content: {
      type: 'text-button-with-image-section',
    },
  },
  {
    id: 'bio-with-links',
    label: '<b> Bio with Social Media Links </b>',
    droppable: false,
    resizable: true,
    category: categories.LAYOUTS,
    content: {
      type: 'bio-social-media',
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
