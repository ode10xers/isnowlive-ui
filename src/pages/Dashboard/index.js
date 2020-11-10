import React from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';
import Routes from 'routes';

import SessionsInventories from 'pages/Dashboard/SessionsInventories';
import SessionsDetails from 'pages/Dashboard/SessionsDetails';
import ManageSessions from 'pages/Dashboard/ManageSessions';
import Session from 'pages/Session';
import Profile from 'pages/Profile';
import ProfilePreview from 'pages/ProfilePreview';

const Dashboard = ({ match }) => {
  return (
    <Switch>
      <Route exact path={match.url + Routes.dashboard.sessions} component={SessionsInventories} />
      <Route exact path={match.url + Routes.dashboard.sessionsDetails} component={SessionsDetails} />
      <Route exact path={match.url + Routes.dashboard.manageSessions} component={ManageSessions} />
      <Route exact path={match.url + Routes.dashboard.createSessions} component={Session} />
      <Route exact path={match.url + Routes.dashboard.updateSessions} component={Session} />
      <Route exact path={match.url + Routes.dashboard.profile} component={ProfilePreview} />
      <Route exact path={match.url + Routes.dashboard.editProfile} component={Profile} />
      <Redirect to={match.url + Routes.dashboard.defaultPath} />
    </Switch>
  );
};

export default Dashboard;
