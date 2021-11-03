import { googleFonts } from 'utils/constants.js';

export default (editor) => {
  editor.TraitManager.addType('padding-slider', {
    // Expects as return a simple HTML string or an HTML element
    noLabel: true,
    templateInput: `
    <div class="custom-trait-layout">
      <div class="custom-trait-label">
        Padding
      </div>
      <div class="custom-trait-input" data-input>
      </div>
    </div>
    `,
    createInput({ trait }) {
      // Create a new element container and add some content
      const minValue = 0;
      const maxValue = 100;
      const el = document.createElement('div');
      el.innerHTML = `
      <div class="padding-slider-container">
        <span class="padding-slider-text">${minValue}px</span>
        <input type="range" min="${minValue}" max="${maxValue}" class="padding-slider" />
        <span class="padding-slider-text">${maxValue}px</span>
      </div>
      <div class="padding-slider-value-container">
        Current Value: <span class="padding-slider-value"></span>
      </div>
      `;
      return el;
    },
    // Update the component based on element changes
    // `elInput` is the result HTMLElement you get from `createInput`
    onEvent({ elInput, component, event }) {
      const sliderInput = elInput.querySelector('.padding-slider');
      const valueText = elInput.querySelector('.padding-slider-value');
      valueText.innerHTML = sliderInput.value + 'px';
      component.setStyle({
        ...component.getStyle(),
        padding: sliderInput.value ?? 0,
      });
    },
    // Update elements on the component change
    onUpdate({ elInput, component }) {
      const componentStyle = component.getStyle();
      const padding = componentStyle['padding'] ?? 20;
      const sliderInput = elInput.querySelector('.padding-slider');
      sliderInput.value = padding;
      const valueText = elInput.querySelector('.padding-slider-value');
      valueText.innerHTML = padding + 'px';
      sliderInput.dispatchEvent(new CustomEvent('change'));
    },
  });

  editor.TraitManager.addType('text-section-layout', {
    // Expects as return a simple HTML string or an HTML element
    noLabel: true,
    templateInput: `<div class="custom-trait-layout">
    <div class="custom-trait-label">
      Text Layout
    </div>
    <div class="custom-trait-input" data-input>
    </div>
  </div>`,
    createInput({ trait }) {
      // Here we can decide to use properties from the trait
      const options = [
        { id: 'left', name: 'Left', class: 'fa fa-align-left' },
        { id: 'center', name: 'Centered', class: 'fa fa-align-center' },
        { id: 'right', name: 'Right', class: 'fa fa-align-right' },
      ];

      // Create a new element container and add some content
      const el = document.createElement('div');
      // el.classList.add(['trait-radio-button-container']);
      // el.innerHTML = `
      //   ${options.map((opt) => `
      //     <input type="radio" class="trait-radio-button ${opt.class}" name="${opt.name}" value="${opt.value}" />
      //   `)}
      // `;
      el.innerHTML = `
        <select class="text-section-layout-select">
          ${options.map((opt) => `<option value="${opt.id}">${opt.name}</option>`).join('')}
        </select>
      `;

      return el;
    },
    // Update the component based on element changes
    // elInput` is the result HTMLElement you get from `createInput`
    onEvent({ elInput, component, event }) {
      const inputType = elInput.querySelector('.text-section-layout-select');
      component.setStyle({
        ...component.setStyle(),
        'text-align': inputType.value ?? 'left',
      });
      component.addAttributes({
        layout: inputType.value,
      });
    },
    // Update elements on the component change
    onUpdate({ elInput, component }) {
      const layout = component.getAttributes()['layout'] || 'left';
      const inputType = elInput.querySelector('.text-section-layout-select');
      inputType.value = layout;

      inputType.dispatchEvent(new CustomEvent('change'));
    },
  });

  editor.TraitManager.addType('image-position-layout', {
    // Expects as return a simple HTML string or an HTML element
    noLabel: true,
    templateInput: `
    <div class="custom-trait-layout">
      <div class="custom-trait-label">
        Image Layout
      </div>
      <div class="custom-trait-input" data-input>
      </div>
    </div>
    `,
    createInput({ trait }) {
      // Here we can decide to use properties from the trait
      const options = [
        { id: 'left', name: 'Left', class: 'fa fa-align-left' },
        { id: 'top', name: 'Top', class: 'fa fa-align-center' },
        { id: 'right', name: 'Right', class: 'fa fa-align-right' },
        { id: 'bottom', name: 'Bottom', class: 'fa fa-align-center' },
      ];

      // Create a new element container and add some content
      const el = document.createElement('div');
      el.innerHTML = `
        <select class="image-position-select">
          ${options.map((opt) => `<option value="${opt.id}">${opt.name}</option>`).join('')}
        </select>
      `;

      return el;
    },
    // Update the component based on element changes
    // `elInput` is the result HTMLElement you get from `createInput`
    onEvent({ elInput, component, event }) {
      const inputType = elInput.querySelector('.image-position-select');
      let classes = ['text-image-section-container'];

      if (inputType.value) {
        classes.push(`image-${inputType.value}`);
      }

      component.setClass(classes);
    },
    // Update elements on the component change
    onUpdate({ elInput, component }) {
      // This is getting the trait value from the set classes
      const layout =
        component
          .getClasses()
          .find((cls) => cls.startsWith('image-'))
          ?.split('-')[1] ?? 'right';
      const inputType = elInput.querySelector('.image-position-select');
      inputType.value = layout;

      inputType.dispatchEvent(new CustomEvent('change'));
    },
  });

  editor.TraitManager.addType('font-selector', {
    noLabel: true,
    templateInput: `
    <div class="custom-trait-layout">
      <div class="custom-trait-label">
        Text Font
      </div>
      <div class="custom-trait-input" data-input>
      </div>
    </div>
    `,
    createInput({ trait }) {
      // Here we can decide to use properties from the trait
      const options = Object.values(googleFonts).map((font) => ({
        id: font,
        name: font,
      }));

      // Create a new element container and add some content
      const el = document.createElement('div');
      el.innerHTML = `
        <select class="font-select">
          ${options
            .map(
              (opt) =>
                `<option style="font-family: ${opt.id.includes(' ') ? `'${opt.id}'` : opt.id};" value="${opt.id}">${
                  opt.name
                }</option>`
            )
            .join('')}
        </select>
      `;

      return el;
    },
    // Update the component based on element changes
    // `elInput` is the result HTMLElement you get from `createInput`
    onEvent({ elInput, component, event }) {
      const inputType = elInput.querySelector('.font-select');
      component.updateTrait('font-family', {
        type: 'text',
        value: inputType.value,
        changeProp: 1,
      });
    },
    // Update elements on the component change
    onUpdate({ elInput, component }) {
      // This is getting the trait value from the set classes
      const font = component.props()['font-family'] ?? component.getAttributes()['font-family'] ?? '';
      const inputType = elInput.querySelector('.font-select');
      inputType.value = font;

      inputType.dispatchEvent(new CustomEvent('change'));
    },
  });
};
