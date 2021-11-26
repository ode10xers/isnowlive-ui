import PassionFooter from 'components/PageEditorPassionComponents/PassionFooter';
import { fullyDisabledComponentFlags } from '../Configs/common/component_flags';

export default (editor) => {
  // editor.Components.addType('site-footer', {
  //   model: {
  //     defaults: {
  //       tagName: 'footer',
  //       name: 'Site Footer',
  //       draggable: false,
  //       removable: false,
  //       copyable: false,
  //       toolbar: [],
  //       components: [
  //         {
  //           tagName: 'h5',
  //           content: '© 2021 Passion.do | All rights reserved',
  //           attributes: {
  //             class: 'footer-text',
  //           },
  //           styles: `
  //             .footer-text {
  //               text-align: center;
  //               padding: 20px;
  //               font-weight: 500;
  //               font-size: 16px;
  //             }
  //           `,
  //         },
  //       ],
  //     },
  //   },
  // });

  editor.Components.addType('PassionFooter', {
    extend: 'react-component',
    isComponent: (el) => el.tagName === 'PASSIONFOOTER',
    model: {
      defaults: {
        component: PassionFooter,
        ...fullyDisabledComponentFlags,
        attributes: {},
        traits: [],
      },
    },
  });
};
