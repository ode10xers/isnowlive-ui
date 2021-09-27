import React, { lazy, Suspense } from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';
import Routes from 'routes';

const MobileLayout = lazy(() => import('layouts/MobileLayout'));

const SessionsInventories = lazy(() => import('pages/CreatorDashboard/SessionsInventories'));
const SessionsDetails = lazy(() => import('pages/CreatorDashboard/SessionsDetails'));
const ManageSessions = lazy(() => import('pages/CreatorDashboard/ManageSessions'));
const Session = lazy(() => import('pages/Session'));
const Profile = lazy(() => import('pages/Profile'));
const LiveStream = lazy(() => import('pages/LiveStream'));
const ClassPassList = lazy(() => import('pages/CreatorDashboard/ClassPassList'));
const PaymentAccount = lazy(() => import('pages/CreatorDashboard/PaymentAccount'));
const EarningDetails = lazy(() => import('pages/CreatorDashboard/EarningDetails'));
const Videos = lazy(() => import('pages/CreatorDashboard/Videos'));
const Courses = lazy(() => import('pages/CreatorDashboard/Courses'));
const CourseForm = lazy(() => import('pages/CreatorDashboard/ManageCourse/CourseForm'));
const CourseModulesForm = lazy(() => import('pages/CreatorDashboard/ManageCourse/CourseModulesForm'));
const Subscriptions = lazy(() => import('pages/CreatorDashboard/Subscriptions'));
const Coupons = lazy(() => import('pages/CreatorDashboard/Coupons'));
const Audiences = lazy(() => import('pages/CreatorDashboard/Newsletter/Audiences'));
const EmailTemplates = lazy(() => import('pages/CreatorDashboard/Newsletter/EmailTemplates'));
const AccountSettings = lazy(() => import('pages/CreatorDashboard/SiteSettings/AccountSettings'));
const Legals = lazy(() => import('pages/CreatorDashboard/SiteSettings/Legals'));
const Files = lazy(() => import('pages/CreatorDashboard/Files'));
const Plugins = lazy(() => import('pages/CreatorDashboard/ExternalSiteSettings/Plugins'));
const CustomDomain = lazy(() => import('pages/CreatorDashboard/ExternalSiteSettings/CustomDomain'));
const MembersList = lazy(() => import('pages/CreatorDashboard/Members/MembersList'));
const MembersTags = lazy(() => import('pages/CreatorDashboard/AdvancedFeatures/MembersTags'));
const MemberSettings = lazy(() => import('pages/CreatorDashboard/AdvancedFeatures/MembersSettings'));
const Referral = lazy(() => import('pages/CreatorDashboard/Referral'));
const Affiliates = lazy(() => import('pages/CreatorDashboard/Affiliates'));
const DynamicProfile = lazy(() => import('pages/DynamicProfile'));

const CreatorDashboard = ({ match }) => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Switch>
        <Route exact path={match.url + Routes.creatorDashboard.sessions} component={SessionsInventories} />
        <Route exact path={match.url + Routes.creatorDashboard.availabilities} component={SessionsInventories} />
        <Route exact path={match.url + Routes.creatorDashboard.sessionsDetails} component={SessionsDetails} />
        <Route exact path={match.url + Routes.creatorDashboard.availabilitiesDetails} component={SessionsDetails} />
        <Route exact path={match.url + Routes.creatorDashboard.manageSessions} component={ManageSessions} />
        <Route exact path={match.url + Routes.creatorDashboard.manageAvailabilities} component={ManageSessions} />
        <Route exact path={match.url + Routes.creatorDashboard.createSessions} component={Session} />
        <Route exact path={match.url + Routes.creatorDashboard.updateSessions} component={Session} />
        <Route
          exact
          path={[
            match.url + Routes.creatorDashboard.profile,
            ...Object.entries(Routes.creatorDashboard.profileComponents).map(([key, val]) => match.url + val),
          ]}
          render={({ props }) => (
            <MobileLayout>
              <DynamicProfile />
            </MobileLayout>
          )}
        />
        <Route exact path={match.url + Routes.creatorDashboard.createAvailabilities} component={Session} />
        <Route exact path={match.url + Routes.creatorDashboard.updateAvailabilities} component={Session} />
        <Route exact path={match.url + Routes.creatorDashboard.editProfile} component={Profile} />
        <Route exact path={match.url + Routes.creatorDashboard.livestream} component={LiveStream} />
        <Route exact path={match.url + Routes.creatorDashboard.paymentAccount} component={PaymentAccount} />
        <Route exact path={match.url + Routes.creatorDashboard.earningDetails} component={EarningDetails} />
        <Route exact path={match.url + Routes.creatorDashboard.passes} component={ClassPassList} />
        <Route exact path={match.url + Routes.creatorDashboard.videos} component={Videos} />
        <Route exact path={match.url + Routes.creatorDashboard.courses} component={Courses} />
        <Route exact path={match.url + Routes.creatorDashboard.updateCourse} component={CourseForm} />
        <Route exact path={match.url + Routes.creatorDashboard.createCourse} component={CourseForm} />
        <Route exact path={match.url + Routes.creatorDashboard.createCourseModule} component={CourseModulesForm} />
        <Route exact path={match.url + Routes.creatorDashboard.subscriptions} component={Subscriptions} />
        <Route exact path={match.url + Routes.creatorDashboard.coupons} component={Coupons} />
        <Route exact path={match.url + Routes.creatorDashboard.accountSettings} component={AccountSettings} />
        <Route exact path={match.url + Routes.creatorDashboard.audiences} component={Audiences} />
        <Route exact path={match.url + Routes.creatorDashboard.emailTemplates} component={EmailTemplates} />
        <Route exact path={match.url + Routes.creatorDashboard.legals} component={Legals} />
        <Route exact path={match.url + Routes.creatorDashboard.documents} component={Files} />
        <Route exact path={match.url + Routes.creatorDashboard.membersList} component={MembersList} />
        <Route exact path={match.url + Routes.creatorDashboard.plugins} component={Plugins} />
        <Route exact path={match.url + Routes.creatorDashboard.domains} component={CustomDomain} />
        <Route exact path={match.url + Routes.creatorDashboard.membersList} component={MembersList} />
        <Route exact path={match.url + Routes.creatorDashboard.membersTags} component={MembersTags} />
        <Route exact path={match.url + Routes.creatorDashboard.membersSettings} component={MemberSettings} />
        <Route exact path={match.url + Routes.creatorDashboard.referral} component={Referral} />
        <Route exact path={match.url + Routes.creatorDashboard.affiliates} component={Affiliates} />
        <Redirect to={match.url + Routes.creatorDashboard.defaultPath} />
      </Switch>
    </Suspense>
  );
};

export default CreatorDashboard;
