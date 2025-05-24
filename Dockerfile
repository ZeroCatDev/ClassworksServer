FROM node:alpine

# Required build argument for database type
ARG DATABASE_TYPE

# Set production environment
ENV NODE_ENV=production \
    DATABASE_TYPE=${DATABASE_TYPE}

# Copy all application files
COPY . .


# Install dependencies and generate Prisma client
RUN npm install && \
    npx prisma migrate dev --name init && \
    npx prisma generate

USER node
EXPOSE 3000

CMD ["npm", "start"]
