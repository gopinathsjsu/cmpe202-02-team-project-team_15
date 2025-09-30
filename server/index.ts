import http from 'http';
import mongoose from 'mongoose';
import { app } from './app';


(async function main() {
await mongoose.connect(process.env.MONGO_URI!);
const server = http.createServer(app);

const port = Number(process.env.PORT) || 8080;
server.listen(port, () => console.log(`Campus Marketplace API up on ${port}`));
})();