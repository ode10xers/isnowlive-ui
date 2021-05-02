import React from 'react';
import { Button } from 'antd';
import {
  TagsOutlined,
  VideoCameraOutlined,
  ToolOutlined,
  DollarOutlined,
  GlobalOutlined,
  PlayCircleOutlined,
  BookOutlined,
  SettingOutlined,
  ScheduleOutlined,
  PercentageOutlined,
  AuditOutlined,
  FilePdfOutlined,
  Html5Outlined,
  TeamOutlined,
  ControlOutlined,
} from '@ant-design/icons';
import Routes from 'routes';
import { mixPanelEventTags } from 'services/integrations/mixpanel';

const { creator, attendee } = mixPanelEventTags;

export const creatorMenuItems = [
  {
    order: 1,
    key: 'create_session_cta',
    title: (
      <Button block type="primary">
        Create a Session
      </Button>
    ),
    is_button: true,
    historyData: {
      route: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.createSessions,
      state: undefined,
    },
  },
  {
    order: 2,
    key: 'upload_video_cta',
    title: (
      <Button block type="primary">
        Add a Video
      </Button>
    ),
    is_button: true,
    historyData: {
      route: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.videos,
      state: { onboarding: true },
    },
  },
  {
    order: 3,
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
    order: 4,
    is_button: false,
    key: 'passes',
    title: 'Pass',
    mixPanelTag: creator.click.dashboard.passesNav,
    icon: <TagsOutlined />,
    path: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.passes,
  },
  {
    order: 5,
    is_button: false,
    key: 'videos',
    title: 'Videos',
    icon: <PlayCircleOutlined />,
    mixPanelTag: creator.click.dashboard.videosNav,
    path: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.videos,
  },
  {
    order: 6,
    is_button: false,
    key: 'courses',
    title: 'Courses',
    icon: <BookOutlined />,
    mixPanelTag: creator.click.dashboard.coursesNav,
    path: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.courses,
  },
  {
    order: 7,
    key: 'subscriptions',
    title: 'Membership',
    icon: <ScheduleOutlined />,
    mixPanelTag: creator.click.dashboard.coursesNav,
    path: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.subscriptions,
  },
  {
    order: 8,
    is_button: false,
    key: 'coupons',
    title: 'Coupons',
    icon: <PercentageOutlined />,
    mixPanelTag: creator.click.dashboard.couponsNav,
    path: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.coupons,
  },
  {
    order: 9,
    key: 'members',
    title: 'Members Dashboard',
    icon: <TeamOutlined />,
    children: [
      {
        order: 1,
        key: 'members_list',
        title: 'Members List',
        mixPanelTag: creator.click.dashboard.membersListNav,
        path: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.membersList,
      },
    ],
  },
  {
    order: 10,
    is_button: false,
    key: 'livestream',
    title: 'Livestream',
    icon: <ToolOutlined />,
    mixPanelTag: creator.click.dashboard.livestreamNav,
    path: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.livestream,
  },
  {
    order: 11,
    is_button: false,
    key: 'public_page',
    title: 'Public Page',
    icon: <GlobalOutlined />,
    mixPanelTag: creator.click.dashboard.profileNav,
    path: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.profile,
  },
  {
    order: 12,
    is_button: false,
    key: 'get_paid',
    title: 'Get Paid',
    icon: <DollarOutlined />,
    mixPanelTag: creator.click.dashboard.paymentNav,
    path: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.paymentAccount,
  },
  {
    order: 13,
    key: 'site_settings',
    title: 'Site Settings',
    icon: <SettingOutlined />,
    children: [
      {
        order: 1,
        key: 'account_settings',
        title: 'Account Settings',
        mixPanelTag: creator.click.dashboard.accountNav,
        path: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.accountSettings,
      },
      {
        order: 2,
        key: 'legals_settings',
        title: 'Waiver and Policies',
        mixPanelTag: creator.click.dashboard.legalNav,
        path: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.legals,
      },
    ],
  },
  {
    order: 14,
    is_button: false,
    key: 'external_site_setting',
    title: 'External Site Settings',
    icon: <Html5Outlined />,
    mixPanelTag: creator.click.dashboard.externalSiteSettingsNav,
    path: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.externalSiteSettings,
  },
  {
    order: 15,
    is_button: false,
    key: 'documents',
    title: 'Document Drive',
    icon: <FilePdfOutlined />,
    mixPanelTag: creator.click.dashboard.documentsNav,
    path: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.documents,
  },
  {
    order: 16,
    is_button: false,
    key: 'newsletter',
    title: 'Newsletter',
    icon: <AuditOutlined />,
    mixPanelTag: creator.click.dashboard.newsletterNav,
    path: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.newsletter,
  },
  {
    order: 17,
    key: 'advanced_settings',
    title: 'Advanced Settings',
    icon: <ControlOutlined />,
    children: [
      {
        order: 1,
        key: 'members_settings',
        title: 'Make site private',
        mixPanelTag: creator.click.dashboard.membersSettingsNav,
        path: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.membersSettings,
      },
      {
        order: 2,
        key: 'members_tags',
        title: 'Members Tags',
        mixPanelTag: creator.click.dashboard.membersTagsNav,
        path: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.membersTags,
      },
    ],
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
  {
    order: 5,
    key: 'subscription',
    title: 'Memberships',
    icon: <ScheduleOutlined />,
    mixPanelTag: attendee.click.dashboard.subscriptionsNav,
    path: Routes.attendeeDashboard.rootPath + Routes.attendeeDashboard.subscriptions,
  },
];
