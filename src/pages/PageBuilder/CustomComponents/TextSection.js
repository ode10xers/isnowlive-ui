import { generateFontFamilyStylingText } from 'utils/helper.js';
import { isValidCSSColor } from 'utils/colors';

const websiteIcon = require('assets/icons/website/website.svg');
const facebookIcon = require('assets/icons/facebook/facebook.svg');
const linkedinIcon = require('assets/icons/linkedin/linkedin.svg');
const instagramIcon = require('assets/icons/instagram/instagram.svg');
const twitterIcon = require('assets/icons/twitter/twitter.svg');

export default (editor) => {
  editor.DomComponents.addType('text-section', {
    model: {
      defaults: {
        tagName: 'div',
        name: 'Text Section',
        droppable: false,
        attributes: {
          layout: 'left',
          class: 'text-section-container',
        },
        'font-family': 'Arial',
        'text-color': '#000000',
        'bg-style': '#ffffff',
        traits: [
          {
            type: 'text-section-layout',
            name: 'layout',
          },
          // {
          //   type: 'padding-slider',
          // },
          {
            type: 'font-selector',
            name: 'font-family',
            changeProp: 1,
          },
          {
            type: 'color',
            label: 'Text color',
            name: 'text-color',
            changeProp: 1,
          },
          {
            type: 'background-styles',
            id: 'background-style-picker',
          },
          {
            type: 'color',
            label: 'Background color',
            name: 'bg-style',
            changeProp: true,
          },
        ],
        // components: `
        //   <h1 class="text-section-title">Section Title</h1>
        //   <p class="text-section-content">You can place your section content here. Double click on this text to edit</p>
        // `,
        //? Above is the example of using default components with HTML strings
        //? Below we try to customize the behavior
        components: [
          {
            tagName: 'h1',
            type: 'text',
            content: 'Section Title',
            name: 'Section Title',
            attributes: {},
            traits: [],
            toolbar: [],
            removable: false,
            draggable: false,
            droppable: false,
            highlightable: false,
            editable: true,
            copyable: false,
          },
          {
            tagName: 'p',
            type: 'text',
            content: 'Section Content',
            name: 'Section Content',
            attributes: {},
            traits: [],
            removable: false,
            draggable: false,
            droppable: false,
            highlightable: false,
            editable: true,
            copyable: false,
            toolbar: [],
          },
        ],
        styles: `
        .with-background-image:before {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          left: 0;
          background-image: linear-gradient(to bottom right,rgba(0,0,0,0.6), rgba(0,0,0,0.6));
          opacity: .6; 
          z-index: 0;
        }

        .with-background-image * {
          z-index: 1;
        }
          .text-section-container {
            position: relative;
            display: flex;
            flex: 0 1 auto;
            width: 100%;
            padding: 8px;
            flex-direction: column;
            justify-content: center;
          }

          .text-section-container * {
            position: relative;
            flex: 0 0 auto;
          }
        `,
      },
      init() {
        // We put a listener that triggers when an attribute changes
        // In this case when text-color attribute changes
        this.on('change:text-color', this.handleTextColorChange);
        this.on('change:bg-style', this.handleBGStyleChange);
        this.on('change:font-family', this.handleFontChange);
      },
      handleTextColorChange() {
        const textColor = this.props()['text-color'];

        //Propagate this inside
        this.components().forEach((comp) => {
          comp.setStyle({
            ...comp.getStyle(),
            color: `${textColor} !important`,
          });
        });

        this.setStyle({
          ...this.getStyle(),
          color: `${textColor} !important`,
        });
      },
      handleBGStyleChange() {
        const bgStyle = this.props()['bg-style'];
        const componentList = this.components();

        const isBackgroundColor = isValidCSSColor(bgStyle);

        // Check for child components with the same property
        const validChildList = componentList.filter((comp) => comp.props().hasOwnProperty('bg-style'));
        validChildList.forEach((childComp) => {
          // NOTE: Right now this only works if the prop name and trait name is same
          childComp.updateTrait('bg-style', {
            type: 'color',
            value: isBackgroundColor ? bgStyle : 'transparent',
          });
        });

        this.setStyle({
          ...this.getStyle(),
          background: bgStyle,
        });
      },
      handleFontChange() {
        const font = this.props()['font-family'];

        this.setStyle({
          ...this.getStyle(),
          'font-family': generateFontFamilyStylingText(font),
        });
      },
    },
  });

  editor.DomComponents.addType('text-section-with-button', {
    extend: 'text-section',
    model: {
      defaults: {
        components: [
          {
            tagName: 'h1',
            type: 'text',
            content: 'Section Title',
            name: 'Section Title',
            attributes: {},
            traits: [],
            toolbar: [],
            removable: false,
            draggable: false,
            droppable: false,
            highlightable: false,
            editable: true,
            copyable: false,
          },
          {
            tagName: 'p',
            type: 'text',
            content: 'Section Content',
            name: 'Section Content',
            attributes: {},
            traits: [],
            removable: false,
            draggable: false,
            droppable: false,
            highlightable: false,
            editable: true,
            copyable: false,
            toolbar: [],
          },
          {
            type: 'text-section-link-button',
          },
        ],
      },
    },
  });

  editor.DomComponents.addType('social-media-links', {
    model: {
      defaults: {
        tagName: 'div',
        name: 'Social Media Links',
        droppable: false,
        draggable: false,
        attributes: {
          class: 'social-icons-container',
        },
        toolbar: [],
        removable: false,
        highlightable: false,
        copyable: false,
        'bg-style': '#ffffff',
        'facebook-link': 'https://www.facebook.com',
        'instagram-link': 'https://www.instagram.com',
        'linkedin-link': 'https://www.linkedin.com',
        'twitter-link': 'https://twitter.com',
        'website-link': '',
        traits: [
          {
            type: 'text',
            name: 'facebook-link',
            label: 'Facebook',
            changeProp: true,
          },
          {
            type: 'text',
            name: 'instagram-link',
            label: 'Instagram',
            changeProp: true,
          },
          {
            type: 'text',
            name: 'linkedin-link',
            label: 'LinkedIn',
            changeProp: true,
          },
          {
            type: 'text',
            name: 'twitter-link',
            label: 'Twitter',
            changeProp: true,
          },
          {
            type: 'text',
            name: 'website-link',
            label: 'Website',
            changeProp: true,
          },
        ],
        styles: `
          .social-icons-container {
            gap: 12px;
            display: flex;
            width: fit-content;
            justify-items: space-evenly;
            align-content: center;
            padding: 8px 12px;
            background: white;
            text-align:center;
            box-shadow: 0px 0px 4px rgba(0, 0, 0, 0.08), 0px 0px 16px 2px rgba(0, 0, 0, 0.05);
            border-radius: 22.5px;
          }
        `,
      },
      init() {
        this.on('change:facebook-link', this.handleLinkChanged);
        this.on('change:instagram-link', this.handleLinkChanged);
        this.on('change:linkedin-link', this.handleLinkChanged);
        this.on('change:twitter-link', this.handleLinkChanged);
        this.on('change:website-link', this.handleLinkChanged);

        this.handleLinkChanged();
        console.log(this.props());
      },
      handleLinkChanged() {
        const {
          'facebook-link': facebookLink,
          'instagram-link': instagramLink,
          'linkedin-link': linkedinLink,
          'twitter-link': twitterLink,
          'website-link': websiteLink,
        } = this.props();

        const linkArr = [];
        console.log(facebookLink);

        if (facebookLink) {
          linkArr.push({
            url: facebookLink,
            icon: facebookIcon,
            altText: 'Facebook',
          });
        }
        if (instagramLink) {
          linkArr.push({
            url: instagramLink,
            icon: instagramIcon,
            altText: 'Instagram',
          });
        }
        if (linkedinLink) {
          linkArr.push({
            url: linkedinLink,
            icon: linkedinIcon,
            altText: 'LinkedIn',
          });
        }
        if (twitterLink) {
          linkArr.push({
            url: twitterLink,
            icon: twitterIcon,
            altText: 'Twitter',
          });
        }
        if (websiteLink) {
          linkArr.push({
            url: websiteLink,
            icon: websiteIcon,
            altText: 'Website',
          });
        }

        this.components(
          linkArr.map((link) => ({
            type: 'link',
            attributes: {
              class: 'social-icon-item',
              href: link.url,
              target: '_blank',
            },
            droppable: false,
            draggable: false,
            toolbar: [],
            selectable: false,
            removable: false,
            badgable: false,
            highlightable: false,
            hoverable: false,
            copyable: false,
            components: [
              {
                type: 'image',
                droppable: false,
                draggable: false,
                toolbar: [],
                selectable: false,
                removable: false,
                badgable: false,
                highlightable: false,
                hoverable: false,
                copyable: false,
                attributes: {
                  src: link.icon,
                  alt: link.altText,
                  height: '32',
                  width: '32',
                },
              },
            ],
          }))
        );
      },
    },
  });

  editor.DomComponents.addType('bio-social-media', {
    extend: 'text-section',
    model: {
      defaults: {
        components: [
          {
            tagName: 'h1',
            type: 'text',
            content: `Hi! I'm .....`,
            name: 'Section Title',
            attributes: {},
            traits: [],
            toolbar: [],
            removable: false,
            draggable: false,
            droppable: false,
            highlightable: false,
            editable: true,
            copyable: false,
          },
          {
            tagName: 'p',
            type: 'text',
            content: 'This is my introduction',
            name: 'Section Content',
            attributes: {},
            traits: [],
            removable: false,
            draggable: false,
            droppable: false,
            highlightable: false,
            editable: true,
            copyable: false,
            toolbar: [],
          },
          {
            type: 'social-media-links',
          },
        ],
      },
    },
  });
};
