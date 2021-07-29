import React from 'react';
import classNames from 'classnames';
import { Layout, Row, Col } from 'antd';

import NavbarHeader from 'components/NavbarHeader';

import { isInCreatorDashboard } from 'utils/helper';

import styles from './style.module.scss';

const { Content, Header } = Layout;

const MobileLayout = ({ children }) => {
  return (
    <Layout>
      {!isInCreatorDashboard() && (
        <Header className={styles.topHeader}>
          <NavbarHeader />
        </Header>
      )}
      <Content className={classNames(styles.mainContainer, isInCreatorDashboard() ? undefined : styles.withTopHeader)}>
        <Row justify="center">
          <Col className={styles.mainContent}>{children}</Col>
        </Row>
      </Content>
    </Layout>
  );
};

export default MobileLayout;
