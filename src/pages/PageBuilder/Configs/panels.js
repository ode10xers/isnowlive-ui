// This is the default value
// taken from https://github.com/artf/grapesjs/blob/master/src/panels/config/config.js

// const swv = 'sw-visibility';
const expt = 'export-template';
// const osm = 'open-sm';
const otm = 'open-tm';
const ola = 'open-layers';
const obl = 'open-blocks';
const ful = 'fullscreen';
const prv = 'preview';

// NOTE: This needs to match the cmd in Plugins/commands.js
const sdm = 'set-device-mobile';
const sdt = 'set-device-tablet';
const sdd = 'set-device-desktop';

const saj = 'save-as-json';

// TODO: Add more commands later
// Responsive select, export to JSON
export default {
  stylePrefix: 'pn-',

  // Default panels fa-sliders for features
  defaults: [
    // {
    //   id: 'commands',
    //   buttons: [{}]
    // },
    {
      id: 'devices',
      buttons: [
        {
          active: true,
          id: sdd,
          className: 'fa fa-desktop',
          command: sdd,
          context: sdd,
          attributes: { title: 'Set Desktop View' },
        },
        {
          id: sdt,
          className: 'fa fa-tablet',
          command: sdt,
          context: sdt,
          attributes: { title: 'Set Tablet View' },
        },
        {
          id: sdm,
          className: 'fa fa-mobile',
          command: sdm,
          context: sdm,
          attributes: { title: 'Set Mobile View' },
        },
      ],
    },
    {
      id: 'options',
      buttons: [
        // {
        //   active: true,
        //   id: swv,
        //   className: 'fa fa-square-o',
        //   command: swv,
        //   context: swv,
        //   attributes: { title: 'View components' }
        // },
        {
          id: prv,
          className: 'fa fa-eye',
          command: prv,
          context: prv,
          attributes: { title: 'Preview' },
        },
        {
          id: ful,
          className: 'fa fa-arrows-alt',
          command: ful,
          context: ful,
          attributes: { title: 'Fullscreen' },
        },
        {
          id: expt,
          className: 'fa fa-code',
          command: expt,
          attributes: { title: 'View code' },
        },
        {
          id: saj,
          className: 'fa fa-floppy-o',
          command: saj,
          attributes: { title: 'Save Template' },
        },
      ],
    },
    {
      id: 'views',
      buttons: [
        // {
        //   id: osm,
        //   className: 'fa fa-paint-brush',
        //   command: osm,
        //   active: true,
        //   togglable: 0,
        //   attributes: { title: 'Open Style Manager' }
        // },
        {
          id: otm,
          className: 'fa fa-cog',
          command: otm,
          togglable: 0,
          attributes: { title: 'Settings' },
        },
        {
          id: ola,
          className: 'fa fa-bars',
          command: ola,
          togglable: 0,
          attributes: { title: 'Open Layer Manager' },
        },
        {
          id: obl,
          active: true,
          className: 'fa fa-th-large',
          command: obl,
          togglable: 0,
          attributes: { title: 'Open Blocks' },
        },
      ],
    },
  ],

  // Editor model
  em: null,

  // Delay before show children buttons (in milliseconds)
  delayBtnsShow: 300,
};