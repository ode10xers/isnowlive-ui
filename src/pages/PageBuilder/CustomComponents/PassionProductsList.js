import { fullyDisabledComponentFlags } from '../Configs/common/component_flags';
import { generateContainerWrapper } from '../CustomComponents/Container.js';

import layouts, { sessionsLayout } from 'components/PageEditorPassionComponents/layouts';
import PassionSessionList from 'components/PageEditorPassionComponents/SessionList';
import PassionVideoList from 'components/PageEditorPassionComponents/VideoList';
import PassionCourseList from 'components/PageEditorPassionComponents/CourseList';
import PassionPassList from 'components/PageEditorPassionComponents/PassList';
import PassionSubscriptionList from 'components/PageEditorPassionComponents/SubscriptionList';

import defaultBlockToolbar from '../Configs/common/toolbar.js';
import { inventoryListCSSVars, sessionCardsCSSVars } from 'utils/widgets';
import traitTypes from '../Configs/strings/traitTypes';
import componentTypes from '../Configs/strings/componentTypes';
import { generateFontFamilyStylingText } from 'utils/helper';

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
  {
    type: componentTypes.PASSION_COMPONENTS.VIDEO_LIST,
    name: 'Passion Video List',
    component: PassionVideoList,
    blockType: componentTypes.BLOCKS.PASSION_VIDEO_LIST,
  },
  {
    type: componentTypes.PASSION_COMPONENTS.COURSE_LIST,
    name: 'Passion Course List',
    component: PassionCourseList,
    blockType: componentTypes.BLOCKS.PASSION_COURSE_LIST,
  },
  {
    type: componentTypes.PASSION_COMPONENTS.PASS_LIST,
    name: 'Passion Pass List',
    component: PassionPassList,
    blockType: componentTypes.BLOCKS.PASSION_PASS_LIST,
  },
  {
    type: componentTypes.PASSION_COMPONENTS.SUBSCRIPTION_LIST,
    name: 'Passion Subscription List',
    component: PassionSubscriptionList,
    blockType: componentTypes.BLOCKS.PASSION_SUBSCRIPTION_LIST,
  },
];

export default (editor) => {
  editor.Components.addType(componentTypes.PASSION_COMPONENTS.SESSION_LIST, {
    extend: componentTypes.REACT_COMPONENT_HANDLER,
    isComponent: (el) => el.tagName === componentTypes.PASSION_COMPONENTS.SESSION_LIST.toUpperCase(),
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

  editor.Components.addType(componentTypes.BLOCKS.PASSION_SESSION_LIST, {
    model: {
      defaults: {
        tagName: 'div',
        name: 'Passion Sessions List',
        droppable: false,
        toolbar: defaultBlockToolbar,
        attributes: {},
        components: generateContainerWrapper([{ type: componentTypes.PASSION_COMPONENTS.SESSION_LIST }]),
        layout: sessionsLayout.GRID,
        'show-image': false,
        'show-desc': false,
        'font-family': 'Segoe UI',
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
          {
            type: traitTypes.FONT.FONT_FAMILY_SELECTOR,
            name: 'font-family',
            changeProp: 1,
          },
          {
            id: 'colors',
            type: traitTypes.CUSTOM_REACT_INPUTS.CSS_VARS_COLORS,
            label: 'Customize Colors',
            options: sessionCardsCSSVars.map((vars) => ({
              id: vars.key,
              label: vars.label,
            })),
          },
        ],
      },
      init() {
        this.handleLayoutChange();

        this.on('change:layout', this.handleLayoutChange);
        this.on('change:font-family', this.handleFontFamilyChange);
        this.on('change:show-image', () => this.handleBooleanAttributeChange('show-image'));
        this.on('change:show-desc', () => this.handleBooleanAttributeChange('show-desc'));
      },
      handleBooleanAttributeChange(attrName) {
        const value = this.props()[attrName] ?? false;
        const passionSessionList = this.findType(componentTypes.PASSION_COMPONENTS.SESSION_LIST)[0] ?? null;

        if (passionSessionList) {
          passionSessionList.setAttributes({
            ...passionSessionList.getAttributes(),
            [attrName]: value,
          });
        } else {
          console.warn(`No ${componentTypes.PASSION_COMPONENTS.SESSION_LIST} Component Found!`);
        }
      },
      handleLayoutChange() {
        const layoutVal = this.props()['layout'] ?? sessionsLayout.GRID;
        const passionSessionList = this.findType(componentTypes.PASSION_COMPONENTS.SESSION_LIST)[0] ?? null;

        let attrVal = { layout: layoutVal };

        if (layoutVal === sessionsLayout.LIST) {
          attrVal = {
            ...attrVal,
            'show-image': this.props()['show-image'] ?? false,
            'show-desc': this.props()['show-desc'] ?? false,
          };

          this.removeTrait(['colors']);

          this.addTrait([
            {
              type: 'checkbox',
              name: 'show-image',
              label: 'Show Image',
              changeProp: true,
            },
            {
              type: 'checkbox',
              name: 'show-desc',
              label: 'Show Description',
              changeProp: true,
            },
            {
              id: 'colors',
              type: traitTypes.CUSTOM_REACT_INPUTS.CSS_VARS_COLORS,
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
          this.removeTrait(['show-image', 'show-desc', 'colors']);
          this.addTrait({
            id: 'colors',
            type: traitTypes.CUSTOM_REACT_INPUTS.CSS_VARS_COLORS,
            label: 'Customize Colors',
            options: sessionCardsCSSVars.map((vars) => ({
              id: vars.key,
              label: vars.label,
            })),
          });
          if (passionSessionList) {
            passionSessionList.removeAttributes(['show-image', 'show-desc']);

            passionSessionList.setAttributes({
              ...passionSessionList.getAttributes(),
              layout: layoutVal,
            });
          }
        }
      },
      handleFontFamilyChange() {
        const font = this.props()['font-family'];

        const cssVarName = '--inventory-list-custom-font';

        this.setStyle({
          ...this.getStyle(),
          [cssVarName]: generateFontFamilyStylingText(font),
        });
      },
    },
  });

  passionProductsListComponents.forEach((comp) => {
    // NOTE: Initially, each component can be selected and we
    // can choose the layouts (GRID or Horizontal scroll, etc)
    editor.Components.addType(comp.type, {
      extend: componentTypes.REACT_COMPONENT_HANDLER,
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
