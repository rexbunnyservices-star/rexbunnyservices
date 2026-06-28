import PocketBase from "pocketbase";

let pb: PocketBase | null = null;

export function getClient(): PocketBase {
  if (!pb) {
    const url = import.meta.env.POCKETBASE_URL || "http://localhost:8090";
    pb = new PocketBase(url);
  }
  return pb;
}
