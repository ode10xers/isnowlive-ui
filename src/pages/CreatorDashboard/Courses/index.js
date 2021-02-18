import React, { useState } from 'react';

import { Row, Col, Tabs, Typography, Button } from 'antd';

import styles from './styles.module.scss';

const { TabPane } = Tabs;
const { Title, Text } = Typography;

const Courses = () => {
  const [selectedListTab, setSelectedListTab] = useState('liveClassCourse');

  const handleChangeListTab = (key) => {
    setSelectedListTab(key);
  };

  return (
    <div className={styles.box}>
      <Row gutter={[8, 8]}>
        <Col xs={24} md={14} lg={16} xl={18}>
          <Title level={3}> Courses </Title>
        </Col>
        <Col xs={24} md={10} lg={18} xl={6}>
          <Button block size="large" type="primary" onClick={() => console.log('Clicked')}>
            Create New Course
          </Button>
        </Col>
        <Col xs={24}>
          <Tabs
            size="large"
            defaultActiveKey={selectedListTab}
            activeKey={selectedListTab}
            onChange={handleChangeListTab}
          >
            <TabPane key="liveClassCourse" tab={<Text> Live Class Courses </Text>}></TabPane>
            {/* <TabPane key="videoCourse" tab={<Text> Video Courses </Text>}></TabPane> */}
          </Tabs>
        </Col>
      </Row>
    </div>
  );
};

export default Courses;
