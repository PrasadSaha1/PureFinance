function getCSRFToken() {
    // gets the CSRF token, needed for POST requests for security reasons
    return document.querySelector('[name=csrfmiddlewaretoken]').value;
}