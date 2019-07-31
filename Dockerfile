FROM adorsys/node:10

COPY . .

EXPOSE 3000

CMD ["npm", "run", "start"]
