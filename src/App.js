import React from 'react';
import { BrowserRouter as Router, Switch, Route, Redirect } from 'react-router-dom';
import Routes from './routes';
import { getLocalUserDetails } from './utils/storage';

import DefaultLayout from './layouts/DefaultLayout';
import SideNavLayout from 'layouts/SideNavLayout';

import Home from './pages/Home';
import Profile from './pages/Profile';
import LiveStream from './pages/LiveStream';
import ProfilePreview from './pages/ProfilePreview';
import SignUp from 'pages/SignUp';
import Login from 'pages/Login';
import Session from 'pages/Session';
import SessionDetails from 'pages/SessionDetails';
import Dashboard from 'pages/Dashboard';
import ResetPassword from 'pages/ResetPassword';

function RouteWithLayout({ layout, component, ...rest }) {
  return (
    <Route
      {...rest}
      render={(props) => {
        return React.createElement(layout, props, React.createElement(component, props));
      }}
    />
  );
}

const PrivateRoute = ({ ...rest }) => {
  return getLocalUserDetails() ? <RouteWithLayout {...rest} /> : <Redirect to={Routes.login} />;
};

function App() {
  return (
    <Router>
      <Switch>
        <PrivateRoute layout={SideNavLayout} path={Routes.dashboard.rootPath} component={Dashboard} />
        <PrivateRoute layout={DefaultLayout} exact path={Routes.profile} component={Profile} />
        <PrivateRoute layout={DefaultLayout} exact path={Routes.livestream} component={LiveStream} />
        <PrivateRoute layout={DefaultLayout} exact path={Routes.session} component={Session} />
        <PrivateRoute layout={DefaultLayout} exact path={Routes.sessionDetails} component={SessionDetails} />
        <PrivateRoute layout={DefaultLayout} exact path={Routes.sessionUpdate} component={Session} />
        <PrivateRoute layout={DefaultLayout} exact path={Routes.profilePreview} component={ProfilePreview} />
        <RouteWithLayout layout={DefaultLayout} exact path={Routes.login} component={Login} />
        <RouteWithLayout layout={DefaultLayout} path={Routes.passwordVerification} component={ResetPassword} />
        <RouteWithLayout layout={DefaultLayout} exact path={Routes.signup} component={SignUp} />
        <RouteWithLayout layout={DefaultLayout} exact path={Routes.root} component={Home} />
      </Switch>
    </Router>
  );
}

export default App;
