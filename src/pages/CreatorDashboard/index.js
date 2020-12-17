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
      <Redirect to={match.url + Routes.creatorDashboard.defaultPath} />
    </Switch>
  );
};

export default CreatorDashboard;
