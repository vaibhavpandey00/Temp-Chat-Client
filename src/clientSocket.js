import { io } from "socket.io-client";
import { getUrl } from "./_getUrl";

const _$BkURL = getUrl();

const socket = io(`${_$BkURL}`);

export default socket;