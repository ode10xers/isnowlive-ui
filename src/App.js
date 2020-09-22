import React from 'react';
import { createBrowserHistory } from 'history';
import { Router, Switch, Route } from 'react-router-dom';
import Routes from './routes';

import Home from './pages/Home';

function App() {
  const history = createBrowserHistory();

  //TODO: add private and public routes
  return (
    <Router history={history}>
      <Switch>
        <Route path={Routes.root} component={Home} />
      </Switch>
    </Router>
  );
}

export default App;
