import { generateTraitsLayout } from 'utils/pageEditor';
import traitTypes from '../strings/traitTypes';

export default (editor) => {
  // TODO: We can make a generic list item handler based on this
  editor.TraitManager.addType(traitTypes.LIST_ITEMS.NAV_LINKS, {
    noLabel: true,
    templateInput: generateTraitsLayout('Navigation links'),
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
        if (component.is('navbar-header')) {
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
        } else {
          const targetComponent = component.findType('navbar-header')[0];

          targetComponent.append(
            {
              type: 'link-buttons',
              toolbar: [],
              removable: false,
            },
            {
              at: (targetComponent.components().length ?? 1) - 1,
            }
          );
        }
        component.emitUpdate();
      };

      elInput.appendChild(addNavBtn);
    },
  });

  // NOTE : Testimonials
  editor.TraitManager.addType(traitTypes.LIST_ITEMS.TESTIMONIAL_ITEMS, {
    noLabel: true,
    templateInput: generateTraitsLayout('Testimonials'),
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
};
