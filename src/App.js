import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Switch, Route, Redirect } from 'react-router-dom';
import Routes from 'routes';
import apis from 'apis';
import { useGlobalContext } from 'services/globalContext';
import { initializeFreshChat } from 'services/integrations/fresh-chat';
import { initMixPanel } from 'services/integrations/mixpanel';
import { getAuthCookie } from 'services/authCookie';
import { isAPISuccess } from 'utils/helper';

import DefaultLayout from 'layouts/DefaultLayout';
import SideNavLayout from 'layouts/SideNavLayout';
import SideNavWithHeaderLayout from 'layouts/SideNavWithHeaderLayout';
import NavbarLayout from 'layouts/NavbarLayout';

import Home from 'pages/Home';
import Profile from 'pages/Profile';
import LiveStream from 'pages/LiveStream';
import ProfilePreview from 'pages/ProfilePreview';
import SignUp from 'pages/SignUp';
import Login from 'pages/Login';
import AdminLogin from 'pages/AdminLogin';
import Session from 'pages/Session';
import InventoryDetails from 'pages/InventoryDetails';
import SessionDetails from 'pages/SessionDetails';
import CreatorDashboard from 'pages/CreatorDashboard';
import AttendeeDashboard from 'pages/AttendeeDashboard';
import ResetPassword from 'pages/ResetPassword';
import EmailVerification from 'pages/EmailVerification';
import PaymentVerification from 'pages/PaymentVerification';
import SessionReschedule from 'pages/SessionReschedule';
import PassDetails from 'pages/PassDetails';
import VideoDetails from 'pages/VideoDetails';

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
  const {
    state: { userAuthenticated },
  } = useGlobalContext();

  return userAuthenticated ? <RouteWithLayout {...rest} /> : <Redirect to={Routes.login} />;
};

function App() {
  const {
    state: { userDetails },
    setUserAuthentication,
    setUserDetails,
  } = useGlobalContext();
  const [isReadyToLoad, setIsReadyToLoad] = useState(false);

  useEffect(() => {
    initMixPanel();
  }, []);

  useEffect(() => {
    initializeFreshChat(userDetails);
  }, [userDetails]);

  useEffect(() => {
    const getUserDetails = async () => {
      try {
        const { data, status } = await apis.user.getProfile();
        if (isAPISuccess(status) && data) {
          setUserAuthentication(true);
          setUserDetails({ ...data, auth_token: data.auth_token ? data.auth_token : getAuthCookie() });
          setTimeout(() => {
            setIsReadyToLoad(true);
          }, 100);
        }
      } catch (error) {
        setUserAuthentication(false);
        setUserDetails(null);
        setIsReadyToLoad(true);
      }
    };
    const authToken = getAuthCookie();
    if (authToken && authToken !== '') {
      getUserDetails();
    } else {
      setUserAuthentication(false);
      setUserDetails(null);
      setIsReadyToLoad(true);
    }
    // eslint-disable-next-line
  }, []);

  if (!isReadyToLoad) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <Switch>
        <PrivateRoute layout={SideNavLayout} path={Routes.creatorDashboard.rootPath} component={CreatorDashboard} />
        <PrivateRoute
          layout={SideNavWithHeaderLayout}
          path={Routes.attendeeDashboard.rootPath}
          component={AttendeeDashboard}
        />
        <PrivateRoute layout={DefaultLayout} exact path={Routes.profile} component={Profile} />
        <PrivateRoute layout={DefaultLayout} exact path={Routes.livestream} component={LiveStream} />
        <PrivateRoute layout={DefaultLayout} exact path={Routes.session} component={Session} />
        <PrivateRoute layout={DefaultLayout} exact path={Routes.sessionUpdate} component={Session} />
        <PrivateRoute layout={DefaultLayout} exact path={Routes.sessionReschedule} component={SessionReschedule} />
        <PrivateRoute layout={DefaultLayout} exact path={Routes.profilePreview} component={ProfilePreview} />
        <PrivateRoute layout={DefaultLayout} exact path={Routes.stripePaymentSuccess} component={PaymentVerification} />
        <RouteWithLayout layout={DefaultLayout} exact path={Routes.inventoryDetails} component={InventoryDetails} />
        <RouteWithLayout layout={DefaultLayout} exact path={Routes.sessionDetails} component={SessionDetails} />
        <RouteWithLayout layout={DefaultLayout} exact path={Routes.passDetails} component={PassDetails} />
        <RouteWithLayout layout={DefaultLayout} exact path={Routes.videoDetails} component={VideoDetails} />
        <RouteWithLayout layout={DefaultLayout} exact path={Routes.login} component={Login} />
        <RouteWithLayout layout={DefaultLayout} exact path={Routes.adminLogin} component={AdminLogin} />
        <RouteWithLayout layout={NavbarLayout} path={Routes.passwordVerification} component={ResetPassword} />
        <RouteWithLayout layout={NavbarLayout} path={Routes.createPassword} component={ResetPassword} />
        <RouteWithLayout layout={NavbarLayout} path={Routes.emailVerification} component={EmailVerification} />
        <RouteWithLayout layout={DefaultLayout} exact path={Routes.signup} component={SignUp} />
        <RouteWithLayout layout={NavbarLayout} exact path={Routes.root} component={Home} />
        <Route path={Routes.stripeAccountValidate}>
          <Redirect
            to={{
              pathname: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.paymentAccount,
              state: { validateAccount: true },
            }}
          />
        </Route>
      </Switch>
    </Router>
  );
}

export default App;
