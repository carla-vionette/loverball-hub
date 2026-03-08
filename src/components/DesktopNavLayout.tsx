import React from "react";
import { Outlet } from "react-router-dom";
import DesktopNav from "@/components/DesktopNav";

const DesktopNavLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <DesktopNav />
      {children}
    </>
  );
};

export default DesktopNavLayout;
