import React from 'react';
import { Layout } from 'antd';

import NavbarHeader from 'components/NavbarHeader';

import styles from './style.module.scss';

const { Content, Header } = Layout;

const NavbarFullWidthLayout = ({ children }) => {
  return (
    <Layout>
      <Header className={styles.topHeader}>
        <NavbarHeader />
      </Header>
      <Content className={styles.mainContent}>{children}</Content>
    </Layout>
  );
};

export default NavbarFullWidthLayout;
