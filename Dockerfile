###############################
# Build for local development #
###############################
FROM node:current-alpine AS development
WORKDIR /app
COPY --chown=node:node package*.json /app/
RUN npm ci
COPY --chown=node:node . /app
USER node

########################
# Build for production #
########################
FROM node:current-alpine AS build
LABEL stage=build
WORKDIR /app
COPY --chown=node:node package*.json /app/
COPY --chown=node:node --from=development /app/node_modules /app/node_modules
COPY --chown=node:node . /app
RUN npm run build
ENV NODE_ENV=production
RUN npm ci --only=production && npm cache clean --force
USER node

##############
# Production #
##############
FROM node:current-alpine AS production
COPY --chown=node:node --from=build /app/node_modules /app/node_modules
COPY --chown=node:node --from=build /app/dist /app/dist

# Start the server using production build
CMD ["node", "dist/main.js"]
