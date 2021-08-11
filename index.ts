import { useEffect, useMemo, useState } from "react";

type Serializer<T> = (object: T | undefined) => string;
type Parser<T> = (val: string) => T | undefined;
type Setter<T> = React.Dispatch<React.SetStateAction<T>>;

type Options<T> = Partial<{
  serializer: Serializer<T>;
  parser: Parser<T>;
  logger: (error: any) => void;
  syncData: boolean;
}>;

function useLocalStorage<T>(
  key: string,
  defaultValue: T,
  options?: Options<T>
): [T, Setter<T>];
function useLocalStorage<T>(
  key: string,
  defaultValue?: undefined,
  options?: Options<T>
): [T | undefined, Setter<T | undefined>];
function useLocalStorage<T>(
  key: string,
  defaultValue?: T,
  options?: Options<T>
) {
  const opts = useMemo(() => {
    return {
      serializer: JSON.stringify,
      parser: JSON.parse,
      logger: console.log,
      syncData: true,
      ...options,
    };
  }, [options]);

  const { serializer, parser, logger, syncData } = opts;

  const [storedValue, setValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      const res: T = item ? parser(item) : defaultValue;

      return res;
    } catch (e) {
      logger(e);
      return defaultValue;
    }
  });

  window.addEventListener("storage", (e: StorageEvent) => {
    if (e.key === key) {
      setValue(e.newValue ? parser(e.newValue) : e.oldValue);
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, serializer(storedValue));
    } catch (e) {
      logger(e);
    }
  }, [storedValue]);

  useEffect(() => {
    if (!syncData) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key !== key || e.storageArea !== window.localStorage) return;

      try {
        setValue(e.newValue ? parser(e.newValue) : undefined);
      } catch (e) {
        logger(e);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [key, syncData]);

  return [storedValue, setValue];
}

export default useLocalStorage;
