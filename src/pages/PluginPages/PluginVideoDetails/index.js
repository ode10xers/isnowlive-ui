import React from 'react';

import { Row, Col, Button } from 'antd';
import { LeftOutlined } from '@ant-design/icons';

import NewVideoDetails from 'pages/ProductDetails/NewVideoDetails';

import styles from './style.module.scss';

const PluginVideoDetails = ({ match, history }) => {
  return (
    <div className={styles.pluginVideoDetailsPage}>
      <Row gutter={[8, 8]}>
        <Col xs={24}>
          <div className={styles.backButtonContainer}>
            <Button ghost type="primary" onClick={() => history.goBack()} icon={<LeftOutlined />}>
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
