import React from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';
import Routes from 'routes';

import SessionsInventories from 'pages/AttendeeDashboard/SessionsInventories';
import ClassPassList from 'pages/AttendeeDashboard/ClassPassList';
import Videos from 'pages/AttendeeDashboard/Videos';
import VideoDetails from 'pages/AttendeeDashboard/VideoDetails';
import CourseList from 'pages/AttendeeDashboard/CourseList';
import Subscriptions from 'pages/AttendeeDashboard/Subscriptions';
import Referrals from 'pages/AttendeeDashboard/Referrals';
import CourseOrderDetails from 'pages/AttendeeDashboard/CourseOrderDetails';

const AttendeeDashboard = ({ match }) => {
  return (
    <Switch>
      <Route exact path={match.url + Routes.attendeeDashboard.sessions} component={SessionsInventories} />
      <Route exact path={match.url + Routes.attendeeDashboard.passes} component={ClassPassList} />
      <Route exact path={match.url + Routes.attendeeDashboard.videoDetails} component={VideoDetails} />
      <Route exact path={match.url + Routes.attendeeDashboard.videos} component={Videos} />
      <Route exact path={match.url + Routes.attendeeDashboard.courses} component={CourseList} />
      <Route exact path={match.url + Routes.attendeeDashboard.courseDetails} component={CourseOrderDetails} />
      <Route exact path={match.url + Routes.attendeeDashboard.subscriptions} component={Subscriptions} />
      <Route exact path={match.url + Routes.attendeeDashboard.referrals} component={Referrals} />
      <Redirect to={match.url + Routes.attendeeDashboard.defaultPath} />
    </Switch>
  );
};

export default AttendeeDashboard;
