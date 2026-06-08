FROM nginx:1.27-alpine

COPY nginx.conf  /etc/nginx/conf.d/default.conf
COPY 503.html    /usr/share/nginx/html/503.html
COPY logo.png    /usr/share/nginx/html/logo.png

EXPOSE 80
