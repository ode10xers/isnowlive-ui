import React from 'react';
import { Layout, Divider, Button } from 'antd';

import SideNavigation from 'components/SideNavigation';
import DashboardHeader from 'components/DashboardHeader';

import styles from './style.module.scss';

const { Content, Sider } = Layout;

const SideNavLayout = ({ children }) => {
  const handleCollapsed = (collapsed) => {
    if (document.getElementsByClassName('ant-layout-sider-zero-width-trigger-left')[0]) {
      if (!collapsed) {
        // document.getElementsByClassName('ant-layout-sider-zero-width-trigger-left')[0].style.right = '200px';
        document.getElementsByClassName('ant-layout-sider-zero-width-trigger-left')[0].classList.add('expanded');
      } else {
        // document.getElementsByClassName('ant-layout-sider-zero-width-trigger-left')[0].style.right = '-36px';
        document.getElementsByClassName('ant-layout-sider-zero-width-trigger-left')[0].classList.remove('expanded');
      }
    }
  };

  return (
    <>
      <DashboardHeader />
      <Divider className={styles.divider} />
      <Layout className={styles.container}>
        <Sider
          className={styles.sideIcon}
          width={250}
          breakpoint="lg"
          collapsedWidth="0"
          onCollapse={handleCollapsed}
          trigger={
            <Button ghost size="small" type="primary" className={styles.siderTriggerMenuButton}>
              Menu
            </Button>
          }
        >
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
