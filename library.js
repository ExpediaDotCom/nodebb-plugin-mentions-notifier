let db;
let user;
let topics;
let meta;
let middleware;

const request = module.parent.require('request');
const nconf = module.parent.require('nconf');
const winston = module.parent.require('winston');
const domain = nconf.get('url');

function notifierPlugin(_db, _user, _topics, _meta, _middleware) {
    db = _db || module.parent.require('./database');
    user = _user || module.parent.require('./user');
    topics = _topics || module.parent.require('./topics');
    meta = _meta || module.parent.require('./meta');
    middleware = _middleware || module.parent.require('./middleware');
    return notifierPlugin;
}

function renderAdmin(req, res) {
    // Renders a notitfer HTML string and sends it to the client
    res.render('admin/plugins/notifier', {});
}

function init(data, cb) {
    if (!middleware) { notifierPlugin(); }
    const app = data.router;

    app.get('/admin/plugins/notifier', middleware.admin.buildHeader, renderAdmin);
    app.get('/api/admin/plugins/notifier', renderAdmin);

    return cb();
}

function addAdminNavigation(customHeader, cb) {
    customHeader.plugins.push({
        route: '/plugins/notifier',
        name: 'Notifier'
    });

    return cb(null, customHeader);
}

function notificationPushed(body) {
    if (!db) { notifierPlugin(); }

    notifierPlugin.processNotificationBody(body, (err, res) => {
        if (!err) {
            notifierPlugin.postToEndpoint(res, (error) => {
                if (error) {
                    winston.log('error', error);
                }
            });
        }
    });
}

function processNotificationBody(body, cb) {
    if (!domain) {
        return cb(new Error('[[error:domain-not-found]]'));
    }

    const { notification } = body;
    if (!notification) {
        return cb(new Error('[[error:no-notification]]'));
    }

    const allowedTypes = ['mention', 'new-reply'];
    if (allowedTypes.indexOf(notification.type) < 0) {
        return cb(new Error('[[error:invalid-type]]'));
    }
    return notifierPlugin.uidsToEmails(body.uids, (err, res) => {
        if (err) {
            return cb(err);
        }
        return notifierPlugin.getTopicTitle(
            notification.tid,
            (error, title) => {
                if (error) {
                    return cb(error);
                }

                return cb(null, {
                    emails: res,
                    url: `${domain}/post/${notification.pid}`,
                    type: notification.type,
                    topicTitle: title,
                    messageBody: notification.bodyLong
                });
            }
        );
    });
}

function getTopicTitle(tid, cb) {
    topics.getTopicFields(
        tid, ['title'],
        (err, topicData) => {
            if (err) {
                return cb(err);
            }
            return cb(null, topicData.title);
        }
    );
}

function postToEndpoint(jsonBody, cb) {
    let postEndpoint;

    meta.settings.get('notifier', (err, settings) => {
        if (err) {
            return cb(err);
        }
        // The following params will be send as part of the JSON obj:
        // emails(array), title, type, URL, messageBody
        postEndpoint = settings.endPointURL;

        return request.post({
            url: postEndpoint,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(jsonBody)
        }, (error, res, body) => {
            if (error || res.statusCode !== 200) {
                return cb(error || new Error('[[error:invalid-response]]'));
            }
            return cb(null, body);
        });
    });
}

function getFieldFromUids(uids, prop, cb) {
    user.getUsersFields(uids, [prop], (err, res) => {
        let props;
        if (!err) {
            props = res.map(userObj => userObj[prop]);
        }
        cb(err, props);
    });
}

function uidsToEmails(uids, cb) {
    getFieldFromUids(uids, 'email', cb);
}


notifierPlugin.init = init;
notifierPlugin.addAdminNavigation = addAdminNavigation;
notifierPlugin.notificationPushed = notificationPushed;
notifierPlugin.processNotificationBody = processNotificationBody;
notifierPlugin.getTopicTitle = getTopicTitle;
notifierPlugin.postToEndpoint = postToEndpoint;
notifierPlugin.uidsToEmails = uidsToEmails;
module.exports = notifierPlugin;
