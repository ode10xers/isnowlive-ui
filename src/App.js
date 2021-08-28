import React, { useEffect, useState, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Switch, Route, Redirect } from 'react-router-dom';

import Routes from 'routes';
import apis from 'apis';

import parseQueryString from 'utils/parseQueryString';
import { storeCreatorDetailsToLS } from 'utils/storage';
import { isAPISuccess, isInCustomDomain } from 'utils/helper';
import { isInIframeWidget, isWidgetUrl, publishedWidgets } from 'utils/widgets';

import { useGlobalContext } from 'services/globalContext';
import { initFreshChatWidget, initializeFreshChat } from 'services/integrations/fresh-chat';
import { initMixPanel } from 'services/integrations/mixpanel';
import { getAuthCookie, setAuthCookie } from 'services/authCookie';
import { deleteAuthTokenFromLS, getAuthTokenFromLS, setAuthTokenInLS } from 'services/localAuthToken';
import { setGTMUserAttributes } from 'services/integrations/googleTagManager';
import { mapUserToPendo } from 'services/integrations/pendo';
import http from 'services/http';

import './styles/globals.scss';
import 'swiper/swiper.scss';

const DefaultLayout = lazy(() => 'layouts/DefaultLayout');
const SideNavLayout = lazy(() => 'layouts/SideNavLayout');
const SideNavWithHeaderLayout = lazy(() => 'layouts/SideNavWithHeaderLayout');
const NavbarFullWidthLayout = lazy(() => 'layouts/NavbarFullWidthLayout');
const NavbarLayout = lazy(() => 'layouts/NavbarLayout');
const MobileLayout = lazy(() => 'layouts/MobileLayout');

const Home = lazy(() => 'pages/Home');
const Profile = lazy(() => 'pages/Profile');
const LiveStream = lazy(() => 'pages/LiveStream');
const ProfilePreview = lazy(() => 'pages/ProfilePreview');
const SignUp = lazy(() => 'pages/SignUp');
const Login = lazy(() => 'pages/Login');
const AdminLogin = lazy(() => 'pages/AdminLogin');
const AvailabilityDetails = lazy(() => 'pages/ProductDetails/AvailabilityDetails');
const Session = lazy(() => 'pages/Session');
const InventoryDetails = lazy(() => 'pages/InventoryDetails');
const SessionDetails = lazy(() => 'pages/SessionDetails');
const CreatorDashboard = lazy(() => 'pages/CreatorDashboard');
const AttendeeDashboard = lazy(() => 'pages/AttendeeDashboard');
const ResetPassword = lazy(() => 'pages/ResetPassword');
const EmailVerification = lazy(() => 'pages/EmailVerification');
const PaymentRedirectVerify = lazy(() => 'pages/PaymentRedirectVerify');
const PaymentVerification = lazy(() => 'pages/PaymentVerification');
const PaymentRetry = lazy(() => 'pages/PaymentRetry');
const SessionReschedule = lazy(() => 'pages/SessionReschedule');
const MembershipDetails = lazy(() => 'pages/ProductDetails/MembershipDetails');
const VideoDetails = lazy(() => 'pages/ProductDetails/VideoDetails');
const CourseDetails = lazy(() => 'pages/ProductDetails/CourseDetails');
const PassDetails = lazy(() => 'pages/ProductDetails/PassDetails');
const NewHome = lazy(() => 'pages/NewHome');
const VideoDetailedListView = lazy(() => 'pages/DetailedListView/Videos');
const SessionDetailedListView = lazy(() => 'pages/DetailedListView/Sessions');
const CourseDetailedListView = lazy(() => 'pages/DetailedListView/Courses');
const EmbeddablePage = lazy(() => 'pages/EmbeddablePage');
const Legals = lazy(() => 'pages/Legals');

const PassDetailPreview = lazy(() => 'pages/PreviewPages/PassDetails');
const CourseDetailPreview = lazy(() => 'pages/PreviewPages/CourseDetails');
const VideoDetailPreview = lazy(() => 'pages/PreviewPages/VideoDetails');
const MembershipDetailPreview = lazy(() => 'pages/PreviewPages/MembershipDetails');
const AvailabilityDetailPreview = lazy(() => 'pages/PreviewPages/AvailabilityDetails');
const SessionDetailsPreview = lazy(() => 'pages/PreviewPages/SessionDetails');
const InventoryDetailsPreview = lazy(() => 'pages/PreviewPages/InventoryDetails');

// const CookieConsentPopup = lazy(() => 'components/CookieConsentPopup');
const PaymentPopup = lazy(() => 'components/PaymentPopup');
const SendCustomerEmailModal = lazy(() => 'components/SendCustomerEmailModal');

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
    state: { userDetails, cookieConsent },
    setUserAuthentication,
    setUserDetails,
  } = useGlobalContext();
  const [isReadyToLoad, setIsReadyToLoad] = useState(false);
  const [shouldFetchCreatorDetails, setShouldFetchCreatorDetails] = useState(true);
  const isWidget = isWidgetUrl() || isInIframeWidget();
  const windowLocation = window.location;
  const { authCode, widgetType } = parseQueryString(windowLocation.search);

  let signupAuthToken =
    window.location.search &&
    window.location.search.includes('signupAuthToken=') &&
    window.location.search.split('signupAuthToken=')[1];
  if (signupAuthToken === '') {
    signupAuthToken = false;
  }

  if (signupAuthToken) {
    setAuthCookie(signupAuthToken);
    http.setAuthToken(signupAuthToken);

    window.location = window.location.origin + window.location.pathname;
  }

  // Logic to initially save creator details in LS
  useEffect(() => {
    const currentDomain = window.location.hostname;

    if (!isInCustomDomain()) {
      setShouldFetchCreatorDetails(false);
    } else {
      if (shouldFetchCreatorDetails) {
        const fetchCreatorDetailsForCustomDomain = async (customDomain) => {
          console.log('Fetching creator details based on domain ', customDomain);

          try {
            const { status, data } = await apis.user.getCreatorDetailsByCustomDomain(customDomain);

            if (isAPISuccess(status) && data) {
              storeCreatorDetailsToLS(data);
            }
          } catch (error) {
            console.error('Failed fetching creator details based on domain', error?.response?.data);
          }

          setShouldFetchCreatorDetails(false);
        };

        fetchCreatorDetailsForCustomDomain(currentDomain);
      }
    }
  }, [shouldFetchCreatorDetails]);

  useEffect(() => {
    if (!isWidget && !signupAuthToken) {
      initializeFreshChat(userDetails, cookieConsent);

      if (cookieConsent) {
        initFreshChatWidget(userDetails);
        initMixPanel();
        if (userDetails && userDetails.is_creator) {
          setGTMUserAttributes(userDetails);
          mapUserToPendo(userDetails);
        }
      }
    }
  }, [userDetails, cookieConsent, isWidget, signupAuthToken]);

  useEffect(() => {
    const removeUserState = () => {
      setUserAuthentication(false);
      setUserDetails(null);
      setIsReadyToLoad(true);
      deleteAuthTokenFromLS();
    };

    const getUserDetails = async () => {
      try {
        const { data, status } = await apis.user.getProfile();
        if (isAPISuccess(status) && data) {
          const authTokenData = data.auth_token ? data.auth_token : getAuthCookie();

          setUserAuthentication(true);
          setUserDetails({ ...data, auth_token: authTokenData });
          setTimeout(() => {
            setIsReadyToLoad(true);
          }, 100);
        }
      } catch (error) {
        removeUserState();
      }
    };

    if (!signupAuthToken) {
      if (!isWidget) {
        const authToken = getAuthCookie();
        if (authToken && authToken !== '') {
          getUserDetails();
        } else {
          removeUserState();
        }
      } else if (isWidget) {
        // TODO: Below if block can be removed, once we verify that local storage solution works for all browser in iframe
        if (authCode && authCode !== '') {
          http.setAuthToken(authCode);
          setAuthTokenInLS(authCode);
          getUserDetails();
        } else {
          const tokenFromLS = getAuthTokenFromLS();
          if (tokenFromLS) {
            http.setAuthToken(tokenFromLS);
            getUserDetails();
          } else {
            removeUserState();
          }
        }
      } else {
        setIsReadyToLoad(true);
      }
    }

    // eslint-disable-next-line
  }, [isWidget, signupAuthToken]);

  if (!isReadyToLoad || signupAuthToken || shouldFetchCreatorDetails) {
    return <div>Loading...</div>;
  }

  return (
    <Suspense fallback={<div> Loading... </div>}>
      <PaymentPopup />
      {userDetails && userDetails.is_creator && <SendCustomerEmailModal />}
      <Router>
        {isWidget && isReadyToLoad && publishedWidgets.includes(widgetType) ? (
          <EmbeddablePage widget={widgetType} />
        ) : (
          <Switch>
            <PrivateRoute layout={SideNavLayout} path={Routes.creatorDashboard.rootPath} component={CreatorDashboard} />
            <PrivateRoute
              layout={SideNavWithHeaderLayout}
              path={Routes.attendeeDashboard.rootPath}
              component={AttendeeDashboard}
            />
            <PrivateRoute layout={DefaultLayout} exact path={Routes.profile} component={Profile} />
            <PrivateRoute layout={DefaultLayout} exact path={Routes.livestream} component={LiveStream} />
            <PrivateRoute layout={DefaultLayout} exact path={Routes.sessionCreate} component={Session} />
            <PrivateRoute layout={DefaultLayout} exact path={Routes.sessionUpdate} component={Session} />
            <PrivateRoute layout={DefaultLayout} exact path={Routes.sessionReschedule} component={SessionReschedule} />
            <PrivateRoute layout={DefaultLayout} exact path={Routes.profilePreview} component={ProfilePreview} />
            <PrivateRoute layout={DefaultLayout} path={Routes.paymentRetry} component={PaymentRetry} />
            <PrivateRoute
              layout={DefaultLayout}
              exact
              path={Routes.stripePaymentSuccess}
              component={PaymentVerification}
            />
            <PrivateRoute layout={NavbarLayout} exact path={Routes.paymentConfirm} component={PaymentRedirectVerify} />
            <RouteWithLayout
              layout={MobileLayout}
              exact
              path={Routes.previewPages.memberships}
              component={MembershipDetailPreview}
            />
            <RouteWithLayout
              layout={MobileLayout}
              exact
              path={Routes.membershipDetails}
              component={MembershipDetails}
            />

            <RouteWithLayout
              layout={NavbarFullWidthLayout}
              exact
              path={Routes.previewPages.courses}
              component={CourseDetailPreview}
            />
            <RouteWithLayout
              layout={NavbarFullWidthLayout}
              exact
              path={Routes.courseDetails}
              component={CourseDetails}
            />
            <RouteWithLayout
              layout={NavbarFullWidthLayout}
              path={Routes.previewPages.availabilities}
              component={AvailabilityDetailPreview}
            />
            <RouteWithLayout
              layout={NavbarFullWidthLayout}
              path={Routes.availabilityDetails}
              component={AvailabilityDetails}
            />
            <RouteWithLayout
              layout={NavbarFullWidthLayout}
              exact
              path={Routes.previewPages.passes}
              component={PassDetailPreview}
            />
            <RouteWithLayout layout={NavbarFullWidthLayout} exact path={Routes.passDetails} component={PassDetails} />
            <RouteWithLayout
              layout={MobileLayout}
              exact
              path={Routes.previewPages.videos}
              component={VideoDetailPreview}
            />
            <RouteWithLayout layout={MobileLayout} exact path={Routes.videoDetails} component={VideoDetails} />
            <RouteWithLayout
              layout={NavbarLayout}
              exact
              path={Routes.previewPages.inventories}
              component={InventoryDetailsPreview}
            />
            <RouteWithLayout layout={NavbarLayout} exact path={Routes.inventoryDetails} component={InventoryDetails} />
            <RouteWithLayout
              layout={NavbarLayout}
              exact
              path={Routes.previewPages.sessions}
              component={SessionDetailsPreview}
            />
            <RouteWithLayout layout={NavbarLayout} exact path={Routes.sessionDetails} component={SessionDetails} />
            {/* <RouteWithLayout layout={NavbarLayout} exact path={Routes.passDetails} component={PassDetails} /> */}
            {/* <RouteWithLayout layout={NavbarLayout} exact path={Routes.videoDetails} component={VideoDetails} /> */}
            {/* <RouteWithLayout layout={NavbarLayout} exact path={Routes.courseDetails} component={CourseDetails} /> */}
            <RouteWithLayout
              layout={NavbarLayout}
              exact
              path={Routes.courseSessionDetails}
              component={SessionDetails}
            />
            <RouteWithLayout layout={NavbarLayout} exact path={Routes.login} component={Login} />
            <RouteWithLayout layout={DefaultLayout} exact path={Routes.adminLogin} component={AdminLogin} />
            <RouteWithLayout layout={NavbarLayout} path={Routes.passwordVerification} component={ResetPassword} />
            <RouteWithLayout layout={NavbarLayout} path={Routes.createPassword} component={ResetPassword} />
            <RouteWithLayout layout={NavbarLayout} path={Routes.emailVerification} component={EmailVerification} />
            <RouteWithLayout layout={DefaultLayout} exact path={Routes.signup} component={SignUp} />
            {/* New Pages are put higher for more priority matching */}
            <RouteWithLayout layout={NavbarLayout} exact path={Routes.root + 'old'} component={Home} />
            <RouteWithLayout
              layout={MobileLayout}
              exact
              path={Routes.list.sessions}
              component={SessionDetailedListView}
            />
            <RouteWithLayout layout={MobileLayout} exact path={Routes.list.videos} component={VideoDetailedListView} />
            <RouteWithLayout
              layout={MobileLayout}
              exact
              path={Routes.list.courses}
              component={CourseDetailedListView}
            />
            <RouteWithLayout
              layout={MobileLayout}
              exact
              path={[Routes.root, Routes.sessions, Routes.videos, Routes.courses, Routes.subscriptions, Routes.passes]}
              component={NewHome}
            />
            <RouteWithLayout layout={NavbarLayout} exact path={Routes.legals} component={Legals} />
            <Route path={Routes.stripeAccountValidate}>
              <Redirect
                to={{
                  pathname: Routes.creatorDashboard.rootPath + Routes.creatorDashboard.paymentAccount,
                  state: { validateAccount: true },
                }}
              />
            </Route>
          </Switch>
        )}
      </Router>
      {/* {!isWidget && <CookieConsentPopup />} */}
    </Suspense>
  );
}

export default App;
