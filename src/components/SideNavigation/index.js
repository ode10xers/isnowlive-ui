import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { Menu } from 'antd';

import Routes from 'routes';
import { creatorMenuItems, attendeeMenuItems } from './MenuItems.constant';

import { trackSimpleEvent } from 'services/integrations/mixpanel';

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

  const trackAndNavigate = (item) => {
    trackSimpleEvent(item.mixPanelTag);
    history.push(item.path);
  };

  return (
    <Menu mode="inline" className={styles.sideNavMenu}>
      {showMenu.map((navItem) =>
        navItem.children ? (
          <SubMenu key={navItem.key} className={navItem.key} title={navItem.title} icon={navItem.icon}>
            {navItem.children.map((item) => (
              <Item key={item.key} className={item.key} onClick={() => trackAndNavigate(item)}>
                {item.title}
              </Item>
            ))}
          </SubMenu>
        ) : navItem.is_button ? (
          <Item
            key={navItem.key}
            className={navItem.key}
            onClick={() =>
              navItem.historyData.state
                ? history.push(navItem.historyData.route, navItem.historyData.state)
                : history.push(navItem.historyData.route)
            }
          >
            {navItem.title}
          </Item>
        ) : (
          <Item
            key={navItem.key}
            className={navItem.key}
            icon={navItem?.icon || null}
            onClick={() => trackAndNavigate(navItem)}
          >
            {navItem.title}
          </Item>
        )
      )}
    </Menu>
  );
};

export default SideNavigation;
