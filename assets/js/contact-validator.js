'use strict';

console.log('contact validating...');

window.onload = function(){
    const form = document.getElementById('contact-form');
    const pristine = new Pristine(form);
    const button = document.getElementById('contact-submit')
        .addEventListener('click', e => {
            e.preventDefault();
            if (pristine.validate())
            {
                console.log('yer valid');
            }
            else
            {
                console.log('not ready yet');
            }
        });

    // form.addEventListener('keypress', e => {
    //     e.preventDefault();
    //     if (pristine.validate()){
    //         console.log('too legit to quit');
    //     }
    //     else {
    //         console.log('not ready yet');
    //     }
    // });
};
