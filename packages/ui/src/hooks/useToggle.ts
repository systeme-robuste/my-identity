import { useCallback, useState } from "react";

export function useToggle(initial = false): [boolean, () => void, (v: boolean) => void] {
  const [v, setV] = useState(initial);
  const toggle = useCallback(() => setV((x) => !x), []);
  return [v, toggle, setV];
}
