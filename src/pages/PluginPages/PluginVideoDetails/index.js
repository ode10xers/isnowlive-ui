import React, { useCallback, useEffect } from 'react';

import { Row, Col, Button } from 'antd';
import { LeftOutlined } from '@ant-design/icons';

import NewVideoDetails from 'pages/ProductDetails/NewVideoDetails';

import { widgetComponentsName, localStoragePluginStylingKeyPrefix } from 'utils/widgets';

import styles from './style.module.scss';

const PluginVideoDetails = ({ match, history }) => {
  const initializePluginStyling = useCallback(() => {
    // NOTE : This needs to match with the variable in globals.scss to work
    document.body.style.background = 'var(--video-widget-background-color, transparent)';

    // NOTE : We try to reuse the same styling as the video plugin
    const pluginType = widgetComponentsName.VIDEOS.value;

    const savedPluginStyling = localStorage.getItem(`${localStoragePluginStylingKeyPrefix}${pluginType}`) ?? null;

    if (savedPluginStyling) {
      document.head.insertAdjacentHTML('beforeend', `<style>${savedPluginStyling}</style>`);
    }
  }, []);

  useEffect(() => {
    initializePluginStyling();
  }, [initializePluginStyling]);

  return (
    <div className={styles.pluginVideoDetailsPage}>
      <Row gutter={[8, 8]} className={styles.pageContainer}>
        <Col xs={24}>
          <div className={styles.backButtonContainer}>
            <Button
              ghost
              type="primary"
              icon={<LeftOutlined />}
              className={styles.backButton}
              onClick={() => history.goBack()}
            >
              Back
            </Button>
          </div>
        </Col>
        <Col xs={24}>
          <NewVideoDetails match={match} />
        </Col>
      </Row>
    </div>
  );
};

export default PluginVideoDetails;
