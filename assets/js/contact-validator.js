'use strict';
/**
 * Add validation to contact form.
 */
window.onload = function() {
    const form = document.getElementById('contact-form');
    const pristine = new Pristine(form, null, true);
    const button = document.getElementById('contact-submit');
    const inputs = document.querySelectorAll('.contact-input');
    inputs.forEach(i => enableButtonIfValid(i, pristine, button));
}

/**
 * Adds listener to all inputs to enable submit button if
 * all fields are valid.
 * @param element
 * @param pristine
 * @param button
 * @returns void
 */
function enableButtonIfValid(element, pristine, button) {
    element.addEventListener('keydown', function(e){
        if (pristine.validate())
            button.disabled = false;
        else
            button.disabled = true;
    });
}
