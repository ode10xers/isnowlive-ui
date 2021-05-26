import React from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';
import Routes from 'routes';

import SessionsInventories from 'pages/CreatorDashboard/SessionsInventories';
import SessionsDetails from 'pages/CreatorDashboard/SessionsDetails';
import ManageSessions from 'pages/CreatorDashboard/ManageSessions';
import Session from 'pages/Session';
import Profile from 'pages/Profile';
import ProfilePreview from 'pages/ProfilePreview';
import LiveStream from 'pages/LiveStream';
import ClassPassList from 'pages/CreatorDashboard/ClassPassList';
import PaymentAccount from 'pages/CreatorDashboard/PaymentAccount';
import EarningDetails from 'pages/CreatorDashboard/EarningDetails';
import Videos from 'pages/CreatorDashboard/Videos';
import Courses from 'pages/CreatorDashboard/Courses';
import Subscriptions from 'pages/CreatorDashboard/Subscriptions';
import Coupons from 'pages/CreatorDashboard/Coupons';
import Audiences from 'pages/CreatorDashboard/Newsletter/Audiences';
import EmailTemplates from 'pages/CreatorDashboard/Newsletter/EmailTemplates';
import AccountSettings from 'pages/CreatorDashboard/SiteSettings/AccountSettings';
import Legals from 'pages/CreatorDashboard/SiteSettings/Legals';
import Documents from 'pages/CreatorDashboard/Documents';
import Plugins from 'pages/CreatorDashboard/ExternalSiteSettings/Plugins';
import CustomDomain from 'pages/CreatorDashboard/ExternalSiteSettings/CustomDomain';
import MembersList from 'pages/CreatorDashboard/Members/MembersList';
import MembersTags from 'pages/CreatorDashboard/AdvancedSettings/MembersTags';
import MemberSettings from 'pages/CreatorDashboard/AdvancedSettings/MembersSettings';
import Referral from 'pages/CreatorDashboard/Referral';

const CreatorDashboard = ({ match }) => {
  return (
    <Switch>
      <Route exact path={match.url + Routes.creatorDashboard.sessions} component={SessionsInventories} />
      <Route exact path={match.url + Routes.creatorDashboard.sessionsDetails} component={SessionsDetails} />
      <Route exact path={match.url + Routes.creatorDashboard.manageSessions} component={ManageSessions} />
      <Route exact path={match.url + Routes.creatorDashboard.createSessions} component={Session} />
      <Route exact path={match.url + Routes.creatorDashboard.updateSessions} component={Session} />
      <Route exact path={match.url + Routes.creatorDashboard.profile} component={ProfilePreview} />
      <Route exact path={match.url + Routes.creatorDashboard.editProfile} component={Profile} />
      <Route exact path={match.url + Routes.creatorDashboard.livestream} component={LiveStream} />
      <Route exact path={match.url + Routes.creatorDashboard.paymentAccount} component={PaymentAccount} />
      <Route exact path={match.url + Routes.creatorDashboard.earningDetails} component={EarningDetails} />
      <Route exact path={match.url + Routes.creatorDashboard.passes} component={ClassPassList} />
      <Route exact path={match.url + Routes.creatorDashboard.videos} component={Videos} />
      <Route exact path={match.url + Routes.creatorDashboard.courses} component={Courses} />
      <Route exact path={match.url + Routes.creatorDashboard.subscriptions} component={Subscriptions} />
      <Route exact path={match.url + Routes.creatorDashboard.coupons} component={Coupons} />
      <Route exact path={match.url + Routes.creatorDashboard.accountSettings} component={AccountSettings} />
      <Route exact path={match.url + Routes.creatorDashboard.audiences} component={Audiences} />
      <Route exact path={match.url + Routes.creatorDashboard.emailTemplates} component={EmailTemplates} />
      <Route exact path={match.url + Routes.creatorDashboard.legals} component={Legals} />
      <Route exact path={match.url + Routes.creatorDashboard.documents} component={Documents} />
      <Route exact path={match.url + Routes.creatorDashboard.membersList} component={MembersList} />
      <Route exact path={match.url + Routes.creatorDashboard.plugins} component={Plugins} />
      <Route exact path={match.url + Routes.creatorDashboard.domains} component={CustomDomain} />
      <Route exact path={match.url + Routes.creatorDashboard.membersList} component={MembersList} />
      <Route exact path={match.url + Routes.creatorDashboard.membersTags} component={MembersTags} />
      <Route exact path={match.url + Routes.creatorDashboard.membersSettings} component={MemberSettings} />
      <Route exact path={match.url + Routes.creatorDashboard.referral} component={Referral} />
      <Redirect to={match.url + Routes.creatorDashboard.defaultPath} />
    </Switch>
  );
};

export default CreatorDashboard;
