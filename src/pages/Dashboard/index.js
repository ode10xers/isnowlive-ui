import React from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';
import Routes from 'routes';

import DashboardSessions from 'pages/DashboardSessions';
import DashboardSessionsDetails from 'pages/DashboardSessionsDetails';

const Dashboard = ({ match }) => {
  return (
    <Switch>
      <Route exact path={match.url + Routes.dashboard.sessions} component={DashboardSessions} />
      <Route exact path={match.url + Routes.dashboard.sessionsDetails} component={DashboardSessionsDetails} />
      <Redirect to={match.url + Routes.dashboard.defaultPath} />
    </Switch>
  );
};

export default Dashboard;
