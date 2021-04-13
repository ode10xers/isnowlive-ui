import React, { useState } from 'react';

import { Row, Col, Tabs, Typography } from 'antd';

import AudienceImport from './AudienceImport';
import AudienceList from './AudienceList';

import styles from './styles.module.scss';

const { TabPane } = Tabs;
const { Title } = Typography;

const Audiences = () => {
  const [selectedTab, setSelectedTab] = useState('list');

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24}>
        <Title level={4}> Audiences </Title>
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
