import React from 'react';
import {
  ControlOutlined,
  TeamOutlined,
  VideoCameraOutlined,
  ToolOutlined,
  DollarOutlined,
  GlobalOutlined,
  UserOutlined,
} from '@ant-design/icons';
import Routes from 'routes';

const MenuItems = [
  {
    order: 1,
    key: 'sessions',
    title: 'Sessions',
    icon: <VideoCameraOutlined />,
    children: [
      {
        order: 1,
        key: 'upcoming_sessions',
        title: 'Upcoming Sessions',
        // For demo purpose
        path: Routes.profile,
      },
      {
        order: 2,
        key: 'past_sessions',
        title: 'Past Sessions',
      },
      {
        order: 3,
        key: 'manage_sessions',
        title: 'Manage Sessions',
      },
      {
        order: 4,
        key: 'create_session',
        title: 'Create Session',
      },
    ],
  },
  {
    order: 2,
    key: 'attendees',
    title: 'Attendees',
    icon: <TeamOutlined />,
  },
  {
    order: 3,
    key: 'packages',
    title: 'Packages',
    icon: <ControlOutlined />,
  },
  {
    order: 4,
    key: 'livestream',
    title: 'Livestream',
    icon: <ToolOutlined />,
  },
  {
    order: 5,
    key: 'public_page',
    title: 'Public Page',
    icon: <GlobalOutlined />,
  },
  {
    order: 6,
    key: 'get_paid',
    title: 'Get Paid',
    icon: <DollarOutlined />,
  },
  {
    order: 7,
    key: 'account',
    title: 'Account',
    icon: <UserOutlined />,
  },
];

MenuItems.sort((a, b) => a.order - b.order);

export default MenuItems;
