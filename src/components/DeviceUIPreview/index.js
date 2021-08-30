import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

// Props list can be found here https://github.com/bdryanovski/react-device-preview/blob/master/src/index.js
import ReactDevicePreview from 'react-device-preview';

import { Spin } from 'antd';

import DynamicProfile from 'pages/DynamicProfile';
import MobileLayout from 'layouts/MobileLayout';

import styles from './styles.module.scss';
import { preventDefaults } from 'utils/helper';

// NOTE: play with the previewScale (0 - 1) to adjust device size
const deviceTypes = {
  MOBILE: {
    key: 'iphonex',
    viewportWidth: '375',
    previewScale: '0.8',
  },
  DESKTOP: {
    key: 'macbookpro',
    viewportWidth: '1280',
    previewScale: '0.5',
  },
};

// NOTE : caveat is that the URL needs to contain username
// So we might not be able to allow them to edit this here
const DeviceUIPreview = ({ creatorProfileData = null, isMobilePreview = true }) => {
  const [contentRef, setContentRef] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const mountNode = contentRef?.contentWindow?.document?.body;

  useEffect(() => {
    if (!contentRef) {
      return;
    }

    const timeoutID = setTimeout(() => {
      // Copy all the style and link tags from main document
      // to <head> of iframe
      const win = contentRef?.contentWindow;
      const linkEls = win.parent.document.querySelectorAll('link');
      if (linkEls.length) {
        linkEls.forEach((el) => {
          win.document.head.appendChild(el.cloneNode(true));
        });
      }

      const styleEls = win.parent.document.querySelectorAll('style');
      if (styleEls.length) {
        styleEls.forEach((el) => {
          win.document.head.appendChild(el.cloneNode(true));
        });
      }

      const metaViewportElement = document.createElement('meta');
      metaViewportElement.name = 'viewport';

      metaViewportElement.content = `width=${
        deviceTypes[isMobilePreview ? 'MOBILE' : 'DESKTOP'].viewportWidth
      }, initial-scale=1`;

      win.document.head.appendChild(metaViewportElement);
      setIsLoading(false);
    }, 3000);

    return () => {
      if (timeoutID) {
        clearTimeout(timeoutID);
      }
    };
  }, [contentRef, isMobilePreview]);

  const creatorProfilePreview = (
    <MobileLayout>
      <DynamicProfile overrideUserObject={creatorProfileData} />
    </MobileLayout>
  );

  return (
    <Spin spinning={isLoading} tip="Loading preview...">
      <ReactDevicePreview
        device={deviceTypes[isMobilePreview ? 'MOBILE' : 'DESKTOP'].key}
        scale={deviceTypes[isMobilePreview ? 'MOBILE' : 'DESKTOP'].previewScale}
      >
        <iframe
          style={{ display: isLoading ? 'none' : 'block' }}
          className={styles.contentContainer}
          title="Device Profile Preview"
          ref={setContentRef}
          onClick={preventDefaults}
        >
          {mountNode && createPortal(creatorProfilePreview, mountNode)}
        </iframe>
      </ReactDevicePreview>
    </Spin>
  );
};

export default DeviceUIPreview;
