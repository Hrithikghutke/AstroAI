import { createContext, useContext } from "react";

export const BrandContext = createContext<any>(null);

export const useBrand = () => useContext(BrandContext);
