import React from 'react';
import { Layout } from 'antd';

import SideNavigation from 'components/SideNavigation';

import styles from './style.module.scss';

const { Content, Sider } = Layout;

const SideNavLayout = ({ children }) => {
  return (
    <Layout>
      {/* Header should come at this place */}
      <Sider width={250} breakpoint="md" collapsedWidth="0">
        <SideNavigation />
      </Sider>
      <Layout className={styles.mainContent}>
        <Content>{children}</Content>
      </Layout>
    </Layout>
  );
};

export default SideNavLayout;
