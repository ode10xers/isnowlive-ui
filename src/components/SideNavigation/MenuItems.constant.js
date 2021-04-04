import React from 'react';
import {
  TagsOutlined,
  VideoCameraOutlined,
  ToolOutlined,
  DollarOutlined,
  GlobalOutlined,
  PlayCircleOutlined,
  BookOutlined,
  SettingOutlined,
  PercentageOutlined,
  Html5Outlined,
} from '@ant-design/icons';
import Routes from 'routes';
import { mixPanelEventTags } from 'services/integrations/mixpanel';

const { creator, attendee } = mixPanelEventTags;

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
        mixPanelTag: creator.click.dashboard.upcomingSessions,
        path: Routes.creatorDashboard.rootPath + '/sessions/upcoming',
      },
      {
        order: 2,
        key: 'past_sessions',
        title: 'Past Sessions',
        mixPanelTag: creator.click.dashboard.pastSessions,
        path: Routes.creatorDashboard.rootPath + '/sessions/past',
      },
      {
        order: 3,
        key: 'manage_sessions',
        title: 'Manage Sessions',
        mixPanelTag: creator.click.dashboard.manageSessions,
        path: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.manageSessions,
      },
      {
        order: 4,
        key: 'create_session',
        title: 'Create Session',
        mixPanelTag: creator.click.dashboard.createSession,
        path: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.createSessions,
      },
    ],
  },
  {
    order: 3,
    key: 'passes',
    title: 'Pass',
    mixPanelTag: creator.click.dashboard.passesNav,
    icon: <TagsOutlined />,
    path: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.passes,
  },
  {
    order: 4,
    key: 'videos',
    title: 'Videos',
    icon: <PlayCircleOutlined />,
    mixPanelTag: creator.click.dashboard.videosNav,
    path: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.videos,
  },
  {
    order: 5,
    key: 'courses',
    title: 'Courses',
    icon: <BookOutlined />,
    mixPanelTag: creator.click.dashboard.coursesNav,
    path: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.courses,
  },
  {
    order: 6,
    key: 'coupons',
    title: 'Coupons',
    icon: <PercentageOutlined />,
    mixPanelTag: creator.click.dashboard.couponsNav,
    path: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.coupons,
  },
  {
    order: 7,
    key: 'livestream',
    title: 'Livestream',
    icon: <ToolOutlined />,
    mixPanelTag: creator.click.dashboard.livestreamNav,
    path: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.livestream,
  },
  {
    order: 8,
    key: 'public_page',
    title: 'Public Page',
    icon: <GlobalOutlined />,
    mixPanelTag: creator.click.dashboard.profileNav,
    path: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.profile,
  },
  {
    order: 9,
    key: 'get_paid',
    title: 'Get Paid',
    icon: <DollarOutlined />,
    mixPanelTag: creator.click.dashboard.paymentNav,
    path: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.paymentAccount,
  },
  {
    order: 10,
    key: 'account_settings',
    title: 'Account Settings',
    icon: <SettingOutlined />,
    mixPanelTag: creator.click.dashboard.settingsNav,
    path: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.accountSettings,
  },
  {
    order: 11,
    key: 'external_site_setting',
    title: 'External Site Settings',
    icon: <Html5Outlined />,
    mixPanelTag: creator.click.dashboard.externalSiteSettingsNav,
    path: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.externalSiteSettings,
  },
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
        mixPanelTag: attendee.click.dashboard.upcomingSession,
        path: Routes.attendeeDashboard.rootPath + '/sessions/upcoming',
      },
      {
        order: 2,
        key: 'past_sessions',
        title: 'Past Sessions',
        mixPanelTag: attendee.click.dashboard.pastSessions,
        path: Routes.attendeeDashboard.rootPath + '/sessions/past',
      },
    ],
  },
  {
    order: 3,
    key: 'Passes',
    title: 'Passes',
    mixPanelTag: attendee.click.dashboard.passesNav,
    icon: <TagsOutlined />,
    path: Routes.attendeeDashboard.rootPath + Routes.attendeeDashboard.passes,
  },
  {
    order: 4,
    key: 'videos',
    title: 'Videos',
    icon: <PlayCircleOutlined />,
    mixPanelTag: attendee.click.dashboard.videosNav,
    path: Routes.attendeeDashboard.rootPath + Routes.attendeeDashboard.videos,
  },
  {
    order: 5,
    key: 'courses',
    title: 'Courses',
    icon: <BookOutlined />,
    mixPanelTag: attendee.click.dashboard.coursesNav,
    path: Routes.attendeeDashboard.rootPath + Routes.attendeeDashboard.courses,
  },
];
