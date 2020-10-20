import React from 'react';
import { useHistory } from 'react-router-dom';
import { Menu } from 'antd';

import menuItems from './MenuItems.constant';

import styles from './style.module.scss';

const { SubMenu } = Menu;

const SideNavigation = () => {
  const history = useHistory();

  return (
    <Menu mode="inline" className={styles.sideNavMenu}>
      {menuItems.map((navItem) => {
        return navItem.children ? (
          <SubMenu key={navItem.key} title={navItem.value} icon={navItem.icon}>
            {navItem.children.map((item) => {
              return (
                <Menu.Item key={item.key} onClick={() => history.push(item.redirect)}>
                  {item.value}
                </Menu.Item>
              );
            })}
          </SubMenu>
        ) : (
          <Menu.Item key={navItem.key} icon={navItem?.icon || null} onClick={() => history.push(navItem.redirect)}>
            {navItem.value}
          </Menu.Item>
        );
      })}
    </Menu>
  );
};

export default SideNavigation;
