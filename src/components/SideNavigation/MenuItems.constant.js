import React from 'react';
import { Button } from 'antd';
import {
  TagsOutlined,
  VideoCameraOutlined,
  ToolOutlined,
  DollarOutlined,
  PlayCircleOutlined,
  BookOutlined,
  ScheduleOutlined,
  AuditOutlined,
  FilePdfOutlined,
  Html5Outlined,
  TeamOutlined,
  ControlOutlined,
  PartitionOutlined,
  GlobalOutlined,
  AppstoreOutlined,
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
      // {
      //   order: 4,
      //   key: 'create_session',
      //   title: 'Create Session',
      //   mixPanelTag: creator.click.dashboard.createSession,
      //   path: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.createSessions,
      // },
    ],
  },
  {
    order: 4,
    is_button: false,
    key: 'video_library',
    title: 'Video Library',
    icon: <PlayCircleOutlined />,
    mixPanelTag: creator.click.dashboard.videosNav,
    path: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.videos,
  },
  {
    order: 5,
    is_button: false,
    key: 'passes_and_courses',
    title: 'Passes and Courses',
    icon: <TagsOutlined />,
    children: [
      {
        order: 1,
        key: 'passes',
        title: 'Pass',
        mixPanelTag: creator.click.dashboard.passesNav,
        path: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.passes,
      },
      {
        order: 2,
        key: 'courses',
        title: 'Courses',
        mixPanelTag: creator.click.dashboard.coursesNav,
        path: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.courses,
      },
    ],
  },
  {
    order: 6,
    is_button: false,
    key: 'subscriptions',
    title: 'Membership Subscriptions',
    icon: <ScheduleOutlined />,
    mixPanelTag: creator.click.dashboard.coursesNav,
    path: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.subscriptions,
  },
  {
    order: 7,
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
    order: 8,
    key: 'passion_site',
    title: 'Your Passion Site',
    icon: <GlobalOutlined />,
    children: [
      {
        order: 1,
        key: 'your_site',
        title: 'Your Site',
        mixPanelTag: creator.click.dashboard.profileNav,
        path: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.profile,
      },
      {
        order: 2,
        key: 'livestream',
        title: 'Livestream',
        mixPanelTag: creator.click.dashboard.livestreamNav,
        path: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.livestream,
      },
      {
        order: 3,
        key: 'account_settings',
        title: 'Account Settings',
        mixPanelTag: creator.click.dashboard.accountNav,
        path: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.accountSettings,
      },
      {
        order: 4,
        key: 'legals_settings',
        title: 'Waiver and Policies',
        mixPanelTag: creator.click.dashboard.legalNav,
        path: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.legals,
      },
    ],
  },
  {
    order: 9,
    is_button: false,
    key: 'get_paid',
    title: 'Get Paid',
    icon: <DollarOutlined />,
    mixPanelTag: creator.click.dashboard.paymentNav,
    path: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.paymentAccount,
  },
  {
    order: 10,
    is_button: false,
    key: 'business_tools',
    title: 'Business Tools',
    icon: <ToolOutlined />,
    children: [
      {
        order: 1,
        key: 'coupons',
        title: 'Coupons',
        mixPanelTag: creator.click.dashboard.couponsNav,
        path: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.coupons,
      },
      {
        order: 2,
        key: 'referrals',
        title: 'Referral Dashboard',
        mixPanelTag: creator.click.dashboard.referralNav,
        path: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.referral,
      },
    ],
  },
  {
    order: 11,
    is_button: false,
    key: 'documents',
    title: 'Document Drive',
    icon: <FilePdfOutlined />,
    mixPanelTag: creator.click.dashboard.documentsNav,
    path: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.documents,
  },
  {
    order: 12,
    is_button: false,
    key: 'newsletter',
    title: 'Newsletter',
    icon: <AuditOutlined />,
    children: [
      {
        order: 1,
        key: 'audience_list',
        title: 'Audience List',
        mixPanelTag: creator.click.dashboard.audienceListNav,
        path: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.audiences,
      },
      {
        order: 2,
        key: 'email_templates',
        title: 'Email Templates',
        mixPanelTag: creator.click.dashboard.emailTemplatesNav,
        path: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.emailTemplates,
      },
    ],
  },
  {
    order: 13,
    is_button: false,
    key: 'external_site_setting',
    title: 'External Site Settings',
    icon: <Html5Outlined />,
    children: [
      {
        order: 1,
        key: 'plugins',
        title: 'Add to your website',
        mixPanelTag: creator.click.dashboard.pluginsNav,
        path: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.plugins,
      },
      {
        order: 2,
        key: 'domains',
        title: 'Custom Domain',
        mixPanelTag: creator.click.dashboard.domainsNav,
        path: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.domains,
      },
    ],
  },
  {
    order: 14,
    key: 'advanced_features',
    title: 'Advanced Features',
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
  {
    order: 15,
    is_button: false,
    key: 'affiliates',
    title: 'Affiliates Dashboard',
    icon: <PartitionOutlined />,
    mixPanelTag: creator.click.dashboard.affiliateNav,
    path: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.affiliates,
  },
];

export const attendeeMenuItems = [
  {
    order: 0,
    key: 'dashboard',
    title: 'Dashboard',
    icon: <AppstoreOutlined />,
    mixPanelTag: attendee.click.dashboard.dashboardNav,
    path: Routes.attendeeDashboard.rootPath + Routes.attendeeDashboard.dashboardPage,
  },
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
    order: 6,
    key: 'subscription',
    title: 'Membership Subscriptions',
    icon: <ScheduleOutlined />,
    mixPanelTag: attendee.click.dashboard.subscriptionsNav,
    path: Routes.attendeeDashboard.rootPath + Routes.attendeeDashboard.subscriptions,
  },
  {
    order: 7,
    key: 'referrals',
    title: 'Referrals',
    icon: <PartitionOutlined />,
    mixPanelTag: attendee.click.dashboard.referralsNav,
    path: Routes.attendeeDashboard.rootPath + Routes.attendeeDashboard.referrals,
  },
];
