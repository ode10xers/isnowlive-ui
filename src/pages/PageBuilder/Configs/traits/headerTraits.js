import { generateTraitsLayout } from 'utils/pageEditor';
import traitTypes from '../strings/traitTypes';

export default (editor) => {
  // NOTE : Header Traits
  editor.TraitManager.addType(traitTypes.HEADER.BRAND_TYPE_SELECT, {
    noLabel: true,
    templateInput: generateTraitsLayout('Brand type'),
    createInput({ trait }) {
      // TODO: This probably needs to be a global var so can be referenced to easily
      const options = [
        { id: 'text', name: 'Text' },
        { id: 'image', name: 'Image/Logo' },
      ];

      const el = document.createElement('div');
      el.innerHTML = `
        <select class="input-select" id="brand-type-select">
          ${options.map((opt) => `<option value="${opt.id}">${opt.name}</option>`).join('')}
        </select>
      `;

      return el;
    },

    onEvent({ elInput, component, event }) {
      const inputType = elInput.querySelector('#brand-type-select');

      component.set({
        'brand-type': inputType.value ?? 'text',
      });
    },

    onUpdate({ elInput, component }) {
      // This is getting the trait value from the set classes
      const brandType = component.get('brand-type') ?? 'text';
      const inputType = elInput.querySelector('#brand-type-select');
      inputType.value = brandType;

      inputType.dispatchEvent(new CustomEvent('change'));
    },
  });
};
