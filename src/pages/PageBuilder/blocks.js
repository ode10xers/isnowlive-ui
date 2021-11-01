// API Doc : https://grapesjs.com/docs/api/block.html#block
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
    id: 'Text Section',
    label: '<b> Text Section </b>',
    droppable: false,
    resizable: true,
    content: {
      type: 'text-section',
    },
  },
  {
    id: 'Text with image',
    label: '<b> Text with Image </b>',
    droppable: false,
    resizable: true,
    content: {
      type: 'text-with-image-section',
    },
  },
];
