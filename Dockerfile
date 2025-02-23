FROM node:alpine
LABEL author=wuyuan
RUN apk add --no-cache openssl
COPY . /
RUN npm install
EXPOSE 3000
CMD ["sh", "-c", "npm run prisma && npm run start"]
