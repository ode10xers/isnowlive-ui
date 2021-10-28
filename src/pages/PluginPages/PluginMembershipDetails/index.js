import React, { useCallback, useEffect } from 'react';

import { Row, Col, Button } from 'antd';
import { LeftOutlined } from '@ant-design/icons';

import NewMembershipDetails from 'pages/ProductDetails/NewMembershipDetails';

import { widgetComponentsName, localStoragePluginStylingKeyPrefix } from 'utils/widgets';

import styles from './style.module.scss';

const PluginMembershipDetails = ({ match, history }) => {
  const initializePluginStyling = useCallback(() => {
    // NOTE : This needs to match with the variable in globals.scss to work
    document.body.style.background = 'var(--membership-widget-background-color, transparent)';

    // NOTE : We try to reuse the same styling as the membership plugin
    const pluginType = widgetComponentsName.MEMBERSHIPS.value;

    const savedPluginStyling = localStorage.getItem(`${localStoragePluginStylingKeyPrefix}${pluginType}`) ?? null;

    if (savedPluginStyling) {
      document.head.insertAdjacentHTML('beforeend', `<style>${savedPluginStyling}</style>`);
    }
  }, []);

  useEffect(() => {
    initializePluginStyling();
  }, [initializePluginStyling]);

  return (
    <div className={styles.pluginMembershipDetailsPage}>
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
          <NewMembershipDetails match={match} />
        </Col>
      </Row>
    </div>
  );
};

export default PluginMembershipDetails;
