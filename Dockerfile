FROM node:alpine

# Required build argument for database type
ARG DATABASE_TYPE

# Set production environment
ENV NODE_ENV=production \
    DATABASE_TYPE=${DATABASE_TYPE}

# Copy all application files
COPY . .

# Copy specific database files based on DATABASE_TYPE and clean up
RUN cp -r /prisma/database/${DATABASE_TYPE}/* /prisma/ && \
    rm -rf /prisma/database

# Install dependencies and generate Prisma client
RUN npm install && \
    npx prisma generate

EXPOSE 3000

# Run different commands based on DATABASE_TYPE
CMD ["sh", "-c", "if [ \"$DATABASE_TYPE\" = \"sqlite\" ]; then (if [ ! -f /data/db.db ]; then npx prisma migrate dev --name init; else npx prisma migrate deploy; fi); else npx prisma migrate deploy; fi && npx prisma generate && npm run start"]
