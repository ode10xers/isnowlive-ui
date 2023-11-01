import React, { useEffect, lazy, Suspense } from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';
import Routes from 'routes';
import { useGlobalContext } from 'services/globalContext';

const SessionsInventories = lazy(() => import('pages/AttendeeDashboard/SessionsInventories'));
const ClassPassList = lazy(() => import('pages/AttendeeDashboard/ClassPassList'));
const Videos = lazy(() => import('pages/AttendeeDashboard/Videos'));
const VideoDetails = lazy(() => import('pages/AttendeeDashboard/VideoDetails'));
const CourseList = lazy(() => import('pages/AttendeeDashboard/CourseList'));
const Subscriptions = lazy(() => import('pages/AttendeeDashboard/Subscriptions'));
const Referrals = lazy(() => import('pages/AttendeeDashboard/Referrals'));
const CourseOrderDetails = lazy(() => import('pages/AttendeeDashboard/CourseOrderDetails'));
const DashboardPage = lazy(() => import('pages/AttendeeDashboard/DashboardPage'));
const DocumentDetails = lazy(() => import('pages/AttendeeDashboard/DocumentDetails'));

const AttendeeDashboard = ({ match }) => {
  const { toggleTawkToWidgetVisibility } = useGlobalContext();

  useEffect(() => {
    toggleTawkToWidgetVisibility(true);

    return () => {
      toggleTawkToWidgetVisibility(false);
    };
  }, [toggleTawkToWidgetVisibility]);

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Switch>
        <Route exact path={match.url + Routes.attendeeDashboard.documentDetails} component={DocumentDetails} />
        <Route exact path={match.url + Routes.attendeeDashboard.dashboardPage} component={DashboardPage} />
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
    </Suspense>
  );
};

export default AttendeeDashboard;
