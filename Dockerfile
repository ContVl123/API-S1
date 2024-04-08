FROM node:16

ADD . /api-s1
WORKDIR /api-s1


RUN yarn add global yarn \
&& yarn install \
&& yarn cache clean


EXPOSE 9005

CMD ["yarn", "start"]

