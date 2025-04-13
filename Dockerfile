# syntax=docker/dockerfile:1

# Comments are provided throughout this file to help you get started.
# If you need more help, visit the Dockerfile reference guide at
# https://docs.docker.com/engine/reference/builder/

ARG NODE_VERSION=20.11.1

################################################################################
# Use node image for base image for all stages.
FROM --platform=linux/amd64 node:${NODE_VERSION}-alpine AS base

# Set working directory for all build stages.
WORKDIR /usr/src/app
ENV HUSKY=0


################################################################################
# Create a stage for installing production dependecies.
FROM base AS deps
# Customize cache invalidation
ARG CACHEBUST=$(date +%s)
COPY prisma ./prisma

# Download dependencies as a separate step to take advantage of Docker's caching.
# into this layer.
COPY package.json .
COPY yarn.lock .
RUN yarn install --production --frozen-lockfile --ignore-scripts

# Generate prisma schema
RUN npx prisma generate

################################################################################
# Create a stage for building the application.
FROM deps AS build

# Download additional development dependencies before building, as some projects require
# "devDependencies" to be installed to build. If you don't need this, remove this step.
RUN yarn install --frozen-lockfile --ignore-scripts

# Copy the rest of the source files into the image.
COPY . .
# Run the build script.
RUN yarn run build

################################################################################
# Create a new stage to run the application with minimal runtime dependencies
# where the necessary files are copied from the build stage.
FROM base AS final

# Use production node environment by default.
ENV NODE_ENV=production
ENV PORT=$PORT

# Run the application as a non-root user.
USER node

# Copy package.json so that package manager commands can be used.
COPY --chown=node:node package.json .

# Copy the production dependencies from the deps stage and also
# the built application from the build stage into the image.
COPY --chown=node:node --from=deps /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=build /usr/src/app/dist ./dist

# Expose the port that the application listens on.
EXPOSE $PORT

# Run the application.
CMD ["node","dist/src/main.js", ">", "/dev/stdout"]