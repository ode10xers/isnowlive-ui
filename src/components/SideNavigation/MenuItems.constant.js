import React from 'react';
import { Button } from 'antd';
import {
  AppstoreOutlined,
  AuditOutlined,
  BookOutlined,
  ClockCircleOutlined,
  ControlOutlined,
  DollarOutlined,
  FilePdfOutlined,
  GlobalOutlined,
  Html5Outlined,
  PartitionOutlined,
  PlayCircleOutlined,
  ScheduleOutlined,
  TagsOutlined,
  TeamOutlined,
  ToolOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import Routes from 'routes';
import { mixPanelEventTags } from 'services/integrations/mixpanel';

const { creator, attendee } = mixPanelEventTags;

/**
 * @param {number} start
 * @returns {(item: T, index: number) => T & { order: number }}
 */
const attachOrderProperty = (start) => (elem, index) => ({ ...elem, order: index + start });

/**
 * @param {string} textProperty
 * @returns {(item: T) => T & { key: string }}
 */
const attachGeneratedKeyProperty = (textProperty) => (elem) => ({
  ...elem,
  key: elem[textProperty].replace(/\s/g, '_').toLowerCase(),
});

export const creatorMenuItems = [
  {
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
    key: 'create_availability_cta',
    title: (
      <Button block type="primary">
        Create an Availability
      </Button>
    ),
    is_button: true,
    historyData: {
      route: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.createAvailabilities,
      state: undefined,
    },
  },
  {
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
    key: 'sessions',
    title: 'Sessions',
    icon: <VideoCameraOutlined />,
    children: [
      {
        title: 'Upcoming Sessions',
        mixPanelTag: creator.click.dashboard.upcomingSessions,
        path: Routes.creatorDashboard.rootPath + '/sessions/upcoming',
      },
      {
        title: 'Past Sessions',
        mixPanelTag: creator.click.dashboard.pastSessions,
        path: Routes.creatorDashboard.rootPath + '/sessions/past',
      },
      {
        title: 'Manage Sessions',
        mixPanelTag: creator.click.dashboard.manageSessions,
        path: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.manageSessions,
      },
    ]
      .map(attachOrderProperty(1))
      .map(attachGeneratedKeyProperty('title')),
  },
  {
    key: 'availabilities',
    title: 'Private Appointments',
    icon: <ClockCircleOutlined />,
    children: [
      {
        title: 'Upcoming Appointments',
        mixPanelTag: creator.click.dashboard.upcomingAvailabilities,
        path: Routes.creatorDashboard.rootPath + '/availabilities/upcoming',
      },
      {
        title: 'Past Appointments',
        mixPanelTag: creator.click.dashboard.pastAvailabilities,
        path: Routes.creatorDashboard.rootPath + '/availabilities/past',
      },
      {
        title: 'Manage Availability',
        mixPanelTag: creator.click.dashboard.manageSessions,
        path: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.manageAvailabilities,
      },
    ]
      .map(attachOrderProperty(1))
      .map(attachGeneratedKeyProperty('title')),
  },
  {
    is_button: false,
    key: 'video_library',
    title: 'Video Library',
    icon: <PlayCircleOutlined />,
    mixPanelTag: creator.click.dashboard.videosNav,
    path: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.videos,
  },
  {
    is_button: false,
    key: 'passes_and_courses',
    title: 'Passes and Courses',
    icon: <TagsOutlined />,
    children: [
      {
        title: 'Pass',
        mixPanelTag: creator.click.dashboard.passesNav,
        path: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.passes,
      },
      {
        title: 'Courses',
        mixPanelTag: creator.click.dashboard.coursesNav,
        path: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.courses,
      },
    ]
      .map(attachOrderProperty(1))
      .map(attachGeneratedKeyProperty('title')),
  },
  {
    is_button: false,
    key: 'subscriptions',
    title: 'Membership Subscriptions',
    icon: <ScheduleOutlined />,
    mixPanelTag: creator.click.dashboard.coursesNav,
    path: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.subscriptions,
  },
  {
    key: 'members',
    title: 'Members Dashboard',
    icon: <TeamOutlined />,
    children: [
      {
        title: 'Members List',
        mixPanelTag: creator.click.dashboard.membersListNav,
        path: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.membersList,
      },
    ]
      .map(attachOrderProperty(1))
      .map(attachGeneratedKeyProperty('title')),
  },
  {
    key: 'passion_site',
    title: 'Your Passion Site',
    icon: <GlobalOutlined />,
    children: [
      {
        title: 'Your Site',
        mixPanelTag: creator.click.dashboard.profileNav,
        path: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.profile,
      },
      {
        title: 'Custom Pages',
        mixPanelTag: creator.click.dashboard.pagesNav,
        path: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.pages,
      },
      {
        title: 'Livestream',
        mixPanelTag: creator.click.dashboard.livestreamNav,
        path: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.livestream,
      },
      {
        title: 'Account Settings',
        mixPanelTag: creator.click.dashboard.accountNav,
        path: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.accountSettings,
      },
      {
        title: 'Waiver and Policies',
        mixPanelTag: creator.click.dashboard.legalNav,
        path: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.legals,
      },
    ]
      .map(attachOrderProperty(1))
      .map(attachGeneratedKeyProperty('title')),
  },
  {
    is_button: false,
    key: 'get_paid',
    title: 'Get Paid',
    icon: <DollarOutlined />,
    mixPanelTag: creator.click.dashboard.paymentNav,
    path: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.paymentAccount,
  },
  {
    is_button: false,
    key: 'business_tools',
    title: 'Business Tools',
    icon: <ToolOutlined />,
    children: [
      {
        title: 'Coupons',
        mixPanelTag: creator.click.dashboard.couponsNav,
        path: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.coupons,
      },
      {
        title: 'Referral Dashboard',
        mixPanelTag: creator.click.dashboard.referralNav,
        path: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.referral,
      },
    ]
      .map(attachOrderProperty(1))
      .map(attachGeneratedKeyProperty('title')),
  },
  {
    is_button: false,
    key: 'documents',
    title: 'Document Drive',
    icon: <FilePdfOutlined />,
    mixPanelTag: creator.click.dashboard.documentsNav,
    path: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.documents,
  },
  {
    is_button: false,
    key: 'newsletter',
    title: 'Newsletter',
    icon: <AuditOutlined />,
    children: [
      {
        title: 'Audience List',
        mixPanelTag: creator.click.dashboard.audienceListNav,
        path: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.audiences,
      },
      {
        title: 'Email Templates',
        mixPanelTag: creator.click.dashboard.emailTemplatesNav,
        path: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.emailTemplates,
      },
    ]
      .map(attachOrderProperty(1))
      .map(attachGeneratedKeyProperty('title')),
  },
  {
    is_button: false,
    key: 'external_site_setting',
    title: 'External Site Settings',
    icon: <Html5Outlined />,
    children: [
      {
        title: 'Add to your website',
        mixPanelTag: creator.click.dashboard.pluginsNav,
        path: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.plugins,
      },
      {
        title: 'Custom Domain',
        mixPanelTag: creator.click.dashboard.domainsNav,
        path: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.domains,
      },
    ]
      .map(attachOrderProperty(1))
      .map(attachGeneratedKeyProperty('title')),
  },
  {
    key: 'advanced_features',
    title: 'Advanced Features',
    icon: <ControlOutlined />,
    children: [
      {
        title: 'Make site private',
        mixPanelTag: creator.click.dashboard.membersSettingsNav,
        path: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.membersSettings,
      },
      {
        title: 'Members Tags',
        mixPanelTag: creator.click.dashboard.membersTagsNav,
        path: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.membersTags,
      },
    ]
      .map(attachOrderProperty(1))
      .map(attachGeneratedKeyProperty('title')),
  },
  {
    is_button: false,
    key: 'affiliates',
    title: 'Affiliates Dashboard',
    icon: <PartitionOutlined />,
    mixPanelTag: creator.click.dashboard.affiliateNav,
    path: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.affiliates,
  },
].map(attachOrderProperty(1));

export const attendeeMenuItems = [
  {
    title: 'Dashboard',
    icon: <AppstoreOutlined />,
    mixPanelTag: attendee.click.dashboard.dashboardNav,
    path: Routes.attendeeDashboard.rootPath + Routes.attendeeDashboard.dashboardPage,
  },
  {
    title: 'Sessions',
    icon: <VideoCameraOutlined />,
    children: [
      {
        title: 'Upcoming Sessions',
        mixPanelTag: attendee.click.dashboard.upcomingSession,
        path: Routes.attendeeDashboard.rootPath + '/sessions/upcoming',
      },
      {
        title: 'Past Sessions',
        mixPanelTag: attendee.click.dashboard.pastSessions,
        path: Routes.attendeeDashboard.rootPath + '/sessions/past',
      },
    ]
      .map(attachOrderProperty(1))
      .map(attachGeneratedKeyProperty('title')),
  },
  {
    title: 'Passes',
    mixPanelTag: attendee.click.dashboard.passesNav,
    icon: <TagsOutlined />,
    path: Routes.attendeeDashboard.rootPath + Routes.attendeeDashboard.passes,
  },
  {
    title: 'Videos',
    icon: <PlayCircleOutlined />,
    mixPanelTag: attendee.click.dashboard.videosNav,
    path: Routes.attendeeDashboard.rootPath + Routes.attendeeDashboard.videos,
  },
  {
    title: 'Courses',
    icon: <BookOutlined />,
    mixPanelTag: attendee.click.dashboard.coursesNav,
    path: Routes.attendeeDashboard.rootPath + Routes.attendeeDashboard.courses,
  },
  {
    title: 'Membership Subscriptions',
    icon: <ScheduleOutlined />,
    mixPanelTag: attendee.click.dashboard.subscriptionsNav,
    path: Routes.attendeeDashboard.rootPath + Routes.attendeeDashboard.subscriptions,
  },
  {
    title: 'Referrals',
    icon: <PartitionOutlined />,
    mixPanelTag: attendee.click.dashboard.referralsNav,
    path: Routes.attendeeDashboard.rootPath + Routes.attendeeDashboard.referrals,
  },
]
  .map(attachOrderProperty(0))
  .map(attachGeneratedKeyProperty('title'));
