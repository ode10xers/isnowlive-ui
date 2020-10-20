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
    value: 'Sessions',
    icon: <VideoCameraOutlined />,
    children: [
      {
        order: 1,
        key: 'upcoming_sessions',
        value: 'Upcoming Sessions',
        // For demo purpose
        redirect: Routes.profile,
      },
      {
        order: 2,
        key: 'past_sessions',
        value: 'Past Sessions',
      },
      {
        order: 3,
        key: 'manage_sessions',
        value: 'Manage Sessions',
      },
      {
        order: 4,
        key: 'create_session',
        value: 'Create Session',
      },
    ],
  },
  {
    order: 2,
    key: 'attendees',
    value: 'Attendees',
    icon: <TeamOutlined />,
  },
  {
    order: 3,
    key: 'packages',
    value: 'Packages',
    icon: <ControlOutlined />,
  },
  {
    order: 4,
    key: 'livestream',
    value: 'Livestream',
    icon: <ToolOutlined />,
  },
  {
    order: 5,
    key: 'public_page',
    value: 'Public Page',
    icon: <GlobalOutlined />,
  },
  {
    order: 6,
    key: 'get_paid',
    value: 'Get Paid',
    icon: <DollarOutlined />,
  },
  {
    order: 7,
    key: 'account',
    value: 'Account',
    icon: <UserOutlined />,
  },
];

MenuItems.sort((a, b) => a.order - b.order);

export default MenuItems;
