FROM registry.access.redhat.com/ubi8/nodejs-16-minimal:1-79

USER 1001

WORKDIR /opt/app-root/src

COPY --chown=1001 . .

RUN chgrp -R 0 /opt/app-root && \
    chmod -R g+rwX /opt/app-root

RUN chgrp -R 0 /opt/app-root/src/.npm/_logs && \
    chmod -R g+rwX /opt/app-root/src/.npm/_logs

RUN npm install && \
    npm run compile

ENV HOST=0.0.0.0 PORT=3001

EXPOSE ${PORT}
CMD ["npm", "run", "serve"]
