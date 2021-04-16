export const mapUserToPendo = (userDetails) => {
  // in your authentication promise handler or callback
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
};
