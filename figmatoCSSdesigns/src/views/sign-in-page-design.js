import React from 'react'

import { Helmet } from 'react-helmet'

import './sign-in-page-design.css'

const SignInPageDesign = (props) => {
  return (
    <div className="sign-in-page-design-container1">
      <Helmet>
        <title>SignInPageDesign - exported project</title>
        <meta
          property="og:title"
          content="SignInPageDesign - exported project"
        />
        <link
          rel="canonical"
          href="https://poly-pages-s3yzmc.teleporthq.app/sign-in-page-design"
        />
      </Helmet>
      <div className="sign-in-page-design-thq-sign-in-page-design-elm">
        <div className="sign-in-page-design-thq-container-elm1">
          <div className="sign-in-page-design-thq-heading1-elm">
            <span className="sign-in-page-design-thq-text-elm1">Sign In</span>
          </div>
          <div className="sign-in-page-design-thq-paragraph-elm1">
            <span className="sign-in-page-design-thq-text-elm2">
              Log in to access and share course notes.
            </span>
          </div>
          <div className="sign-in-page-design-thq-form-elm">
            <div className="sign-in-page-design-thq-container-elm2">
              <div className="sign-in-page-design-thq-label-elm1">
                <span className="sign-in-page-design-thq-text-elm3">
                  Email Address
                </span>
              </div>
              <input
                type="text"
                placeholder="name@calpoly.edu"
                className="sign-in-page-design-thq-email-input-elm"
              />
            </div>
            <div className="sign-in-page-design-thq-container-elm3">
              <div className="sign-in-page-design-thq-label-elm2">
                <span className="sign-in-page-design-thq-text-elm4">
                  Password
                </span>
              </div>
              <input
                type="text"
                placeholder="••••••••"
                className="sign-in-page-design-thq-password-input-elm"
              />
            </div>
            <div className="sign-in-page-design-thq-link-elm1">
              <span className="sign-in-page-design-thq-text-elm5">
                Forgot password?
              </span>
            </div>
            <button className="sign-in-page-design-thq-button-elm">
              <span className="sign-in-page-design-thq-text-elm6">Sign In</span>
            </button>
          </div>
          <div className="sign-in-page-design-thq-paragraph-elm2">
            <span className="sign-in-page-design-thq-text-elm7">
              Don&apos;t have an account?
            </span>
          </div>
          <div className="sign-in-page-design-thq-link-elm2">
            <span className="sign-in-page-design-thq-text-elm8">
              Create one
            </span>
          </div>
          <img
            src="/external/screenshot20260112at33925pm12039-q7ma.svg"
            alt="Screenshot20260112at33925PM12039"
            className="sign-in-page-design-thq-screenshot20260112at33925pm1-elm"
          />
        </div>
      </div>
      <a
        href="https://play.teleporthq.io/signup"
        className="sign-in-page-design-link"
      >
        <div
          aria-label="Sign up to TeleportHQ"
          className="sign-in-page-design-container2"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 19 21"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="sign-in-page-design-icon1"
          >
            <path
              d="M9.1017 4.64355H2.17867C0.711684 4.64355 -0.477539 5.79975 -0.477539 7.22599V13.9567C-0.477539 15.3829 0.711684 16.5391 2.17867 16.5391H9.1017C10.5687 16.5391 11.7579 15.3829 11.7579 13.9567V7.22599C11.7579 5.79975 10.5687 4.64355 9.1017 4.64355Z"
              fill="#B23ADE"
            ></path>
            <path
              d="M10.9733 12.7878C14.4208 12.7878 17.2156 10.0706 17.2156 6.71886C17.2156 3.3671 14.4208 0.649963 10.9733 0.649963C7.52573 0.649963 4.73096 3.3671 4.73096 6.71886C4.73096 10.0706 7.52573 12.7878 10.9733 12.7878Z"
              fill="#FF5C5C"
            ></path>
            <path
              d="M17.7373 13.3654C19.1497 14.1588 19.1497 15.4634 17.7373 16.2493L10.0865 20.5387C8.67402 21.332 7.51855 20.6836 7.51855 19.0968V10.5141C7.51855 8.92916 8.67402 8.2807 10.0865 9.07221L17.7373 13.3654Z"
              fill="#2874DE"
            ></path>
          </svg>
          <span className="sign-in-page-design-text">Built in TeleportHQ</span>
        </div>
      </a>
    </div>
  )
}

export default SignInPageDesign
