import React from 'react';
import { Layout, Row, Col } from 'antd';

import NavbarHeader from 'components/NavbarHeader';

import styles from './style.module.scss';

const { Content, Header } = Layout;

const MobileLayout = ({ children }) => {
  return (
    <Layout>
      <Header className={styles.topHeader}>
        <NavbarHeader />
      </Header>
      <Content className={styles.mainContainer}>
        <Row justify="center">
          <Col className={styles.mainContent}>{children}</Col>
        </Row>
      </Content>
    </Layout>
  );
};

export default MobileLayout;
