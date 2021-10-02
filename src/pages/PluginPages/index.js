import React, { lazy, Suspense } from 'react';
import { Switch, Route } from 'react-router-dom';
import Routes from 'routes';

const PluginVideoDetails = lazy(() => import('./PluginVideoDetails'));

const PluginPages = ({ match }) => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Switch>
        <Route exact path={match.url + Routes.plugins.details.video} component={PluginVideoDetails} />
      </Switch>
    </Suspense>
  );
};

export default PluginPages;
