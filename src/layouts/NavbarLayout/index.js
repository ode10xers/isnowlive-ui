import React from 'react';
import { Layout, Row, Col } from 'antd';

import NavbarHeader from 'components/NavbarHeader';

import styles from './style.module.scss';

const { Content, Header } = Layout;

const NavbarLayout = ({ children }) => {
  return (
    <Layout>
      <Header className={styles.topHeader}>
        <NavbarHeader />
      </Header>
      <Content className={styles.mainContent}>
        <Row>
          <Col xs={2} md={4} xl={4}></Col>
          <Col xs={20} md={16} xl={16}>
            {children}
          </Col>
          <Col xs={2} md={4} xl={4}></Col>
        </Row>
      </Content>
    </Layout>
  );
};

export default NavbarLayout;
