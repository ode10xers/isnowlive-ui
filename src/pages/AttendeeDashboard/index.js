import React from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';
import Routes from 'routes';

import SessionsInventories from 'pages/AttendeeDashboard/SessionsInventories';
import Profile from 'pages/Profile';
import ProfilePreview from 'pages/ProfilePreview';
import LiveStream from 'pages/LiveStream';

const AttendeeDashboard = ({ match }) => {
  return (
    <Switch>
      <Route exact path={match.url + Routes.creatorDashboard.sessions} component={SessionsInventories} />
      <Route exact path={match.url + Routes.creatorDashboard.profile} component={ProfilePreview} />
      <Route exact path={match.url + Routes.creatorDashboard.editProfile} component={Profile} />
      <Route exact path={match.url + Routes.creatorDashboard.livestream} component={LiveStream} />
      <Redirect to={match.url + Routes.creatorDashboard.defaultPath} />
    </Switch>
  );
};

export default AttendeeDashboard;
