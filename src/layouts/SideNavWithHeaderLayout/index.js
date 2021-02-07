import React from 'react';
import { Layout, Divider } from 'antd';

import SideNavigation from 'components/SideNavigation';
import NavbarHeader from 'components/NavbarHeader';
import DashboardHeader from 'components/DashboardHeader';

import { reservedDomainName } from 'utils/helper';

import styles from './style.module.scss';

const { Content, Sider, Header } = Layout;

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

  const username = window.location.hostname.split('.')[0];

  return (
    <>
      {!reservedDomainName.includes(username) && (
        <Header className={styles.topHeader}>
          <NavbarHeader removePadding={true} />
        </Header>
      )}
      <div className={reservedDomainName.includes(username) ? undefined : styles.content}>
        {reservedDomainName.includes(username) && (
          <>
            <DashboardHeader />
            <Divider className={styles.divider} />
          </>
        )}
        <Layout className={styles.container}>
          <Sider
            className={styles.sideIcon}
            width={250}
            breakpoint="md"
            collapsedWidth="0"
            onCollapse={handleCollapsed}
          >
            <SideNavigation />
          </Sider>
          <Layout className={styles.mainContent}>
            <Content>{children}</Content>
          </Layout>
        </Layout>
      </div>
    </>
  );
};

export default SideNavWithHeaderLayout;
