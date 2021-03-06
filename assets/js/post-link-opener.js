'use strict';
/**
 * Any <a href> elements in a '.post' will open in a new tab
 * unless I've added the '.no-target' class.
 * In liquid, add {:class="no-target"} after any link that should
 * open locally.
 */
window.onload = function() {
    let postBody = document.getElementsByClassName('post');
    if (postBody && postBody.length > 0) {
        const links = postBody[0].querySelectorAll('a');
        links.forEach(l => {
            if (l.className !== 'no-target')
                l.setAttribute('target', '_blank')
        });
    }
}
