import * as React from "react";
import PropTypes from "prop-types";
import Header from "./Header";
import Progress from "./Progress";
import EmailProcessor from './EmailProcessor';

/* global require */

export default class App extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.state = {};
  }

  render() {
    const { title, isOfficeInitialized } = this.props;
  
    if (!isOfficeInitialized) {
      return (
        <Progress
          title={title}
          logo={require("./../../../assets/logo-filled.png")}
          message="Please sideload your addin to see app body."
        />
      );
    }
  
    return (
      <div className="ms-welcome">
        <Header logo={require("./../../../assets/logo-filled.png")} title={this.props.title} message="Welcome" />
        <EmailProcessor />
      </div>
    );
  }  
}

App.propTypes = {
  title: PropTypes.string,
  isOfficeInitialized: PropTypes.bool,
};
