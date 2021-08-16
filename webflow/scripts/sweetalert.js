function showErrorMessage(title, msg) {
  if (Swal) {
    Swal.fire({
      title: title || 'An error occured',
      text: msg || 'Something wrong happened',
      icon: 'error',
      confirmButtonText: 'Okay',
    });
  } else {
    alert('Something went wrong');
  }
}
