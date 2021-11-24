import { fullyDisabledComponentFlags } from '../Configs/common/component_flags';
import { generateContainerWrapper } from '../Configs/blocks';

import layouts from 'components/PageEditorPassionComponents/layouts';
import PassionSessionList from 'components/PageEditorPassionComponents/SessionList';
import PassionVideoList from 'components/PageEditorPassionComponents/VideoList';
import PassionCourseList from 'components/PageEditorPassionComponents/CourseList';
import PassionPassList from 'components/PageEditorPassionComponents/PassList';
import PassionSubscriptionList from 'components/PageEditorPassionComponents/SubscriptionList';

import defaultBlockToolbar from '../Configs/common/toolbar.js';

/* 
NOTE: Old flag used in the React Components 
  stylable: false,
  resizable: false,
  editable: false,
  droppable: false,
  draggable: true,
  removable: true,
  badgeable: true,
  highlightable: true,
  hoverable: true,
  copyable: true,
*/

const passionProductsListComponents = [
  {
    type: 'PassionSessionList',
    name: 'Passion Session List',
    component: PassionSessionList,
    blockType: 'passion-session-list-block',
  },
  {
    type: 'PassionVideoList',
    name: 'Passion Video List',
    component: PassionVideoList,
    blockType: 'passion-video-list-block',
  },
  {
    type: 'PassionCourseList',
    name: 'Passion Course List',
    component: PassionCourseList,
    blockType: 'passion-course-list-block',
  },
  {
    type: 'PassionPassList',
    name: 'Passion Pass List',
    component: PassionPassList,
    blockType: 'passion-pass-list-block',
  },
  {
    type: 'PassionSubscriptionList',
    name: 'Passion Subscription List',
    component: PassionSubscriptionList,
    blockType: 'passion-subscription-list-block',
  },
];

export default (editor) => {
  passionProductsListComponents.forEach((comp) => {
    // NOTE: Initially, each component can be selected and we
    // can choose the layouts (GRID or Horizontal scroll, etc)
    editor.Components.addType(comp.type, {
      extend: 'react-component',
      model: {
        defaults: {
          component: comp.component,
          ...fullyDisabledComponentFlags,
          attributes: {
            layout: layouts.GRID,
          },
          traits: [
            {
              type: 'select',
              name: 'layout',
              options: Object.entries(layouts).map(([key, val]) => ({
                id: val,
                name: key,
              })),
            },
          ],
        },
      },
      isComponent: (el) => el.tagName === comp.type.toUpperCase(),
    });

    editor.Components.addType(comp.blockType, {
      model: {
        defaults: {
          tagName: 'div',
          name: comp.name,
          droppable: false,
          toolbar: defaultBlockToolbar,

          attributes: {},
          traits: [],
          components: generateContainerWrapper([{ type: comp.type }]),
        },
      },
    });
  });
};
