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

export const creatorMenuItems = [
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
        path: Routes.creatorDashboard.rootPath + '/sessions/upcoming',
      },
      {
        order: 2,
        key: 'past_sessions',
        title: 'Past Sessions',
        path: Routes.creatorDashboard.rootPath + '/sessions/past',
      },
      {
        order: 3,
        key: 'manage_sessions',
        title: 'Manage Sessions',
        path: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.manageSessions,
      },
      {
        order: 4,
        key: 'create_session',
        title: 'Create Session',
        path: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.createSessions,
      },
    ],
  },
  // {
  //   order: 2,
  //   key: 'attendees',
  //   title: 'Attendees',
  //   icon: <TeamOutlined />,
  // },
  // {
  //   order: 3,
  //   key: 'packages',
  //   title: 'Packages',
  //   icon: <ControlOutlined />,
  // },
  {
    order: 4,
    key: 'livestream',
    title: 'Livestream',
    icon: <ToolOutlined />,
    path: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.livestream,
  },
  {
    order: 5,
    key: 'public_page',
    title: 'Public Page',
    icon: <GlobalOutlined />,
    path: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.profile,
  },
  {
    order: 6,
    key: 'get_paid',
    title: 'Get Paid',
    icon: <DollarOutlined />,
    path: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.paymentAccount,
  },
  // {
  //   order: 7,
  //   key: 'account',
  //   title: 'Account',
  //   icon: <UserOutlined />,
  // },
];

export const attendeeMenuItems = [
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
        path: Routes.attendeeDashboard.rootPath + '/sessions/upcoming',
      },
      {
        order: 2,
        key: 'past_sessions',
        title: 'Past Sessions',
        path: Routes.attendeeDashboard.rootPath + '/sessions/past',
      },
    ],
  },
  // {
  //   order: 3,
  //   key: 'packages',
  //   title: 'Packages',
  //   icon: <ControlOutlined />,
  // },
  // {
  //   order: 7,
  //   key: 'account',
  //   title: 'Account',
  //   icon: <UserOutlined />,
  // },
];
