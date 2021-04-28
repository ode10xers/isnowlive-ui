import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { Menu, Button } from 'antd';

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
      <Item
        key="sessionCTA"
        onClick={() => history.push(Routes.creatorDashboard.rootPath + Routes.creatorDashboard.createSessions)}
      >
        <Button block type="primary">
          Create a Session
        </Button>
      </Item>
      <Item
        key="videoCTA"
        onClick={() =>
          history.push(Routes.creatorDashboard.rootPath + Routes.creatorDashboard.videos, { onboarding: true })
        }
      >
        <Button block type="primary">
          Add a Video
        </Button>
      </Item>
      {showMenu.map((navItem) =>
        navItem.children ? (
          <SubMenu key={navItem.key} title={navItem.title} icon={navItem.icon}>
            {navItem.children.map((item) => (
              <Item key={item.key} onClick={() => trackAndNavigate(item)}>
                {item.title}
              </Item>
            ))}
          </SubMenu>
        ) : (
          <Item key={navItem.key} icon={navItem?.icon || null} onClick={() => trackAndNavigate(navItem)}>
            {navItem.title}
          </Item>
        )
      )}
    </Menu>
  );
};

export default SideNavigation;
