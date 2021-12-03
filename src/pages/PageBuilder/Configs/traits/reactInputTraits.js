// NOTE: These are traits which uses React Components
// and ReactDOM.render methods

import React from 'react';
import ReactDOM from 'react-dom';

import CustomColorPicker from '../../CustomInputs/CustomColorPicker';

import { generateTraitsLayout } from 'utils/pageEditor';
import traitTypes from '../strings/traitTypes';

export default (editor) => {
  // NOTE: Passion Components CSS Vars Traits
  editor.TraitManager.addType(traitTypes.CUSTOM_REACT_INPUTS.CSS_VARS_COLORS, {
    noLabel: true,
    templateInput({ trait }) {
      return generateTraitsLayout(trait.get('label') || 'Component Colors');
    },
    createInput({ trait }) {
      const optionsList = trait.get('options') ?? [];
      const selectedComponent = editor.getSelected();

      const el = document.createElement('div');

      if (selectedComponent) {
        this.reactMountContainers = optionsList.map((opt) => {
          const containerEl = document.createElement('div');
          containerEl.className = 'custom-trait-sub-layout';

          const labelEl = document.createElement('div');
          labelEl.className = 'custom-trait-sub-label';
          labelEl.innerText = opt.label ?? opt.id ?? 'Label';

          const inputEl = document.createElement('div');
          inputEl.className = 'custom-trait-sub-input';
          inputEl.id = opt.id;

          const colorChangeHandler = (color) => {
            console.log(color);
            selectedComponent.setStyle({
              ...selectedComponent.getStyle(),
              [opt.id]: color,
            });
          };

          ReactDOM.render(
            <CustomColorPicker key={opt.id} initialColor="#000000" colorChangeCallback={colorChangeHandler} />,
            inputEl
          );

          containerEl.appendChild(labelEl);
          containerEl.appendChild(inputEl);

          el.appendChild(containerEl);

          return inputEl;
        });
      }

      return el;
    },
    removed() {
      const mountContainers = this.reactMountContainers ?? [];
      mountContainers.forEach((el) => {
        ReactDOM.unmountComponentAtNode(el);
      });
    },
  });

  // NOTE : Custom Color Picker
  editor.TraitManager.addType(traitTypes.CUSTOM_REACT_INPUTS.CUSTOM_COLOR_PICKER, {
    noLabel: true,
    templateInput({ trait }) {
      return generateTraitsLayout(trait.get('label') ?? '');
    },
    createInput({ trait }) {
      const el = document.createElement('div');

      const targetTraitName = trait.get('name') ?? 'color';
      const selectedComponent = editor.getSelected() ?? null;
      const initialColor =
        (trait.get('changeProp')
          ? selectedComponent?.props()[targetTraitName]
          : selectedComponent?.getAttributes()[targetTraitName]) ??
        selectedComponent.getStyle()[targetTraitName] ??
        '#ffffff';

      const targetComponent = editor.getSelected() ?? null;

      const handleColorChange = (color) => {
        if (targetComponent) {
          if (trait.get('changeProp')) {
            targetComponent.set({
              [targetTraitName]: color,
            });
          } else {
            targetComponent.setAttributes({
              ...targetComponent.getAttributes(),
              [targetTraitName]: color,
            });
          }
        }
      };

      ReactDOM.render(<CustomColorPicker initialColor={initialColor} colorChangeCallback={handleColorChange} />, el);

      return el;
    },

    removed() {
      const containerEl = this.getInputElem();
      ReactDOM.unmountComponentAtNode(containerEl);
    },
  });
};
