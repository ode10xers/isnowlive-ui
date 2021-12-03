import { generateTraitsLayout } from 'utils/pageEditor';
import traitTypes from '../strings/traitTypes';

export default (editor) => {
  // NOTE : Spacing traits
  editor.TraitManager.addType(traitTypes.SPACING.PADDING_SLIDER, {
    // Expects as return a simple HTML string or an HTML element
    noLabel: true,
    templateInput: generateTraitsLayout('Padding'),
    createInput({ trait }) {
      // Create a new element container and add some content
      const minValue = trait.get('min') || 0;
      const maxValue = trait.get('max') || 250;
      const el = document.createElement('div');
      el.innerHTML = `
        <div class="input-slider-container">
          <span class="input-slider-text">${minValue}px</span>
          <input type="range" min="${minValue}" max="${maxValue}" id="padding-slider" class="input-slider" />
          <span class="input-slider-text">${maxValue}px</span>
        </div>
        <div class="input-slider-value-container">
          Current Value: <span class="input-slider-value" id="padding-slider-value"></span>
        </div>
        `;
      return el;
    },
    // Update the component based on element changes
    // `elInput` is the result HTMLElement you get from `createInput`
    onEvent({ elInput, component, event }) {
      const sliderInput = elInput.querySelector('#padding-slider');
      const valueText = elInput.querySelector('#padding-slider-value');
      valueText.innerHTML = sliderInput.value + 'px';
      component.setStyle({
        ...component.getStyle(),
        padding: `${sliderInput.value ?? 8}px`,
      });
    },
    // Update elements on the component change
    onUpdate({ elInput, component }) {
      const componentStyle = component.getStyle();
      const padding = componentStyle['padding'] ?? '8px';
      const sliderInput = elInput.querySelector('#padding-slider');
      sliderInput.value = padding.replace('px', '');
      const valueText = elInput.querySelector('#padding-slider-value');
      valueText.innerHTML = padding;
      sliderInput.dispatchEvent(new CustomEvent('change'));
    },
  });

  editor.TraitManager.addType(traitTypes.SPACING.MARGIN_SLIDER, {
    // Expects as return a simple HTML string or an HTML element
    noLabel: true,
    templateInput: `
      <div class="custom-trait-layout">
        <div class="custom-trait-label">
          Margin
        </div>
        <div class="custom-trait-input" data-input>
        </div>
      </div>
      `,
    createInput({ trait }) {
      // Create a new element container and add some content
      const minValue = trait.get('min') || 0;
      const maxValue = trait.get('max') || 250;
      const el = document.createElement('div');
      el.innerHTML = `
        <div class="input-slider-container">
          <span class="input-slider-text">${minValue}px</span>
          <input type="range" min="${minValue}" max="${maxValue}" id="margin-slider" class="input-slider" />
          <span class="input-slider-text">${maxValue}px</span>
        </div>
        <div class="input-slider-value-container">
          Current Value: <span id="margin-slider-value" class="input-slider-value"></span>
        </div>
        `;
      return el;
    },
    // Update the component based on element changes
    // `elInput` is the result HTMLElement you get from `createInput`
    onEvent({ elInput, component, event }) {
      const sliderInput = elInput.querySelector('#margin-slider');
      const valueText = elInput.querySelector('#margin-slider-value');
      valueText.innerHTML = sliderInput.value + 'px';
      component.setStyle({
        ...component.getStyle(),
        margin: `${sliderInput.value ?? 8}px`,
      });
    },
    // Update elements on the component change
    onUpdate({ elInput, component }) {
      const componentStyle = component.getStyle();
      const padding = componentStyle['margin'] ?? '0px';
      const sliderInput = elInput.querySelector('#margin-slider');
      sliderInput.value = padding.replace('px', '');
      const valueText = elInput.querySelector('#margin-slider-value');
      valueText.innerHTML = padding;
      sliderInput.dispatchEvent(new CustomEvent('change'));
    },
  });
};
