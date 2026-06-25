"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export interface PageData {
  events?: any[];
  programs?: any[];
  news?: any[];
  masjidConstruction?: any[];
  donations?: any[];
  pledges?: any[];
  enrollments?: any[];
  rsvps?: any[];
  contactSubmissions?: any[];
  schedulingRequests?: any[];
  users?: any[];
  subscribers?: any[];
  inviteCodes?: any[];
  faq?: any[];
  volunteers?: any[];
  testimonials?: any[];
  activityLog?: any[];
  journalEntries?: any[];
  knowledgeDocs?: any[];
  currentPath?: string;
}

interface PageDataContextType {
  data: PageData;
  setPageData: (data: PageData) => void;
}

const PageDataContext = createContext<PageDataContextType>({
  data: {},
  setPageData: () => {},
});

export function PageDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<PageData>({});
  const setPageData = useCallback((d: PageData) => setData(d), []);
  return (
    <PageDataContext.Provider value={{ data, setPageData }}>
      {children}
    </PageDataContext.Provider>
  );
}

export const usePageData = () => useContext(PageDataContext);
