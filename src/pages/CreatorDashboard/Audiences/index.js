import React, { useState } from 'react';

import { Row, Col, Tabs, Typography } from 'antd';

import AudienceImport from './AudienceImport';
import AudienceList from './AudienceList';

import styles from './styles.module.scss';

const { TabPane } = Tabs;
const { Title, Paragraph } = Typography;

const Audiences = () => {
  const [selectedTab, setSelectedTab] = useState('list');

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24}>
        <Title level={4}> Audiences </Title>
      </Col>
      <Col xs={24}>
        <Paragraph>
          A Member is a person who has an account on this site and has purchased at least 1 of your products.
        </Paragraph>
        <Paragraph>
          An Audience is a person subscribed to your email list but does not have an account on this site and hence
          hasn't bought any of your products yet.
        </Paragraph>
      </Col>
      <Col xs={24}>
        <Tabs size="large" activeKey={selectedTab} onChange={setSelectedTab}>
          <TabPane key="list" tab={<Title level={5}> Audience List </Title>}>
            <AudienceList />
          </TabPane>
          <TabPane className={styles.p50} key="import" tab={<Title level={5}> Import List </Title>}>
            <AudienceImport />
          </TabPane>
        </Tabs>
      </Col>
    </Row>
  );
};

export default Audiences;
