import React from 'react';

const Dashboard = ({ token }) => {
  return (
    <>
      <h1>Just for demo purpose to show that cookie issue is fixed and we have token available</h1>
      <p>Show user dashboard here, we have the token value = {token}</p>
      <p><strong>We just need to replicate / use the exisiting components of dashboard in this view</strong></p>
      <p><strong>Get the design of how dashboard should look like in embeddable view if required</strong></p>
    </>);
};

export default Dashboard;
