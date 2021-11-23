import elementIds from './elementIds';

const {
  BUILDER_CONTAINER_ID,
  SELECTOR_PANEL_ID,
  STYLES_PANEL_ID,
  TRAITS_PANEL_ID,
  LAYERS_PANEL_ID,
  BLOCKS_PANEL_ID,
} = elementIds;

export default {
  // Indicate where to init the editor. You can also pass an HTMLElement
  container: '#' + BUILDER_CONTAINER_ID,
  // TODO: Investigate will this be required when rendering page
  // Show the wrapper component in the final code, eg. in editor.getHtml()
  // exportWrapper: true, // This is to allow them to play with paddings and all
  // The wrapper, if visible, will be shown as a `<body>`
  // wrapperIsBody: false,
  // Get the content for the canvas directly from the element
  // As an alternative we could use: `components: '<h1>Hello World Component!</h1>'`,
  // fromElement: true,
  // Size of the editor
  height: 'calc(100vh - 80px)',
  width: 'auto',
  noticeOnUnload: true,
  showOffsetsSelected: true,
  keepUnusedStyles: false,
  storageManager: {
    id: 'gjs-', // Prefix identifier that will be used on parameters
    type: 'local', // Type of the storage
    autosave: true, // Store data automatically
    autoload: false, // Autoload stored data on init
    stepsBeforeSave: 5, // If autosave enabled, indicates how many changes are necessary before store method is triggered
  },
  // Avoid any default panel
  // panels: definedPanels,
  // Built-in props for styles
  // https://grapesjs.com/docs/modules/Style-manager.html#built-in-properties
  selectorManager: {
    appendTo: '#' + SELECTOR_PANEL_ID,
    componentFirst: true,
  },
  styleManager: {
    appendTo: '#' + STYLES_PANEL_ID,
    clearProperties: true,
  },
  traitManager: {
    appendTo: '#' + TRAITS_PANEL_ID,
  },
  layerManager: {
    appendTo: '#' + LAYERS_PANEL_ID,
  },
  blockManager: {
    appendTo: '#' + BLOCKS_PANEL_ID,
    appendOnClick: (block, editor) => {
      editor.getWrapper().append(block.get('content'));
    },
  },
  deviceManager: {
    devices: [
      {
        name: 'Desktop',
        width: '', // default size
      },
      {
        name: 'Tablet',
        width: '768px', // this value will be used on canvas width
        widthMedia: '768px', // this value will be used in CSS @media
      },
      {
        name: 'Mobile',
        width: '426px', // this value will be used on canvas width
        widthMedia: '576px', // this value will be used in CSS @media
      },
    ],
  },
  // Sample Remote Storage Config
  // storageManager: {
  //   id: '', // Prefix identifier that will be used on parameters
  //   type: 'remote', // Type of the storage
  //   autosave: true, // Store data automatically
  //   autoload: false, // Autoload stored data on init
  //   stepsBeforeSave: 5, // If autosave enabled, indicates how many changes are necessary before store method is triggered
  //   urlStore: config.server.baseURL + '/secure/creator/website/pages',
  //   headers: {
  //     'auth-token': userDetails?.auth_token ?? getLocalUserDetails()?.auth_token ?? '',
  //     'creator-username': getUsernameFromUrl() ?? '',
  //   },
  //   credentials: 'omit',
  //   fetchOptions: (currentOptions) => {
  //     console.log("Current Options: ", currentOptions)
  //     return currentOptions.method === 'post' ? { method: 'PATCH' } : {};
  //   }
  // },
};
