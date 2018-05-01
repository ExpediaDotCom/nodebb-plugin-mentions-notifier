/* eslint import/no-extraneous-dependencies:0  */
/* eslint import/no-unresolved:0 */

const { assert } = require('chai');
const async = require('async');

const nconf = require.main.require('nconf');
nconf.argv()
    .env()
    .file({ file: 'node_modules/nodebb/config.json' });


const db = require('nodebb/test/mocks/databasemock');
const user = require('nodebb/src/user');
const topics = require('nodebb/src/topics');
const meta = require('nodebb/src/meta');
const middleware = require('nodebb/src/middleware');
const notifierPlugin = require('../library')(db, user, topics, meta, middleware);
const express = require('express');

describe('plugin tests', () => {
    function getRandomInt(min, max) {
        const minimum = Math.ceil(min);
        const maximum = Math.floor(max);
        return Math.floor(Math.random() * (maximum - minimum)) + minimum;
    }


    const userData = [];
    let uids;

    before((done) => {
        for (let i = 0; i < 10; i += 1) {
            const x = getRandomInt(0, 1000);
            userData.push({
                email: `myemail${x}@email.com`,
                username: `User${x}`,
                password: 'swordfish'
            });
        }
        async.waterfall([

            function createUsers(next) {
                async.map(
                    userData,
                    (userInfo, cb) => {
                        user.create(userInfo, cb);
                    },
                    (err, results) => {
                        assert.isNotOk(err, 'Created users ');
                        uids = results;
                        next();
                    }
                );
            }
        ], done);
    });

    describe('userid to username tests', () => {
        it('test uidsToEmails: empty array as input', () => {
            notifierPlugin.uidsToEmails([], (err, res) => {
                assert.deepEqual([], res, 'Emails given are not equal to \
                    inserted emails');
            });
        });

        it('test uidsToEmails: get all emails from uids as ints', () => {
            const emails = userData.map(userInfo => userInfo.email);
            notifierPlugin.uidsToEmails(uids, (err, res) => {
                assert.deepEqual(emails, res, 'Emails given are not equal to \
                    inserted emails');
            });
        });
    });

    describe('notificationPused integration', () => {
        it('processNotificationBody: handles one mention', () => {
            const testUids = [3];
            const { username } = userData[2];
            const body = {
                notification: {
                    type: 'mention',
                    bodyShort: '[[notifications:user_mentioned_you_in, \
                        username, test mention]]',
                    bodyLong: `hello @${username}`,
                    nid: 'tid:10:pid:80:uid:2:user',
                    pid: 80,
                    tid: 10,
                    from: 2,
                    path: '/post/80',
                    importance: 6,
                    datetime: 1506846640655
                },
                uids: testUids
            };
            const { notification } = body;
            const domain = nconf.get('url');
            const url = `${domain}/post/${body.notification.pid}`;

            notifierPlugin.processNotificationBody(body, (err, res) => {
                assert.equal(url, res.url);
                assert.equal(notification.type, res.type);
                assert.equal(1, res.emails.length);
                assert.equal(userData[2].email, res.emails[0]);
                assert.equal(res.messageBody, notification.bodyLong);
            });
        });


        it('processNotificationBody: handles two mentions', () => {
            const testUids = [3, 7];
            const usernames = testUids.map(uid => userData[uid - 1].username).join(' @');
            const body = {
                notification: {
                    type: 'mention',
                    bodyShort: '[[notifications:user_mentioned_you_in, \
                        username, test mention]]',
                    bodyLong: `hello @${usernames}`,
                    nid: 'tid:10:pid:80:uid:2:user',
                    pid: 80,
                    tid: 10,
                    from: 2,
                    path: '/post/80',
                    importance: 6,
                    datetime: 1506846640655
                },
                uids: testUids
            };
            const { notification } = body;
            const domain = nconf.get('url');
            const url = `${domain}/post/${body.notification.pid}`;

            notifierPlugin.processNotificationBody(body, (err, res) => {
                assert.equal(url, res.url);
                assert.equal(notification.type, res.type);
                assert.equal(2, res.emails.length);
                const expectedEmails = testUids.map(uid => userData[uid - 1].email);
                assert.deepEqual(expectedEmails, res.emails);
                assert.equal(res.messageBody, notification.bodyLong);
            });
        });

        it('processNotificationBody: handles five mentions', () => {
            const testUids = [1, 3, 5, 7, 9];
            const usernames = testUids.map(uid => userData[uid - 1].username).join(' @');
            const body = {
                notification: {
                    type: 'mention',
                    bodyShort: '[[notifications:user_mentioned_you_in, \
                        username, test mention]]',
                    bodyLong: `hello @${usernames}`,
                    nid: 'tid:10:pid:80:uid:2:user',
                    pid: 80,
                    tid: 10,
                    from: 2,
                    path: '/post/80',
                    importance: 6,
                    datetime: 1506846640655
                },
                uids: testUids
            };
            const { notification } = body;
            const domain = nconf.get('url');
            const url = `${domain}/post/${body.notification.pid}`;

            notifierPlugin.processNotificationBody(body, (err, res) => {
                assert.equal(url, res.url);
                assert.equal(notification.type, res.type);
                assert.equal(5, res.emails.length);
                const expectedEmails = testUids.map(uid => userData[uid - 1].email);
                assert.deepEqual(expectedEmails, res.emails);
                assert.equal(res.messageBody, notification.bodyLong);
            });
        });

        it('processNotificationBody: no notification', () => {
            const body = {};
            notifierPlugin.processNotificationBody(body, (err) => {
                assert.equal(err.message, '[[error:no-notification]]');
            });
        });

        it(
            'processNotificationBody: handles new-replies if user is watching',
            () => {
                const body = {
                    notification: {
                        type: 'new-reply',
                        bodyShort: '[[notifications:user_posted_to, user, test\
                            new reply]]',
                        bodyLong: '<p>new reply</p>\n',
                        pid: 82,
                        path: '/post/82',
                        nid: 'new_post:tid:11:pid:82:uid:1',
                        tid: '11',
                        from: 1,
                        mergeId: 'notifications:user_posted_to|11',
                        topicTitle: 'test topic',
                        importance: 5,
                        datetime: 1506846873788
                    },
                    uids: [2]
                };
                const domain = nconf.get('url');
                const url = `${domain}/post/${body.notification.pid}`;
                const { notification } = body;

                notifierPlugin.processNotificationBody(
                    body,
                    (err, res) => {
                        assert.equal(url, res.url);
                        assert.equal(body.notification.type, res.type);
                        assert.equal(1, res.emails.length);
                        assert.equal(userData[1].email, res.emails[0]);
                        assert.equal(res.messageBody, notification.bodyLong);
                    }
                );
            }
        );

        function assertDoesNotHandleOtherTypes(type) {
            const body = {
                notification: {
                    type
                }
            };
            notifierPlugin.processNotificationBody(body, (err) => {
                assert.equal(err.message, '[[error:invalid-type]]');
            });
        }

        it('processNotificationBody: does not handle new-topic notifications', () => {
            assertDoesNotHandleOtherTypes('new-topic');
        });

        it('processNotificationBody: does not handle new-chat notifications', () => {
            assertDoesNotHandleOtherTypes('new-chat');
        });

        it('processNotificationBody: does not handle new-post-flag notifications', () => {
            assertDoesNotHandleOtherTypes('new-post-flag');
        });

        it('processNotificationBody: does not handle follow notifications', () => {
            assertDoesNotHandleOtherTypes('follow');
        });

        it('processNotificationBody: does not handle notifications with no type', () => {
            assertDoesNotHandleOtherTypes(null);
        });
    });

    describe('admin init', () => {
        it('adds notiifer to admin routes', () => {
            const router = express.Router();
            notifierPlugin.init({ router }, () => {
                assert.equal(2, router.stack.length);
                assert.equal('/admin/plugins/notifier', router.stack[0].route.path);
                assert.equal('/api/admin/plugins/notifier', router.stack[1].route.path);
            });
        });
    });

    describe('admin control panel navigation', () => {
        it('adds Notiifer option to admin settings', () => {
            const customHeader = { plugins: [] };
            notifierPlugin.addAdminNavigation(customHeader, () => {
                assert.equal(1, customHeader.plugins.length);
                assert.equal('Notifier', customHeader.plugins[0].name);
            });
        });

        it('adds notiifer route to admin settings', () => {
            const customHeader = { plugins: [] };
            notifierPlugin.addAdminNavigation(customHeader, () => {
                assert.equal('/plugins/notifier', customHeader.plugins[0].route);
            });
        });
    });
});
