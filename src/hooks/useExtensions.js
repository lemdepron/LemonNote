import { useEffect, useState } from "react";
import { listExtensions, subscribeExtensions } from "@/lib/extensions";

export default function useExtensions() {
  const [extensions, setExtensions] = useState(listExtensions);

  useEffect(() => subscribeExtensions(() => setExtensions(listExtensions())), []);

  return extensions;
}