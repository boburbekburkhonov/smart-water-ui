import React from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';

const UserDashboard = () => {
  return (
    <HelmetProvider>
      Dashboard

      <Helmet>
        <script src="../src/assets/js/menuBar.js"></script>
      </Helmet>
    </HelmetProvider>
  );
};

export default UserDashboard;