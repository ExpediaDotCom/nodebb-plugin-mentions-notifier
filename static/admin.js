/* eslint prefer-arrow-callback:0  */
/* eslint no-var:0 */

/* globals $, app, socket */

define('admin/plugins/notifier', ['settings'], function notifierSettings(Settings) {
    // Admin Control Panel.
    var ACP = {};

    function validURL(str) {
        var pattern = new RegExp('^(https?://)' + // protocol
            '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|' + // domain name
            '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
            '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*', 'i'); // port and path
            // '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
            // '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator

        if (!pattern.test(str)) {
            return false;
        }
        return true;
    }

    ACP.init = function init() {
        Settings.load('notifier', $('.notifier-settings'));

        $('#save').on('click', function onClick() {
            var endPointURL = $('.notifier-settings')[0].endPointURL.value;

            if (validURL(endPointURL)) {
                Settings.save('notifier', $('.notifier-settings'), function saveSetting() {
                    app.alert({
                        alert_id: 'notifier-success',
                        title: 'Settings Saved',
                        type: 'success',
                        message: 'Settings have been successfully saved',
                        clickfn: function clickAlert() {
                            socket.emit('admin.reload');
                        }
                    });
                });
            } else {
                app.alertError('Invalid URL format. Settings not saved.');
            }
        });
    };


    return ACP;
});
