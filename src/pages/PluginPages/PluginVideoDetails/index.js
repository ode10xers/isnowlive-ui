import React from 'react';

import { Row, Col, Button } from 'antd';
import { RightOutlined } from '@ant-design/icons';

import NewVideoDetails from 'pages/ProductDetails/NewVideoDetails';

const PluginVideoDetails = ({ match, history }) => {
  return (
    <div>
      <Row gutter={[8, 8]}>
        <Col xs={24}>
          <Button ghost type="primary" onClick={() => history.goBack()} icon={<RightOutlined />}>
            Back
          </Button>
        </Col>
        <Col xs={24}>
          <NewVideoDetails match={match} />
        </Col>
      </Row>
    </div>
  );
};

export default PluginVideoDetails;
