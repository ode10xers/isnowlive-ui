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
import PaymentAccount from 'pages/CreatorDashboard/PaymentAccount';
import SessionEarnings from 'pages/CreatorDashboard/SessionEarnings';
import ClassPassList from 'pages/CreatorDashboard/ClassPassList';
import PassEarnings from 'pages/CreatorDashboard/PassEarnings';
import VideoEarnings from 'pages/CreatorDashboard/VideoEarnings';
import CourseEarnings from 'pages/CreatorDashboard/CourseEarnings';
import Videos from 'pages/CreatorDashboard/Videos';
import Courses from 'pages/CreatorDashboard/Courses';
import Subscriptions from 'pages/CreatorDashboard/Subscriptions';
import AccountSettings from 'pages/CreatorDashboard/AccountSettings';

//TODO: Might want to refactor earning details page to be single component
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
      <Route exact path={match.url + Routes.creatorDashboard.sessionEarnings} component={SessionEarnings} />
      <Route exact path={match.url + Routes.creatorDashboard.passEarnings} component={PassEarnings} />
      <Route exact path={match.url + Routes.creatorDashboard.videoEarnings} component={VideoEarnings} />
      <Route exact path={match.url + Routes.creatorDashboard.courseEarnings} component={CourseEarnings} />
      <Route exact path={match.url + Routes.creatorDashboard.passes} component={ClassPassList} />
      <Route exact path={match.url + Routes.creatorDashboard.videos} component={Videos} />
      <Route exact path={match.url + Routes.creatorDashboard.courses} component={Courses} />
      <Route exact path={match.url + Routes.creatorDashboard.subscriptions} component={Subscriptions} />
      <Route exact path={match.url + Routes.creatorDashboard.accountSettings} component={AccountSettings} />
      <Redirect to={match.url + Routes.creatorDashboard.defaultPath} />
    </Switch>
  );
};

export default CreatorDashboard;
