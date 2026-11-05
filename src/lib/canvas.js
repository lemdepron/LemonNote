import { uid } from "@/lib/table";

export const CARD_WIDTH = 240;
export const CARD_HEIGHT = 154;

export function makeCanvas(name = "Untitled canvas") {
  const capture = uid("node");
  const connect = uid("node");
  const ship = uid("node");

  return {
    name,
    nodes: [
      { id: capture, x: 80, y: 140, title: "Capture", body: "Drop any thought here before it evaporates." },
      { id: connect, x: 420, y: 70, title: "Connect", body: "Link cards to show how two ideas relate." },
      { id: ship, x: 420, y: 330, title: "Ship", body: "Turn the strongest cluster into a written note." },
    ],
    edges: [
      { id: uid("edge"), from: capture, to: connect },
      { id: uid("edge"), from: connect, to: ship },
    ],
  };
}