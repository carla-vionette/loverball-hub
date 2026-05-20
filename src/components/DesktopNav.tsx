import SiteNav from "@/components/SiteNav";

const desktopNavLayoutReset = `
  @media (min-width: 768px) {
    [class*="md:ml-16"] { margin-left: 0 !important; }
    [class*="md:pl-64"] { padding-left: 0 !important; }
    [class*="md:left-64"] { left: 0 !important; }
  }

  @media (min-width: 1280px) {
    [class*="xl:ml-64"] { margin-left: 0 !important; }
  }
`;

const DesktopNav = () => {
  return (
    <>
      <style>{desktopNavLayoutReset}</style>
      <div className="hidden md:block" aria-hidden>
        <div className="h-[74px]" />
      </div>
      <div className="hidden md:block">
        <SiteNav />
      </div>
    </>
  );
};

export default DesktopNav;