import React, { useState } from 'react';
import classNames from 'classnames';
import { Layout, Divider, Typography } from 'antd';

import SideNavigation from 'components/SideNavigation';
import NavbarHeader from 'components/NavbarHeader';
import DashboardHeader from 'components/DashboardHeader';

import { reservedDomainName } from 'utils/helper';

import styles from './style.module.scss';
import { isInIframeWidget, isWidgetUrl } from 'utils/widgets';

const { Content, Sider, Header } = Layout;
const { Text } = Typography;

const SideNavWithHeaderLayout = ({ children }) => {
  // Currently only being used in widget view
  const [isSideMenuCollapsed, setIsSideMenuCollapsed] = useState(true);

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

    setIsSideMenuCollapsed(collapsed);
  };

  const username = window.location.hostname.split('.')[0];
  const isInWidget = isInIframeWidget() || isWidgetUrl();

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
        <Layout className={isInWidget ? styles.container : styles.widgetContainer}>
          {isInWidget ? (
            <Sider
              className={styles.sideIcon}
              width={250}
              breakpoint="xxl"
              collapsedWidth="0"
              collapsible={true}
              defaultCollapsed={true}
              collapsed={isSideMenuCollapsed}
              onCollapse={handleCollapsed}
              trigger={<Text className={styles.triggerText}> {isSideMenuCollapsed ? 'Open' : 'Close'} side menu </Text>}
            >
              <SideNavigation />
            </Sider>
          ) : (
            <Sider
              className={classNames(styles.sideIcon, reservedDomainName.includes(username) ? undefined : styles.hide)}
              width={250}
              breakpoint="lg"
              collapsedWidth="0"
              onCollapse={handleCollapsed}
            >
              <SideNavigation />
            </Sider>
          )}
          <Layout className={styles.mainContent}>
            <Content>{children}</Content>
          </Layout>
        </Layout>
      </div>
    </>
  );
};

export default SideNavWithHeaderLayout;
