import React from 'react';
import { createBrowserHistory } from 'history';
import { Router, Switch, Route } from 'react-router-dom';
import Routes from './routes';
import DefaultLayout from './layouts/DefaultLayout';

import Home from './pages/Home';
import Profile from './pages/Profile';
import ProfilePreview from './pages/ProfilePreview';

function RouteWithLayout({ layout, component, ...rest }) {
  return (
    <Route {...rest} render={(props) => React.createElement(layout, props, React.createElement(component, props))} />
  );
}

function App() {
  const history = createBrowserHistory();

  //TODO: add private and public routes
  return (
    <Router history={history}>
      <Switch>
        <Route exact path={Routes.root} component={Home} />
        <RouteWithLayout layout={DefaultLayout} exact path={Routes.profile} component={Profile} />
        <RouteWithLayout layout={DefaultLayout} exact path={Routes.profilePreview} component={ProfilePreview} />
      </Switch>
    </Router>
  );
}

export default App;
