FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

# Download Inter font
RUN apk add --no-cache wget unzip && \
    wget -O inter.zip https://github.com/rsms/inter/releases/download/v4.0/Inter-4.0.zip && \
    unzip inter.zip -d /tmp/inter && \
    mkdir -p /app/public/fonts && \
    cp /tmp/inter/extras/ttf/*.ttf /app/public/fonts/ && \
    rm -rf /tmp/inter inter.zip

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]