import React from 'react';
import { useHistory } from 'react-router-dom';
import { Menu } from 'antd';

import menuItems from './MenuItems.constant';

import styles from './style.module.scss';

const { SubMenu, Item } = Menu;

const SideNavigation = () => {
  const history = useHistory();

  return (
    <Menu mode="inline" className={styles.sideNavMenu}>
      {menuItems.map((navItem) =>
        navItem.children ? (
          <SubMenu key={navItem.key} title={navItem.title} icon={navItem.icon}>
            {navItem.children.map((item) => (
              <Item key={item.key} onClick={() => history.push(item.path)}>
                {item.title}
              </Item>
            ))}
          </SubMenu>
        ) : (
          <Item key={navItem.key} icon={navItem?.icon || null} onClick={() => history.push(navItem.path)}>
            {navItem.title}
          </Item>
        )
      )}
    </Menu>
  );
};

export default SideNavigation;
