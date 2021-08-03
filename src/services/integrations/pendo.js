import dateUtil from 'utils/date';

const {
  timeCalculation: { isNewUserBasedOnSignupDate },
} = dateUtil;

export const mapUserToPendo = (userDetails) => {
  // in your authentication promise handler or callback
  const isDev =
    window.location.origin.includes('localhost') ||
    window.location.origin.includes('stage') ||
    process.env.REACT_APP_ENV !== 'production';

  const allowedStageEmail = 'felicia.karissa7';

  // These checks below will selectively initializes pendo
  if (userDetails && false) {
    if (isDev) {
      // For Dev environments, only initializes for specific emails
      // And with hardcoded external ID values
      // This is to reserve MAU counts for Pendo

      if (userDetails.email.startsWith(allowedStageEmail)) {
        const hardcodedExternalId = 'e009a4ca-4052-4620-a196-afa9e04f66b0';
        const hardcodedEmail = 'felicia.karissa7@gmail.com';
        console.log('User logged in with email ' + userDetails.email);
        console.log(`Pendo initialized using id ${hardcodedExternalId} with email ${hardcodedEmail}`);

        window.pendo.initialize({
          visitor: {
            id: hardcodedExternalId, // Required if user is logged in
            email: hardcodedEmail, // Recommended if using Pendo Feedback, or NPS Email
            //full_name:                  // Recommended if using Pendo Feedback
            // role:         // Optional

            // You can add any additional visitor level key-values here,
            // as long as it's not one of the above reserved names.
          },

          account: {
            id: hardcodedExternalId, // Highly recommended
            // name:         // Optional
            // is_paying:    // Recommended if using Pendo Feedback
            // monthly_value:// Recommended if using Pendo Feedback
            // planLevel:    // Optional
            // planPrice:    // Optional
            // creationDate: // Optional
            // You can add any additional account level key-values here,
            // as long as it's not one of the above reserved names.
          },
        });
      }
    } else {
      // For PROD, we will check (based on signup_date in user details)
      // whether this user is a "new" user or not, if new then initialize Pendo for them
      // A user is considered "new" if it's still in 21 days range since they first signed up
      if (isNewUserBasedOnSignupDate(userDetails.signup_date || null)) {
        console.log('Pendo initialized on PROD for user ' + userDetails.external_id);

        window.pendo.initialize({
          visitor: {
            id: userDetails.external_id, // Required if user is logged in
            email: userDetails.email, // Recommended if using Pendo Feedback, or NPS Email
            //full_name:                  // Recommended if using Pendo Feedback
            // role:         // Optional

            // You can add any additional visitor level key-values here,
            // as long as it's not one of the above reserved names.
          },

          account: {
            id: userDetails.external_id, // Highly recommended
            // name:         // Optional
            // is_paying:    // Recommended if using Pendo Feedback
            // monthly_value:// Recommended if using Pendo Feedback
            // planLevel:    // Optional
            // planPrice:    // Optional
            // creationDate: // Optional
            // You can add any additional account level key-values here,
            // as long as it's not one of the above reserved names.
          },
        });
      }
    }
  } else {
    console.log('Pendo not initialized');
  }
};
