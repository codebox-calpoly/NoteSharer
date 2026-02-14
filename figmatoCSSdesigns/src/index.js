import React from 'react'
import ReactDOM from 'react-dom'
import {
  BrowserRouter as Router,
  Route,
  Switch,
  Redirect,
} from 'react-router-dom'

import './style.css'
import Home from './views/home'
import LeaderboardPageDesign from './views/leaderboard-page-design'
import LandingPageDesign from './views/landing-page-design'
import UploadNotesPageDesign from './views/upload-notes-page-design'
import CourseDetailPageUI from './views/course-detail-page-ui'
import CourseBrowsePageUI from './views/course-browse-page-ui'
import SignInPageDesign from './views/sign-in-page-design'
import CreateAccountPageDesign from './views/create-account-page-design'
import UserProfilePageDesign from './views/user-profile-page-design'
import NotFound from './views/not-found'

const App = () => {
  return (
    <Router>
      <Switch>
        <Route component={Home} exact path="/" />
        <Route
          component={LeaderboardPageDesign}
          exact
          path="/leaderboard-page-design"
        />
        <Route
          component={LandingPageDesign}
          exact
          path="/landing-page-design"
        />
        <Route
          component={UploadNotesPageDesign}
          exact
          path="/upload-notes-page-design"
        />
        <Route
          component={CourseDetailPageUI}
          exact
          path="/course-detail-page-ui"
        />
        <Route
          component={CourseBrowsePageUI}
          exact
          path="/course-browse-page-ui"
        />
        <Route component={SignInPageDesign} exact path="/sign-in-page-design" />
        <Route
          component={CreateAccountPageDesign}
          exact
          path="/create-account-page-design"
        />
        <Route
          component={UserProfilePageDesign}
          exact
          path="/user-profile-page-design"
        />
        <Route component={NotFound} path="**" />
        <Redirect to="**" />
      </Switch>
    </Router>
  )
}

ReactDOM.render(<App />, document.getElementById('app'))
