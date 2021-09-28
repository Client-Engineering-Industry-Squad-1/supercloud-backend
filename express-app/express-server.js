'use strict';

const express = require("express");
const request = require('request');

const app = (module.exports = express());

app.get('/health', (req, res, next) => {
    return res.status(200).send({
        "status": "UP"
    });
});

if (process.env.NODE_ENV !== "dev" && process.env.NODE_ENV !== "test") {

    // If the OCP_API_URL environment variable is not set, then use App ID
    if (!process.env.OCP_API_URL) {
        const passport = require("passport");
        const APIStrategy = require("ibmcloud-appid").APIStrategy;

        app.use(passport.initialize());
        passport.use(new APIStrategy({
            oauthServerUrl: process.env.APPID_OAUTH_SERVER_URL
        }));
        passport.serializeUser(function (user, cb) {
            cb(null, user);
        });
        passport.deserializeUser(function (obj, cb) {
            cb(null, obj);
        });
        app.use(passport.authenticate(APIStrategy.STRATEGY_NAME, {
            session: false,
            scope: "appid_authenticated"
        }));
    }

    const editorMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];
    app.use((req, res, next) => {
        if (!process.env.OCP_API_URL) {
            request({
                url: `${process.env.OCP_API_URL}/apis/user.openshift.io/v1/users/~`,
                headers: {
                    'Authorization': req.headers['Authorization']
                }
            }, (err, response, body) => {
                const user = JSON.parse(body);
                req.scopes = [];
                if (user?.groups?.includes("ascent-fs-viewers")) {
                    req.scopes.push("view_controls");
                }
                if (user?.groups?.includes("ascent-editors")) {
                    req.scopes.push("edit");
                }
                if (user?.groups?.includes("ascent-admins")) {
                    req.scopes.push("super_edit");
                }
                if (!editorMethods.includes(req.method) || req.scopes.includes("edit")) {
                    next();
                } else {
                    res.status(401).json({
                        error: {
                            message: "You must have editor role to perform this request."
                        }
                    });
                }
                done(err, user);
            });
        } else {
            req.scopes = req?.appIdAuthorizationContext?.accessTokenPayload?.scope?.split(" ");
            if (!editorMethods.includes(req.method) || req.scopes.includes("edit")) {
                next();
            } else {
                res.status(401).json({
                    error: {
                        message: "You must have editor role to perform this request."
                    }
                });
            }
        }
    });
}