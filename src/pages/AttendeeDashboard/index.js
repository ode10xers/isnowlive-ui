import React from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';
import Routes from 'routes';

import SessionsInventories from 'pages/AttendeeDashboard/SessionsInventories';
import ClassPassList from 'pages/AttendeeDashboard/ClassPassList';
import Profile from 'pages/Profile';
import ProfilePreview from 'pages/ProfilePreview';
import LiveStream from 'pages/LiveStream';

const AttendeeDashboard = ({ match }) => {
  return (
    <Switch>
      <Route exact path={match.url + Routes.attendeeDashboard.sessions} component={SessionsInventories} />
      <Route exact path={match.url + Routes.attendeeDashboard.profile} component={ProfilePreview} />
      <Route exact path={match.url + Routes.attendeeDashboard.editProfile} component={Profile} />
      <Route exact path={match.url + Routes.attendeeDashboard.livestream} component={LiveStream} />
      <Route exact path={match.url + Routes.attendeeDashboard.passes} component={ClassPassList} />
      <Redirect to={match.url + Routes.attendeeDashboard.defaultPath} />
    </Switch>
  );
};

export default AttendeeDashboard;
