import React from 'react';
import { Layout, Divider } from 'antd';

import SideNavigation from 'components/SideNavigation';
import Header from 'components/Header';
import NavbarHeader from 'components/NavbarHeader';

import styles from './style.module.scss';

const { Content, Sider } = Layout;

const SideNavWithHeaderLayout = ({ children }) => {
  const handleCollapsed = (collapsed) => {
    if (document.getElementsByClassName('ant-layout-sider-zero-width-trigger-left')[0]) {
      if (!collapsed) {
        document.getElementsByClassName('ant-layout-sider-zero-width-trigger-left')[0].style.right = '200px';
      } else {
        document.getElementsByClassName('ant-layout-sider-zero-width-trigger-left')[0].style.right = '-36px';
      }
    }
  };

  return (
    <>
      <div className={styles.topHeader}>
        <NavbarHeader />
      </div>
      <Header />
      <Divider className={styles.divider} />
      <Layout className={styles.container}>
        <Sider className={styles.sideIcon} width={250} breakpoint="md" collapsedWidth="0" onCollapse={handleCollapsed}>
          <SideNavigation />
        </Sider>
        <Layout className={styles.mainContent}>
          <Content>{children}</Content>
        </Layout>
      </Layout>
    </>
  );
};

export default SideNavWithHeaderLayout;
