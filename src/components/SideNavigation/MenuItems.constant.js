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
} from '@ant-design/icons';
import Routes from 'routes';
import { mixPanelEventTags } from 'services/integrations/mixpanel';
import { i18n } from 'utils/i18n';

const { creator, attendee } = mixPanelEventTags;

export const creatorMenuItems = [
  {
    order: 1,
    key: 'sessions',
    title: i18n.t('SESSIONS'),
    icon: <VideoCameraOutlined />,
    children: [
      {
        order: 1,
        key: 'upcoming_sessions',
        title: i18n.t('UPCOMING_SESSIONS'),
        mixPanelTag: creator.click.dashboard.upcomingSessions,
        path: Routes.creatorDashboard.rootPath + '/sessions/upcoming',
      },
      {
        order: 2,
        key: 'past_sessions',
        title: i18n.t('PAST_SESSIONS'),
        mixPanelTag: creator.click.dashboard.pastSessions,
        path: Routes.creatorDashboard.rootPath + '/sessions/past',
      },
      {
        order: 3,
        key: 'manage_sessions',
        title: i18n.t('MANAGE_SESSIONS'),
        mixPanelTag: creator.click.dashboard.manageSessions,
        path: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.manageSessions,
      },
      {
        order: 4,
        key: 'create_session',
        title: i18n.t('CREATE_SESSION'),
        mixPanelTag: creator.click.dashboard.createSession,
        path: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.createSessions,
      },
    ],
  },
  {
    order: 3,
    key: 'passes',
    title: i18n.t('PASS'),
    mixPanelTag: creator.click.dashboard.passesNav,
    icon: <TagsOutlined />,
    path: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.passes,
  },
  {
    order: 4,
    key: 'videos',
    title: i18n.t('VIDEOS'),
    icon: <PlayCircleOutlined />,
    mixPanelTag: creator.click.dashboard.videosNav,
    path: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.videos,
  },
  {
    order: 5,
    key: 'courses',
    title: i18n.t('COURSES'),
    icon: <BookOutlined />,
    mixPanelTag: creator.click.dashboard.coursesNav,
    path: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.courses,
  },
  {
    order: 6,
    key: 'coupons',
    title: i18n.t('COUPONS'),
    icon: <PercentageOutlined />,
    mixPanelTag: creator.click.dashboard.couponsNav,
    path: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.coupons,
  },
  {
    order: 7,
    key: 'livestream',
    title: i18n.t('LIVESTREAM'),
    icon: <ToolOutlined />,
    mixPanelTag: creator.click.dashboard.livestreamNav,
    path: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.livestream,
  },
  {
    order: 8,
    key: 'public_page',
    title: i18n.t('PUBLIC_PAGE'),
    icon: <GlobalOutlined />,
    mixPanelTag: creator.click.dashboard.profileNav,
    path: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.profile,
  },
  {
    order: 9,
    key: 'get_paid',
    title: i18n.t('GET_PAID'),
    icon: <DollarOutlined />,
    mixPanelTag: creator.click.dashboard.paymentNav,
    path: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.paymentAccount,
  },
  {
    order: 10,
    key: 'account_settings',
    title: i18n.t('ACCOUNT_SETTINGS'),
    icon: <SettingOutlined />,
    mixPanelTag: creator.click.dashboard.settingsNav,
    path: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.accountSettings,
  },
];

export const attendeeMenuItems = [
  {
    order: 1,
    key: 'sessions',
    title: i18n.t('SESSIONS'),
    icon: <VideoCameraOutlined />,
    children: [
      {
        order: 1,
        key: 'upcoming_sessions',
        title: i18n.t('UPCOMING_SESSIONS'),
        mixPanelTag: attendee.click.dashboard.upcomingSession,
        path: Routes.attendeeDashboard.rootPath + '/sessions/upcoming',
      },
      {
        order: 2,
        key: 'past_sessions',
        title: i18n.t('PAST_SESSIONS'),
        mixPanelTag: attendee.click.dashboard.pastSessions,
        path: Routes.attendeeDashboard.rootPath + '/sessions/past',
      },
    ],
  },
  {
    order: 3,
    key: 'Passes',
    title: i18n.t('PASSES'),
    mixPanelTag: attendee.click.dashboard.passesNav,
    icon: <TagsOutlined />,
    path: Routes.attendeeDashboard.rootPath + Routes.attendeeDashboard.passes,
  },
  {
    order: 4,
    key: 'videos',
    title: i18n.t('VIDEOS'),
    icon: <PlayCircleOutlined />,
    mixPanelTag: attendee.click.dashboard.videosNav,
    path: Routes.attendeeDashboard.rootPath + Routes.attendeeDashboard.videos,
  },
  {
    order: 5,
    key: 'courses',
    title: i18n.t('COURSES'),
    icon: <BookOutlined />,
    mixPanelTag: attendee.click.dashboard.coursesNav,
    path: Routes.attendeeDashboard.rootPath + Routes.attendeeDashboard.courses,
  },
];
