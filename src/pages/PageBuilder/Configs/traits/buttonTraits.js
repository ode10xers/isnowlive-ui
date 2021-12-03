import traitTypes from '../strings/traitTypes.js';
import componentTypes from '../strings/componentTypes.js';

import { generateTraitsLayout } from 'utils/pageEditor';

export default (editor) => {
  // Button Traits (to be deprecated)
  editor.TraitManager.addType(traitTypes.BUTTONS.BUTTON_TYPES, {
    noLabel: true,
    templateInput: generateTraitsLayout('Button type'),
    createInput({ trait }) {
      // TODO: This probably needs to be a global var so can be referenced to easily
      const options = [
        { id: 'link', name: 'Link' },
        { id: 'outlined', name: 'Outlined' },
        { id: 'filled', name: 'Filled' },
      ];

      const el = document.createElement('div');
      el.innerHTML = `
          <select class="input-select" id="button-layout-select">
            ${options.map((opt) => `<option value="${opt.id}">${opt.name}</option>`).join('')}
          </select>
        `;

      return el;
    },

    onEvent({ elInput, component, event }) {
      const inputType = elInput.querySelector('#button-layout-select');

      let classes = [];
      let existingClasses = component.getClasses();

      if (inputType.value) {
        classes.push(`button-type-${inputType.value}`);
        existingClasses = existingClasses.filter(
          (cls) => !['button-type-link', 'button-type-outlined', 'button-type-filled'].includes(cls)
        );
      }

      component.setClass([...new Set([...existingClasses, ...classes])]);
    },

    onUpdate({ elInput, component }) {
      // This is getting the trait value from the set classes
      const layout =
        component
          .getClasses()
          .find((cls) => cls.startsWith('button-type-'))
          ?.split('-')[2] ?? 'link';
      const inputType = elInput.querySelector('#button-layout-select');
      inputType.value = layout;

      inputType.dispatchEvent(new CustomEvent('change'));
    },
  });

  editor.TraitManager.addType(traitTypes.BUTTONS.BUTTON_LINK, {
    noLabel: true,
    templateInput: generateTraitsLayout('Button URL'),
    createInput({ trait }) {
      const el = document.createElement('div');
      el.innerHTML = `
          <input id="button-link-input" class="input-field" placeholder="The link to be opened" />
        `;
      return el;
    },

    onEvent({ elInput, component, event }) {
      const inputLink = elInput.querySelector('#button-link-input');
      const targetComponent =
        component.findType(componentTypes.CUSTOM_COMPONENTS.LINK_BUTTON)[0] ??
        component.findType(componentTypes.CUSTOM_COMPONENTS.INNER.TEXT_SECTION_BUTTON)[0] ??
        component.find('a')[0] ??
        component.find('button')[0] ??
        component;

      if (inputLink.value) {
        targetComponent.setAttributes({
          ...targetComponent.getAttributes(),
          href: inputLink.value,
        });
      }
    },

    onUpdate({ elInput, component }) {
      // This is getting the trait value from the set classes
      const componentEl =
        component.findType(componentTypes.CUSTOM_COMPONENTS.LINK_BUTTON)[0] ??
        component.findType(componentTypes.CUSTOM_COMPONENTS.INNER.TEXT_SECTION_BUTTON)[0] ??
        component.find('a')[0] ??
        component.find('button')[0] ??
        component;
      const inputType = elInput.querySelector('#button-link-input');
      inputType.value = componentEl.getAttributes()['href'];

      inputType.dispatchEvent(new CustomEvent('change'));
    },
  });

  editor.TraitManager.addType(traitTypes.BUTTONS.BUTTON_TARGET, {
    noLabel: true,
    templateInput: generateTraitsLayout('Button behavior'),
    createInput({ trait }) {
      const options = [
        { id: '_blank', name: 'New Page' },
        { id: '_self', name: 'Same Page' },
      ];

      const el = document.createElement('div');
      el.innerHTML = `
          <select class="input-select" id="button-target-select">
            ${options.map((opt) => `<option value="${opt.id}">${opt.name}</option>`).join('')}
          </select>
        `;
      return el;
    },

    onEvent({ elInput, component, event }) {
      const inputLink = elInput.querySelector('#button-target-select');
      const targetComponent =
        component.findType(componentTypes.CUSTOM_COMPONENTS.LINK_BUTTON)[0] ??
        component.findType(componentTypes.CUSTOM_COMPONENTS.INNER.TEXT_SECTION_BUTTON)[0] ??
        component.find('a')[0] ??
        component;

      if (inputLink.value) {
        targetComponent.setAttributes({
          ...targetComponent.getAttributes(),
          target: inputLink.value,
        });
      }
    },

    onUpdate({ elInput, component }) {
      // This is getting the trait value from the set classes
      const componentEl =
        component.findType(componentTypes.CUSTOM_COMPONENTS.LINK_BUTTON)[0] ??
        component.findType(componentTypes.CUSTOM_COMPONENTS.INNER.TEXT_SECTION_BUTTON)[0] ??
        component.find('a')[0] ??
        component;
      const inputType = elInput.querySelector('#button-target-select');
      inputType.value = componentEl.getAttributes()['target'];

      inputType.dispatchEvent(new CustomEvent('change'));
    },
  });

  editor.TraitManager.addType(traitTypes.BUTTONS.BUTTON_CONTENT, {
    noLabel: true,
    templateInput: generateTraitsLayout('Button text'),
    createInput({ trait }) {
      const el = document.createElement('div');
      el.innerHTML = `
          <input id="button-content-input" class="input-field" placeholder="The text shown in the button" />
        `;
      return el;
    },

    onEvent({ elInput, component, event }) {
      const inputContent = elInput.querySelector('#button-content-input');
      const targetComponent =
        component.findType(componentTypes.CUSTOM_COMPONENTS.LINK_BUTTON)[0] ??
        component.findType(componentTypes.CUSTOM_COMPONENTS.INNER.TEXT_SECTION_BUTTON)[0] ??
        component.find('a')[0] ??
        component.find('button')[0] ??
        component;

      if (inputContent.value) {
        targetComponent.set({
          content: inputContent.value,
        });
      }
    },

    onUpdate({ elInput, component }) {
      // This is getting the trait value from the set classes
      const componentEl =
        component.findType(componentTypes.CUSTOM_COMPONENTS.LINK_BUTTON)[0] ??
        component.findType(componentTypes.CUSTOM_COMPONENTS.INNER.TEXT_SECTION_BUTTON)[0] ??
        component.find('a')[0] ??
        component.find('button')[0] ??
        component;
      const inputType = elInput.querySelector('#button-content-input');
      inputType.value = componentEl.props()['content'];

      inputType.dispatchEvent(new CustomEvent('change'));
    },
  });
};
