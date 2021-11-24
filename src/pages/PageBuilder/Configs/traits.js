import React from 'react';
import ReactDOM from 'react-dom';

import { googleFonts } from 'utils/constants.js';
import CustomColorPicker from '../CustomColorPicker';

const generateTemplateHTML = (label = '') => `
  <div class="custom-trait-layout">
    <div class="custom-trait-label">
      ${label}
    </div>
    <div class="custom-trait-input" data-input>
    </div>
  </div>
`;

export default (editor) => {
  // NOTE : Custom Color Picker
  editor.TraitManager.addType('custom-color-picker', {
    noLabel: true,
    templateInput({ trait }) {
      return generateTemplateHTML(trait.get('label') ?? '');
    },
    createInput({ trait }) {
      const el = document.createElement('div');

      const targetTraitName = trait.get('name') ?? 'color';
      const initialColor = editor.getSelected()?.getStyle()[targetTraitName] ?? '#ffffff';

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
      // TODO: Test if this works, or should this be called on remove()
      const containerEl = this.getInputElem();
      ReactDOM.unmountComponentAtNode(containerEl);
    },
  });

  // NOTE : Testimonials
  editor.TraitManager.addType('testimonial-items-list', {
    noLabel: true,
    templateInput: generateTemplateHTML('Testimonials'),
    createInput({ trait }) {
      const el = document.createElement('div');
      el.classList.add(['button-list-container']);

      return el;
    },

    onUpdate({ elInput, component }) {
      // This is getting the trait value from the set classes
      const testimonialItems = component.findType('testimonial-item') ?? [];
      // const elInput = elInput.querySelector('.button-list-container');

      elInput.innerHTML = '';

      testimonialItems.forEach((item) => {
        const btnTraitContainer = document.createElement('div');
        btnTraitContainer.classList.add(['button-item-container']);

        const btnTraitContent = document.createElement('p');
        btnTraitContent.classList.add(['button-trait-content']);
        const targetHeading = item.findType('text-section-heading')[0] ?? null;
        btnTraitContent.innerHTML =
          targetHeading?.get('content') || targetHeading?.findType('textnode')[0]?.get('content') || 'John Doe';

        const selectBtn = document.createElement('button');
        selectBtn.classList.add(['button-trait-cta']);
        selectBtn.innerText = 'Select';
        selectBtn.onclick = () => {
          editor.select(item);
        };

        const deleteBtn = document.createElement('button');
        deleteBtn.classList.add(['button-trait-cta']);
        deleteBtn.innerText = 'Delete';
        deleteBtn.onclick = () => {
          item.remove();
          component.emitUpdate();
        };

        btnTraitContainer.appendChild(btnTraitContent);
        btnTraitContainer.appendChild(selectBtn);
        btnTraitContainer.appendChild(deleteBtn);

        elInput.appendChild(btnTraitContainer);
      });

      const addNewBtn = document.createElement('button');
      addNewBtn.classList.add(['button-trait-add']);
      addNewBtn.innerText = 'Add New';
      addNewBtn.onclick = () => {
        // component.handleAddButtonLink();
        const testimonialContainer = component.findType('testimonials')[0] ?? null;

        if (testimonialContainer) {
          testimonialContainer.append(
            {
              type: 'testimonial-item',
            },
            {
              at: testimonialContainer.components().length ?? 1,
            }
          );
        }
        component.emitUpdate();
      };

      elInput.appendChild(addNewBtn);
    },
  });

  // NOTE: Image Traits
  editor.TraitManager.addType('image-cutout-select', {
    // Expects as return a simple HTML string or an HTML element
    noLabel: true,
    templateInput: generateTemplateHTML('Image Type'),
    createInput({ trait }) {
      // Create a new element container and add some content
      const el = document.createElement('div');
      el.classList.add(['radio-btn-container']);

      const adjustBorderRadius = (value) => {
        const selected = editor.getSelected();
        const targetComponent = selected.find('img') ?? [selected];

        targetComponent.forEach((comp) => {
          comp.setStyle({
            ...comp.getStyle(),
            'border-radius': value,
          });
        });
      };

      const squareButton = document.createElement('button');
      // squareButton.classList.add('fa', 'fa-square', 'radio-btn-item');
      squareButton.classList.add('radio-btn-item');
      squareButton.innerText = 'Square';
      squareButton.addEventListener('click', () => adjustBorderRadius('0px'));

      const roundButton = document.createElement('button');
      // roundButton.classList.add('fa', 'fa-circle', 'radio-btn-item');
      roundButton.classList.add('radio-btn-item');
      roundButton.innerText = 'Round';
      roundButton.addEventListener('click', () => adjustBorderRadius('50%'));

      el.appendChild(squareButton);
      el.appendChild(roundButton);
      return el;
    },
  });

  editor.TraitManager.addType('border-radius-slider', {
    // Expects as return a simple HTML string or an HTML element
    noLabel: true,
    templateInput: generateTemplateHTML('Roundness'),
    createInput({ trait }) {
      // Create a new element container and add some content
      const minValue = trait.get('min') || 0;
      const maxValue = trait.get('max') || 100;
      const traitUnit = trait.get('unit') || 'px';
      const unitType = ['px', '%'].includes(traitUnit) ? traitUnit : 'px';
      this.unit = unitType;
      const el = document.createElement('div');
      el.innerHTML = `
      <div class="input-slider-container">
        <span class="input-slider-text">${minValue}${unitType}</span>
        <input type="range" min="${minValue}" max="${maxValue}" id="border-radius-slider" class="input-slider" />
        <span class="input-slider-text">${maxValue}${unitType}</span>
      </div>
      <div class="input-slider-value-container">
        Current Value: <span id="border-radius-slider-value" class="input-slider-value"></span>
      </div>
      `;
      return el;
    },
    // Update the component based on element changes
    // `elInput` is the result HTMLElement you get from `createInput`
    onEvent({ elInput, component, event }) {
      const sliderInput = elInput.querySelector('#border-radius-slider');
      const valueText = elInput.querySelector('#border-radius-slider-value');
      valueText.innerHTML = sliderInput.value + (this.unit ?? 'px');

      const targetComponent = component.find('img') ?? [component];

      targetComponent.forEach((comp) => {
        comp.setStyle({
          ...comp.getStyle(),
          'border-radius': `${sliderInput.value ?? 8}${this.unit ?? 'px'}`,
        });
      });
    },
    // Update elements on the component change
    onUpdate({ elInput, component }) {
      const componentStyle = (component.find('img')[0] ?? component).getStyle();
      const borderRadius = componentStyle['border-radius'] ?? '0px';
      const sliderInput = elInput.querySelector('#border-radius-slider');
      // Remove all non numeric char
      // The logic below is for us to support multiple units
      sliderInput.value = borderRadius.replaceAll('[^\\d]', '');

      const valueText = elInput.querySelector('#border-radius-slider-value');
      valueText.innerHTML = borderRadius;
      sliderInput.dispatchEvent(new CustomEvent('change'));
    },
  });

  editor.TraitManager.addType('background-image-picker', {
    noLabel: true,
    templateInput: generateTemplateHTML('Container background'),
    createInput({ trait }) {
      const el = document.createElement('div');
      el.classList.add(['actions-input-container']);

      const setBtn = document.createElement('button');
      setBtn.innerText = 'Set BG Image';
      setBtn.addEventListener('click', () => {
        editor.runCommand('set-background-image');
      });

      const resetBtn = document.createElement('button');
      resetBtn.innerText = 'Reset BG';
      resetBtn.addEventListener('click', () => {
        editor.runCommand('remove-background-image');
      });

      el.appendChild(setBtn);
      el.appendChild(resetBtn);
      return el;
    },
  });

  // NOTE : Spacing traits
  editor.TraitManager.addType('padding-slider', {
    // Expects as return a simple HTML string or an HTML element
    noLabel: true,
    templateInput: generateTemplateHTML('Padding'),
    createInput({ trait }) {
      // Create a new element container and add some content
      console.log(trait.get('min'));
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

  editor.TraitManager.addType('margin-slider', {
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
      const minValue = 0;
      const maxValue = 100;
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

  // NOTE : Font Traits
  editor.TraitManager.addType('font-selector', {
    noLabel: true,
    templateInput: generateTemplateHTML('Text Font'),
    createInput({ trait }) {
      // Here we can decide to use properties from the trait
      const options = Object.values(googleFonts).map((font) => ({
        id: font,
        name: font,
      }));

      // Create a new element container and add some content
      const el = document.createElement('div');
      el.innerHTML = `
        <select placeholder="Default" class="input-select" id="font-select">
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
      const inputType = elInput.querySelector('#font-select');
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
      const inputType = elInput.querySelector('#font-select');
      inputType.value = font;

      inputType.dispatchEvent(new CustomEvent('change'));
    },
  });

  editor.TraitManager.addType('font-size', {
    noLabel: true,
    templateInput: generateTemplateHTML('Text size'),
    createInput({ trait }) {
      const el = document.createElement('div');
      el.innerHTML = `
        <input type="number" min="0" id="font-size-input" class="input-field" placeholder="Default size" />
      `;
      return el;
    },

    onEvent({ elInput, component, event }) {
      const inputLink = elInput.querySelector('#font-size-input');

      if (inputLink.value) {
        component.setStyle({
          ...component.getStyle(),
          'font-size': `${inputLink.value}px`,
        });
      }
    },

    onUpdate({ elInput, component }) {
      // This is getting the trait value from the set classes
      const inputType = elInput.querySelector('#font-size-input');
      inputType.value = (component.getStyle()['font-size'] ?? '14px').replace('px', '');

      inputType.dispatchEvent(new CustomEvent('change'));
    },
  });

  // Button Traits
  editor.TraitManager.addType('button-types', {
    noLabel: true,
    templateInput: generateTemplateHTML('Button type'),
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
        existingClasses = existingClasses.filter((cls) => !['button-type-link', 'button-type-outlined'].includes(cls));
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

  editor.TraitManager.addType('button-link', {
    noLabel: true,
    templateInput: generateTemplateHTML('Button URL'),
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
        component.findType('link-button')[0] ??
        component.findType('text-section-link-button')[0] ??
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
        component.findType('link-button')[0] ??
        component.findType('text-section-link-button')[0] ??
        component.find('a')[0] ??
        component.find('button')[0] ??
        component;
      const inputType = elInput.querySelector('#button-link-input');
      inputType.value = componentEl.getAttributes()['href'];

      inputType.dispatchEvent(new CustomEvent('change'));
    },
  });

  editor.TraitManager.addType('button-target', {
    noLabel: true,
    templateInput: generateTemplateHTML('Button behavior'),
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
        component.findType('link-button')[0] ??
        component.findType('text-section-link-button')[0] ??
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
        component.findType('link-button')[0] ??
        component.findType('text-section-link-button')[0] ??
        component.find('a')[0] ??
        component;
      const inputType = elInput.querySelector('#button-target-select');
      inputType.value = componentEl.getAttributes()['target'];

      inputType.dispatchEvent(new CustomEvent('change'));
    },
  });

  editor.TraitManager.addType('button-content', {
    noLabel: true,
    templateInput: generateTemplateHTML('Button text'),
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
        component.findType('link-button')[0] ??
        component.findType('text-section-link-button')[0] ??
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
        component.findType('link-button')[0] ??
        component.findType('text-section-link-button')[0] ??
        component.find('a')[0] ??
        component.find('button')[0] ??
        component;
      const inputType = elInput.querySelector('#button-content-input');
      inputType.value = componentEl.props()['content'];

      inputType.dispatchEvent(new CustomEvent('change'));
    },
  });

  // NOTE : Header Traits
  editor.TraitManager.addType('brand-type-select', {
    noLabel: true,
    templateInput: generateTemplateHTML('Brand type'),
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

  // TODO: We can make a generic list item handler based on this
  editor.TraitManager.addType('nav-links', {
    noLabel: true,
    templateInput: generateTemplateHTML('Navigation links'),
    createInput({ trait }) {
      const el = document.createElement('div');
      el.classList.add(['button-list-container']);

      return el;
    },

    onUpdate({ elInput, component }) {
      // This is getting the trait value from the set classes
      const linkButtons = component.findType('link-buttons') ?? [];
      // const elInput = elInput.querySelector('.button-list-container');

      elInput.innerHTML = '';

      linkButtons.forEach((btn) => {
        const btnTraitContainer = document.createElement('div');
        btnTraitContainer.classList.add(['button-item-container']);

        const btnTraitContent = document.createElement('p');
        btnTraitContent.classList.add(['button-trait-content']);
        btnTraitContent.innerHTML = btn.get('content') ?? 'Link button';

        const selectNavBtn = document.createElement('button');
        selectNavBtn.classList.add(['button-trait-cta']);
        selectNavBtn.innerText = 'Select';
        selectNavBtn.onclick = () => {
          editor.select(btn);
        };

        const deleteNavBtn = document.createElement('button');
        deleteNavBtn.classList.add(['button-trait-cta']);
        deleteNavBtn.innerText = 'Delete';
        deleteNavBtn.onclick = () => {
          btn.remove();
          component.emitUpdate();
        };

        btnTraitContainer.appendChild(btnTraitContent);
        btnTraitContainer.appendChild(selectNavBtn);
        btnTraitContainer.appendChild(deleteNavBtn);

        elInput.appendChild(btnTraitContainer);
      });

      const addNavBtn = document.createElement('button');
      addNavBtn.classList.add(['button-trait-add']);
      addNavBtn.innerText = 'Add New Link';
      addNavBtn.onclick = () => {
        component.append(
          {
            type: 'link-buttons',
            toolbar: [],
            removable: false,
          },
          {
            at: (component.components().length ?? 1) - 1,
          }
        );
        component.emitUpdate();
      };

      elInput.appendChild(addNavBtn);
    },
  });

  // Layout Traits
  editor.TraitManager.addType('text-section-layout', {
    // Expects as return a simple HTML string or an HTML element
    noLabel: true,
    templateInput: generateTemplateHTML('Text layout'),
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
        <select class="input-select" id="text-section-layout-select">
          ${options.map((opt) => `<option value="${opt.id}">${opt.name}</option>`).join('')}
        </select>
      `;

      return el;
    },
    // Update the component based on element changes
    // elInput` is the result HTMLElement you get from `createInput`
    onEvent({ elInput, component, event }) {
      const inputType = elInput.querySelector('#text-section-layout-select');
      const alignValue = inputType.value;

      const textSection = component.find('.text-section-container') ?? [component];

      textSection.forEach((comp) => {
        comp.setStyle({
          ...comp.getStyle(),
          'text-align': alignValue ?? 'left',
          'align-items':
            alignValue === 'center'
              ? alignValue
              : alignValue === 'left'
              ? 'flex-start'
              : alignValue === 'right'
              ? 'flex-end'
              : 'flex-start',
        });
      });

      component.addAttributes({
        layout: inputType.value,
      });
    },
    // Update elements on the component change
    onUpdate({ elInput, component }) {
      const layout = component.getAttributes()['layout'] || 'center';
      const inputType = elInput.querySelector('#text-section-layout-select');
      inputType.value = layout;

      inputType.dispatchEvent(new CustomEvent('change'));
    },
  });

  editor.TraitManager.addType('image-position-layout', {
    // Expects as return a simple HTML string or an HTML element
    noLabel: true,
    templateInput: generateTemplateHTML('Image Layout'),
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
        <select class="input-select" id="image-position-select">
          ${options.map((opt) => `<option value="${opt.id}">${opt.name}</option>`).join('')}
        </select>
      `;

      return el;
    },
    // Update the component based on element changes
    // `elInput` is the result HTMLElement you get from `createInput`
    onEvent({ elInput, component, event }) {
      const inputType = elInput.querySelector('#image-position-select');
      const targetComponent =
        component.find('.text-image-section-container')[0] ??
        component.findType('simple-text-image-section')[0] ??
        component;

      let classes = [];
      let existingClasses = targetComponent.getClasses();

      if (inputType.value) {
        classes.push(`image-${inputType.value}`);
        existingClasses = existingClasses.filter(
          (cls) => !['image-left', 'image-top', 'image-right', 'image-bottom'].includes(cls)
        );
      }

      targetComponent.setClass([...new Set([...existingClasses, ...classes])]);
    },
    // Update elements on the component change
    onUpdate({ elInput, component }) {
      // This is getting the trait value from the set classes
      const targetComponent =
        component.find('.text-image-section-container')[0] ??
        component.findType('simple-text-image-section')[0] ??
        component;

      const layout =
        targetComponent
          .getClasses()
          .find((cls) => cls.startsWith('image-'))
          ?.split('-')[1] ?? 'right';
      const inputType = elInput.querySelector('#image-position-select');
      inputType.value = layout;

      inputType.dispatchEvent(new CustomEvent('change'));
    },
  });
};
