import React from 'react';
import { Layout, Divider } from 'antd';

import SideNavigation from 'components/SideNavigation';
import Header from 'components/Header';

import styles from './style.module.scss';

const { Content, Sider } = Layout;

const SideNavLayout = ({ children }) => {
  return (
    <>
      <Header />
      <Divider className={styles.divider} />
      <Layout className={styles.container}>
        <Sider width={250} breakpoint="md" collapsedWidth="0">
          <SideNavigation />
        </Sider>
        <Layout className={styles.mainContent}>
          <Content>{children}</Content>
        </Layout>
      </Layout>
    </>
  );
};

export default SideNavLayout;
