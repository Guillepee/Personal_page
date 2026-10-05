FROM python:3.12-slim AS build
WORKDIR /site
COPY requirements-build.txt .
RUN pip install --no-cache-dir -r requirements-build.txt
COPY . .
RUN python tools/build_site.py

FROM nginx:alpine
COPY --from=build /site/dist/ /usr/share/nginx/html/
EXPOSE 80
