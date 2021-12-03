import PassionFooter from 'components/PageEditorPassionComponents/PassionFooter';
import { fullyDisabledComponentFlags } from '../Configs/common/component_flags';
import componentTypes from '../Configs/strings/componentTypes';

export default (editor) => {
  editor.Components.addType(componentTypes.BLOCKS.FOOTER, {
    extend: componentTypes.REACT_COMPONENT_HANDLER,
    isComponent: (el) => el.tagName === componentTypes.BLOCKS.FOOTER.toUpperCase(),
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
