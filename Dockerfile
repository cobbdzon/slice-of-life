# syntax=docker/dockerfile:1

FROM oven/bun:1-slim AS base
WORKDIR /app

FROM base AS build
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bunx sass src/styles:public/assets/css

FROM base AS runtime
ENV NODE_ENV=production \
    PORT=3000 \
    UPLOAD_DIR=/app/public/uploads/ \
    UPLOAD_URL_PREFIX=/static/uploads/
COPY --from=build --chown=bun:bun /app /app
RUN mkdir -p /app/public/uploads && chown -R bun:bun /app/public/uploads
USER bun
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD bun -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/login').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
ENTRYPOINT ["/app/docker/entrypoint.sh"]
CMD ["bun", "src/index.tsx"]
