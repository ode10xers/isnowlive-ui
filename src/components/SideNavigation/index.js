import React from 'react';
import { Menu } from 'antd';

import menuItems from './MenuItems.constant';

import styles from './style.module.scss';
import { useHistory } from 'react-router-dom';

const { SubMenu } = Menu;

// TODO: In Below component, we need to add an action which can be triggered on the click of the menu item.
// And that action

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
