import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

// Props list can be found here https://github.com/bdryanovski/react-device-preview/blob/master/src/index.js
import ReactDevicePreview from 'react-device-preview';

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
  const mountNode = contentRef?.contentWindow?.document?.body;

  useEffect(() => {
    if (!contentRef) {
      return;
    }
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
  }, [contentRef, isMobilePreview]);

  // TODO: Also need to pass override user sections here as another props
  const creatorProfilePreview = (
    <MobileLayout>
      <DynamicProfile overrideUserObject={creatorProfileData} />
    </MobileLayout>
  );

  return (
    <ReactDevicePreview
      device={deviceTypes[isMobilePreview ? 'MOBILE' : 'DESKTOP'].key}
      scale={deviceTypes[isMobilePreview ? 'MOBILE' : 'DESKTOP'].previewScale}
    >
      <iframe
        className={styles.contentContainer}
        title="Device Profile Preview"
        ref={setContentRef}
        onClick={preventDefaults}
      >
        {mountNode && createPortal(creatorProfilePreview, mountNode)}
      </iframe>
    </ReactDevicePreview>
  );
};

export default DeviceUIPreview;
