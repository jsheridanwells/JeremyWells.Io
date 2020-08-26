'use strict';
/**
 * Add validation to contact form.
 */
function addValidation() {
    var pristine;
    var form = document.getElementById('contact-form');
    if (form) {
        var button = document.getElementById('contact-submit');
        var inputs = document.querySelectorAll('.contact-input');
        pristine = new Pristine(form, null, true);
        inputs.forEach(function(i) {
            enableButtonIfValid(i, pristine, button)
        });
    }
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
    element.addEventListener('keyup', function(e){
        button.disabled = !pristine.validate();
        if (!e.target.value || e.target.value.length < 1)
            button.disabled = true;
    });
}

addValidation();
