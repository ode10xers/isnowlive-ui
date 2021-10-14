import React, { useEffect, useState, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Switch, Route, Redirect } from 'react-router-dom';

import Routes from 'routes';
import apis from 'apis';

import parseQueryString from 'utils/parseQueryString';
import { isAPISuccess } from 'utils/helper';
import { isInCustomDomain } from 'utils/url';
import { storeCreatorDetailsToLS } from 'utils/storage';
import { isInIframeWidget, isWidgetUrl, publishedWidgets } from 'utils/widgets';

import http from 'services/http';
import { useGlobalContext } from 'services/globalContext';
import { mapUserToPendo } from 'services/integrations/pendo';
import { initMixPanel } from 'services/integrations/mixpanel';
import { getAuthCookie, setAuthCookie } from 'services/authCookie';
import { setGTMUserAttributes } from 'services/integrations/googleTagManager';
import { initFreshChatWidget, initializeFreshChat } from 'services/integrations/fresh-chat';
import { deleteAuthTokenFromLS, getAuthTokenFromLS, setAuthTokenInLS } from 'services/localAuthToken';

import './styles/globals.scss';
import 'swiper/swiper.scss';

const DefaultLayout = lazy(() => import('layouts/DefaultLayout'));
const SideNavLayout = lazy(() => import('layouts/SideNavLayout'));
const SideNavWithHeaderLayout = lazy(() => import('layouts/SideNavWithHeaderLayout'));
const NavbarFullWidthLayout = lazy(() => import('layouts/NavbarFullWidthLayout'));
const NavbarLayout = lazy(() => import('layouts/NavbarLayout'));
const MobileLayout = lazy(() => import('layouts/MobileLayout'));
const FullWidthLayout = lazy(() => import('layouts/FullWidthLayout'));

const Profile = lazy(() => import('pages/Profile'));
const LiveStream = lazy(() => import('pages/LiveStream'));
const SignUp = lazy(() => import('pages/SignUp'));
const Login = lazy(() => import('pages/Login'));
const AdminLogin = lazy(() => import('pages/AdminLogin'));
const AvailabilityDetails = lazy(() => import('pages/ProductDetails/AvailabilityDetails'));
const Session = lazy(() => import('pages/Session'));
const InventoryDetails = lazy(() => import('pages/InventoryDetails'));
const SessionDetails = lazy(() => import('pages/SessionDetails'));
const CreatorDashboard = lazy(() => import('pages/CreatorDashboard'));
const AttendeeDashboard = lazy(() => import('pages/AttendeeDashboard'));
const ResetPassword = lazy(() => import('pages/ResetPassword'));
const EmailVerification = lazy(() => import('pages/EmailVerification'));
const PaymentRedirectVerify = lazy(() => import('pages/PaymentRedirectVerify'));
const PaymentRetry = lazy(() => import('pages/PaymentRetry'));
const SessionReschedule = lazy(() => import('pages/SessionReschedule'));
const NewMembershipDetails = lazy(() => import('pages/ProductDetails/NewMembershipDetails'));
const NewVideoDetails = lazy(() => import('pages/ProductDetails/NewVideoDetails'));
const CourseDetails = lazy(() => import('pages/ProductDetails/CourseDetails'));
const PassDetails = lazy(() => import('pages/ProductDetails/PassDetails'));
const NewHome = lazy(() => import('pages/NewHome'));
const VideoDetailedListView = lazy(() => import('pages/DetailedListView/Videos'));
const SessionDetailedListView = lazy(() => import('pages/DetailedListView/Sessions'));
const CourseDetailedListView = lazy(() => import('pages/DetailedListView/Courses'));
const EmbeddablePage = lazy(() => import('pages/EmbeddablePage'));
const Legals = lazy(() => import('pages/Legals'));
const Onboarding = lazy(() => import('pages/EditProfile'));

const PassDetailPreview = lazy(() => import('pages/PreviewPages/PassDetails'));
const CourseDetailPreview = lazy(() => import('pages/PreviewPages/CourseDetails'));
const VideoDetailPreview = lazy(() => import('pages/PreviewPages/VideoDetails'));
const MembershipDetailPreview = lazy(() => import('pages/PreviewPages/MembershipDetails'));
const AvailabilityDetailPreview = lazy(() => import('pages/PreviewPages/AvailabilityDetails'));
const SessionDetailsPreview = lazy(() => import('pages/PreviewPages/SessionDetails'));
const InventoryDetailsPreview = lazy(() => import('pages/PreviewPages/InventoryDetails'));
const PluginPages = lazy(() => import('pages/PluginPages'));

// const CookieConsentPopup = lazy(() => import('components/CookieConsentPopup'));
const PaymentPopup = lazy(() => import('components/PaymentPopup'));
const WaitlistRegisterPopup = lazy(() => import('components/WaitlistRegisterPopup'));
const SendCustomerEmailModal = lazy(() => import('components/SendCustomerEmailModal'));

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
  // Query Params for Plugins
  const { authCode, widgetType } = parseQueryString(window.location.search);

  // Logic to sign in from Webflow redirection
  // As well as handle auth token passing from widget to site
  // (widgets store tokens in LS while site uses cookies)
  let { signupAuthToken, redirectUrl = null } = parseQueryString(window.location.search);

  if (signupAuthToken === '') {
    signupAuthToken = false;
  }

  if (signupAuthToken) {
    setAuthCookie(signupAuthToken);
    http.setAuthToken(signupAuthToken);

    if (redirectUrl) {
      window.location.href = decodeURIComponent(redirectUrl);
    } else {
      window.location = window.location.origin + window.location.pathname;
    }
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
            // NOTE : The API call here causes a delay
            // which might cause the styling not getting applied
            setIsReadyToLoad(true);
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
      <WaitlistRegisterPopup />
      {userDetails && userDetails.is_creator && <SendCustomerEmailModal />}
      <Router>
        {isWidget && isReadyToLoad && publishedWidgets.includes(widgetType) ? (
          <EmbeddablePage widget={widgetType} />
        ) : (
          <Switch>
            <RouteWithLayout layout={FullWidthLayout} path={Routes.plugins.root} component={PluginPages} />
            <PrivateRoute layout={SideNavLayout} path={Routes.creatorDashboard.rootPath} component={CreatorDashboard} />
            <PrivateRoute
              layout={SideNavWithHeaderLayout}
              path={Routes.attendeeDashboard.rootPath}
              component={AttendeeDashboard}
            />
            <PrivateRoute layout={FullWidthLayout} exact path={Routes.profileEdit} component={Onboarding} />
            <PrivateRoute layout={FullWidthLayout} exact path={Routes.onboardingProfile} component={Onboarding} />
            <PrivateRoute layout={NavbarFullWidthLayout} exact path={Routes.onboardingName} component={Profile} />
            <PrivateRoute layout={DefaultLayout} exact path={Routes.livestream} component={LiveStream} />
            <PrivateRoute layout={DefaultLayout} exact path={Routes.sessionCreate} component={Session} />
            <PrivateRoute layout={DefaultLayout} exact path={Routes.sessionUpdate} component={Session} />
            <PrivateRoute layout={DefaultLayout} exact path={Routes.sessionReschedule} component={SessionReschedule} />
            {/* <PrivateRoute layout={DefaultLayout} exact path={Routes.profilePreview} component={ProfilePreview} /> */}
            <PrivateRoute layout={DefaultLayout} path={Routes.paymentRetry} component={PaymentRetry} />
            {/* <PrivateRoute
              layout={DefaultLayout}
              exact
              path={Routes.stripePaymentSuccess}
              component={PaymentVerification}
            /> */}
            <PrivateRoute layout={NavbarLayout} exact path={Routes.paymentConfirm} component={PaymentRedirectVerify} />
            <RouteWithLayout
              layout={MobileLayout}
              exact
              path={Routes.previewPages.memberships}
              component={MembershipDetailPreview}
            />
            <RouteWithLayout
              layout={NavbarFullWidthLayout}
              exact
              path={Routes.membershipDetails}
              component={NewMembershipDetails}
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
            <RouteWithLayout
              layout={NavbarFullWidthLayout}
              exact
              path={Routes.videoDetails}
              component={NewVideoDetails}
            />
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
            <RouteWithLayout layout={NavbarLayout} exact path={Routes.signup} component={SignUp} />
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
