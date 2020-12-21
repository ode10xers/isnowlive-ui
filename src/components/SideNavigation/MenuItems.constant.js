import React from 'react';
import {
  // ControlOutlined,
  // TeamOutlined,
  // UserOutlined,
  VideoCameraOutlined,
  ToolOutlined,
  DollarOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import Routes from 'routes';
import { mixPanelEventTags } from 'services/integrations/mixpanel';

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
        mixPanelTag: mixPanelEventTags.creator.click.dashboard.upcomingSessions,
        path: Routes.creatorDashboard.rootPath + '/sessions/upcoming',
      },
      {
        order: 2,
        key: 'past_sessions',
        title: 'Past Sessions',
        mixPanelTag: mixPanelEventTags.creator.click.dashboard.pastSessions,
        path: Routes.creatorDashboard.rootPath + '/sessions/past',
      },
      {
        order: 3,
        key: 'manage_sessions',
        title: 'Manage Sessions',
        mixPanelTag: mixPanelEventTags.creator.click.dashboard.manageSessions,
        path: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.manageSessions,
      },
      {
        order: 4,
        key: 'create_session',
        title: 'Create Session',
        mixPanelTag: mixPanelEventTags.creator.click.dashboard.createSession,
        path: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.createSessions,
      },
    ],
  },
  // {
  //   order: 2,
  //   key: 'attendees',
  //   title: 'Attendees',
  //   mixPanelTag: mixPanelEventTags.creator.click.dashboard.attendeeNav,
  //   icon: <TeamOutlined />,
  // },
  // {
  //   order: 3,
  //   key: 'packages',
  //   title: 'Packages',
  //   mixPanelTag: mixPanelEventTags.creator.click.dashboard.packagesNav,
  //   icon: <ControlOutlined />,
  // },
  {
    order: 4,
    key: 'livestream',
    title: 'Livestream',
    icon: <ToolOutlined />,
    mixPanelTag: mixPanelEventTags.creator.click.dashboard.livestreamNav,
    path: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.livestream,
  },
  {
    order: 5,
    key: 'public_page',
    title: 'Public Page',
    icon: <GlobalOutlined />,
    mixPanelTag: mixPanelEventTags.creator.click.dashboard.profileNav,
    path: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.profile,
  },
  {
    order: 6,
    key: 'get_paid',
    title: 'Get Paid',
    icon: <DollarOutlined />,
    mixPanelTag: mixPanelEventTags.creator.click.dashboard.paymentNav,
    path: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.paymentAccount,
  },
  // {
  //   order: 7,
  //   key: 'account',
  //   title: 'Account',
  //   mixPanelTag: mixPanelEventTags.creator.click.dashboard.accountNav,
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
        mixPanelTag: mixPanelEventTags.attendee.click.dashboard.upcomingSession,
        path: Routes.attendeeDashboard.rootPath + '/sessions/upcoming',
      },
      {
        order: 2,
        key: 'past_sessions',
        title: 'Past Sessions',
        mixPanelTag: mixPanelEventTags.attendee.click.dashboard.pastSessions,
        path: Routes.attendeeDashboard.rootPath + '/sessions/past',
      },
    ],
  },
  // {
  //   order: 3,
  //   key: 'packages',
  //   title: 'Packages',
  //   mixPanelTag: mixPanelEventTags.attendee.click.dsahboard.packagesNav,
  //   icon: <ControlOutlined />,
  // },
  // {
  //   order: 7,
  //   key: 'account',
  //   title: 'Account',
  //   mixPanelTag: mixPanelEventTags.attendee.click.dsahboard.accountNav,
  //   icon: <UserOutlined />,
  // },
];
