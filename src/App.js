import React from 'react';
import { createBrowserHistory } from 'history';
import { Router, Switch, Route } from 'react-router-dom';
import Routes from './routes';

import Home from './pages/Home';
import Profile from './pages/Profile';
import ProfilePreview from './pages/ProfilePreview';

function App() {
  const history = createBrowserHistory();

  //TODO: add private and public routes
  return (
    <Router history={history}>
      <Switch>
        <Route exact path={Routes.root} component={Home} />
        <Route exact path={Routes.profile} component={Profile} />
        <Route exact path={Routes.profilePreview} component={ProfilePreview} />
      </Switch>
    </Router>
  );
}

export default App;
