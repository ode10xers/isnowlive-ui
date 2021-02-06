import React from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';
import Routes from 'routes';

import SessionsInventories from 'pages/AttendeeDashboard/SessionsInventories';
import ClassPassList from 'pages/AttendeeDashboard/ClassPassList';
import Videos from 'pages/AttendeeDashboard/Videos';
import VideoDetails from 'pages/AttendeeDashboard/VideoDetails';
import Profile from 'pages/Profile';
import ProfilePreview from 'pages/ProfilePreview';
import LiveStream from 'pages/LiveStream';

const AttendeeDashboard = ({ match }) => {
  console.log(match.url);

  return (
    <Switch>
      <Route exact path={match.url + Routes.attendeeDashboard.sessions} component={SessionsInventories} />
      <Route exact path={match.url + Routes.attendeeDashboard.profile} component={ProfilePreview} />
      <Route exact path={match.url + Routes.attendeeDashboard.editProfile} component={Profile} />
      <Route exact path={match.url + Routes.attendeeDashboard.livestream} component={LiveStream} />
      <Route exact path={match.url + Routes.attendeeDashboard.passes} component={ClassPassList} />
      <Route exact path={match.url + Routes.attendeeDashboard.videoDetails} component={VideoDetails} />
      <Route exact path={match.url + Routes.attendeeDashboard.videos} component={Videos} />
      <Redirect to={match.url + Routes.attendeeDashboard.defaultPath} />
    </Switch>
  );
};

export default AttendeeDashboard;
