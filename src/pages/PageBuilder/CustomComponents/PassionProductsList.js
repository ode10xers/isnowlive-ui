import { fullyDisabledComponentFlags } from '../Configs/common/component_flags';
import { generateContainerWrapper } from '../CustomComponents/Container.js';

import layouts, { sessionsLayout } from 'components/PageEditorPassionComponents/layouts';
import PassionSessionList from 'components/PageEditorPassionComponents/SessionList';
import PassionVideoList from 'components/PageEditorPassionComponents/VideoList';
import PassionCourseList from 'components/PageEditorPassionComponents/CourseList';
import PassionPassList from 'components/PageEditorPassionComponents/PassList';
import PassionSubscriptionList from 'components/PageEditorPassionComponents/SubscriptionList';

import defaultBlockToolbar from '../Configs/common/toolbar.js';
import { inventoryListCSSVars } from 'utils/widgets';

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

// For components with custom configs, we'll initialize them separately for now
const passionProductsListComponents = [
  // {
  //   type: 'PassionSessionList',
  //   name: 'Passion Session List',
  //   component: PassionSessionList,
  //   blockType: 'passion-session-list-block',
  // },
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
  editor.Components.addType('PassionSessionList', {
    extend: 'react-component',
    isComponent: (el) => el.tagName === 'PASSIONSESSIONLIST',
    model: {
      defaults: {
        component: PassionSessionList,
        ...fullyDisabledComponentFlags,
        attributes: {
          layout: sessionsLayout.GRID,
        },
      },
    },
  });

  editor.Components.addType('passion-session-list-block', {
    model: {
      defaults: {
        tagName: 'div',
        name: 'Passion Sessions List',
        droppable: false,
        toolbar: defaultBlockToolbar,
        attributes: {},
        components: generateContainerWrapper([{ type: 'PassionSessionList' }]),
        layout: sessionsLayout.GRID,
        'show-image': false,
        'show-desc': false,
        traits: [
          {
            type: 'select',
            name: 'layout',
            changeProp: true,
            options: Object.entries(sessionsLayout).map(([key, val]) => ({
              id: val,
              name: key,
            })),
          },
        ],
      },
      init() {
        this.handleLayoutChange();

        this.on('change:layout', this.handleLayoutChange);
        this.on('change:show-image', () => this.handleBooleanAttributeChange('show-image'));
        this.on('change:show-desc', () => this.handleBooleanAttributeChange('show-desc'));
      },
      handleBooleanAttributeChange(attrName) {
        const value = this.props()[attrName] ?? false;
        const passionSessionList = this.findType('PassionSessionList')[0] ?? null;

        if (passionSessionList) {
          passionSessionList.setAttributes({
            ...passionSessionList.getAttributes(),
            [attrName]: value,
          });
        } else {
          console.warn('No PassionSessionList Component Found!');
        }
      },
      handleLayoutChange() {
        const layoutVal = this.props()['layout'] ?? sessionsLayout.GRID;
        const passionSessionList = this.findType('PassionSessionList')[0] ?? null;

        let attrVal = { layout: layoutVal };

        if (layoutVal === sessionsLayout.LIST) {
          attrVal = {
            ...attrVal,
            'show-image': this.props()['show-image'] ?? false,
            'show-desc': this.props()['show-desc'] ?? false,
          };

          this.addTrait([
            {
              type: 'checkbox',
              name: 'show-image',
              label: 'Show Image?',
              changeProp: true,
            },
            {
              type: 'checkbox',
              name: 'show-desc',
              label: 'Show Description?',
              changeProp: true,
            },
            {
              type: 'css-vars-colors',
              label: 'Customize Colors',
              options: inventoryListCSSVars.map((vars) => ({
                id: vars.key,
                label: vars.label,
              })),
            },
          ]);

          if (passionSessionList) {
            passionSessionList.setAttributes({
              ...passionSessionList.getAttributes(),
              ...attrVal,
            });
          }
        } else {
          // TODO: Might want to remove the CSS vars by looping through options
          this.removeTrait(['show-image', 'show-desc', 'css-vars-colors']);
          if (passionSessionList) {
            passionSessionList.removeAttributes(['show-image', 'show-desc']);

            passionSessionList.setAttributes({
              ...passionSessionList.getAttributes(),
              layout: layoutVal,
            });
          }
        }
      },
    },
  });

  passionProductsListComponents.forEach((comp) => {
    // NOTE: Initially, each component can be selected and we
    // can choose the layouts (GRID or Horizontal scroll, etc)
    editor.Components.addType(comp.type, {
      extend: 'react-component',
      isComponent: (el) => el.tagName === comp.type.toUpperCase(),
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
