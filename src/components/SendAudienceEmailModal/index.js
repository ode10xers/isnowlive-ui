import React, { useState, useEffect, useRef } from 'react';

import { Row, Col, Modal, Form, Input, Tooltip, Button, Select, Typography } from 'antd';
import { FilePdfOutlined, CloseCircleOutlined } from '@ant-design/icons';

import EmailEditor from 'react-email-editor';

import apis from 'apis';

// import TextEditor from 'components/TextEditor';
import FileUpload from 'components/FileUpload';
import { resetBodyStyle, showSuccessModal, showErrorModal } from 'components/Modals/modals';

import { isAPISuccess } from 'utils/helper';
import validationRules from 'utils/validation';
import { getLocalUserDetails } from 'utils/storage';

import { sendCustomerEmailFormLayout } from 'layouts/FormLayouts';

import styles from './styles.module.scss';

const { Title, Text } = Typography;
const formInitialValues = {
  recipients: [],
  subject: '',
};

/*
  Design template for default body

  {
    counters: {}
    body: {
      rows: [],
      "values":{
            "backgroundColor":"#e8d4bb",
            "backgroundImage":{
                "url":"",
                "fullWidth":true,
                "repeat":false,
                "center":true,
                "cover":false
            },
            "contentWidth":"600px",
            "contentAlign":"center",
            "fontFamily":{
                "label":"Montserrat",
                "value":"'Montserrat',sans-serif",
                "url":"https://fonts.googleapis.com/css?family=Montserrat:400,700",
                "defaultFont":true
            },
            "preheaderText":"",
            "linkStyle":{
                "body":true,
                "linkColor":"#0000ee",
                "linkHoverColor":"#0000ee",
                "linkUnderline":true,
                "linkHoverUnderline":true
            },
            "_meta":{
                "htmlID":"u_body",
                "htmlClassNames":"u_body"
            }
        }
    }
  }
*/

// the Unlayer behaves very weirdly
// For some reason it works if
// 1) onLoad, we load a template (in this case testTemplate is used)
// 2) We then reset it into blanks and set the body value using the object below
const initialEditorBodyTemplate = {
  backgroundColor: '#ffffff',
  contentWidth: '800px',
};

const testTemplate = {
  counters: {
    u_row: 13,
    u_column: 16,
    u_content_menu: 3,
    u_content_text: 11,
    u_content_image: 3,
    u_content_button: 4,
    u_content_social: 1,
    u_content_divider: 6,
  },
  body: {
    rows: [
      {
        cells: [1],
        columns: [
          {
            contents: [
              {
                type: 'divider',
                values: {
                  width: '100%',
                  border: {
                    borderTopWidth: '0px',
                    borderTopStyle: 'solid',
                    borderTopColor: '#BBBBBB',
                  },
                  textAlign: 'center',
                  containerPadding: '5px',
                  hideDesktop: false,
                  _meta: {
                    htmlID: 'u_content_divider_6',
                    htmlClassNames: 'u_content_divider',
                  },
                  selectable: true,
                  draggable: true,
                  duplicatable: true,
                  deletable: true,
                  hideable: true,
                  hideMobile: false,
                },
              },
            ],
            values: {
              _meta: {
                htmlID: 'u_column_16',
                htmlClassNames: 'u_column',
              },
              border: {},
              padding: '0px',
              backgroundColor: '',
            },
          },
        ],
        values: {
          displayCondition: null,
          columns: false,
          backgroundColor: '',
          columnsBackgroundColor: '',
          backgroundImage: {
            url: '',
            fullWidth: true,
            repeat: false,
            center: true,
            cover: false,
          },
          padding: '0px',
          hideDesktop: false,
          _meta: {
            htmlID: 'u_row_13',
            htmlClassNames: 'u_row',
          },
          selectable: true,
          draggable: true,
          duplicatable: true,
          deletable: true,
          hideable: true,
          hideMobile: false,
          noStackMobile: false,
        },
      },
      {
        cells: [1, 1, 1],
        columns: [
          {
            contents: [
              {
                type: 'menu',
                values: {
                  containerPadding: '25px 10px 10px',
                  menu: {
                    items: [
                      {
                        key: '1606923979328',
                        link: {
                          name: 'web',
                          values: {
                            href: '',
                            target: '_self',
                          },
                        },
                        text: 'NEWS',
                      },
                      {
                        key: '1606924033905',
                        link: {
                          name: 'web',
                          values: {
                            href: '',
                            target: '_self',
                          },
                        },
                        text: 'SERVICE',
                      },
                    ],
                  },
                  fontFamily: {
                    label: 'Montserrat',
                    value: "'Montserrat',sans-serif",
                    url: 'https://fonts.googleapis.com/css?family=Montserrat:400,700',
                    defaultFont: true,
                  },
                  fontSize: '14px',
                  textColor: '#444444',
                  linkColor: '#0068A5',
                  align: 'center',
                  layout: 'horizontal',
                  separator: '',
                  padding: '5px 15px',
                  hideDesktop: false,
                  _meta: {
                    htmlID: 'u_content_menu_3',
                    htmlClassNames: 'u_content_menu',
                  },
                  selectable: true,
                  draggable: true,
                  duplicatable: true,
                  deletable: true,
                  hideable: true,
                  hideMobile: false,
                },
              },
            ],
            values: {
              _meta: {
                htmlID: 'u_column_1',
                htmlClassNames: 'u_column',
              },
              border: {},
              padding: '0px',
              backgroundColor: '',
            },
          },
          {
            contents: [
              {
                type: 'image',
                values: {
                  containerPadding: '20px 10px',
                  src: {
                    url: 'https://cdn.templates.unlayer.com/assets/1606906849237-logo.png',
                    width: 248,
                    height: 56,
                    maxWidth: '77%',
                    autoWidth: false,
                  },
                  textAlign: 'center',
                  altText: 'Image',
                  action: {
                    name: 'web',
                    values: {
                      href: '',
                      target: '_blank',
                    },
                  },
                  hideDesktop: false,
                  _meta: {
                    htmlID: 'u_content_image_1',
                    htmlClassNames: 'u_content_image',
                  },
                  selectable: true,
                  draggable: true,
                  duplicatable: true,
                  deletable: true,
                  hideable: true,
                  hideMobile: false,
                  _override: {
                    mobile: {
                      src: {
                        maxWidth: '58%',
                        autoWidth: false,
                      },
                    },
                  },
                },
              },
            ],
            values: {
              _meta: {
                htmlID: 'u_column_2',
                htmlClassNames: 'u_column',
              },
              border: {},
              padding: '0px',
              backgroundColor: '',
            },
          },
          {
            contents: [
              {
                type: 'menu',
                values: {
                  containerPadding: '25px 10px 30px',
                  menu: {
                    items: [
                      {
                        key: '1606923979328',
                        link: {
                          name: 'web',
                          values: {
                            href: '',
                            target: '_self',
                          },
                        },
                        text: 'ABOUT',
                      },
                      {
                        key: '1606924033905',
                        link: {
                          name: 'web',
                          values: {
                            href: '',
                            target: '_self',
                          },
                        },
                        text: 'CONTACT',
                      },
                    ],
                  },
                  fontFamily: {
                    label: 'Montserrat',
                    value: "'Montserrat',sans-serif",
                    url: 'https://fonts.googleapis.com/css?family=Montserrat:400,700',
                    defaultFont: true,
                  },
                  fontSize: '14px',
                  textColor: '#444444',
                  linkColor: '#0068A5',
                  align: 'center',
                  layout: 'horizontal',
                  separator: '',
                  padding: '5px 15px',
                  hideDesktop: false,
                  _meta: {
                    htmlID: 'u_content_menu_2',
                    htmlClassNames: 'u_content_menu',
                  },
                  selectable: true,
                  draggable: true,
                  duplicatable: true,
                  deletable: true,
                  hideable: true,
                  hideMobile: false,
                },
              },
            ],
            values: {
              _meta: {
                htmlID: 'u_column_3',
                htmlClassNames: 'u_column',
              },
              border: {},
              padding: '0px',
              backgroundColor: '',
            },
          },
        ],
        values: {
          displayCondition: null,
          columns: false,
          backgroundColor: '',
          columnsBackgroundColor: '#ffffff',
          backgroundImage: {
            url: '',
            fullWidth: true,
            repeat: false,
            center: true,
            cover: false,
          },
          padding: '0px',
          hideDesktop: false,
          _meta: {
            htmlID: 'u_row_1',
            htmlClassNames: 'u_row',
          },
          selectable: true,
          draggable: true,
          duplicatable: true,
          deletable: true,
          hideable: true,
          hideMobile: false,
          noStackMobile: false,
        },
      },
      {
        cells: [1],
        columns: [
          {
            contents: [
              {
                type: 'divider',
                values: {
                  width: '100%',
                  border: {
                    borderTopWidth: '0px',
                    borderTopStyle: 'solid',
                    borderTopColor: '#BBBBBB',
                  },
                  textAlign: 'center',
                  containerPadding: '150px 10px 10px',
                  hideDesktop: false,
                  _meta: {
                    htmlID: 'u_content_divider_2',
                    htmlClassNames: 'u_content_divider',
                  },
                  selectable: true,
                  draggable: true,
                  duplicatable: true,
                  deletable: true,
                  hideable: true,
                  hideMobile: false,
                },
              },
              {
                type: 'text',
                values: {
                  containerPadding: '10px',
                  color: '#ffffff',
                  textAlign: 'center',
                  lineHeight: '140%',
                  linkStyle: {
                    inherit: true,
                    linkColor: '#0000ee',
                    linkHoverColor: '#0000ee',
                    linkUnderline: true,
                    linkHoverUnderline: true,
                  },
                  hideDesktop: false,
                  _meta: {
                    htmlID: 'u_content_text_1',
                    htmlClassNames: 'u_content_text',
                  },
                  selectable: true,
                  draggable: true,
                  duplicatable: true,
                  deletable: true,
                  hideable: true,
                  hideMobile: false,
                  text:
                    '<p style="font-size: 14px; line-height: 140%;"><span style="font-family: Montserrat, sans-serif; font-size: 14px; line-height: 19.6px;"><strong><span style="font-size: 44px; line-height: 61.6px;">NEW ARRIVAL</span></strong></span></p>',
                },
              },
              {
                type: 'button',
                values: {
                  containerPadding: '10px 10px 50px',
                  href: {
                    name: 'web',
                    values: {
                      href: '',
                      target: '_blank',
                    },
                  },
                  buttonColors: {
                    color: '#463a41',
                    backgroundColor: '#ffffff',
                    hoverColor: '#FFFFFF',
                    hoverBackgroundColor: '#3AAEE0',
                  },
                  size: {
                    autoWidth: true,
                    width: '100%',
                  },
                  textAlign: 'center',
                  lineHeight: '120%',
                  padding: '12px 22px',
                  border: {},
                  borderRadius: '0px',
                  hideDesktop: false,
                  _meta: {
                    htmlID: 'u_content_button_1',
                    htmlClassNames: 'u_content_button',
                  },
                  selectable: true,
                  draggable: true,
                  duplicatable: true,
                  deletable: true,
                  hideable: true,
                  hideMobile: false,
                  text: '<strong><span style="font-size: 14px; line-height: 16.8px;">VIEW MORE</span></strong>',
                  calculatedWidth: 134,
                  calculatedHeight: 40,
                },
              },
            ],
            values: {
              _meta: {
                htmlID: 'u_column_5',
                htmlClassNames: 'u_column',
              },
              border: {},
              padding: '0px',
              backgroundColor: '',
            },
          },
        ],
        values: {
          displayCondition: null,
          columns: false,
          backgroundColor: '',
          columnsBackgroundColor: '',
          backgroundImage: {
            url: 'https://cdn.templates.unlayer.com/assets/1606924485372-1.jpg',
            fullWidth: false,
            repeat: false,
            center: true,
            cover: false,
            width: 626,
            height: 500,
          },
          padding: '0px',
          hideDesktop: false,
          _meta: {
            htmlID: 'u_row_3',
            htmlClassNames: 'u_row',
          },
          selectable: true,
          draggable: true,
          duplicatable: true,
          deletable: true,
          hideable: true,
          hideMobile: false,
          noStackMobile: false,
        },
      },
      {
        cells: [1],
        columns: [
          {
            contents: [
              {
                type: 'text',
                values: {
                  containerPadding: '40px 10px 10px',
                  textAlign: 'center',
                  lineHeight: '140%',
                  linkStyle: {
                    inherit: true,
                    linkColor: '#0000ee',
                    linkHoverColor: '#0000ee',
                    linkUnderline: true,
                    linkHoverUnderline: true,
                  },
                  hideDesktop: false,
                  _meta: {
                    htmlID: 'u_content_text_2',
                    htmlClassNames: 'u_content_text',
                  },
                  selectable: true,
                  draggable: true,
                  duplicatable: true,
                  deletable: true,
                  hideable: true,
                  hideMobile: false,
                  text:
                    '<p style="line-height: 140%; font-size: 14px;"><span style="line-height: 33.6px; font-size: 24px; font-family: \'Playfair Display\', serif;"><span style="line-height: 33.6px; font-size: 24px;"><strong>Purchasing Focal Just got easier</strong></span></span></p>',
                },
              },
              {
                type: 'text',
                values: {
                  containerPadding: '0px 10px 40px',
                  textAlign: 'center',
                  lineHeight: '140%',
                  linkStyle: {
                    inherit: true,
                    linkColor: '#0000ee',
                    linkHoverColor: '#0000ee',
                    linkUnderline: true,
                    linkHoverUnderline: true,
                  },
                  hideDesktop: false,
                  _meta: {
                    htmlID: 'u_content_text_11',
                    htmlClassNames: 'u_content_text',
                  },
                  selectable: true,
                  draggable: true,
                  duplicatable: true,
                  deletable: true,
                  hideable: true,
                  hideMobile: false,
                  text:
                    '<p style="font-size: 14px; line-height: 140%;"><span style="font-size: 14px; line-height: 19.6px;">Lorem ipsum dolor sit amet,&nbsp;</span></p>',
                },
              },
            ],
            values: {
              _meta: {
                htmlID: 'u_column_7',
                htmlClassNames: 'u_column',
              },
              border: {},
              padding: '0px',
              backgroundColor: '',
            },
          },
        ],
        values: {
          displayCondition: null,
          columns: false,
          backgroundColor: '',
          columnsBackgroundColor: '#ffffff',
          backgroundImage: {
            url: '',
            fullWidth: true,
            repeat: false,
            center: true,
            cover: false,
          },
          padding: '0px',
          hideDesktop: false,
          _meta: {
            htmlID: 'u_row_5',
            htmlClassNames: 'u_row',
          },
          selectable: true,
          draggable: true,
          duplicatable: true,
          deletable: true,
          hideable: true,
          hideMobile: false,
          noStackMobile: false,
        },
      },
      {
        cells: [1, 1],
        columns: [
          {
            contents: [
              {
                type: 'image',
                values: {
                  containerPadding: '10px',
                  src: {
                    url: 'https://cdn.templates.unlayer.com/assets/1606934810497-02.png',
                    width: 626,
                    height: 418,
                  },
                  textAlign: 'center',
                  altText: 'Image',
                  action: {
                    name: 'web',
                    values: {
                      href: '',
                      target: '_blank',
                    },
                  },
                  hideDesktop: false,
                  _meta: {
                    htmlID: 'u_content_image_3',
                    htmlClassNames: 'u_content_image',
                  },
                  selectable: true,
                  draggable: true,
                  duplicatable: true,
                  deletable: true,
                  hideable: true,
                  hideMobile: false,
                },
              },
              {
                type: 'text',
                values: {
                  containerPadding: '10px 10px 0px',
                  textAlign: 'center',
                  lineHeight: '140%',
                  linkStyle: {
                    inherit: true,
                    linkColor: '#0000ee',
                    linkHoverColor: '#0000ee',
                    linkUnderline: true,
                    linkHoverUnderline: true,
                  },
                  hideDesktop: false,
                  _meta: {
                    htmlID: 'u_content_text_3',
                    htmlClassNames: 'u_content_text',
                  },
                  selectable: true,
                  draggable: true,
                  duplicatable: true,
                  deletable: true,
                  hideable: true,
                  hideMobile: false,
                  text:
                    '<p style="font-size: 14px; line-height: 140%;"><span style="font-size: 16px; line-height: 22.4px;"><strong><span style="line-height: 22.4px; font-size: 16px;">Ray-Ban</span></strong></span></p>',
                },
              },
              {
                type: 'text',
                values: {
                  containerPadding: '10px',
                  textAlign: 'center',
                  lineHeight: '140%',
                  linkStyle: {
                    inherit: true,
                    linkColor: '#0000ee',
                    linkHoverColor: '#0000ee',
                    linkUnderline: true,
                    linkHoverUnderline: true,
                  },
                  hideDesktop: false,
                  _meta: {
                    htmlID: 'u_content_text_4',
                    htmlClassNames: 'u_content_text',
                  },
                  selectable: true,
                  draggable: true,
                  duplicatable: true,
                  deletable: true,
                  hideable: true,
                  hideMobile: false,
                  text:
                    '<p style="font-size: 14px; line-height: 140%;"><span style="font-size: 16px; line-height: 22.4px;"><strong><span style="line-height: 22.4px; font-size: 16px;">$20</span></strong></span></p>',
                },
              },
              {
                type: 'button',
                values: {
                  containerPadding: '10px',
                  href: {
                    name: 'web',
                    values: {
                      href: '',
                      target: '_blank',
                    },
                  },
                  buttonColors: {
                    color: '#FFFFFF',
                    backgroundColor: '#262425',
                    hoverColor: '#FFFFFF',
                    hoverBackgroundColor: '#3AAEE0',
                  },
                  size: {
                    autoWidth: true,
                    width: '100%',
                  },
                  textAlign: 'center',
                  lineHeight: '120%',
                  padding: '10px 20px',
                  border: {},
                  borderRadius: '0px',
                  hideDesktop: false,
                  _meta: {
                    htmlID: 'u_content_button_2',
                    htmlClassNames: 'u_content_button',
                  },
                  selectable: true,
                  draggable: true,
                  duplicatable: true,
                  deletable: true,
                  hideable: true,
                  hideMobile: false,
                  text: '<span style="font-size: 14px; line-height: 16.8px;">Buy Now</span>',
                  calculatedWidth: 104,
                  calculatedHeight: 36,
                },
              },
            ],
            values: {
              _meta: {
                htmlID: 'u_column_6',
                htmlClassNames: 'u_column',
              },
              border: {},
              padding: '0px',
              backgroundColor: '',
            },
          },
          {
            contents: [
              {
                type: 'image',
                values: {
                  containerPadding: '10px',
                  src: {
                    url: 'https://cdn.templates.unlayer.com/assets/1606932761674-2.jpg',
                    width: 626,
                    height: 417,
                  },
                  textAlign: 'center',
                  altText: 'Image',
                  action: {
                    name: 'web',
                    values: {
                      href: '',
                      target: '_blank',
                    },
                  },
                  hideDesktop: false,
                  _meta: {
                    htmlID: 'u_content_image_2',
                    htmlClassNames: 'u_content_image',
                  },
                  selectable: true,
                  draggable: true,
                  duplicatable: true,
                  deletable: true,
                  hideable: true,
                  hideMobile: false,
                },
              },
              {
                type: 'text',
                values: {
                  containerPadding: '10px 10px 0px',
                  textAlign: 'center',
                  lineHeight: '140%',
                  linkStyle: {
                    inherit: true,
                    linkColor: '#0000ee',
                    linkHoverColor: '#0000ee',
                    linkUnderline: true,
                    linkHoverUnderline: true,
                  },
                  hideDesktop: false,
                  _meta: {
                    htmlID: 'u_content_text_5',
                    htmlClassNames: 'u_content_text',
                  },
                  selectable: true,
                  draggable: true,
                  duplicatable: true,
                  deletable: true,
                  hideable: true,
                  hideMobile: false,
                  text:
                    '<p style="font-size: 14px; line-height: 140%;"><span style="font-size: 16px; line-height: 22.4px;"><strong><span style="line-height: 22.4px; font-size: 16px;">Ray-Ban</span></strong></span></p>',
                },
              },
              {
                type: 'text',
                values: {
                  containerPadding: '10px',
                  textAlign: 'center',
                  lineHeight: '140%',
                  linkStyle: {
                    inherit: true,
                    linkColor: '#0000ee',
                    linkHoverColor: '#0000ee',
                    linkUnderline: true,
                    linkHoverUnderline: true,
                  },
                  hideDesktop: false,
                  _meta: {
                    htmlID: 'u_content_text_6',
                    htmlClassNames: 'u_content_text',
                  },
                  selectable: true,
                  draggable: true,
                  duplicatable: true,
                  deletable: true,
                  hideable: true,
                  hideMobile: false,
                  text:
                    '<p style="font-size: 14px; line-height: 140%;"><span style="font-size: 16px; line-height: 22.4px;"><strong><span style="line-height: 22.4px; font-size: 16px;">$25</span></strong></span></p>',
                },
              },
              {
                type: 'button',
                values: {
                  containerPadding: '10px',
                  href: {
                    name: 'web',
                    values: {
                      href: '',
                      target: '_blank',
                    },
                  },
                  buttonColors: {
                    color: '#FFFFFF',
                    backgroundColor: '#262425',
                    hoverColor: '#FFFFFF',
                    hoverBackgroundColor: '#3AAEE0',
                  },
                  size: {
                    autoWidth: true,
                    width: '100%',
                  },
                  textAlign: 'center',
                  lineHeight: '120%',
                  padding: '10px 20px',
                  border: {},
                  borderRadius: '0px',
                  hideDesktop: false,
                  _meta: {
                    htmlID: 'u_content_button_3',
                    htmlClassNames: 'u_content_button',
                  },
                  selectable: true,
                  draggable: true,
                  duplicatable: true,
                  deletable: true,
                  hideable: true,
                  hideMobile: false,
                  text: '<span style="font-size: 14px; line-height: 16.8px;">Buy Now</span>',
                  calculatedWidth: 104,
                  calculatedHeight: 36,
                },
              },
            ],
            values: {
              _meta: {
                htmlID: 'u_column_10',
                htmlClassNames: 'u_column',
              },
              border: {},
              padding: '0px',
              backgroundColor: '',
            },
          },
        ],
        values: {
          displayCondition: null,
          columns: false,
          backgroundColor: '',
          columnsBackgroundColor: '#ffffff',
          backgroundImage: {
            url: '',
            fullWidth: true,
            repeat: false,
            center: true,
            cover: false,
          },
          padding: '0px',
          hideDesktop: false,
          _meta: {
            htmlID: 'u_row_4',
            htmlClassNames: 'u_row',
          },
          selectable: true,
          draggable: true,
          duplicatable: true,
          deletable: true,
          hideable: true,
          hideMobile: false,
          noStackMobile: false,
        },
      },
      {
        cells: [1],
        columns: [
          {
            contents: [
              {
                type: 'text',
                values: {
                  containerPadding: '30px 30px 40px',
                  textAlign: 'center',
                  lineHeight: '160%',
                  linkStyle: {
                    inherit: true,
                    linkColor: '#0000ee',
                    linkHoverColor: '#0000ee',
                    linkUnderline: true,
                    linkHoverUnderline: true,
                  },
                  hideDesktop: false,
                  _meta: {
                    htmlID: 'u_content_text_7',
                    htmlClassNames: 'u_content_text',
                  },
                  selectable: true,
                  draggable: true,
                  duplicatable: true,
                  deletable: true,
                  hideable: true,
                  hideMobile: false,
                  text:
                    '<p style="font-size: 14px; line-height: 160%;"><span style="font-size: 14px; line-height: 22.4px;">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.&nbsp;</span></p>',
                },
              },
            ],
            values: {
              _meta: {
                htmlID: 'u_column_11',
                htmlClassNames: 'u_column',
              },
              border: {},
              padding: '0px',
              backgroundColor: '',
            },
          },
        ],
        values: {
          displayCondition: null,
          columns: false,
          backgroundColor: '',
          columnsBackgroundColor: '#ffffff',
          backgroundImage: {
            url: '',
            fullWidth: true,
            repeat: false,
            center: true,
            cover: false,
          },
          padding: '0px',
          hideDesktop: false,
          _meta: {
            htmlID: 'u_row_8',
            htmlClassNames: 'u_row',
          },
          selectable: true,
          draggable: true,
          duplicatable: true,
          deletable: true,
          hideable: true,
          hideMobile: false,
          noStackMobile: false,
        },
      },
      {
        cells: [1],
        columns: [
          {
            contents: [
              {
                type: 'text',
                values: {
                  containerPadding: '60px 30px 0px',
                  color: '#ffffff',
                  textAlign: 'left',
                  lineHeight: '120%',
                  linkStyle: {
                    inherit: true,
                    linkColor: '#0000ee',
                    linkHoverColor: '#0000ee',
                    linkUnderline: true,
                    linkHoverUnderline: true,
                  },
                  hideDesktop: false,
                  _meta: {
                    htmlID: 'u_content_text_8',
                    htmlClassNames: 'u_content_text',
                  },
                  selectable: true,
                  draggable: true,
                  duplicatable: true,
                  deletable: true,
                  hideable: true,
                  hideMobile: false,
                  text:
                    '<p style="font-size: 14px; line-height: 120%;"><span style="font-size: 32px; line-height: 38.4px;"><strong><span style="line-height: 38.4px; font-size: 32px;">ABOUT OUR</span></strong></span></p>\n<p style="font-size: 14px; line-height: 120%;"><span style="font-size: 32px; line-height: 38.4px;"><strong><span style="line-height: 38.4px; font-size: 32px;"> PRODUCT</span></strong></span></p>',
                  _override: {
                    mobile: {
                      textAlign: 'center',
                    },
                  },
                },
              },
              {
                type: 'text',
                values: {
                  containerPadding: '22px 30px 10px',
                  color: '#ffffff',
                  textAlign: 'left',
                  lineHeight: '140%',
                  linkStyle: {
                    inherit: true,
                    linkColor: '#0000ee',
                    linkHoverColor: '#0000ee',
                    linkUnderline: true,
                    linkHoverUnderline: true,
                  },
                  hideDesktop: false,
                  _meta: {
                    htmlID: 'u_content_text_9',
                    htmlClassNames: 'u_content_text',
                  },
                  selectable: true,
                  draggable: true,
                  duplicatable: true,
                  deletable: true,
                  hideable: true,
                  hideMobile: false,
                  text:
                    '<p style="font-size: 14px; line-height: 140%;"><span style="font-size: 14px; line-height: 19.6px;">Lorem ipsum dolor sit amet, consectetur </span></p>\n<p style="font-size: 14px; line-height: 140%;"><span style="font-size: 14px; line-height: 19.6px;">adipiscing elit, sed do eiusmod tempor </span></p>\n<p style="font-size: 14px; line-height: 140%;"><span style="font-size: 14px; line-height: 19.6px;">incididunt ut labore et dolore magna </span></p>\n<p style="font-size: 14px; line-height: 140%;"><span style="font-size: 14px; line-height: 19.6px;"><span style="line-height: 19.6px; font-size: 14px;">aliqua.</span><span style="line-height: 19.6px; font-size: 14px;">enim ad minim veniam, quis nostrud </span></span></p>\n<p style="font-size: 14px; line-height: 140%;"><span style="font-size: 14px; line-height: 19.6px;"><span style="line-height: 19.6px; font-size: 14px;">exercitation ullamco</span><span style="line-height: 19.6px; font-size: 14px;">&nbsp;</span></span></p>',
                  _override: {
                    mobile: {
                      textAlign: 'center',
                    },
                  },
                },
              },
              {
                type: 'button',
                values: {
                  containerPadding: '10px 30px 40px',
                  href: {
                    name: 'web',
                    values: {
                      href: '',
                      target: '_blank',
                    },
                  },
                  buttonColors: {
                    color: '#252324',
                    backgroundColor: '#ffffff',
                    hoverColor: '#FFFFFF',
                    hoverBackgroundColor: '#3AAEE0',
                  },
                  size: {
                    autoWidth: true,
                    width: '100%',
                  },
                  textAlign: 'left',
                  lineHeight: '120%',
                  padding: '12px 25px',
                  border: {},
                  borderRadius: '0px',
                  hideDesktop: false,
                  _meta: {
                    htmlID: 'u_content_button_4',
                    htmlClassNames: 'u_content_button',
                  },
                  selectable: true,
                  draggable: true,
                  duplicatable: true,
                  deletable: true,
                  hideable: true,
                  hideMobile: false,
                  text: '<strong><span style="font-size: 14px; line-height: 16.8px;">VIEW MORE</span></strong>',
                  _override: {
                    mobile: {
                      textAlign: 'center',
                    },
                  },
                  calculatedWidth: 139,
                  calculatedHeight: 40,
                },
              },
            ],
            values: {
              _meta: {
                htmlID: 'u_column_9',
                htmlClassNames: 'u_column',
              },
              border: {},
              padding: '0px',
              backgroundColor: '',
            },
          },
        ],
        values: {
          displayCondition: null,
          columns: false,
          backgroundColor: '',
          columnsBackgroundColor: '',
          backgroundImage: {
            url: 'https://cdn.templates.unlayer.com/assets/1606937518713-ASASS.png',
            fullWidth: false,
            repeat: false,
            center: true,
            cover: false,
            width: 600,
            height: 500,
          },
          padding: '0px',
          hideDesktop: false,
          _meta: {
            htmlID: 'u_row_7',
            htmlClassNames: 'u_row',
          },
          selectable: true,
          draggable: true,
          duplicatable: true,
          deletable: true,
          hideable: true,
          hideMobile: false,
          noStackMobile: false,
        },
      },
      {
        cells: [1],
        columns: [
          {
            contents: [
              {
                type: 'divider',
                values: {
                  width: '100%',
                  border: {
                    borderTopWidth: '0px',
                    borderTopStyle: 'solid',
                    borderTopColor: '#BBBBBB',
                  },
                  textAlign: 'center',
                  containerPadding: '15px',
                  hideDesktop: false,
                  _meta: {
                    htmlID: 'u_content_divider_4',
                    htmlClassNames: 'u_content_divider',
                  },
                  selectable: true,
                  draggable: true,
                  duplicatable: true,
                  deletable: true,
                  hideable: true,
                  hideMobile: false,
                },
              },
            ],
            values: {
              _meta: {
                htmlID: 'u_column_12',
                htmlClassNames: 'u_column',
              },
              border: {},
              padding: '0px',
              backgroundColor: '',
            },
          },
        ],
        values: {
          displayCondition: null,
          columns: false,
          backgroundColor: '',
          columnsBackgroundColor: '#ffffff',
          backgroundImage: {
            url: '',
            fullWidth: true,
            repeat: false,
            center: true,
            cover: false,
          },
          padding: '0px',
          hideDesktop: false,
          _meta: {
            htmlID: 'u_row_9',
            htmlClassNames: 'u_row',
          },
          selectable: true,
          draggable: true,
          duplicatable: true,
          deletable: true,
          hideable: true,
          hideMobile: false,
          noStackMobile: false,
        },
      },
      {
        cells: [1],
        columns: [
          {
            contents: [
              {
                type: 'text',
                values: {
                  containerPadding: '20px 10px 10px',
                  color: '#ffffff',
                  textAlign: 'center',
                  lineHeight: '140%',
                  linkStyle: {
                    inherit: true,
                    linkColor: '#0000ee',
                    linkHoverColor: '#0000ee',
                    linkUnderline: true,
                    linkHoverUnderline: true,
                  },
                  hideDesktop: false,
                  _meta: {
                    htmlID: 'u_content_text_10',
                    htmlClassNames: 'u_content_text',
                  },
                  selectable: true,
                  draggable: true,
                  duplicatable: true,
                  deletable: true,
                  hideable: true,
                  hideMobile: false,
                  text:
                    '<p style="font-size: 14px; line-height: 140%;"><span style="font-size: 14px; line-height: 19.6px; font-family: Montserrat, sans-serif;"><strong><span style="line-height: 19.6px; font-size: 14px;">FOLLOW&nbsp; US&nbsp; ON</span></strong></span></p>',
                },
              },
              {
                type: 'social',
                values: {
                  containerPadding: '0px 10px 20px',
                  icons: {
                    iconType: 'circle-white',
                    icons: [
                      {
                        url: 'https://facebook.com/',
                        name: 'Facebook',
                      },
                      {
                        url: 'https://instagram.com/',
                        name: 'Instagram',
                      },
                      {
                        url: 'https://twitter.com/',
                        name: 'Twitter',
                      },
                    ],
                    editor: {
                      data: {
                        showDefaultIcons: true,
                        customIcons: [],
                      },
                    },
                  },
                  align: 'center',
                  spacing: 10,
                  hideDesktop: false,
                  _meta: {
                    htmlID: 'u_content_social_1',
                    htmlClassNames: 'u_content_social',
                  },
                  selectable: true,
                  draggable: true,
                  duplicatable: true,
                  deletable: true,
                  hideable: true,
                  hideMobile: false,
                },
              },
            ],
            values: {
              _meta: {
                htmlID: 'u_column_14',
                htmlClassNames: 'u_column',
              },
              border: {},
              padding: '0px',
              backgroundColor: '',
            },
          },
        ],
        values: {
          displayCondition: null,
          columns: false,
          backgroundColor: '',
          columnsBackgroundColor: '#d4ae7f',
          backgroundImage: {
            url: '',
            fullWidth: true,
            repeat: false,
            center: true,
            cover: false,
          },
          padding: '0px',
          hideDesktop: false,
          _meta: {
            htmlID: 'u_row_11',
            htmlClassNames: 'u_row',
          },
          selectable: true,
          draggable: true,
          duplicatable: true,
          deletable: true,
          hideable: true,
          hideMobile: false,
          noStackMobile: false,
        },
      },
      {
        cells: [1],
        columns: [
          {
            contents: [
              {
                type: 'divider',
                values: {
                  width: '100%',
                  border: {
                    borderTopWidth: '0px',
                    borderTopStyle: 'solid',
                    borderTopColor: '#BBBBBB',
                  },
                  textAlign: 'center',
                  containerPadding: '10px',
                  hideDesktop: false,
                  _meta: {
                    htmlID: 'u_content_divider_5',
                    htmlClassNames: 'u_content_divider',
                  },
                  selectable: true,
                  draggable: true,
                  duplicatable: true,
                  deletable: true,
                  hideable: true,
                  hideMobile: false,
                },
              },
            ],
            values: {
              _meta: {
                htmlID: 'u_column_15',
                htmlClassNames: 'u_column',
              },
              border: {},
              padding: '0px',
              backgroundColor: '',
            },
          },
        ],
        values: {
          displayCondition: null,
          columns: false,
          backgroundColor: '',
          columnsBackgroundColor: '',
          backgroundImage: {
            url: '',
            fullWidth: true,
            repeat: false,
            center: true,
            cover: false,
          },
          padding: '0px',
          hideDesktop: false,
          _meta: {
            htmlID: 'u_row_12',
            htmlClassNames: 'u_row',
          },
          selectable: true,
          draggable: true,
          duplicatable: true,
          deletable: true,
          hideable: true,
          hideMobile: false,
          noStackMobile: false,
        },
      },
    ],
    values: {
      textColor: '#000000',
      backgroundColor: '#e8d4bb',
      backgroundImage: {
        url: '',
        fullWidth: true,
        repeat: false,
        center: true,
        cover: false,
      },
      contentWidth: '800px',
      contentAlign: 'center',
      fontFamily: {
        label: 'Montserrat',
        value: "'Montserrat',sans-serif",
        url: 'https://fonts.googleapis.com/css?family=Montserrat:400,700',
        defaultFont: true,
      },
      preheaderText: '',
      linkStyle: {
        body: true,
        linkColor: '#0000ee',
        linkHoverColor: '#0000ee',
        linkUnderline: true,
        linkHoverUnderline: true,
      },
      _meta: {
        htmlID: 'u_body',
        htmlClassNames: 'u_body',
      },
    },
  },
  schemaVersion: 6,
};

// The functionality is very similar to SendCustomerEmailModal
// But the data is handled differently since Audience is a different entity
// Also SendCustomerEmail requires some product information while this one does not
const SendAudienceEmailModal = ({ visible, closeModal, recipients }) => {
  const emailEditor = useRef(null);
  const [form] = Form.useForm();

  const [submitting, setSubmitting] = useState(false);
  const [validRecipients, setValidRecipients] = useState([]);
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [emailDocumentUrl, setEmailDocumentUrl] = useState(null);

  useEffect(() => {
    if (visible && recipients.length > 0) {
      setValidRecipients(recipients);
      setSelectedRecipients(recipients.map((recipient) => recipient.id));
      form.setFieldsValue({
        recipients: recipients.map((recipient) => recipient.id),
      });
    } else {
      form.resetFields();
      setEmailDocumentUrl(null);
      setSelectedRecipients([]);
      setValidRecipients([]);
      setSubmitting(false);
    }
  }, [visible, form, recipients]);

  const normFile = (e) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e && e.fileList;
  };

  const resetEditorContent = () => {
    if (emailEditor.current) {
      emailEditor.current.editor.loadBlank(initialEditorBodyTemplate);
      emailEditor.current.editor.setBodyValues(initialEditorBodyTemplate);
    }
  };

  const handleFinish = (values) => {
    if (emailEditor.current) {
      emailEditor.current.editor.exportHtml(async (data) => {
        const emailBody = data.chunks.body.replaceAll(`\n`, '');
        setSubmitting(true);
        try {
          const payload = {
            body: emailBody,
            subject: values.subject,
            audience_ids: selectedRecipients || values.recipients,
            document_url: emailDocumentUrl || '',
          };

          const { status } = await apis.audiences.sendEmailToAudiences(payload);

          if (isAPISuccess(status)) {
            showSuccessModal('Emails sent successfully');
            resetEditorContent();
            closeModal();
          }
        } catch (error) {
          showErrorModal('Failed to send emails', error?.respoonse?.data?.message || 'Something went wrong');
        }
        setSubmitting(false);
      });
    }
  };

  const adjustEditorIframeMinWidth = () => {
    const editorId = emailEditor.current.editorId;
    const editorElement = document.getElementById(editorId);
    // NOTE: the Unlayer iframe has a default min-width value of 1024px
    // We can override it here to squish the iframe so it fits in the modal
    editorElement.querySelector('iframe').style.minWidth = '1024px';
  };

  const handleEditorLoad = () => {
    adjustEditorIframeMinWidth();
    // The Unlayer behaves weirdly that we have to loadDesign first
    // Then reset it so that we can "apply" some default body values
    emailEditor.current.editor.loadDesign(testTemplate);
    resetEditorContent();
  };

  return (
    <Modal
      title={<Title level={5}> Send email to audiences </Title>}
      visible={visible}
      centered={true}
      onCancel={() => closeModal()}
      footer={null}
      width={1080}
      afterClose={resetBodyStyle}
    >
      <Form
        layout="horizontal"
        name="emailForm"
        form={form}
        onFinish={handleFinish}
        scrollToFirstError={true}
        initialValues={formInitialValues}
      >
        <Row gutter={[8, 16]}>
          <Col xs={24}>
            <Form.Item {...sendCustomerEmailFormLayout} label="Replies will be sent to">
              <Text strong> {getLocalUserDetails()?.email} </Text>
            </Form.Item>
          </Col>
          <Col xs={24}>
            <Form.Item
              {...sendCustomerEmailFormLayout}
              id="recipients"
              name="recipients"
              label="Recipients"
              rules={validationRules.arrayValidation}
            >
              <Select
                showArrow
                showSearch
                placeholder="Select the recipients"
                mode="multiple"
                maxTagCount={3}
                values={selectedRecipients}
                onChange={(val) => setSelectedRecipients(val)}
                options={validRecipients.map((recipient) => ({
                  label: `${recipient.first_name} ${recipient.last_name || ''}`,
                  value: recipient.id,
                }))}
              />
            </Form.Item>
          </Col>
          <Col xs={24}>
            <Form.Item
              {...sendCustomerEmailFormLayout}
              id="subject"
              name="subject"
              label="Email Subject"
              rules={validationRules.requiredValidation}
            >
              <Input placeholder="Subject of the email goes here" />
            </Form.Item>
          </Col>
          <Col xs={24}>
            <EmailEditor
              // Customizing their editor with CSS requires premium
              options={{
                features: {
                  textEditor: {
                    cleanPaste: false,
                  },
                },
              }}
              appearance={{
                theme: 'dark',
              }}
              safeHtml={true}
              ref={emailEditor}
              onLoad={handleEditorLoad}
            />
          </Col>
          {/* <Col xs={24}>
            <Form.Item
              {...sendCustomerEmailBodyFormLayout}
              label="Email Body"
              name="emailBody"
              id="emailBody"
              rules={validationRules.requiredValidation}
            >
              <TextEditor name="emailBody" form={form} placeholder="Content of the email goes here" />
            </Form.Item>
          </Col> */}
          <Col xs={24}>
            <Form.Item name="document_url" id="document_url" valuePropName="fileList" getValueFromEvent={normFile}>
              <Row>
                <Col>
                  <FileUpload
                    name="document_url"
                    value={emailDocumentUrl}
                    onChange={setEmailDocumentUrl}
                    listType="text"
                    label="Upload a PDF file"
                  />
                </Col>
                {emailDocumentUrl && (
                  <Col>
                    <Button
                      type="text"
                      icon={<FilePdfOutlined />}
                      size="middle"
                      onClick={() => window.open(emailDocumentUrl)}
                      className={styles.filenameButton}
                    >
                      {emailDocumentUrl.split('_').slice(-1)[0]}
                    </Button>
                    <Tooltip title="Remove this file">
                      <Button
                        danger
                        type="text"
                        size="middle"
                        icon={<CloseCircleOutlined />}
                        onClick={() => setEmailDocumentUrl(null)}
                      />
                    </Tooltip>
                  </Col>
                )}
              </Row>
            </Form.Item>
          </Col>
        </Row>
        <Row justify="end" align="center" gutter={16}>
          <Col xs={12} md={6}>
            <Button block type="default" onClick={() => closeModal()} loading={submitting}>
              Cancel
            </Button>
          </Col>
          <Col xs={12} md={6}>
            <Button block type="primary" htmlType="submit" loading={submitting}>
              Send Email
            </Button>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default SendAudienceEmailModal;
