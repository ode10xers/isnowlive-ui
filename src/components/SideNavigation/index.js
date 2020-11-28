import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { Menu } from 'antd';

import Routes from 'routes';
import { creatorMenuItems, attendeeMenuItems } from './MenuItems.constant';

import styles from './style.module.scss';

const { SubMenu, Item } = Menu;

const SideNavigation = () => {
  const [showMenu, setShowMenu] = useState(() => creatorMenuItems.sort((a, b) => a.order - b.order));
  const history = useHistory();

  useEffect(() => {
    if (history.location.pathname.includes(Routes.creatorDashboard.rootPath)) {
      setShowMenu(creatorMenuItems.sort((a, b) => a.order - b.order));
    } else {
      setShowMenu(attendeeMenuItems.sort((a, b) => a.order - b.order));
    }
  }, [history.location.pathname]);

  return (
    <Menu mode="inline" className={styles.sideNavMenu}>
      {showMenu.map((navItem) =>
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
