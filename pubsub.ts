import { EventEmitter } from "node:events";

const pubsub = new EventEmitter<{
    "publish": [boolean]
}>();
pubsub.setMaxListeners(0);

export default pubsub;